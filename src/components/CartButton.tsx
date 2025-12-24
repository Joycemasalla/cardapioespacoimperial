import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function CartButton() {
  const { itemCount, total } = useCart();

  if (itemCount === 0) return null;

  return (
    <Link to="/cart">
      <Button 
        className="fixed bottom-24 right-6 z-40 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg animate-slide-up glow-gold"
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="font-semibold">{itemCount}</span>
        <span className="hidden sm:inline">• R$ {total.toFixed(2)}</span>
      </Button>
    </Link>
  );
}
