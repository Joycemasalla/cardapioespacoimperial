import { useState, useMemo } from 'react';
import { X, Plus, Minus, ChevronDown } from 'lucide-react';
import { Product, ProductVariation, SelectedAddon } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { useCategoryAddons } from '@/hooks/useCategoryAddons';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ProductDetailModalProps {
  product: Product;
  variations: ProductVariation[];
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailModal({ product, variations, isOpen, onClose }: ProductDetailModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(
    variations.length > 0 ? variations[0] : undefined
  );
  const [isHalfHalf, setIsHalfHalf] = useState(false);
  const [secondFlavor, setSecondFlavor] = useState<Product | undefined>();
  const [secondFlavorOpen, setSecondFlavorOpen] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);

  // Get addons for this product's category
  const { data: categoryAddons } = useCategoryAddons(product.category_id || undefined);

  // Get pizzas for half-and-half selection
  const { data: allProducts } = useProducts();
  const pizzaProducts = useMemo(() => {
    return allProducts?.filter(p => 
      p.category_id === product.category_id && 
      p.id !== product.id
    ) || [];
  }, [allProducts, product]);

  // Check if this product has a "Grande" variation (for half-and-half option)
  const hasLargeVariation = variations.some(v => 
    v.name.toLowerCase().includes('grande') || v.name.toLowerCase().includes('g')
  );
  const isLargeSelected = selectedVariation?.name.toLowerCase().includes('grande') || 
    selectedVariation?.name.toLowerCase().includes('g');

  const hasPromotion = product.promotion && product.promotion.is_active;
  
  const currentPrice = useMemo(() => {
    if (selectedVariation) {
      return selectedVariation.price;
    }
    if (hasPromotion) {
      return product.price * (1 - product.promotion!.discount_percent / 100);
    }
    return product.price;
  }, [selectedVariation, hasPromotion, product]);

  // Calculate addons total
  const addonsTotal = useMemo(() => {
    return selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  }, [selectedAddons]);

  // For half-and-half, use the higher price between the two flavors
  const finalPrice = useMemo(() => {
    let basePrice = currentPrice;
    if (isHalfHalf && secondFlavor && selectedVariation) {
      // Find the variation for the second flavor
      const secondFlavorPrice = selectedVariation.price; // Assume same size
      basePrice = Math.max(currentPrice, secondFlavorPrice);
    }
    return basePrice + addonsTotal;
  }, [isHalfHalf, secondFlavor, selectedVariation, currentPrice, addonsTotal]);

  const handleToggleAddon = (addon: { id: string; name: string; price: number }) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      }
      return [...prev, { id: addon.id, name: addon.name, price: addon.price }];
    });
  };

  const handleAddToCart = () => {
    addItem(
      product, 
      quantity, 
      undefined, 
      selectedVariation, 
      isHalfHalf ? secondFlavor : undefined,
      selectedAddons.length > 0 ? selectedAddons : undefined
    );
    
    let message = `${product.name}`;
    if (selectedVariation) {
      message += ` (${selectedVariation.name})`;
    }
    if (isHalfHalf && secondFlavor) {
      message += ` + ${secondFlavor.name}`;
    }
    if (selectedAddons.length > 0) {
      message += ` com ${selectedAddons.length} adicional(is)`;
    }
    message += ` adicionado ao carrinho!`;
    
    toast.success(message);
    onClose();
    setQuantity(1);
    setIsHalfHalf(false);
    setSecondFlavor(undefined);
    setSelectedAddons([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 glass-effect border-primary/20">
        {/* Image */}
        <div className="relative aspect-video">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
          {hasPromotion && (
            <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1 rounded">
              -{product.promotion!.discount_percent}%
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          <DialogHeader className="p-0">
            <DialogTitle className="text-xl font-display">{product.name}</DialogTitle>
          </DialogHeader>

          {product.description && (
            <p className="text-muted-foreground text-sm">{product.description}</p>
          )}

          {/* Size Variations */}
          {variations.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Escolha o tamanho</Label>
              <RadioGroup 
                value={selectedVariation?.id} 
                onValueChange={(id) => {
                  const v = variations.find(v => v.id === id);
                  setSelectedVariation(v);
                  // Reset half-half if not large
                  if (v && !v.name.toLowerCase().includes('grande') && !v.name.toLowerCase().includes('g')) {
                    setIsHalfHalf(false);
                    setSecondFlavor(undefined);
                  }
                }}
                className="space-y-2"
              >
                {variations.map((variation) => (
                  <div key={variation.id} className="flex items-center">
                    <RadioGroupItem value={variation.id} id={variation.id} className="peer sr-only" />
                    <Label
                      htmlFor={variation.id}
                      className="flex-1 flex items-center justify-between p-3 rounded-lg border border-border bg-card cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all"
                    >
                      <span className="font-medium">{variation.name}</span>
                      <span className="text-primary font-bold">R$ {variation.price.toFixed(2)}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Half-and-Half Option (only for large pizza) */}
          {hasLargeVariation && isLargeSelected && pizzaProducts.length > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="half-half" className="text-base font-semibold">
                  Pizza Meia a Meia?
                </Label>
                <Switch
                  id="half-half"
                  checked={isHalfHalf}
                  onCheckedChange={(checked) => {
                    setIsHalfHalf(checked);
                    if (!checked) setSecondFlavor(undefined);
                  }}
                />
              </div>

              {isHalfHalf && (
                <Collapsible open={secondFlavorOpen} onOpenChange={setSecondFlavorOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {secondFlavor ? secondFlavor.name : 'Escolha o segundo sabor'}
                      <ChevronDown className={`h-4 w-4 transition-transform ${secondFlavorOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                    {pizzaProducts.map((pizza) => (
                      <button
                        key={pizza.id}
                        onClick={() => {
                          setSecondFlavor(pizza);
                          setSecondFlavorOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition-colors ${
                          secondFlavor?.id === pizza.id 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        {pizza.name}
                      </button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}

          {/* Addons Section */}
          {categoryAddons && categoryAddons.length > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <Label className="text-base font-semibold">🧀 Adicionais</Label>
              <div className="space-y-2">
                {categoryAddons.map((addon) => (
                  <div 
                    key={addon.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedAddons.find(a => a.id === addon.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                    onClick={() => handleToggleAddon(addon)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={!!selectedAddons.find(a => a.id === addon.id)}
                        onCheckedChange={() => handleToggleAddon(addon)}
                      />
                      <span className="font-medium">{addon.name}</span>
                    </div>
                    <span className="text-primary font-bold">
                      +R$ {addon.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Label className="text-base font-semibold">Quantidade</Label>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-bold text-lg">{quantity}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Add to Cart */}
          <Button 
            onClick={handleAddToCart} 
            size="lg" 
            className="w-full text-base"
            disabled={isHalfHalf && !secondFlavor}
          >
            Adicionar • R$ {(finalPrice * quantity).toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
