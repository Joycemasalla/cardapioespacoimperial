import { Product } from '@/types';

interface ProductListItemProps {
  product: Product;
  onClick: () => void;
  minPrice?: number;
}

export function ProductListItem({ product, onClick, minPrice }: ProductListItemProps) {
  const hasPromotion = product.promotion && product.promotion.is_active;
  const discountedPrice = hasPromotion 
    ? product.price * (1 - product.promotion!.discount_percent / 100)
    : product.price;

  const displayPrice = minPrice ?? discountedPrice;
  const showFromPrice = minPrice !== undefined && minPrice < product.price;

  return (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-lg p-3 flex gap-3 text-left hover:border-primary/50 transition-all animate-fade-in"
    >
      {product.image_url ? (
        <img 
          src={product.image_url} 
          alt={product.name}
          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
        />
      ) : (
        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">🍽️</span>
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
          {hasPromotion && (
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded flex-shrink-0">
              -{product.promotion!.discount_percent}%
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
  );
}
