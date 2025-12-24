import { MessageCircle } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

export function WhatsAppFloatingButton() {
  const { data: settings } = useSettings();
  
  const whatsappNumber = settings?.whatsapp_number || '5511999999999';
  const message = encodeURIComponent('Olá! Gostaria de fazer um pedido.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 animate-pulse-glow"
      aria-label="Pedir pelo WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="hidden sm:inline font-medium">Prefere pedir pelo Zap?</span>
    </a>
  );
}
