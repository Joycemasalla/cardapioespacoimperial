import { Product } from '@/types';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in hover:border-primary/50 transition-all group text-left w-full"
    >
      <div className="relative aspect-[4/3]">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        {hasPromotion && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
            -{product.promotion!.discount_percent}%
          </div>
        )}
        {product.is_featured && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
            ⭐ Destaque
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-base text-foreground line-clamp-1">{product.name}</h3>
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
            <span className="text-primary font-bold text-lg">
              R$ {displayPrice.toFixed(2)}
            </span>
          </div>
          
          <div className="bg-primary text-primary-foreground rounded-full p-2 group-hover:scale-110 transition-transform">
            <Plus className="h-5 w-5" />
          </div>
        </div>
      </div>
    </button>
  );
}
