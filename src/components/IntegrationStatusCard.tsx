import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Facebook, 
  ShoppingCart, 
  Zap, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Settings,
  Plus
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IntegrationStatusCardProps {
  projectId: string;
  onOpenIntegrations: () => void;
}

export function IntegrationStatusCard({ projectId, onOpenIntegrations }: IntegrationStatusCardProps) {
  const { integrations, logs, loading, triggerSync, refreshData } = useIntegrations(projectId);
  const [refreshing, setRefreshing] = useState(false);

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'meta_ads': return Facebook;
      case 'hotmart_webhook': return ShoppingCart;
      case 'kiwify_webhook': return Zap;
      default: return Settings;
    }
  };

  const getIntegrationLabel = (type: string) => {
    switch (type) {
      case 'meta_ads': return 'Meta Ads';
      case 'hotmart_webhook': return 'Hotmart';
      case 'kiwify_webhook': return 'Kiwify';
      default: return type;
    }
  };

  const getLastLogStatus = (integrationId: string) => {
    const integrationLogs = logs.filter(log => log.integration_id === integrationId);
    return integrationLogs.length > 0 ? integrationLogs[0] : null;
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      // Trigger sync for all Meta Ads integrations
      const metaAdsIntegrations = integrations.filter(i => i.integration_type === 'meta_ads' && i.is_active);
      
      for (const integration of metaAdsIntegrations) {
        await triggerSync(integration.id);
      }
      
      await refreshData();
    } catch (error) {
      console.error('Error refreshing integrations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (integrations.length === 0) {
    return (
      <Card className="p-4 bg-white shadow-card">
        <div className="text-center space-y-3">
          <Settings className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
          <div>
            <h3 className="font-medium text-foreground">Nenhuma integração configurada</h3>
            <p className="text-sm text-muted-foreground">
              Configure integrações para automatizar a coleta de dados
            </p>
          </div>
          <Button onClick={onOpenIntegrations} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Configurar Integrações
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">Status das Integrações</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenIntegrations}>
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {integrations.map((integration) => {
          const Icon = getIntegrationIcon(integration.integration_type);
          const lastLog = getLastLogStatus(integration.id);
          const isWebhook = integration.integration_type.includes('webhook');
          
          return (
            <div key={integration.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/30">
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5 text-primary" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {getIntegrationLabel(integration.integration_type)}
                    </span>
                    <Badge variant={integration.is_active ? "default" : "secondary"} className="text-xs">
                      {integration.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  {integration.last_sync_at && !isWebhook && (
                    <p className="text-xs text-muted-foreground">
                      Última sync: {formatDistanceToNow(new Date(integration.last_sync_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  )}
                  
                  {isWebhook && (
                    <p className="text-xs text-muted-foreground">
                      Webhook configurado
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {lastLog && (
                  <div className="flex items-center space-x-1">
                    {lastLog.status === 'success' && <CheckCircle className="h-4 w-4 text-success" />}
                    {lastLog.status === 'error' && <AlertCircle className="h-4 w-4 text-danger" />}
                    {lastLog.status === 'warning' && <Clock className="h-4 w-4 text-warning" />}
                  </div>
                )}
                
                {!isWebhook && integration.is_active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => triggerSync(integration.id)}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}