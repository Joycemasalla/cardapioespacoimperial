import { Product } from '@/types';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  minPrice?: number;
}

export function ProductCard({ product, onClick, minPrice }: ProductCardProps) {
  const hasPromotion = product.promotion && product.promotion.is_active;
  const discountedPrice = hasPromotion 
    ? product.price * (1 - product.promotion!.discount_percent / 100)
    : product.price;

  const displayPrice = minPrice ?? discountedPrice;
  const showFromPrice = minPrice !== undefined && minPrice < product.price;

  return (
    <button
      onClick={onClick}
      className="card-glow group text-left w-full relative"
    >
      {/* Glow effect overlay */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-primary/10 to-transparent" />
      
      <div className="relative aspect-[4/3] overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {hasPromotion && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded animate-pulse">
            -{product.promotion!.discount_percent}%
          </div>
        )}
        {product.is_featured && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded shadow-lg shadow-primary/30">
            ⭐ Destaque
          </div>
        )}
      </div>
      
      <div className="p-4 relative">
        <h3 className="font-display font-semibold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2 min-h-[2.5rem]">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col">
            {showFromPrice && (
              <span className="text-muted-foreground text-xs">a partir de</span>
            )}
            {hasPromotion && !showFromPrice && (
              <span className="text-muted-foreground line-through text-sm">
                R$ {product.price.toFixed(2)}
              </span>
            )}
            <span className="text-primary font-bold text-lg group-hover:animate-pulse">
              R$ {displayPrice.toFixed(2)}
            </span>
          </div>
          
          <div className="bg-primary text-primary-foreground rounded-full p-2 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/40 transition-all duration-300">
            <Plus className="h-5 w-5" />
          </div>
        </div>
      </div>
    </button>
  );
}
