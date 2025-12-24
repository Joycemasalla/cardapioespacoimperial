import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductVariation } from '@/types';

export function useProductVariations(productId?: string) {
  return useQuery({
    queryKey: ['product-variations', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as ProductVariation[];
    },
    enabled: !!productId,
  });
}

export function useAllProductVariations() {
  return useQuery({
    queryKey: ['all-product-variations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as ProductVariation[];
    },
  });
}

export function useCreateProductVariation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variation: Omit<ProductVariation, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('product_variations')
        .insert(variation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-variations', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['all-product-variations'] });
    },
  });
}

export function useUpdateProductVariation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variation: Partial<ProductVariation> & { id: string }) => {
      const { data, error } = await supabase
        .from('product_variations')
        .update(variation)
        .eq('id', variation.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variations'] });
      queryClient.invalidateQueries({ queryKey: ['all-product-variations'] });
    },
  });
}

export function useDeleteProductVariation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_variations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variations'] });
      queryClient.invalidateQueries({ queryKey: ['all-product-variations'] });
    },
  });
}
