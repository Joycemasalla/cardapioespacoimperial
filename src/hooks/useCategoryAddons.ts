import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CategoryAddon {
  id: string;
  category_id: string;
  name: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// Buscar todos os adicionais de uma categoria
export function useCategoryAddons(categoryId?: string) {
  return useQuery({
    queryKey: ['category-addons', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('category_addons')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CategoryAddon[];
    },
    enabled: !!categoryId,
  });
}

// Buscar todos os adicionais (para admin)
export function useAllCategoryAddons() {
  return useQuery({
    queryKey: ['category-addons-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_addons')
        .select('*')
        .order('category_id')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as CategoryAddon[];
    },
  });
}

// Criar adicional
export function useCreateCategoryAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addon: Omit<CategoryAddon, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('category_addons')
        .insert(addon)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-addons'] });
      queryClient.invalidateQueries({ queryKey: ['category-addons-all'] });
    },
  });
}

// Atualizar adicional
export function useUpdateCategoryAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CategoryAddon> & { id: string }) => {
      const { data, error } = await supabase
        .from('category_addons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-addons'] });
      queryClient.invalidateQueries({ queryKey: ['category-addons-all'] });
    },
  });
}

// Deletar adicional
export function useDeleteCategoryAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('category_addons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-addons'] });
      queryClient.invalidateQueries({ queryKey: ['category-addons-all'] });
    },
  });
}
