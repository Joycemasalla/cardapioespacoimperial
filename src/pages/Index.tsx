import { useState } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { WhatsAppFloatingButton } from '@/components/WhatsAppFloatingButton';
import { CartButton } from '@/components/CartButton';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { Input } from '@/components/ui/input';
import { Search, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Index() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  
  const { data: categories } = useCategories();
  const { data: products, isLoading: loadingProducts } = useProducts(selectedCategory);

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background dark">
      <Header />
      
      <div className="container py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produtos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="container pb-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          <button onClick={() => setSelectedCategory(undefined)} className={`px-4 py-2 rounded-full border transition-all whitespace-nowrap ${!selectedCategory ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/50'}`}>Todos</button>
          {categories?.map((category) => (
            <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`px-4 py-2 rounded-full border transition-all whitespace-nowrap ${selectedCategory === category.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/50'}`}>{category.name}</button>
          ))}
        </div>
      </div>

      <section className="container pb-32">
        <h2 className="text-xl font-display font-semibold mb-4">{selectedCategory ? categories?.find(c => c.id === selectedCategory)?.name : 'Cardápio Completo'}</h2>
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="bg-card border border-border rounded-lg h-64 animate-pulse" />)}
          </div>
        ) : filteredProducts?.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">{search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado ainda'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts?.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>

      <Link to="/admin" className="fixed bottom-6 left-6 z-40 p-3 bg-card border border-border rounded-full hover:border-primary/50"><Settings className="h-5 w-5 text-muted-foreground" /></Link>
      <CartButton />
      <WhatsAppFloatingButton />
    </div>
  );
}
