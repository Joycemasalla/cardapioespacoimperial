import { useSettings } from '@/hooks/useSettings';
import { Crown } from 'lucide-react';

export function Header() {
  const { data: settings } = useSettings();
  
  return (
    <header className="bg-card border-b border-border sticky top-0 z-30">
      <div className="container py-4">
        <div className="flex items-center justify-center gap-3">
          <Crown className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">
            {settings?.store_name || 'Espaço Imperial'}
          </h1>
        </div>
        {!settings?.is_open && (
          <div className="mt-2 text-center">
            <span className="inline-block bg-destructive/20 text-destructive px-3 py-1 rounded-full text-sm font-medium">
              Fechado no momento
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
