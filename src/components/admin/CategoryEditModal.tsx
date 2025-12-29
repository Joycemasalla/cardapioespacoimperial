import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Category } from '@/types';
import { useUpdateCategory } from '@/hooks/useCategories';
import { 
  useCategoryAddons, 
  useCreateCategoryAddon, 
  useUpdateCategoryAddon, 
  useDeleteCategoryAddon,
  CategoryAddon 
} from '@/hooks/useCategoryAddons';

interface CategoryEditModalProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryEditModal({ category, open, onOpenChange }: CategoryEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    sort_order: 0,
    is_active: true,
  });

  // Addon form state
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');

  const updateCategory = useUpdateCategory();
  const { data: addons, refetch: refetchAddons } = useCategoryAddons(category?.id);
  const createAddon = useCreateCategoryAddon();
  const updateAddon = useUpdateCategoryAddon();
  const deleteAddon = useDeleteCategoryAddon();

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        image_url: category.image_url || '',
        sort_order: category.sort_order ?? 0,
        is_active: category.is_active ?? true,
      });
    }
  }, [category]);

  const handleSave = async () => {
    if (!category) return;
    
    try {
      await updateCategory.mutateAsync({
        id: category.id,
        name: formData.name,
        description: formData.description || null,
        image_url: formData.image_url || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      });
      toast.success('Categoria atualizada!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao atualizar categoria');
    }
  };

  const handleAddAddon = async () => {
    if (!category || !newAddonName.trim()) {
      toast.error('Digite o nome do adicional');
      return;
    }

    try {
      await createAddon.mutateAsync({
        category_id: category.id,
        name: newAddonName.trim(),
        price: parseFloat(newAddonPrice) || 0,
        is_active: true,
        sort_order: (addons?.length || 0) + 1,
      });
      setNewAddonName('');
      setNewAddonPrice('');
      refetchAddons();
      toast.success('Adicional criado!');
    } catch (error) {
      toast.error('Erro ao criar adicional');
    }
  };

  const handleToggleAddon = async (addon: CategoryAddon) => {
    try {
      await updateAddon.mutateAsync({
        id: addon.id,
        is_active: !addon.is_active,
      });
      refetchAddons();
    } catch (error) {
      toast.error('Erro ao atualizar adicional');
    }
  };

  const handleDeleteAddon = async (addonId: string) => {
    try {
      await deleteAddon.mutateAsync(addonId);
      refetchAddons();
      toast.success('Adicional removido!');
    } catch (error) {
      toast.error('Erro ao remover adicional');
    }
  };

  const handleUpdateAddonPrice = async (addon: CategoryAddon, newPrice: string) => {
    try {
      await updateAddon.mutateAsync({
        id: addon.id,
        price: parseFloat(newPrice) || 0,
      });
      refetchAddons();
    } catch (error) {
      toast.error('Erro ao atualizar preço');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            ✏️ Editar Categoria
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nome */}
          <div>
            <Label className="text-foreground">Nome</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              rows={2}
            />
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
              <img src={formData.image_url} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-lg" />
            )}
          </div>

          {/* Ordem de exibição */}
          <div>
            <Label className="text-foreground">Ordem de Exibição</Label>
            <Input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              className="bg-background border-border text-foreground w-24"
            />
          </div>

          {/* Switch Ativo */}
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label className="text-foreground">Categoria Ativa</Label>
          </div>

          {/* Adicionais da Categoria */}
          <div className="border-t border-border pt-4">
            <Label className="text-foreground text-base font-semibold mb-3 block">
              🧀 Adicionais da Categoria
            </Label>
            <p className="text-muted-foreground text-sm mb-4">
              Adicionais que podem ser escolhidos pelos clientes em produtos desta categoria.
            </p>

            {/* Lista de adicionais existentes */}
            {addons && addons.length > 0 && (
              <div className="space-y-2 mb-4">
                {addons.map((addon) => (
                  <div key={addon.id} className="flex items-center gap-2 p-2 bg-background rounded-lg border border-border">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className={`flex-1 ${!addon.is_active ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {addon.name}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      value={addon.price}
                      onChange={(e) => handleUpdateAddonPrice(addon, e.target.value)}
                      className="w-24 h-8 text-sm"
                      placeholder="R$"
                    />
                    <Switch
                      checked={addon.is_active}
                      onCheckedChange={() => handleToggleAddon(addon)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAddon(addon.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulário para adicionar novo */}
            <div className="flex gap-2">
              <Input
                value={newAddonName}
                onChange={(e) => setNewAddonName(e.target.value)}
                placeholder="Nome do adicional"
                className="flex-1 bg-background border-border text-foreground"
              />
              <Input
                type="number"
                step="0.01"
                value={newAddonPrice}
                onChange={(e) => setNewAddonPrice(e.target.value)}
                placeholder="Preço"
                className="w-24 bg-background border-border text-foreground"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddAddon}
                disabled={createAddon.isPending}
              >
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
