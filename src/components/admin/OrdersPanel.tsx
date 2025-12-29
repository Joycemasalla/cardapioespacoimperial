import { useState } from 'react';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, MapPin, Clock, Package, CheckCircle, XCircle, Loader2, ChefHat, Truck, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Order } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Clock className="h-4 w-4" /> },
  confirmed: { label: 'Confirmado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <CheckCircle className="h-4 w-4" /> },
  preparing: { label: 'Preparando', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <ChefHat className="h-4 w-4" /> },
  ready: { label: 'Pronto', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <Package className="h-4 w-4" /> },
  delivered: { label: 'Entregue', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <Truck className="h-4 w-4" /> },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <XCircle className="h-4 w-4" /> },
};

const statusMessages: Record<OrderStatus, string> = {
  pending: 'Seu pedido foi recebido e está aguardando confirmação!',
  confirmed: 'Seu pedido foi confirmado e logo será preparado!',
  preparing: 'Seu pedido está sendo preparado com carinho!',
  ready: 'Seu pedido está pronto! Aguardando retirada/entrega.',
  delivered: 'Seu pedido foi entregue! Bom apetite!',
  cancelled: 'Infelizmente seu pedido foi cancelado.',
};

const orderTypeLabels = {
  delivery: '🚚 Delivery',
  pickup: '🏪 Retirada',
  table: '🍽️ Mesa',
};

export function OrdersPanel() {
  const { data: orders, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders?.filter(o => o.status === filterStatus);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, status: newStatus });
      toast.success(`Status atualizado para ${statusConfig[newStatus].label}`);
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleNotifyCustomer = (order: Order, status: OrderStatus) => {
    if (!order.customer_phone) {
      toast.error('Cliente não tem telefone cadastrado');
      return;
    }

    const message = `Olá, ${order.customer_name}! 📦\n\n${statusMessages[status]}\n\nPedido: #${order.id.slice(0, 8).toUpperCase()}\n\nObrigado pela preferência!`;
    const whatsappUrl = `https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-display font-bold text-foreground">
          Gerenciar Pedidos ({filteredOrders?.length || 0})
        </h2>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px] bg-card border-border">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todos os Pedidos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="confirmed">Confirmados</SelectItem>
            <SelectItem value="preparing">Preparando</SelectItem>
            <SelectItem value="ready">Prontos</SelectItem>
            <SelectItem value="delivered">Entregues</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders?.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders?.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onStatusChange={handleStatusChange}
              onNotifyCustomer={handleNotifyCustomer}
              isUpdating={updateStatus.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onNotifyCustomer: (order: Order, status: OrderStatus) => void;
  isUpdating: boolean;
}

function OrderCard({ order, onStatusChange, onNotifyCustomer, isUpdating }: OrderCardProps) {
  const status = (order.status || 'pending') as OrderStatus;
  const config = statusConfig[status];
  
  const formattedDate = order.created_at 
    ? format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'Data não disponível';

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 hover:border-primary/30 transition-colors animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`${config.color} flex items-center gap-1.5`}>
            {config.icon}
            {config.label}
          </Badge>
          <span className="text-muted-foreground text-sm">{formattedDate}</span>
        </div>
        <span className="text-sm text-muted-foreground font-mono">
          #{order.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Customer Info */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Phone className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{order.customer_name}</p>
            <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
          </div>
        </div>
        
        <Badge variant="secondary" className="w-fit">
          {orderTypeLabels[order.order_type]}
        </Badge>

        {order.order_type === 'delivery' && order.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              {order.address}
              {order.address_complement && ` - ${order.address_complement}`}
            </span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Itens do Pedido:</p>
        <div className="space-y-1">
          {order.items?.map((item, index) => (
            <div key={index} className="text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {item.quantity}x {item.product?.name || 'Produto'}
                  {item.variation && ` (${item.variation.name})`}
                  {item.secondFlavor && ` + ${item.secondFlavor.name}`}
                </span>
                <span className="text-foreground font-medium">
                  R$ {((item.variation?.price || item.product?.price || 0) * item.quantity).toFixed(2)}
                </span>
              </div>
              {/* Show addons if any */}
              {item.addons && item.addons.length > 0 && (
                <div className="ml-4 text-xs text-muted-foreground">
                  + {item.addons.map(a => a.name).join(', ')}
                  <span className="ml-2">
                    (+R$ {item.addons.reduce((sum, a) => sum + a.price, 0).toFixed(2)})
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Observações:</span> {order.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-border">
        <div className="text-xl font-bold text-primary">
          Total: R$ {order.total.toFixed(2)}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Notify Customer Button */}
          {order.customer_phone && status !== 'cancelled' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNotifyCustomer(order, status)}
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Notificar
            </Button>
          )}

          {status !== 'cancelled' && status !== 'delivered' && (
            <>
              {status === 'pending' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onStatusChange(order.id, 'confirmed')}
                  disabled={isUpdating}
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirmar
                </Button>
              )}
              {status === 'confirmed' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onStatusChange(order.id, 'preparing')}
                  disabled={isUpdating}
                  className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                >
                  <ChefHat className="h-4 w-4 mr-1" />
                  Preparar
                </Button>
              )}
              {status === 'preparing' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onStatusChange(order.id, 'ready')}
                  disabled={isUpdating}
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                >
                  <Package className="h-4 w-4 mr-1" />
                  Pronto
                </Button>
              )}
              {status === 'ready' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onStatusChange(order.id, 'delivered')}
                  disabled={isUpdating}
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Truck className="h-4 w-4 mr-1" />
                  Entregar
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStatusChange(order.id, 'cancelled')}
                disabled={isUpdating}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
