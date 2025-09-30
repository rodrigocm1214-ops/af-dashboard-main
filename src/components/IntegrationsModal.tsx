import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Plus, Trash2, RefreshCw, Copy, Eye, EyeOff, Facebook, ShoppingCart, Zap, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Clock } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { ProjectIntegration } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IntegrationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

interface IntegrationFormData {
  type: 'meta_ads' | 'hotmart_webhook' | 'kiwify_webhook';
  config: Record<string, any>;
  credentials: Record<string, any>;
  syncFrequency: 'hourly' | 'daily' | 'weekly';
}

export function IntegrationsModal({ 
  open, 
  onOpenChange, 
  projectId, 
  projectName 
}: IntegrationsModalProps) {
  const { toast } = useToast();
  const { 
    integrations, 
    logs, 
    loading, 
    createIntegration, 
    updateIntegration, 
    deleteIntegration, 
    triggerSync,
    getWebhookUrl,
    refreshData 
  } = useIntegrations(projectId);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<ProjectIntegration | null>(null);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<IntegrationFormData>({
    type: 'meta_ads',
    config: {},
    credentials: {},
    syncFrequency: 'daily'
  });

  const resetForm = () => {
    setFormData({
      type: 'meta_ads',
      config: {},
      credentials: {},
      syncFrequency: 'daily'
    });
    setShowCreateForm(false);
    setEditingIntegration(null);
  };

  const handleCreateIntegration = async () => {
    try {
      await createIntegration({
        project_id: projectId,
        integration_type: formData.type,
        is_active: true,
        config: formData.config,
        credentials: formData.credentials,
        sync_frequency: formData.syncFrequency,
        last_sync_at: undefined,
        next_sync_at: undefined
      });
      resetForm();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleUpdateIntegration = async () => {
    if (!editingIntegration) return;

    try {
      await updateIntegration(editingIntegration.id, {
        config: formData.config,
        credentials: formData.credentials,
        sync_frequency: formData.syncFrequency
      });
      resetForm();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const copyWebhookUrl = (platform: 'hotmart' | 'kiwify') => {
    const url = getWebhookUrl(platform);
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copiada!",
      description: `URL do webhook ${platform} foi copiada para a área de transferência.`
    });
  };

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
      case 'meta_ads': return 'Meta Ads API';
      case 'hotmart_webhook': return 'Hotmart Webhook';
      case 'kiwify_webhook': return 'Kiwify Webhook';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'error': return 'text-danger';
      case 'warning': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const renderMetaAdsForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="accessToken">Access Token *</Label>
        <div className="relative">
          <Input
            id="accessToken"
            type={showCredentials.accessToken ? "text" : "password"}
            value={formData.credentials.accessToken || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              credentials: { ...prev.credentials, accessToken: e.target.value }
            }))}
            placeholder="Seu token de acesso do Meta Ads"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => setShowCredentials(prev => ({ ...prev, accessToken: !prev.accessToken }))}
          >
            {showCredentials.accessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adAccountId">Ad Account ID *</Label>
        <Input
          id="adAccountId"
          value={formData.config.adAccountId || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            config: { ...prev.config, adAccountId: e.target.value }
          }))}
          placeholder="123456789"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="syncFrequency">Frequência de Sincronização</Label>
        <Select 
          value={formData.syncFrequency} 
          onValueChange={(value: any) => setFormData(prev => ({ ...prev, syncFrequency: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hourly">A cada hora</SelectItem>
            <SelectItem value="daily">Diariamente</SelectItem>
            <SelectItem value="weekly">Semanalmente</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderWebhookForm = (platform: 'hotmart' | 'kiwify') => (
    <div className="space-y-4">
      <div className="bg-muted/30 p-3 rounded-lg">
        <h4 className="font-medium text-sm mb-2">URL do Webhook</h4>
        <div className="flex gap-2">
          <Input
            value={getWebhookUrl(platform)}
            readOnly
            className="font-mono text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copyWebhookUrl(platform)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Configure esta URL nas configurações de webhook da {platform === 'hotmart' ? 'Hotmart' : 'Kiwify'}.
          {platform === 'hotmart' && (
            <span className="block mt-1 text-warning">
              ⚠️ Certifique-se de que a URL está acessível publicamente. URLs localhost não funcionam.
            </span>
          )}
        </p>
      </div>

      {platform === 'kiwify' && (
        <div className="space-y-2">
          <Label htmlFor="webhookSecret">Webhook Secret *</Label>
          <div className="relative">
            <Input
              id="webhookSecret"
              type={showCredentials.webhookSecret ? "text" : "password"}
              value={formData.credentials.webhookSecret || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                credentials: { ...prev.credentials, webhookSecret: e.target.value }
              }))}
              placeholder="Chave secreta do webhook"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setShowCredentials(prev => ({ ...prev, webhookSecret: !prev.webhookSecret }))}
            >
              {showCredentials.webhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Chave secreta fornecida pela Kiwify para validação do webhook
          </p>
        </div>
      )}

      {platform === 'hotmart' && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <h5 className="font-medium text-sm text-blue-900 mb-2">Configuração na Hotmart</h5>
          <div className="text-xs text-blue-800 space-y-1">
            <p>1. Acesse: Hotmart &gt; Ferramentas &gt; Webhook</p>
            <p>2. Cole a URL do webhook acima</p>
            <p>3. Selecione os eventos: PURCHASE_COMPLETE, PURCHASE_APPROVED</p>
            <p>4. A Hotmart não usa webhook secret - apenas configure a URL</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="webhookEvents">Eventos para Processar</Label>
        <Textarea
          id="webhookEvents"
          value={formData.config.events?.join('\n') || (platform === 'hotmart' ? 'PURCHASE_COMPLETE\nPURCHASE_APPROVED' : 'order.paid')}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            config: { ...prev.config, events: e.target.value.split('\n').filter(Boolean) }
          }))}
          placeholder={platform === 'hotmart' ? 'PURCHASE_COMPLETE\nPURCHASE_APPROVED' : 'order.paid'}
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Integrações - {projectName}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="integrations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-6">
            {/* Create/Edit Form */}
            {(showCreateForm || editingIntegration) && (
              <Card className="p-4 bg-white shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">
                    {editingIntegration ? 'Editar Integração' : 'Nova Integração'}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  {!editingIntegration && (
                    <div className="space-y-2">
                      <Label>Tipo de Integração</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meta_ads">Meta Ads API</SelectItem>
                          <SelectItem value="hotmart_webhook">Hotmart Webhook</SelectItem>
                          <SelectItem value="kiwify_webhook">Kiwify Webhook</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.type === 'meta_ads' && renderMetaAdsForm()}
                  {formData.type === 'hotmart_webhook' && renderWebhookForm('hotmart')}
                  {formData.type === 'kiwify_webhook' && renderWebhookForm('kiwify')}

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={editingIntegration ? handleUpdateIntegration : handleCreateIntegration}
                      disabled={
                        formData.type === 'meta_ads' ? !formData.credentials.accessToken :
                        formData.type === 'kiwify_webhook' ? !formData.credentials.webhookSecret :
                        false // Hotmart não precisa de webhook secret
                      }
                    >
                      {editingIntegration ? 'Atualizar' : 'Criar'} Integração
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Integrations List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Integrações Configuradas</h3>
                {!showCreateForm && !editingIntegration && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Integração
                  </Button>
                )}
              </div>

              {integrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma integração configurada</p>
                  <p className="text-sm mt-2">
                    Configure integrações para automatizar a coleta de dados
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {integrations.map((integration) => {
                    const Icon = getIntegrationIcon(integration.integration_type);
                    const isWebhook = integration.integration_type.includes('webhook');
                    
                    return (
                      <Card key={integration.id} className="p-4 bg-white shadow-card">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <div>
                              <h4 className="font-medium">
                                {getIntegrationLabel(integration.integration_type)}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant={integration.is_active ? "default" : "secondary"}>
                                  {integration.is_active ? 'Ativo' : 'Inativo'}
                                </Badge>
                                {!isWebhook && (
                                  <Badge variant="outline" className="text-xs">
                                    {integration.sync_frequency}
                                  </Badge>
                                )}
                              </div>
                              {integration.last_sync_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Última sincronização: {formatDistanceToNow(new Date(integration.last_sync_at), { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {!isWebhook && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => triggerSync(integration.id)}
                                disabled={!integration.is_active}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingIntegration(integration);
                                setFormData({
                                  type: integration.integration_type,
                                  config: integration.config,
                                  credentials: integration.credentials,
                                  syncFrequency: integration.sync_frequency
                                });
                              }}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteIntegration(integration.id)}
                              className="text-danger hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {isWebhook && (
                          <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">URL do Webhook:</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyWebhookUrl(integration.integration_type.replace('_webhook', '') as 'hotmart' | 'kiwify')}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <code className="text-xs text-muted-foreground break-all">
                              {getWebhookUrl(integration.integration_type.replace('_webhook', '') as 'hotmart' | 'kiwify')}
                            </code>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Logs de Execução</h3>
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum log encontrado</p>
                <p className="text-sm mt-2">
                  Os logs de execução aparecerão aqui após as primeiras sincronizações
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const StatusIcon = log.status === 'success' ? CheckCircle : 
                                   log.status === 'error' ? AlertCircle : Clock;
                  
                  return (
                    <Card key={log.id} className="p-4 bg-white shadow-card">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <StatusIcon className={`h-5 w-5 mt-0.5 ${getStatusColor(log.status)}`} />
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">
                                {log.execution_type === 'api_sync' ? 'Sincronização API' : 
                                 log.execution_type === 'webhook_received' ? 'Webhook Recebido' : 
                                 'Execução Manual'}
                              </span>
                              <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                                {log.status}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {log.message || 'Sem mensagem'}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>Processados: {log.records_processed}</span>
                              <span>Criados: {log.records_created}</span>
                              <span>Atualizados: {log.records_updated}</span>
                              {log.records_failed > 0 && (
                                <span className="text-danger">Falhas: {log.records_failed}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{formatDistanceToNow(new Date(log.started_at), { addSuffix: true, locale: ptBR })}</p>
                          {log.execution_time_ms && (
                            <p>{log.execution_time_ms}ms</p>
                          )}
                        </div>
                      </div>

                      {log.error_details && (
                        <div className="mt-3 p-3 bg-danger/5 border border-danger/20 rounded-lg">
                          <p className="text-sm text-danger font-medium">Detalhes do Erro:</p>
                          <pre className="text-xs text-danger mt-1 overflow-x-auto">
                            {JSON.stringify(log.error_details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}