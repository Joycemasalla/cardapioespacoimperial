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
import { Crown, Plus, Trash2, ArrowLeft, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  if (isLoading) return <div className="min-h-screen bg-background dark flex items-center justify-center">Carregando...</div>;
  if (!isAdmin) return (
    <div className="min-h-screen bg-background dark flex flex-col items-center justify-center p-4">
      <p className="text-muted-foreground mb-4">Você não tem permissão de administrador.</p>
      <p className="text-sm text-muted-foreground mb-4">Para testar, adicione seu usuário à tabela user_roles com role 'admin'.</p>
      <Link to="/"><Button variant="outline">Voltar ao Cardápio</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background dark">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-muted rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
            <Crown className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-display font-semibold">Painel Admin</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sair</Button>
        </div>
      </header>

      <div className="container py-6">
        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Dialog>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Produto</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Adicionar Produto</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Nome</Label><Input value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} /></div>
                  <div><Label>Preço</Label><Input type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} /></div>
                  <div><Label>Descrição</Label><Input value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} /></div>
                  <div><Label>Categoria</Label>
                    <Select value={newProduct.category_id} onValueChange={(v) => setNewProduct({...newProduct, category_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>URL da Imagem</Label><Input value={newProduct.image_url} onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})} /></div>
                  <Button onClick={handleAddProduct} className="w-full">Adicionar</Button>
                </div>
              </DialogContent>
            </Dialog>
            <div className="grid gap-4">
              {products?.map((p) => (
                <div key={p.id} className="bg-card border border-border rounded-lg p-4 flex justify-between items-center">
                  <div><p className="font-semibold">{p.name}</p><p className="text-primary">R$ {Number(p.price).toFixed(2)}</p></div>
                  <Button variant="ghost" size="icon" onClick={() => { deleteProduct.mutate(p.id); toast.success('Removido'); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Nova categoria" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
              <Button onClick={handleAddCategory}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="grid gap-2">
              {categories?.map((c) => (
                <div key={c.id} className="bg-card border border-border rounded-lg p-3 flex justify-between items-center">
                  <span>{c.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => { deleteCategory.mutate(c.id); toast.success('Removida'); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div><Label>Número do WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5511999999999" /></div>
              <Button onClick={handleSaveSettings}>Salvar</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
