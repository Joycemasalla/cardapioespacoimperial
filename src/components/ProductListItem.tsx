import { Plus } from 'lucide-react';
import { Product, ProductVariation } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ProductListItemProps {
  product: Product;
  onClick: () => void;
  minPrice?: number;
  variations?: ProductVariation[];
}

export function ProductListItem({ product, onClick, minPrice, variations }: ProductListItemProps) {
  const { addItem } = useCart();
  
  const hasPromotion = product.promotion && product.promotion.is_active;
  const discountedPrice = hasPromotion 
    ? product.price * (1 - product.promotion!.discount_percent / 100)
    : product.price;

  const displayPrice = minPrice ?? discountedPrice;
  const showFromPrice = minPrice !== undefined && minPrice < product.price;
  const hasVariations = variations && variations.length > 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (hasVariations) {
      // Open modal for products with variations
      onClick();
    } else {
      // Direct add for simple products
      addItem(product, 1);
      toast.success(`${product.name} adicionado!`);
    }
  };

  return (
    <div className="w-full bg-card border border-border rounded-lg p-3 flex gap-3 text-left transition-all active:scale-[0.98]">
      {/* Image + Info - clickable to open details */}
      <button
        onClick={onClick}
        className="flex gap-3 flex-1 min-w-0 text-left"
      >
        <div className="relative overflow-hidden rounded-lg flex-shrink-0">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-20 h-20 object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
          )}
          {hasPromotion && (
            <div className="absolute top-1 left-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{product.promotion!.discount_percent}%
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-foreground line-clamp-1">
              {product.name}
            </h3>
            {product.is_featured && (
              <span className="bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                ⭐
              </span>
            )}
          </div>
          
          {product.description && (
            <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">
              {product.description}
            </p>
          )}
          
          <div className="mt-2 flex items-center gap-2">
            {showFromPrice && (
              <span className="text-muted-foreground text-xs">a partir de</span>
            )}
            {hasPromotion && !showFromPrice && (
              <span className="text-muted-foreground line-through text-xs">
                R$ {product.price.toFixed(2)}
              </span>
            )}
            <span className="text-primary font-bold">
              R$ {displayPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </button>
      
      {/* Quick Add Button */}
      <button
        onClick={handleQuickAdd}
        className="flex-shrink-0 w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center self-center transition-colors active:scale-95"
        aria-label={hasVariations ? "Ver opções" : "Adicionar ao carrinho"}
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
