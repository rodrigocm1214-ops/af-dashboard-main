import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { useProjectSettings } from '@/hooks/useProjectSettings';
import { ProjectSettings } from '@/types/settings';
import { useToast } from '@/hooks/use-toast';

interface ProjectSettingsModalProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectSettingsModal({ 
  projectId, 
  projectName, 
  open, 
  onOpenChange 
}: ProjectSettingsModalProps) {
  const { toast } = useToast();
  const { globalSettings, getProjectSettings, saveProjectSettings } = useProjectSettings();
  const [settings, setSettings] = useState<ProjectSettings>({
    projectId,
    platformTax: globalSettings.defaultPlatformTax,
    tax: globalSettings.defaultTax,
    participation: globalSettings.defaultParticipation
  });

  useEffect(() => {
    if (open) {
      const currentSettings = getProjectSettings(projectId);
      setSettings(currentSettings);
    }
  }, [open, projectId, getProjectSettings]);

  const handleSave = () => {
    saveProjectSettings(settings);
    toast({
      title: "Configurações salvas",
      description: `Configurações do projeto "${projectName}" foram atualizadas.`,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setSettings({
      projectId,
      platformTax: globalSettings.defaultPlatformTax,
      tax: globalSettings.defaultTax,
      participation: globalSettings.defaultParticipation
    });
    toast({
      title: "Configurações redefinidas",
      description: "Configurações foram restauradas para os valores globais padrão.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[100] pointer-events-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configurações: {projectName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 pointer-events-auto">
          <Card className="p-4 bg-muted/30 pointer-events-auto">
            <h4 className="text-sm font-medium mb-3">Cálculos Financeiros</h4>
            <div className="space-y-4 pointer-events-auto">
              <div className="space-y-2">
                <Label htmlFor="platformTax" className="pointer-events-auto">Taxa de Plataforma (%)</Label>
                <Input
                  id="platformTax"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.platformTax || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setSettings(prev => ({
                      ...prev,
                      platformTax: value
                    }));
                  }}
                  className="pointer-events-auto relative z-10 bg-background border-input"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Porcentagem deduzida do faturamento bruto
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax" className="pointer-events-auto">Imposto (%)</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.tax || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setSettings(prev => ({
                      ...prev,
                      tax: value
                    }));
                  }}
                  className="pointer-events-auto relative z-10 bg-background border-input"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Porcentagem de impostos aplicada sobre o lucro
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="participation" className="pointer-events-auto">Percentual de Participação (%)</Label>
                <Input
                  id="participation"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.participation || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setSettings(prev => ({
                      ...prev,
                      participation: value
                    }));
                  }}
                  className="pointer-events-auto relative z-10 bg-background border-input"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Sua participação no lucro líquido final
                </p>
              </div>
            </div>
          </Card>

          <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
            <h5 className="font-medium mb-2">Fórmula de Cálculo:</h5>
            <p>Lucro Líquido = (Faturamento - Investimento - Taxa Plataforma - Impostos) × % Participação</p>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Redefinir
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}