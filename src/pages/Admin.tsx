import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, LogOut, Package, BarChart3, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import logo from '@/assets/logo.png';

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { data: settings } = useSettings();
  
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const updateSettings = useUpdateSettings();

  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', category_id: '', image_url: '' });
  const [newCategory, setNewCategory] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (settings) setWhatsapp(settings.whatsapp_number);
  }, [settings]);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return toast.error('Preencha nome e preço');
    await createProduct.mutateAsync({
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      description: newProduct.description || null,
      category_id: newProduct.category_id || null,
      image_url: newProduct.image_url || null,
      is_active: true,
      is_featured: false,
    });
    setNewProduct({ name: '', price: '', description: '', category_id: '', image_url: '' });
    toast.success('Produto adicionado!');
  };

  const handleAddCategory = async () => {
    if (!newCategory) return;
    await createCategory.mutateAsync({ name: newCategory, description: null, image_url: null, sort_order: 0, is_active: true });
    setNewCategory('');
    toast.success('Categoria adicionada!');
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    await updateSettings.mutateAsync({ id: settings.id, whatsapp_number: whatsapp });
    toast.success('Configurações salvas!');
  };

  const filteredProducts = filterCategory === 'all' 
    ? products 
    : products?.filter(p => p.category_id === filterCategory);

  const totalProducts = products?.length || 0;
  const totalCategories = categories?.length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background dark flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Você não tem permissão de administrador.</p>
        <p className="text-sm text-muted-foreground mb-4">Para testar, adicione seu usuário à tabela user_roles com role 'admin'.</p>
        <Link to="/"><Button variant="outline">Voltar ao Cardápio</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-30">
        <div className="container py-4 flex items-center justify-between">
          <Link to="/" className="flex-shrink-0">
            <img src={logo} alt="Espaço Imperial" className="h-12 w-auto" />
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-foreground hover:text-primary">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="container py-6">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="mb-8 bg-transparent border-b border-border rounded-none w-full justify-start gap-8 h-auto p-0">
            <TabsTrigger 
              value="products" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary pb-3 px-0 uppercase tracking-wide font-medium"
            >
              Produtos
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary pb-3 px-0 uppercase tracking-wide font-medium"
            >
              Adicionais
            </TabsTrigger>
            <TabsTrigger 
              value="statistics" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary pb-3 px-0 uppercase tracking-wide font-medium"
            >
              Estatísticas
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-display font-bold text-foreground">
                Gerenciar Produtos ({filterCategory === 'all' ? 'Todos os Produtos' : categories?.find(c => c.id === filterCategory)?.name})
              </h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Adicionar Produto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-foreground">Nome</Label>
                      <Input 
                        value={newProduct.name} 
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground">Preço</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={newProduct.price} 
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground">Descrição</Label>
                      <Input 
                        value={newProduct.description} 
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground">Categoria</Label>
                      <Select value={newProduct.category_id} onValueChange={(v) => setNewProduct({...newProduct, category_id: v})}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {categories?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-foreground">URL da Imagem</Label>
                      <Input 
                        value={newProduct.image_url} 
                        onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <Button onClick={handleAddProduct} className="w-full bg-primary hover:bg-primary/90">
                      Adicionar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground text-sm">Filtrar por Categoria</span>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[250px] bg-card border-border text-foreground">
                  <SelectValue placeholder="Todos os Produtos" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Todos os Produtos</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Products List */}
            {filteredProducts?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Nenhum produto cadastrado</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Produto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Adicionar Produto</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-foreground">Nome</Label>
                        <Input 
                          value={newProduct.name} 
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Preço</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={newProduct.price} 
                          onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Descrição</Label>
                        <Input 
                          value={newProduct.description} 
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Categoria</Label>
                        <Select value={newProduct.category_id} onValueChange={(v) => setNewProduct({...newProduct, category_id: v})}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {categories?.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-foreground">URL da Imagem</Label>
                        <Input 
                          value={newProduct.image_url} 
                          onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <Button onClick={handleAddProduct} className="w-full bg-primary hover:bg-primary/90">
                        Adicionar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredProducts?.map((p) => (
                  <div key={p.id} className="bg-card border border-border rounded-lg p-4 flex justify-between items-center hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      {p.image_url && (
                        <img src={p.image_url} alt={p.name} className="w-16 h-16 object-cover rounded-lg" />
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{p.name}</p>
                        <p className="text-primary font-bold">R$ {Number(p.price).toFixed(2)}</p>
                        {p.description && (
                          <p className="text-muted-foreground text-sm line-clamp-1">{p.description}</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => { deleteProduct.mutate(p.id); toast.success('Removido'); }}
                      className="hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Categories Tab (Adicionais) */}
          <TabsContent value="categories" className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-foreground">Gerenciar Categorias</h2>
            
            <div className="flex gap-2">
              <Input 
                placeholder="Nova categoria" 
                value={newCategory} 
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-background border-border text-foreground max-w-sm"
              />
              <Button onClick={handleAddCategory} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            <div className="grid gap-3">
              {categories?.map((c) => (
                <div key={c.id} className="bg-card border border-border rounded-lg p-4 flex justify-between items-center hover:border-primary/30 transition-colors">
                  <span className="text-foreground font-medium">{c.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => { deleteCategory.mutate(c.id); toast.success('Removida'); }}
                    className="hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Settings Section */}
            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-xl font-display font-bold text-foreground mb-4">Configurações</h3>
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div>
                  <Label className="text-foreground">Número do WhatsApp</Label>
                  <Input 
                    value={whatsapp} 
                    onChange={(e) => setWhatsapp(e.target.value)} 
                    placeholder="5511999999999"
                    className="bg-background border-border text-foreground max-w-sm"
                  />
                  <p className="text-muted-foreground text-sm mt-1">Formato: código do país + DDD + número (sem espaços ou símbolos)</p>
                </div>
                <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90">
                  Salvar Configurações
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-foreground">Estatísticas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Total de Produtos</p>
                    <p className="text-3xl font-bold text-foreground">{totalProducts}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Total de Categorias</p>
                    <p className="text-3xl font-bold text-foreground">{totalCategories}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Status</p>
                    <p className="text-lg font-bold text-success">Ativo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Products by Category */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Produtos por Categoria</h3>
              <div className="space-y-3">
                {categories?.map((category) => {
                  const count = products?.filter(p => p.category_id === category.id).length || 0;
                  const percentage = totalProducts > 0 ? (count / totalProducts) * 100 : 0;
                  return (
                    <div key={category.id} className="flex items-center gap-4">
                      <span className="text-foreground w-48 truncate">{category.name}</span>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground text-sm w-16 text-right">{count} itens</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}