import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface ProjectIntegration {
  id: string;
  project_id: string;
  user_id: string;
  integration_type: 'meta_ads' | 'hotmart_webhook' | 'kiwify_webhook';
  is_active: boolean;
  config: Record<string, any>;
  credentials: Record<string, any>;
  sync_frequency: 'hourly' | 'daily' | 'weekly';
  last_sync_at?: string;
  next_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MetaAdsData {
  id: string;
  project_id: string;
  user_id: string;
  integration_id: string;
  date_start: string;
  date_stop: string;
  account_id?: string;
  campaign_id?: string;
  campaign_name?: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  cpm: number;
  cpc: number;
  ctr: number;
  raw_data: Record<string, any>;
  collected_at: string;
}

export interface WebhookSalesData {
  id: string;
  project_id: string;
  user_id: string;
  integration_id: string;
  external_sale_id: string;
  sale_date: string;
  product_name: string;
  product_id?: string;
  gross_amount: number;
  net_amount: number;
  commission_amount: number;
  fees_amount: number;
  customer_email?: string;
  customer_name?: string;
  transaction_status: string;
  payment_method?: string;
  raw_webhook_data: Record<string, any>;
  received_at: string;
  processed_at: string;
}

export interface IntegrationLog {
  id: string;
  integration_id: string;
  user_id: string;
  execution_type: 'api_sync' | 'webhook_received' | 'manual_trigger';
  status: 'success' | 'error' | 'warning';
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  message?: string;
  error_details?: Record<string, any>;
  execution_time_ms?: number;
  started_at: string;
  completed_at: string;
}