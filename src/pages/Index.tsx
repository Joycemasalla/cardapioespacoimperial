import { useState } from 'react';
import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { CategoryDropdown } from '@/components/CategoryDropdown';
import { ProductCard } from '@/components/ProductCard';
import { Footer } from '@/components/Footer';
import { WhatsAppFloatingButton } from '@/components/WhatsAppFloatingButton';
import { CartButton } from '@/components/CartButton';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';

export default function Index() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  
  const { data: categories } = useCategories();
  const { data: products, isLoading: loadingProducts } = useProducts(selectedCategory);

  const handleCategorySelect = (categoryId: string | undefined) => {
    setSelectedCategory(categoryId);
  };

  const categoryName = selectedCategory 
    ? categories?.find(c => c.id === selectedCategory)?.name 
    : 'Cardápio Completo';

  return (
    <div className="min-h-screen bg-background flex flex-col dark">
      <Header onCategorySelect={handleCategorySelect} selectedCategory={selectedCategory} />
      
      <HeroBanner />
      
      <CategoryDropdown value={selectedCategory} onChange={setSelectedCategory} />

      <main className="container flex-1 pb-32">
        <h2 className="text-2xl font-display font-semibold mb-6 text-center text-foreground">
          {categoryName}
        </h2>
        
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : products?.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">
            Nenhum produto cadastrado nesta categoria
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      
      <CartButton />
      <WhatsAppFloatingButton />
    </div>
  );
}