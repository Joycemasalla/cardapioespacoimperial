import { AlertTriangle, Clock, Wrench } from 'lucide-react';
import { Settings } from '@/types';

interface StoreClosedOverlayProps {
  settings: Settings | null;
}

/**
 * Verifica se a loja está aberta baseado no horário
 */
export function isStoreCurrentlyOpen(settings: Settings | null): boolean {
  if (!settings) return true;
  if (!settings.is_open) return false;
  if (settings.maintenance_mode) return false;

  // Check operating hours
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const openingTime = settings.opening_time || '00:00';
  const closingTime = settings.closing_time || '23:59';

  // Handle overnight hours (e.g., 18:00 - 02:00)
  if (closingTime < openingTime) {
    return currentTime >= openingTime || currentTime < closingTime;
  }
  
  return currentTime >= openingTime && currentTime < closingTime;
}

export function StoreClosedOverlay({ settings }: StoreClosedOverlayProps) {
  if (!settings) return null;
  
  const isOpen = isStoreCurrentlyOpen(settings);
  
  if (isOpen) return null;

  const isMaintenance = settings.maintenance_mode;
  
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        {isMaintenance ? (
          <>
            <Wrench className="h-16 w-16 mx-auto text-amber-500" />
            <h2 className="text-2xl font-display font-bold text-foreground">
              Cardápio em Atualização
            </h2>
            <p className="text-muted-foreground">
              Estamos atualizando nosso cardápio. Volte em breve!
            </p>
          </>
        ) : (
          <>
            <Clock className="h-16 w-16 mx-auto text-primary" />
            <h2 className="text-2xl font-display font-bold text-foreground">
              Estamos Fechados
            </h2>
            <p className="text-muted-foreground">
              {settings.closed_message || 'Estamos fechados no momento.'}
            </p>
            {settings.opening_time && settings.closing_time && (
              <p className="text-sm text-muted-foreground">
                Funcionamos das <span className="text-primary font-semibold">{settings.opening_time}</span> às{' '}
                <span className="text-primary font-semibold">{settings.closing_time}</span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
