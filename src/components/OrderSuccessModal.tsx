import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Copy, MessageCircle, Home } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface OrderSuccessModalProps {
  open: boolean;
  onClose: () => void;
  orderNumber: string;
  pixKey?: string | null;
  whatsappNumber: string;
  total: number;
  paymentMethod: 'cash' | 'pix' | 'card';
}

export default function OrderSuccessModal({ 
  open, 
  onClose,
  orderNumber,
  pixKey,
  whatsappNumber,
  total,
  paymentMethod,
}: OrderSuccessModalProps) {
  const [pixCopied, setPixCopied] = useState(false);

  const handleCopyPix = () => {
    if (pixKey) {
      navigator.clipboard.writeText(pixKey);
      setPixCopied(true);
      toast.success('Chave PIX copiada!');
      setTimeout(() => setPixCopied(false), 2000);
    }
  };

  const handleSendReceipt = () => {
    const message = encodeURIComponent(
      `📱 *Comprovante PIX*\n\n` +
      `Pedido: #${orderNumber}\n` +
      `Valor: R$ ${total.toFixed(2)}\n\n` +
      `_Segue o comprovante em anexo._`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-xl text-foreground">Pedido Enviado!</DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            Seu pedido foi enviado com sucesso pelo WhatsApp.
          </p>
          <div className="inline-block bg-muted rounded-lg px-4 py-2">
            <span className="text-sm text-muted-foreground">Número do pedido</span>
            <p className="text-2xl font-bold font-mono text-primary">#{orderNumber}</p>
          </div>
        </div>

        {paymentMethod === 'pix' && pixKey && (
          <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg space-y-3">
            <p className="text-sm font-medium text-foreground text-center">
              💳 Realize o pagamento via PIX:
            </p>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background border border-border rounded-lg p-3 font-mono text-sm text-foreground break-all text-center">
                {pixKey}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 flex-shrink-0"
                onClick={handleCopyPix}
              >
                {pixCopied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>

            <p className="text-sm text-foreground font-medium text-center">
              Valor: <span className="text-primary">R$ {total.toFixed(2)}</span>
            </p>

            <Button 
              onClick={handleSendReceipt}
              className="w-full gap-2"
              variant="secondary"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar Comprovante PIX
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Após pagar, clique acima para enviar o comprovante pelo WhatsApp
            </p>
          </div>
        )}
        
        <DialogFooter className="mt-4">
          <Button onClick={onClose} className="w-full gap-2">
            <Home className="h-4 w-4" />
            Voltar ao Cardápio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
