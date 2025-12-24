import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

interface FirstAdminOnboardingProps {
  user: User | null;
}

export function FirstAdminOnboarding({ user }: FirstAdminOnboardingProps) {
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const handleBootstrapAdmin = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para se tornar administrador');
      return;
    }

    setIsBootstrapping(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('bootstrap-admin');

      if (error) {
        console.error('Bootstrap admin error:', error);
        toast.error(error.message || 'Erro ao configurar administrador');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(data?.message || 'Você agora é administrador!');
      // Reload the page to refresh admin status
      window.location.reload();
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Erro inesperado ao configurar administrador');
    } finally {
      setIsBootstrapping(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background dark flex flex-col items-center justify-center p-4">
        <img src={logo} alt="Espaço Imperial" className="h-16 mb-8" />
        <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center">
          <LogIn className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold text-foreground mb-2">
            Acesso Restrito
          </h1>
          <p className="text-muted-foreground mb-6">
            Faça login para acessar o painel administrativo.
          </p>
          <Link to="/auth">
            <Button className="w-full bg-primary hover:bg-primary/90">
              Fazer Login
            </Button>
          </Link>
        </div>
        <Link to="/" className="mt-4">
          <Button variant="ghost" className="text-muted-foreground">
            ← Voltar ao Cardápio
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark flex flex-col items-center justify-center p-4">
      <img src={logo} alt="Espaço Imperial" className="h-16 mb-8" />
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center">
        <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-xl font-display font-bold text-foreground mb-2">
          Configuração Inicial
        </h1>
        <p className="text-muted-foreground mb-2">
          Olá, <span className="text-foreground font-medium">{user.email}</span>!
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          Ainda não há administrador configurado. Clique no botão abaixo para se tornar o primeiro administrador do sistema.
        </p>
        <Button 
          onClick={handleBootstrapAdmin}
          disabled={isBootstrapping}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isBootstrapping ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Configurando...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Tornar-me Administrador
            </>
          )}
        </Button>
      </div>
      <Link to="/" className="mt-4">
        <Button variant="ghost" className="text-muted-foreground">
          ← Voltar ao Cardápio
        </Button>
      </Link>
    </div>
  );
}
