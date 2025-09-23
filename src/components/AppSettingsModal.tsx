import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, Building, FileText, Palette, Download } from 'lucide-react';
import { useProjectSettings } from '@/hooks/useProjectSettings';
import { GlobalSettings } from '@/types/settings';
import { useToast } from '@/hooks/use-toast';

interface AppSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppSettingsModal({ open, onOpenChange }: AppSettingsModalProps) {
  const { toast } = useToast();
  const { globalSettings, saveGlobalSettings } = useProjectSettings();
  const [settings, setSettings] = useState<GlobalSettings>(globalSettings);

  useEffect(() => {
    if (open) {
      setSettings(globalSettings);
    }
  }, [open, globalSettings]);

  const handleSave = () => {
    saveGlobalSettings(settings);
    toast({
      title: "Configurações salvas",
      description: "As configurações globais foram atualizadas com sucesso.",
    });
    onOpenChange(false);
  };

  const updateSettings = (updates: Partial<GlobalSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configurações do Aplicativo</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="flex items-center space-x-1">
                <Building className="h-3 w-3" />
                <span className="hidden sm:inline">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center space-x-1">
                <FileText className="h-3 w-3" />
                <span className="hidden sm:inline">Financeiro</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center space-x-1">
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">Relatórios</span>
              </TabsTrigger>
              <TabsTrigger value="interface" className="flex items-center space-x-1">
                <Palette className="h-3 w-3" />
                <span className="hidden sm:inline">Interface</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card className="p-4">
                <h4 className="text-sm font-medium mb-4">Informações da Empresa</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nome da Empresa</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => updateSettings({ companyName: e.target.value })}
                      placeholder="Nome da sua empresa"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reportSignature">Assinatura dos Relatórios</Label>
                    <Textarea
                      id="reportSignature"
                      value={settings.reportSignature}
                      onChange={(e) => updateSettings({ reportSignature: e.target.value })}
                      placeholder="Texto que aparecerá no final dos relatórios"
                      rows={3}
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <Card className="p-4">
                <h4 className="text-sm font-medium mb-4">Configurações Financeiras Padrão</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultPlatformTax">Taxa de Plataforma Padrão (%)</Label>
                    <Input
                      id="defaultPlatformTax"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.defaultPlatformTax}
                      onChange={(e) => updateSettings({ 
                        defaultPlatformTax: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultTax">Imposto Padrão (%)</Label>
                    <Input
                      id="defaultTax"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.defaultTax}
                      onChange={(e) => updateSettings({ 
                        defaultTax: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultParticipation">Participação Padrão (%)</Label>
                    <Input
                      id="defaultParticipation"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.defaultParticipation}
                      onChange={(e) => updateSettings({ 
                        defaultParticipation: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Moeda</Label>
                    <Select 
                      value={settings.currency} 
                      onValueChange={(value: any) => updateSettings({ currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                        <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card className="p-4">
                <h4 className="text-sm font-medium mb-4">Configurações de Relatórios</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportTemplate">Template Padrão</Label>
                    <Select 
                      value={settings.reportTemplate} 
                      onValueChange={(value: any) => updateSettings({ reportTemplate: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Mínimo</SelectItem>
                        <SelectItem value="standard">Padrão</SelectItem>
                        <SelectItem value="detailed">Detalhado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exportFormat">Formato de Exportação Padrão</Label>
                    <Select 
                      value={settings.exportFormat} 
                      onValueChange={(value: any) => updateSettings({ exportFormat: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="Excel">Excel</SelectItem>
                        <SelectItem value="JSON">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="interface" className="space-y-4">
              <Card className="p-4">
                <h4 className="text-sm font-medium mb-4">Preferências de Interface</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Formato de Data</Label>
                    <Select 
                      value={settings.dateFormat} 
                      onValueChange={(value: any) => updateSettings({ dateFormat: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/AAAA</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/AAAA</SelectItem>
                        <SelectItem value="YYYY-MM-DD">AAAA-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <Select 
                      value={settings.theme} 
                      onValueChange={(value: any) => updateSettings({ theme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="auto">Automático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}