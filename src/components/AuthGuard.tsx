import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from './AuthModal';
import { Button } from '@/components/ui/button';
import { LogIn, User } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              A-FONTE Dashboard
            </h1>
            <p className="text-muted-foreground">
              Faça login para acessar o sistema de gestão de KPIs
            </p>
          </div>
          <AuthModal open={true} onOpenChange={() => {}} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}