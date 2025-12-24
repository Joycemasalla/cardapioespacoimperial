import { Product } from '@/types';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const hasPromotion = product.promotion && product.promotion.is_active;
  const discountedPrice = hasPromotion 
    ? product.price * (1 - product.promotion!.discount_percent / 100)
    : product.price;

  const handleAdd = () => {
    addItem(product);
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in hover:border-primary/50 transition-all group">
      <div className="relative">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-40 bg-muted flex items-center justify-center">
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
        <h3 className="font-semibold text-lg text-foreground">{product.name}</h3>
        {product.description && (
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col">
            {hasPromotion && (
              <span className="text-muted-foreground line-through text-sm">
                R$ {product.price.toFixed(2)}
              </span>
            )}
            <span className="text-primary font-bold text-lg">
              R$ {discountedPrice.toFixed(2)}
            </span>
          </div>
          
          <Button 
            size="sm" 
            onClick={handleAdd}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
