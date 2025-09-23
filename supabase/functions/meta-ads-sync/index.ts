import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface MetaAdsConfig {
  accessToken: string;
  adAccountId: string;
  fields?: string[];
  datePreset?: string;
}

interface MetaAdsInsight {
  date_start: string;
  date_stop: string;
  spend: string;
  impressions: string;
  clicks: string;
  reach: string;
  cpm: string;
  cpc: string;
  ctr: string;
  account_id: string;
  campaign_id?: string;
  campaign_name?: string;
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

    if (req.method === 'POST') {
      // Manual sync trigger
      const { integrationId } = await req.json();
      
      if (!integrationId) {
        return new Response(
          JSON.stringify({ error: 'Integration ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await syncMetaAdsData(supabase, integrationId);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Scheduled sync for all active integrations
      const result = await syncAllActiveIntegrations(supabase);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Meta Ads sync error:', error);
    
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

async function syncMetaAdsData(supabase: any, integrationId: string) {
  const startTime = Date.now();
  let logData = {
    integration_id: integrationId,
    execution_type: 'api_sync',
    status: 'success',
    records_processed: 0,
    records_created: 0,
    records_updated: 0,
    records_failed: 0,
    message: '',
    started_at: new Date().toISOString()
  };

  try {
    // Get integration configuration
    const { data: integration, error: integrationError } = await supabase
      .from('project_integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('integration_type', 'meta_ads')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      throw new Error('Integration not found or inactive');
    }

    const config: MetaAdsConfig = integration.config;
    const credentials = integration.credentials;

    if (!credentials.accessToken || !config.adAccountId) {
      throw new Error('Missing required credentials');
    }

    // Calculate date range (last 7 days by default)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    const dateStart = startDate.toISOString().split('T')[0];
    const dateEnd = endDate.toISOString().split('T')[0];

    // Fetch data from Meta Ads API
    const fields = config.fields || [
      'spend', 'impressions', 'clicks', 'reach', 
      'cpm', 'cpc', 'ctr', 'date_start', 'date_stop'
    ];

    const apiUrl = `https://graph.facebook.com/v18.0/act_${config.adAccountId}/insights`;
    const params = new URLSearchParams({
      access_token: credentials.accessToken,
      fields: fields.join(','),
      time_range: JSON.stringify({
        since: dateStart,
        until: dateEnd
      }),
      time_increment: '1',
      level: 'campaign'
    });

    const response = await fetch(`${apiUrl}?${params}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Meta Ads API error: ${response.status} - ${errorData}`);
    }

    const apiData = await response.json();
    const insights: MetaAdsInsight[] = apiData.data || [];

    logData.records_processed = insights.length;

    // Process and store data
    for (const insight of insights) {
      try {
        const { data: existing } = await supabase
          .from('meta_ads_data')
          .select('id')
          .eq('project_id', integration.project_id)
          .eq('integration_id', integrationId)
          .eq('date_start', insight.date_start)
          .eq('campaign_id', insight.campaign_id || 'unknown')
          .single();

        const dataToInsert = {
          project_id: integration.project_id,
          user_id: integration.user_id,
          integration_id: integrationId,
          date_start: insight.date_start,
          date_stop: insight.date_stop,
          account_id: insight.account_id,
          campaign_id: insight.campaign_id || 'unknown',
          campaign_name: insight.campaign_name || 'Unknown Campaign',
          spend: parseFloat(insight.spend) || 0,
          impressions: parseInt(insight.impressions) || 0,
          clicks: parseInt(insight.clicks) || 0,
          reach: parseInt(insight.reach) || 0,
          cpm: parseFloat(insight.cpm) || 0,
          cpc: parseFloat(insight.cpc) || 0,
          ctr: parseFloat(insight.ctr) || 0,
          raw_data: insight,
          collected_at: new Date().toISOString()
        };

        if (existing) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('meta_ads_data')
            .update(dataToInsert)
            .eq('id', existing.id);

          if (updateError) {
            logData.records_failed++;
            console.error('Error updating Meta Ads data:', updateError);
          } else {
            logData.records_updated++;
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('meta_ads_data')
            .insert(dataToInsert);

          if (insertError) {
            logData.records_failed++;
            console.error('Error inserting Meta Ads data:', insertError);
          } else {
            logData.records_created++;
          }
        }
      } catch (error) {
        logData.records_failed++;
        console.error('Error processing insight:', error);
      }
    }

    // Update integration last sync
    await supabase
      .from('project_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        next_sync_at: calculateNextSync(integration.sync_frequency)
      })
      .eq('id', integrationId);

    logData.message = `Successfully synced ${logData.records_created} new records and updated ${logData.records_updated} existing records`;

  } catch (error) {
    logData.status = 'error';
    logData.message = error.message;
    logData.error_details = { error: error.message, stack: error.stack };
  } finally {
    // Log execution
    logData.execution_time_ms = Date.now() - startTime;
    logData.completed_at = new Date().toISOString();

    await supabase
      .from('integration_logs')
      .insert({
        ...logData,
        user_id: integration?.user_id
      });
  }

  return logData;
}

async function syncAllActiveIntegrations(supabase: any) {
  const { data: integrations, error } = await supabase
    .from('project_integrations')
    .select('*')
    .eq('integration_type', 'meta_ads')
    .eq('is_active', true)
    .lte('next_sync_at', new Date().toISOString());

  if (error) {
    throw new Error(`Error fetching integrations: ${error.message}`);
  }

  const results = [];
  
  for (const integration of integrations || []) {
    try {
      const result = await syncMetaAdsData(supabase, integration.id);
      results.push({ integrationId: integration.id, result });
    } catch (error) {
      results.push({ 
        integrationId: integration.id, 
        error: error.message 
      });
    }
  }

  return {
    message: `Processed ${results.length} integrations`,
    results
  };
}

function calculateNextSync(frequency: string): string {
  const now = new Date();
  
  switch (frequency) {
    case 'hourly':
      now.setHours(now.getHours() + 1);
      break;
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    default:
      now.setDate(now.getDate() + 1);
  }
  
  return now.toISOString();
}