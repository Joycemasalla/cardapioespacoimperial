import { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, Trash2, MessageCircle, MapPin, Store, Banknote, CreditCard, QrCode, Edit2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, generateCartItemKey } from '@/contexts/CartContext';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

type OrderType = 'delivery' | 'pickup';
type PaymentMethod = 'cash' | 'pix' | 'card';

const STORAGE_KEY = 'espaco_imperial_customer';

interface CustomerData {
  name: string;
  phone: string;
  address: string;
  addressComplement: string;
}

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
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [needChange, setNeedChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState('');
  
  // Edit mode for saved data
  const [isEditing, setIsEditing] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);

  // Load saved customer data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: CustomerData = JSON.parse(saved);
        setCustomerName(data.name || '');
        setCustomerPhone(data.phone || '');
        setAddress(data.address || '');
        setAddressComplement(data.addressComplement || '');
        setHasSavedData(true);
      } catch (e) {
        console.error('Error loading saved customer data');
      }
    }
  }, []);

  // Save customer data
  const saveCustomerData = () => {
    const data: CustomerData = {
      name: customerName,
      phone: customerPhone,
      address,
      addressComplement,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setHasSavedData(true);
    setIsEditing(false);
  };

  const deliveryFee = orderType === 'delivery' ? (settings?.delivery_fee || 0) : 0;
  const finalTotal = total + deliveryFee;

  const getItemPrice = (item: typeof items[0]) => {
    if (item.variation) {
      return item.variation.price;
    }
    const product = item.product;
    if (product.promotion && product.promotion.is_active) {
      const discount = product.promotion.discount_percent / 100;
      return product.price * (1 - discount);
    }
    return product.price;
  };

  const getItemName = (item: typeof items[0]) => {
    let name = item.product.name;
    if (item.variation) {
      name += ` (${item.variation.name})`;
    }
    if (item.secondFlavor) {
      name += ` + ${item.secondFlavor.name}`;
    }
    return name;
  };

  const formatPaymentMethod = () => {
    switch (paymentMethod) {
      case 'cash':
        let cashText = '💵 Dinheiro';
        if (needChange && changeAmount) {
          cashText += ` (Troco para R$ ${changeAmount})`;
        } else if (!needChange) {
          cashText += ' (Sem troco)';
        }
        return cashText;
      case 'pix':
        return '📱 PIX';
      case 'card':
        return '💳 Cartão';
    }
  };

  const formatOrderMessage = () => {
    let message = `🍔 *Novo Pedido - ${settings?.store_name || 'Espaço Imperial'}*\n\n`;
    message += `👤 *Cliente:* ${customerName}\n`;
    if (customerPhone) {
      message += `📱 *Telefone:* ${customerPhone}\n`;
    }
    message += `\n`;
    
    message += `📋 *Itens:*\n`;
    items.forEach((item) => {
      const price = getItemPrice(item);
      const name = getItemName(item);
      message += `• ${item.quantity}x ${name} - R$ ${(price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n💰 *Subtotal:* R$ ${total.toFixed(2)}\n`;
    
    if (orderType === 'delivery') {
      message += `🚚 *Taxa de Entrega:* R$ ${deliveryFee.toFixed(2)}\n`;
      message += `\n🏠 *Endereço:* ${address}`;
      if (addressComplement) message += ` - ${addressComplement}`;
      message += `\n`;
    } else {
      message += `\n🏪 *Retirada no local*\n`;
    }
    
    message += `\n💵 *TOTAL: R$ ${finalTotal.toFixed(2)}*`;
    message += `\n\n💳 *Pagamento:* ${formatPaymentMethod()}`;
    
    if (notes) {
      message += `\n\n📝 *Observações:* ${notes}`;
    }
    
    return message;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName) {
      toast.error('Preencha seu nome');
      return;
    }
    
    if (orderType === 'delivery' && !address) {
      toast.error('Preencha o endereço de entrega');
      return;
    }

    if (paymentMethod === 'cash' && needChange && !changeAmount) {
      toast.error('Informe o valor para troco');
      return;
    }

    // Save customer data
    saveCustomerData();

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-foreground text-lg mb-4">Seu carrinho está vazio</p>
        <Link to="/">
          <Button>Ver Cardápio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="text-xl font-display font-semibold text-foreground">Meu Carrinho</h1>
        </div>
      </header>

      <div className="container py-6 pb-32">
        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          {items.map((item) => {
            const price = getItemPrice(item);
            const name = getItemName(item);
            const itemKey = generateCartItemKey(item.product, item.variation, item.secondFlavor);
            
            return (
              <div key={itemKey} className="bg-card border border-border rounded-lg p-4 flex gap-4">
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
                  <h3 className="font-semibold text-foreground">{name}</h3>
                  <p className="text-primary font-bold">R$ {(price * item.quantity).toFixed(2)}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium text-foreground">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive ml-auto"
                      onClick={() => removeItem(itemKey)}
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
            <Label className="text-base font-semibold text-foreground">Como você quer receber?</Label>
            <RadioGroup 
              value={orderType} 
              onValueChange={(v) => setOrderType(v as OrderType)}
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                <Label
                  htmlFor="delivery"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all text-foreground"
                >
                  <MapPin className="h-6 w-6" />
                  <span className="text-sm font-medium">Delivery</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                <Label
                  htmlFor="pickup"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all text-foreground"
                >
                  <Store className="h-6 w-6" />
                  <span className="text-sm font-medium">Retirada</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Customer Info with Edit Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold text-foreground">Seus dados</Label>
              {hasSavedData && !isEditing && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="gap-1 text-muted-foreground"
                >
                  <Edit2 className="h-4 w-4" />
                  Alterar
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Seu nome *</Label>
                <Input 
                  id="name" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="João Silva"
                  required
                  disabled={hasSavedData && !isEditing}
                  className="disabled:opacity-70"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">WhatsApp (opcional)</Label>
                <Input 
                  id="phone" 
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  disabled={hasSavedData && !isEditing}
                  className="disabled:opacity-70"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {orderType === 'delivery' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground">Endereço *</Label>
                <Input 
                  id="address" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro"
                  required
                  disabled={hasSavedData && !isEditing}
                  className="disabled:opacity-70"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement" className="text-foreground">Complemento</Label>
                <Input 
                  id="complement" 
                  value={addressComplement} 
                  onChange={(e) => setAddressComplement(e.target.value)}
                  placeholder="Apartamento, bloco, referência"
                  disabled={hasSavedData && !isEditing}
                  className="disabled:opacity-70"
                />
              </div>
            </div>
          )}


          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-foreground">Forma de Pagamento</Label>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(v) => {
                setPaymentMethod(v as PaymentMethod);
                if (v !== 'cash') {
                  setNeedChange(false);
                  setChangeAmount('');
                }
              }}
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <RadioGroupItem value="pix" id="pix" className="peer sr-only" />
                <Label
                  htmlFor="pix"
                  className="flex items-center gap-2 p-4 rounded-lg border border-border bg-card cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all text-foreground"
                >
                  <QrCode className="h-5 w-5" />
                  <span className="font-medium">PIX</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                <Label
                  htmlFor="cash"
                  className="flex items-center gap-2 p-4 rounded-lg border border-border bg-card cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all text-foreground"
                >
                  <Banknote className="h-5 w-5" />
                  <span className="font-medium">Dinheiro</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="card" id="card" className="peer sr-only" />
                <Label
                  htmlFor="card"
                  className="flex items-center gap-2 p-4 rounded-lg border border-border bg-card cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all text-foreground"
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Cartão</span>
                </Label>
              </div>
            </RadioGroup>

            {/* Change Options for Cash */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Label className="text-foreground">Precisa de troco?</Label>
                  <RadioGroup 
                    value={needChange ? 'yes' : 'no'} 
                    onValueChange={(v) => setNeedChange(v === 'yes')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="no-change" />
                      <Label htmlFor="no-change" className="text-foreground cursor-pointer">Não</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="yes-change" />
                      <Label htmlFor="yes-change" className="text-foreground cursor-pointer">Sim</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {needChange && (
                  <div className="space-y-2">
                    <Label htmlFor="changeAmount" className="text-foreground">Troco para quanto?</Label>
                    <Input 
                      id="changeAmount"
                      type="number"
                      value={changeAmount}
                      onChange={(e) => setChangeAmount(e.target.value)}
                      placeholder="Ex: 100"
                      className="max-w-[150px]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-foreground">Observações</Label>
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
            <div className="flex justify-between text-foreground">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            {orderType === 'delivery' && (
              <div className="flex justify-between text-foreground">
                <span>Taxa de Entrega</span>
                <span>R$ {deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
              <span className="text-foreground">Total</span>
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
