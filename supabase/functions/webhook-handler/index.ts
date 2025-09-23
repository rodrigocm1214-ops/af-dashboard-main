import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Signature",
};

interface HotmartWebhookData {
  id: string;
  event: string;
  version: string;
  data: {
    product: {
      id: number;
      name: string;
    };
    buyer: {
      email: string;
      name: string;
    };
    purchase: {
      transaction: string;
      status: string;
      approved_date: number;
      price: {
        value: number;
        currency_value: string;
      };
      commission: {
        value: number;
        currency_value: string;
      };
    };
  };
}

interface KiwifyWebhookData {
  event: string;
  data: {
    order: {
      id: string;
      status: string;
      created_at: string;
      Product: {
        id: string;
        name: string;
      };
      Customer: {
        email: string;
        first_name: string;
        last_name: string;
      };
      charges: Array<{
        amount: number;
        net_amount: number;
        status: string;
      }>;
    };
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Only POST method allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const platform = url.searchParams.get('platform');
    const projectId = url.searchParams.get('project_id');

    if (!platform || !projectId) {
      return new Response(
        JSON.stringify({ error: 'Platform and project_id parameters are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get webhook body
    const body = await req.text();
    const signature = req.headers.get('X-Signature') || req.headers.get('x-signature');

    // Find integration configuration
    const { data: integration, error: integrationError } = await supabase
      .from('project_integrations')
      .select('*')
      .eq('project_id', projectId)
      .eq('integration_type', `${platform}_webhook`)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Integration not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, integration.credentials.webhookSecret, platform)) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process webhook based on platform
    let result;
    if (platform === 'hotmart') {
      result = await processHotmartWebhook(supabase, integration, webhookData as HotmartWebhookData);
    } else if (platform === 'kiwify') {
      result = await processKiwifyWebhook(supabase, integration, webhookData as KiwifyWebhookData);
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported platform' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook handler error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function verifyWebhookSignature(body: string, signature: string | null, secret: string, platform: string): boolean {
  if (!signature || !secret) return false;

  try {
    let expectedSignature: string;
    
    if (platform === 'hotmart') {
      // Hotmart uses HMAC-SHA256
      const hmac = createHmac('sha256', secret);
      hmac.update(body);
      expectedSignature = hmac.digest('base64');
      return signature === expectedSignature;
    } else if (platform === 'kiwify') {
      // Kiwify uses HMAC-SHA256 with hex encoding
      const hmac = createHmac('sha256', secret);
      hmac.update(body);
      expectedSignature = hmac.digest('hex');
      return signature === expectedSignature;
    }
    
    return false;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

async function processHotmartWebhook(supabase: any, integration: any, webhookData: HotmartWebhookData) {
  const startTime = Date.now();
  let logData = {
    integration_id: integration.id,
    user_id: integration.user_id,
    execution_type: 'webhook_received',
    status: 'success',
    records_processed: 1,
    records_created: 0,
    records_updated: 0,
    records_failed: 0,
    message: '',
    started_at: new Date().toISOString()
  };

  try {
    // Only process purchase events
    if (webhookData.event !== 'PURCHASE_COMPLETE' && webhookData.event !== 'PURCHASE_APPROVED') {
      logData.message = `Ignored event: ${webhookData.event}`;
      return { success: true, message: logData.message };
    }

    const purchase = webhookData.data.purchase;
    const product = webhookData.data.product;
    const buyer = webhookData.data.buyer;

    // Convert timestamp to date
    const saleDate = new Date(purchase.approved_date * 1000);

    const saleData = {
      project_id: integration.project_id,
      user_id: integration.user_id,
      integration_id: integration.id,
      external_sale_id: purchase.transaction,
      sale_date: saleDate.toISOString(),
      product_name: product.name,
      product_id: product.id.toString(),
      gross_amount: purchase.price.value,
      net_amount: purchase.price.value - (purchase.commission?.value || 0),
      commission_amount: purchase.commission?.value || 0,
      fees_amount: 0,
      customer_email: buyer.email,
      customer_name: buyer.name,
      transaction_status: purchase.status,
      payment_method: 'unknown',
      raw_webhook_data: webhookData,
      received_at: new Date().toISOString(),
      processed_at: new Date().toISOString()
    };

    // Check if sale already exists
    const { data: existing } = await supabase
      .from('webhook_sales_data')
      .select('id')
      .eq('integration_id', integration.id)
      .eq('external_sale_id', purchase.transaction)
      .single();

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('webhook_sales_data')
        .update(saleData)
        .eq('id', existing.id);

      if (updateError) {
        throw updateError;
      }
      
      logData.records_updated = 1;
      logData.message = 'Sale updated successfully';
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('webhook_sales_data')
        .insert(saleData);

      if (insertError) {
        throw insertError;
      }
      
      logData.records_created = 1;
      logData.message = 'New sale recorded successfully';
    }

  } catch (error) {
    logData.status = 'error';
    logData.message = error.message;
    logData.error_details = { error: error.message };
    logData.records_failed = 1;
  } finally {
    // Log execution
    logData.execution_time_ms = Date.now() - startTime;
    logData.completed_at = new Date().toISOString();

    await supabase
      .from('integration_logs')
      .insert(logData);
  }

  return { 
    success: logData.status === 'success', 
    message: logData.message,
    recordsProcessed: logData.records_processed
  };
}

async function processKiwifyWebhook(supabase: any, integration: any, webhookData: KiwifyWebhookData) {
  const startTime = Date.now();
  let logData = {
    integration_id: integration.id,
    user_id: integration.user_id,
    execution_type: 'webhook_received',
    status: 'success',
    records_processed: 1,
    records_created: 0,
    records_updated: 0,
    records_failed: 0,
    message: '',
    started_at: new Date().toISOString()
  };

  try {
    // Only process order paid events
    if (webhookData.event !== 'order.paid') {
      logData.message = `Ignored event: ${webhookData.event}`;
      return { success: true, message: logData.message };
    }

    const order = webhookData.data.order;
    const product = order.Product;
    const customer = order.Customer;

    // Calculate amounts from charges
    const totalGross = order.charges.reduce((sum, charge) => sum + charge.amount, 0);
    const totalNet = order.charges.reduce((sum, charge) => sum + charge.net_amount, 0);
    const fees = totalGross - totalNet;

    const saleData = {
      project_id: integration.project_id,
      user_id: integration.user_id,
      integration_id: integration.id,
      external_sale_id: order.id,
      sale_date: order.created_at,
      product_name: product.name,
      product_id: product.id,
      gross_amount: totalGross,
      net_amount: totalNet,
      commission_amount: 0,
      fees_amount: fees,
      customer_email: customer.email,
      customer_name: `${customer.first_name} ${customer.last_name}`.trim(),
      transaction_status: order.status,
      payment_method: 'unknown',
      raw_webhook_data: webhookData,
      received_at: new Date().toISOString(),
      processed_at: new Date().toISOString()
    };

    // Check if sale already exists
    const { data: existing } = await supabase
      .from('webhook_sales_data')
      .select('id')
      .eq('integration_id', integration.id)
      .eq('external_sale_id', order.id)
      .single();

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('webhook_sales_data')
        .update(saleData)
        .eq('id', existing.id);

      if (updateError) {
        throw updateError;
      }
      
      logData.records_updated = 1;
      logData.message = 'Sale updated successfully';
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('webhook_sales_data')
        .insert(saleData);

      if (insertError) {
        throw insertError;
      }
      
      logData.records_created = 1;
      logData.message = 'New sale recorded successfully';
    }

  } catch (error) {
    logData.status = 'error';
    logData.message = error.message;
    logData.error_details = { error: error.message };
    logData.records_failed = 1;
  } finally {
    // Log execution
    logData.execution_time_ms = Date.now() - startTime;
    logData.completed_at = new Date().toISOString();

    await supabase
      .from('integration_logs')
      .insert(logData);
  }

  return { 
    success: logData.status === 'success', 
    message: logData.message,
    recordsProcessed: logData.records_processed
  };
}