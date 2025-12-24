import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, ArrowLeft } from 'lucide-react';

interface OrderPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  onConfirm: () => void;
}

export default function OrderPreviewModal({ 
  open, 
  onOpenChange, 
  message, 
  onConfirm 
}: OrderPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground">Confirme seu pedido</DialogTitle>
        </DialogHeader>
        
        <p className="text-sm text-muted-foreground">
          Revise a mensagem que será enviada pelo WhatsApp:
        </p>
        
        <ScrollArea className="flex-1 max-h-[50vh] border border-border rounded-lg bg-muted/30 p-4">
          <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
            {message}
          </pre>
        </ScrollArea>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar e Editar
          </Button>
          <Button 
            onClick={onConfirm}
            className="w-full sm:w-auto gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Confirmar e Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
