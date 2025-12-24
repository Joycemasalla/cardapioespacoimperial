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
      className="w-full bg-card border border-border rounded-lg p-3 flex gap-3 text-left transition-all duration-300 animate-fade-in hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 active:scale-[0.98] group"
    >
      <div className="relative overflow-hidden rounded-lg flex-shrink-0">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-20 h-20 object-cover transition-transform duration-300 group-hover:scale-110"
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
          <h3 className="font-display font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
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
          <span className="text-primary font-bold group-hover:animate-pulse">
            R$ {displayPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </button>
  );
}
