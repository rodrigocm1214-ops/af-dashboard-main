import { useState, useEffect } from 'react';
import { supabase, ProjectIntegration, MetaAdsData, WebhookSalesData, IntegrationLog } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const useIntegrations = (projectId?: string) => {
  const [integrations, setIntegrations] = useState<ProjectIntegration[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      loadIntegrations();
      loadLogs();
    }
  }, [projectId]);

  const loadIntegrations = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_integrations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast({
        title: "Erro ao carregar integrações",
        description: "Não foi possível carregar as integrações do projeto.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('integration_logs')
        .select(`
          *,
          project_integrations!inner(project_id)
        `)
        .eq('project_integrations.project_id', projectId)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const createIntegration = async (integration: Omit<ProjectIntegration, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!projectId) throw new Error('Project ID is required');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('project_integrations')
        .insert({
          ...integration,
          project_id: projectId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      await loadIntegrations();
      
      toast({
        title: "Integração criada",
        description: `Integração ${integration.integration_type} foi configurada com sucesso.`
      });

      return data;
    } catch (error) {
      console.error('Error creating integration:', error);
      toast({
        title: "Erro ao criar integração",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateIntegration = async (integrationId: string, updates: Partial<ProjectIntegration>) => {
    try {
      const { error } = await supabase
        .from('project_integrations')
        .update(updates)
        .eq('id', integrationId);

      if (error) throw error;

      await loadIntegrations();
      
      toast({
        title: "Integração atualizada",
        description: "As configurações foram salvas com sucesso."
      });
    } catch (error) {
      console.error('Error updating integration:', error);
      toast({
        title: "Erro ao atualizar integração",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteIntegration = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('project_integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;

      await loadIntegrations();
      
      toast({
        title: "Integração removida",
        description: "A integração foi removida com sucesso."
      });
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast({
        title: "Erro ao remover integração",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const triggerSync = async (integrationId: string) => {
    try {
      const integration = integrations.find(i => i.id === integrationId);
      if (!integration) throw new Error('Integration not found');

      if (integration.integration_type === 'meta_ads') {
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/meta-ads-sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ integrationId })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Sync failed: ${error}`);
        }

        const result = await response.json();
        
        toast({
          title: "Sincronização iniciada",
          description: `Meta Ads: ${result.message || 'Dados sincronizados com sucesso'}`
        });
      } else {
        toast({
          title: "Sincronização não disponível",
          description: "Webhooks são acionados automaticamente pelas plataformas.",
          variant: "destructive"
        });
      }

      await loadIntegrations();
      await loadLogs();
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getWebhookUrl = (platform: 'hotmart' | 'kiwify') => {
    if (!projectId) return '';
    return `${supabase.supabaseUrl}/functions/v1/webhook-handler?platform=${platform}&project_id=${projectId}`;
  };

  return {
    integrations,
    logs,
    loading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    triggerSync,
    getWebhookUrl,
    refreshData: () => {
      loadIntegrations();
      loadLogs();
    }
  };
};