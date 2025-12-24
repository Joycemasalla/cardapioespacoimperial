import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { Category } from '@/types';
import { useUpdateCategory } from '@/hooks/useCategories';

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

  const updateCategory = useUpdateCategory();

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            ✏️ Editar Categoria
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