import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useCart } from '@/contexts/CartContext';
import logo from '@/assets/logo-transparent.png';

interface HeaderProps {
  onCategorySelect?: (categoryId: string | undefined) => void;
  selectedCategory?: string;
}

export function Header({ onCategorySelect, selectedCategory }: HeaderProps) {
  const { data: categories } = useCategories();
  const { items } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleCategoryClick = (categoryId?: string) => {
    onCategorySelect?.(categoryId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src={logo} alt="Espaço Imperial" className="h-14 md:h-16 w-auto" />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center overflow-x-auto">
            {categories?.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`px-3 py-2 text-xs font-medium uppercase tracking-wide whitespace-nowrap transition-colors hover:text-primary ${
                  selectedCategory === category.id ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                {category.name}
              </button>
            ))}
          </nav>
          
          {/* Right Icons */}
          <div className="flex items-center gap-2">
            <Link to="/cart" className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t border-border pt-4">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleCategoryClick(undefined)}
                className={`px-4 py-2 text-sm font-medium uppercase tracking-wide text-left transition-colors hover:text-primary ${
                  !selectedCategory ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                Todos
              </button>
              {categories?.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`px-4 py-2 text-sm font-medium uppercase tracking-wide text-left transition-colors hover:text-primary ${
                    selectedCategory === category.id ? 'text-primary' : 'text-foreground/80'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}