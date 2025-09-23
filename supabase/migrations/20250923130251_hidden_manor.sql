/*
  # Sistema de Integrações por Projeto

  1. Novas Tabelas
    - `project_integrations` - Configurações de integração por projeto
    - `meta_ads_data` - Dados coletados da API do Meta Ads
    - `webhook_sales_data` - Dados recebidos via webhooks
    - `integration_logs` - Logs de execução das integrações

  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas para usuários acessarem apenas seus próprios dados
    - Proteção de credenciais sensíveis

  3. Funcionalidades
    - Suporte a múltiplas integrações por projeto
    - Logs detalhados para debugging
    - Configurações flexíveis por projeto
*/

-- Tabela de configurações de integração por projeto
CREATE TABLE IF NOT EXISTS project_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type text NOT NULL CHECK (integration_type IN ('meta_ads', 'hotmart_webhook', 'kiwify_webhook')),
  is_active boolean DEFAULT true,
  
  -- Configurações específicas por tipo
  config jsonb DEFAULT '{}',
  
  -- Credenciais (serão criptografadas)
  credentials jsonb DEFAULT '{}',
  
  -- Configurações de execução
  sync_frequency text DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly')),
  last_sync_at timestamptz,
  next_sync_at timestamptz,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Dados do Meta Ads coletados via API
CREATE TABLE IF NOT EXISTS meta_ads_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES project_integrations(id) ON DELETE CASCADE,
  
  -- Dados da campanha
  date_start date NOT NULL,
  date_stop date NOT NULL,
  account_id text,
  campaign_id text,
  campaign_name text,
  
  -- Métricas
  spend numeric(10,2) DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  reach integer DEFAULT 0,
  cpm numeric(10,2) DEFAULT 0,
  cpc numeric(10,2) DEFAULT 0,
  ctr numeric(5,2) DEFAULT 0,
  
  -- Dados originais da API
  raw_data jsonb,
  
  -- Metadados
  collected_at timestamptz DEFAULT now(),
  
  UNIQUE(project_id, integration_id, date_start, campaign_id)
);

-- Dados de vendas recebidos via webhooks
CREATE TABLE IF NOT EXISTS webhook_sales_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES project_integrations(id) ON DELETE CASCADE,
  
  -- Dados da venda
  external_sale_id text NOT NULL,
  sale_date timestamptz NOT NULL,
  product_name text NOT NULL,
  product_id text,
  
  -- Valores financeiros
  gross_amount numeric(10,2) NOT NULL,
  net_amount numeric(10,2) NOT NULL,
  commission_amount numeric(10,2) DEFAULT 0,
  fees_amount numeric(10,2) DEFAULT 0,
  
  -- Informações do cliente
  customer_email text,
  customer_name text,
  
  -- Status da transação
  transaction_status text NOT NULL,
  payment_method text,
  
  -- Dados originais do webhook
  raw_webhook_data jsonb,
  
  -- Metadados
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz DEFAULT now(),
  
  UNIQUE(integration_id, external_sale_id)
);

-- Logs de execução das integrações
CREATE TABLE IF NOT EXISTS integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES project_integrations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Detalhes da execução
  execution_type text NOT NULL CHECK (execution_type IN ('api_sync', 'webhook_received', 'manual_trigger')),
  status text NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  
  -- Resultados
  records_processed integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  
  -- Detalhes e erros
  message text,
  error_details jsonb,
  execution_time_ms integer,
  
  -- Metadados
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_project_integrations_project_id ON project_integrations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_integrations_type ON project_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_meta_ads_data_project_date ON meta_ads_data(project_id, date_start);
CREATE INDEX IF NOT EXISTS idx_webhook_sales_data_project_date ON webhook_sales_data(project_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON integration_logs(integration_id);

-- Enable RLS
ALTER TABLE project_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ads_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para project_integrations
CREATE POLICY "Users can manage their own project integrations"
  ON project_integrations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies para meta_ads_data
CREATE POLICY "Users can view their own meta ads data"
  ON meta_ads_data
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert meta ads data"
  ON meta_ads_data
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies para webhook_sales_data
CREATE POLICY "Users can view their own webhook sales data"
  ON webhook_sales_data
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert webhook sales data"
  ON webhook_sales_data
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies para integration_logs
CREATE POLICY "Users can view their own integration logs"
  ON integration_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert integration logs"
  ON integration_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_project_integrations_updated_at
  BEFORE UPDATE ON project_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();