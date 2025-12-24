import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Product, Category, ProductVariation } from '@/types';
import { useUpdateProduct } from '@/hooks/useProducts';
import { useProductVariations, useCreateProductVariation, useUpdateProductVariation, useDeleteProductVariation } from '@/hooks/useProductVariations';

interface ProductEditModalProps {
  product: Product | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductEditModal({ product, categories, open, onOpenChange }: ProductEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category_id: '',
    image_url: '',
    is_active: true,
    is_featured: false,
  });

  const [newVariation, setNewVariation] = useState({ name: '', price: '' });

  const updateProduct = useUpdateProduct();
  const { data: variations, refetch: refetchVariations } = useProductVariations(product?.id);
  const createVariation = useCreateProductVariation();
  const updateVariation = useUpdateProductVariation();
  const deleteVariation = useDeleteProductVariation();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: String(product.price),
        description: product.description || '',
        category_id: product.category_id || '',
        image_url: product.image_url || '',
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
      });
    }
  }, [product]);

  const handleSave = async () => {
    if (!product) return;
    
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description || null,
        category_id: formData.category_id || null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      });
      toast.success('Produto atualizado!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao atualizar produto');
    }
  };

  const handleAddVariation = async () => {
    if (!product || !newVariation.name || !newVariation.price) {
      toast.error('Preencha nome e preço da variação');
      return;
    }

    try {
      await createVariation.mutateAsync({
        product_id: product.id,
        name: newVariation.name,
        price: parseFloat(newVariation.price),
        sort_order: (variations?.length || 0) + 1,
        is_active: true,
      });
      setNewVariation({ name: '', price: '' });
      refetchVariations();
      toast.success('Variação adicionada!');
    } catch (error) {
      toast.error('Erro ao adicionar variação');
    }
  };

  const handleDeleteVariation = async (variationId: string) => {
    try {
      await deleteVariation.mutateAsync(variationId);
      refetchVariations();
      toast.success('Variação removida!');
    } catch (error) {
      toast.error('Erro ao remover variação');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            ✏️ Editar Produto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome */}
          <div>
            <Label className="text-foreground">Nome</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-background border-border text-foreground"
            />
          </div>

          {/* Preço */}
          <div>
            <Label className="text-foreground">Preço Base (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="bg-background border-border text-foreground"
            />
          </div>

          {/* Descrição */}
          <div>
            <Label className="text-foreground">Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-background border-border text-foreground resize-none"
              rows={3}
            />
          </div>

          {/* Categoria */}
          <div>
            <Label className="text-foreground">Categoria</Label>
            <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* URL da Imagem */}
          <div>
            <Label className="text-foreground">URL da Imagem</Label>
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="bg-background border-border text-foreground"
              placeholder="https://..."
            />
            {formData.image_url && (
              <img src={formData.image_url} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-lg" />
            )}
          </div>

          {/* Switches */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label className="text-foreground">Ativo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
              <Label className="text-foreground">Destaque</Label>
            </div>
          </div>

          {/* Variações */}
          <div className="border-t border-border pt-4">
            <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
              📦 Variações de Tamanho
            </h3>

            {variations && variations.length > 0 ? (
              <div className="space-y-2 mb-4">
                {variations.map((v) => (
                  <div key={v.id} className="flex items-center justify-between bg-background border border-border rounded-lg p-3">
                    <div>
                      <span className="text-foreground font-medium">{v.name}</span>
                      <span className="text-primary ml-4">R$ {Number(v.price).toFixed(2)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteVariation(v.id)}
                      className="hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm mb-4">Nenhuma variação cadastrada.</p>
            )}

            {/* Adicionar nova variação */}
            <div className="flex gap-2">
              <Input
                placeholder="Nome (ex: Pequena)"
                value={newVariation.name}
                onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
                className="bg-background border-border text-foreground flex-1"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Preço"
                value={newVariation.price}
                onChange={(e) => setNewVariation({ ...newVariation, price: e.target.value })}
                className="bg-background border-border text-foreground w-24"
              />
              <Button onClick={handleAddVariation} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}