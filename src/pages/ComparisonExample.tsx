import { useProjectsContext } from '@/contexts/ProjectsContext';
import { ComparisonDashboard } from '@/components/ComparisonDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ComparisonExample() {
  const { projects } = useProjectsContext();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface">
      <header className="h-14 flex items-center justify-between border-b border-border/50 bg-white/80 backdrop-blur-sm px-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
        </div>
        <h2 className="text-sm font-medium text-muted-foreground">
          Dashboard Comparativo - Exemplo
        </h2>
      </header>

      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Dashboard Comparativo
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare a performance entre projetos e períodos com dados reais
          </p>
        </div>

        <ComparisonDashboard projects={projects} />
      </div>
    </div>
  );
}