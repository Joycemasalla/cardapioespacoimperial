/**
 * ========================================
 * HOOK: useCategories (Categorias)
 * ========================================
 * 
 * Gerencia todas as operações com categorias:
 * - Buscar lista de categorias
 * - Criar nova categoria (admin)
 * - Atualizar categoria existente (admin)
 * - Deletar categoria (admin)
 * 
 * DEPENDÊNCIAS:
 * - Supabase (banco de dados)
 * - TanStack Query (cache e sincronização)
 * 
 * TABELA NO BANCO: categories
 * 
 * COMO USAR:
 * ```typescript
 * import { useCategories, useCreateCategory } from '@/hooks/useCategories';
 * 
 * // Buscar todas as categorias
 * const { data: categorias, isLoading } = useCategories();
 * 
 * // Criar nova categoria
 * const criarCategoria = useCreateCategory();
 * await criarCategoria.mutateAsync({ name: 'Pizzas' });
 * ```
 * 
 * ========================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types';

/**
 * Busca lista de categorias
 * Ordenadas por sort_order (ordem de exibição)
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    },
  });
}

/**
 * Cria uma nova categoria
 * Requer permissão de admin
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalida cache para recarregar lista
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

/**
 * Atualiza uma categoria existente
 * Requer permissão de admin
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', category.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

/**
 * Deleta uma categoria
 * Requer permissão de admin
 * ATENÇÃO: Produtos vinculados ficarão sem categoria
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
