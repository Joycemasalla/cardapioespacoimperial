/**
 * ========================================
 * HOOK: useProducts (Produtos)
 * ========================================
 * 
 * Gerencia todas as operações com produtos:
 * - Buscar lista de produtos
 * - Buscar produto específico por ID
 * - Criar novo produto (admin)
 * - Atualizar produto existente (admin)
 * - Deletar produto (admin)
 * 
 * DEPENDÊNCIAS:
 * - Supabase (banco de dados)
 * - TanStack Query (cache e sincronização)
 * 
 * TABELA NO BANCO: products
 * 
 * COMO USAR:
 * ```typescript
 * import { useProducts, useCreateProduct } from '@/hooks/useProducts';
 * 
 * // Buscar todos os produtos
 * const { data: produtos, isLoading } = useProducts();
 * 
 * // Buscar por categoria
 * const { data: pizzas } = useProducts('id-da-categoria');
 * 
 * // Criar novo produto
 * const criarProduto = useCreateProduct();
 * await criarProduto.mutateAsync({ name: 'Pizza', price: 50 });
 * ```
 * 
 * ========================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';

/**
 * Busca lista de produtos
 * @param categoryId - (Opcional) Filtra por categoria
 * @returns Lista de produtos com categoria e promoção
 */
export function useProducts(categoryId?: string) {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      // Monta a query com joins
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          promotion:promotions(*)
        `)
        .order('created_at', { ascending: false });
      
      // Aplica filtro de categoria se informado
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transforma o array de promoções em objeto único
      return data.map((p: any) => ({
        ...p,
        promotion: p.promotion?.[0] || null,
      })) as Product[];
    },
  });
}

/**
 * Busca um produto específico por ID
 * @param id - ID do produto
 * @returns Produto com categoria e promoção
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          promotion:promotions(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return {
        ...data,
        promotion: data.promotion?.[0] || null,
      } as Product;
    },
    enabled: !!id, // Só executa se tiver ID
  });
}

/**
 * Cria um novo produto
 * Requer permissão de admin
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'category' | 'promotion'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalida cache para recarregar lista
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Atualiza um produto existente
 * Requer permissão de admin
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Partial<Product> & { id: string }) => {
      // Remove campos de join antes de atualizar
      const { category, promotion, ...updateData } = product;
      
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Deleta um produto
 * Requer permissão de admin
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
