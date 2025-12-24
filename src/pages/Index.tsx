import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { CategoryDropdown } from '@/components/CategoryDropdown';
import { ProductCard } from '@/components/ProductCard';
import { ProductListItem } from '@/components/ProductListItem';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { Footer } from '@/components/Footer';
import { WhatsAppFloatingButton } from '@/components/WhatsAppFloatingButton';
import { CartButton } from '@/components/CartButton';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { useAllProductVariations } from '@/hooks/useProductVariations';
import { useIsMobile } from '@/hooks/use-mobile';
import { Product, ProductVariation } from '@/types';

export default function Index() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { data: categories } = useCategories();
  const { data: products, isLoading: loadingProducts } = useProducts(selectedCategory);
  const { data: allVariations } = useAllProductVariations();
  const isMobile = useIsMobile();

  const handleCategorySelect = (categoryId: string | undefined) => {
    setSelectedCategory(categoryId);
  };

  // Map variations to products
  const variationsByProductId = useMemo(() => {
    const map: Record<string, ProductVariation[]> = {};
    allVariations?.forEach((v) => {
      if (!map[v.product_id]) map[v.product_id] = [];
      map[v.product_id].push(v);
    });
    return map;
  }, [allVariations]);

  // Get minimum price for products with variations
  const getMinPrice = (productId: string): number | undefined => {
    const variations = variationsByProductId[productId];
    if (!variations || variations.length === 0) return undefined;
    return Math.min(...variations.map(v => v.price));
  };

  const categoryName = selectedCategory 
    ? categories?.find(c => c.id === selectedCategory)?.name 
    : 'Cardápio Completo';

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onCategorySelect={handleCategorySelect} selectedCategory={selectedCategory} />
      
      <HeroBanner />
      
      <CategoryDropdown value={selectedCategory} onChange={setSelectedCategory} />

      <main className="container flex-1 pb-32">
        <h2 className="text-2xl font-display font-semibold mb-6 text-center text-foreground">
          {categoryName}
        </h2>
        
        {loadingProducts ? (
          <div className={isMobile ? 'space-y-3' : 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className={`bg-card border border-border rounded-lg animate-pulse ${isMobile ? 'h-24' : 'h-80'}`} />
            ))}
          </div>
        ) : products?.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">
            Nenhum produto cadastrado nesta categoria
          </p>
        ) : isMobile ? (
          // Mobile: List view
          <div className="space-y-3">
            {products?.map((product) => (
              <ProductListItem 
                key={product.id} 
                product={product} 
                onClick={() => handleProductClick(product)}
                minPrice={getMinPrice(product.id)}
              />
            ))}
          </div>
        ) : (
          // Desktop: Grid view
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products?.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={() => handleProductClick(product)}
                minPrice={getMinPrice(product.id)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
      
      <CartButton />
      <ScrollToTopButton />
      <WhatsAppFloatingButton />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          variations={variationsByProductId[selectedProduct.id] || []}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
