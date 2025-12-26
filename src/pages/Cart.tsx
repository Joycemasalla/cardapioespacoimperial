import { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, Trash2, MessageCircle, MapPin, Store, Banknote, CreditCard, QrCode, Edit2, Copy, Check, Utensils, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, generateCartItemKey } from '@/contexts/CartContext';
import { useSettings } from '@/hooks/useSettings';
import { useCreateOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import OrderPreviewModal from '@/components/OrderPreviewModal';
import OrderSuccessModal from '@/components/OrderSuccessModal';

type OrderType = 'delivery' | 'pickup' | 'dine_in';
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
  const createOrder = useCreateOrder();

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
  const [pixCopied, setPixCopied] = useState(false);

  // Order flow modals
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  // LGPD consent
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
        let cashText = 'Dinheiro';
        if (needChange && changeAmount) {
          cashText += ` (Troco para R$ ${changeAmount})`;
        } else if (!needChange) {
          cashText += ' (Sem troco)';
        }
        return cashText;
      case 'pix':
        return 'PIX';
      case 'card':
        return 'Cartao';
    }
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${timestamp}${random}`;
  };

  const formatDateTime = () => {
    const now = new Date();
    return now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatOrderMessage = (orderNum: string) => {
    const storeName = settings?.store_name || 'Espaco Imperial';

    let message = '';
    message += '\u{1F354} *' + storeName + '*\n';
    message += '------------------------\n\n';

    message += '\u{1F4CB} *PEDIDO #' + orderNum + '*\n';
    message += '\u{1F551} ' + formatDateTime() + '\n\n';

    message += '------------------------\n';
    message += '\u{1F464} *CLIENTE*\n';
    message += '------------------------\n';
    message += 'Nome: ' + customerName + '\n';
    if (customerPhone) {
      message += 'WhatsApp: ' + customerPhone + '\n';
    }
    message += '\n';

    message += '------------------------\n';
    message += '\u{1F6D2} *ITENS DO PEDIDO*\n';
    message += '------------------------\n';
    items.forEach((item) => {
      const price = getItemPrice(item);
      const name = getItemName(item);
      message += '\u{2022} ' + item.quantity + 'x ' + name + '\n';
      message += '   R$ ' + (price * item.quantity).toFixed(2) + '\n';
    });
    message += '\n';

    message += '------------------------\n';
    if (orderType === 'delivery') {
      message += '\u{1F69A} *ENTREGA*\n';
      message += '------------------------\n';
      message += '\u{1F4CD} ' + address;
      if (addressComplement) message += '\n   ' + addressComplement;
      message += '\n\n';
    } else if (orderType === 'dine_in') {
      message += '\u{1F37D} *COMER NO LOCAL*\n';
      message += '------------------------\n\n';
    } else {
      message += '\u{1F3EA} *RETIRADA NO LOCAL*\n';
      message += '------------------------\n\n';
    }

    message += '------------------------\n';
    message += '\u{1F4B0} *VALORES*\n';
    message += '------------------------\n';
    message += 'Subtotal: R$ ' + total.toFixed(2) + '\n';
    if (orderType === 'delivery') {
      message += 'Entrega: R$ ' + deliveryFee.toFixed(2) + '\n';
    }
    message += '*TOTAL: R$ ' + finalTotal.toFixed(2) + '*\n\n';

    message += '------------------------\n';
    message += '\u{1F4B3} *PAGAMENTO*\n';
    message += '------------------------\n';
    message += formatPaymentMethod() + '\n';

    if (paymentMethod === 'pix') {
      message += '\n_Envie o comprovante PIX nesta conversa_\n';
    }

    if (notes) {
      message += '\n------------------------\n';
      message += '\u{1F4DD} *OBSERVACOES*\n';
      message += '------------------------\n';
      message += notes + '\n';
    }

    message += '\n------------------------\n';
    message += '\u{2728} Obrigado pela preferencia!\n';
    message += '------------------------';

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

    if (!acceptedTerms) {
      toast.error('Você precisa aceitar a Política de Privacidade');
      return;
    }

    // Generate order number and show preview
    const newOrderNumber = generateOrderNumber();
    setOrderNumber(newOrderNumber);
    setShowPreview(true);
  };

  const handleConfirmOrder = async () => {
    // Save customer data
    saveCustomerData();

    try {
      // Salvar pedido no banco de dados
      const orderTypeMap: Record<OrderType, 'delivery' | 'pickup' | 'table'> = {
        'delivery': 'delivery',
        'pickup': 'pickup',
        'dine_in': 'table'
      };

      await createOrder.mutateAsync({
        customer_name: customerName,
        customer_phone: customerPhone || '',
        order_type: orderTypeMap[orderType],
        address: orderType === 'delivery' ? address : null,
        address_complement: orderType === 'delivery' ? addressComplement : null,
        table_number: orderType === 'dine_in' && tableNumber ? parseInt(tableNumber) : null,
        items: items.map(item => ({
          product: item.product,
          variation: item.variation,
          secondFlavor: item.secondFlavor,
          quantity: item.quantity
        })) as any,
        total: finalTotal,
        notes: notes || null,
      });

      // Abrir WhatsApp com a mensagem
      const whatsappNumber = settings?.whatsapp_number || '5511999999999';
      const message = formatOrderMessage(orderNumber);

      // Usa wa.me que é mais compatível com emojis
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, '_blank');
      setShowPreview(false);
      clearCart();
      setShowSuccess(true);
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      toast.error('Erro ao registrar pedido. Tente novamente.');
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
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
              className="grid grid-cols-3 gap-3"
            >
              <div>
                <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                <Label
                  htmlFor="delivery"
                  className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border border-border bg-card cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all text-foreground"
                >
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs sm:text-sm font-medium">Delivery</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                <Label
                  htmlFor="pickup"
                  className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border border-border bg-card cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all text-foreground"
                >
                  <Store className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs sm:text-sm font-medium">Retirada</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dine_in" id="dine_in" className="peer sr-only" />
                <Label
                  htmlFor="dine_in"
                  className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border border-border bg-card cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all text-foreground"
                >
                  <Utensils className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs sm:text-sm font-medium">No Local</span>
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

            {/* PIX Key Display */}
            {paymentMethod === 'pix' && settings?.pix_key && (
              <div className="mt-4 space-y-3">
                {/* PIX Key Card */}
                <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <QrCode className="h-5 w-5" />
                    <span>Chave PIX para pagamento</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-background border border-border rounded-lg p-3 font-mono text-sm text-foreground break-all">
                      {settings.pix_key}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 flex-shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(settings.pix_key || '');
                        setPixCopied(true);
                        toast.success('Chave PIX copiada!');
                        setTimeout(() => setPixCopied(false), 2000);
                      }}
                    >
                      {pixCopied ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* PIX Warning Alert */}
                <div className="p-4 bg-amber-500/15 border-2 border-amber-500/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-600 dark:text-amber-400">
                        ⚠️ ATENÇÃO
                      </p>
                      <p className="text-sm text-foreground">
                        Após realizar o pagamento, <strong>envie o comprovante PIX</strong>, junto com seu pedido pelo WhatsApp para confirmar!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

          {/* LGPD Consent */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Checkbox 
              id="lgpd" 
              checked={acceptedTerms} 
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)} 
            />
            <Label htmlFor="lgpd" className="text-sm text-foreground leading-relaxed cursor-pointer">
              Li e aceito a{' '}
              <Link to="/privacidade" className="text-primary hover:underline" target="_blank">
                Política de Privacidade
              </Link>{' '}
              e os{' '}
              <Link to="/termos" className="text-primary hover:underline" target="_blank">
                Termos de Uso
              </Link>
              . Autorizo o uso dos meus dados para processar este pedido.
            </Label>
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

      {/* Order Preview Modal */}
      <OrderPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        message={formatOrderMessage(orderNumber)}
        onConfirm={handleConfirmOrder}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        open={showSuccess}
        onClose={handleCloseSuccess}
        orderNumber={orderNumber}
        pixKey={settings?.pix_key}
        whatsappNumber={settings?.whatsapp_number || '5511999999999'}
        total={finalTotal}
        paymentMethod={paymentMethod}
      />
    </div>
  );
}
