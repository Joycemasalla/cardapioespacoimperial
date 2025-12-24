import { useState } from 'react';
import { ArrowLeft, Minus, Plus, Trash2, MessageCircle, MapPin, Store, UtensilsCrossed } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

type OrderType = 'delivery' | 'pickup' | 'table';

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const { data: settings } = useSettings();
  
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');

  const deliveryFee = orderType === 'delivery' ? (settings?.delivery_fee || 0) : 0;
  const finalTotal = total + deliveryFee;

  const getDiscountedPrice = (item: typeof items[0]) => {
    const product = item.product;
    if (product.promotion && product.promotion.is_active) {
      const discount = product.promotion.discount_percent / 100;
      return product.price * (1 - discount);
    }
    return product.price;
  };

  const formatOrderMessage = () => {
    let message = `🍔 *Novo Pedido - ${settings?.store_name || 'Espaço Imperial'}*\n\n`;
    message += `👤 *Cliente:* ${customerName}\n`;
    message += `📱 *Telefone:* ${customerPhone}\n\n`;
    
    message += `📋 *Itens:*\n`;
    items.forEach((item) => {
      const price = getDiscountedPrice(item);
      message += `• ${item.quantity}x ${item.product.name} - R$ ${(price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n💰 *Subtotal:* R$ ${total.toFixed(2)}\n`;
    
    if (orderType === 'delivery') {
      message += `🚚 *Taxa de Entrega:* R$ ${deliveryFee.toFixed(2)}\n`;
      message += `\n🏠 *Endereço:* ${address}`;
      if (addressComplement) message += ` - ${addressComplement}`;
      message += `\n`;
    } else if (orderType === 'pickup') {
      message += `\n🏪 *Retirada no local*\n`;
    } else {
      message += `\n🍽️ *Mesa:* ${tableNumber}\n`;
    }
    
    message += `\n💵 *TOTAL: R$ ${finalTotal.toFixed(2)}*`;
    
    if (notes) {
      message += `\n\n📝 *Observações:* ${notes}`;
    }
    
    return message;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !customerPhone) {
      toast.error('Preencha seu nome e telefone');
      return;
    }
    
    if (orderType === 'delivery' && !address) {
      toast.error('Preencha o endereço de entrega');
      return;
    }
    
    if (orderType === 'table' && !tableNumber) {
      toast.error('Informe o número da mesa');
      return;
    }

    const whatsappNumber = settings?.whatsapp_number || '5511999999999';
    const message = encodeURIComponent(formatOrderMessage());
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
    clearCart();
    toast.success('Pedido enviado! Finalize no WhatsApp');
    navigate('/');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background dark flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground text-lg mb-4">Seu carrinho está vazio</p>
        <Link to="/">
          <Button>Ver Cardápio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-display font-semibold">Meu Carrinho</h1>
        </div>
      </header>

      <div className="container py-6 pb-32">
        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          {items.map((item) => {
            const price = getDiscountedPrice(item);
            return (
              <div key={item.product.id} className="bg-card border border-border rounded-lg p-4 flex gap-4">
                {item.product.image_url ? (
                  <img 
                    src={item.product.image_url} 
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="font-semibold">{item.product.name}</h3>
                  <p className="text-primary font-bold">R$ {(price * item.quantity).toFixed(2)}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive ml-auto"
                      onClick={() => removeItem(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Como você quer receber?</Label>
            <RadioGroup 
              value={orderType} 
              onValueChange={(v) => setOrderType(v as OrderType)}
              className="grid grid-cols-3 gap-3"
            >
              <div>
                <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                <Label
                  htmlFor="delivery"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all"
                >
                  <MapPin className="h-6 w-6" />
                  <span className="text-sm font-medium">Delivery</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                <Label
                  htmlFor="pickup"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all"
                >
                  <Store className="h-6 w-6" />
                  <span className="text-sm font-medium">Retirada</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="table" id="table" className="peer sr-only" />
                <Label
                  htmlFor="table"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all"
                >
                  <UtensilsCrossed className="h-6 w-6" />
                  <span className="text-sm font-medium">Mesa</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Seu nome *</Label>
              <Input 
                id="name" 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="João Silva"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp *</Label>
              <Input 
                id="phone" 
                value={customerPhone} 
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </div>

          {/* Delivery Address */}
          {orderType === 'delivery' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço *</Label>
                <Input 
                  id="address" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input 
                  id="complement" 
                  value={addressComplement} 
                  onChange={(e) => setAddressComplement(e.target.value)}
                  placeholder="Apartamento, bloco, referência"
                />
              </div>
            </div>
          )}

          {/* Table Number */}
          {orderType === 'table' && (
            <div className="space-y-2">
              <Label htmlFor="table">Número da Mesa *</Label>
              <Input 
                id="table" 
                type="number"
                value={tableNumber} 
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Ex: 5"
                required
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alguma observação sobre seu pedido?"
              rows={3}
            />
          </div>

          {/* Total */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            {orderType === 'delivery' && (
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa de Entrega</span>
                <span>R$ {deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">R$ {finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" size="lg" className="w-full gap-2">
            <MessageCircle className="h-5 w-5" />
            Enviar Pedido pelo WhatsApp
          </Button>

          {/* WhatsApp Help */}
          <p className="text-center text-sm text-muted-foreground">
            Teve algum problema?{' '}
            <a 
              href={`https://wa.me/${settings?.whatsapp_number || '5511999999999'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Clique aqui para pedir direto pelo WhatsApp
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
