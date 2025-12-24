import { useQuery } from '@tanstack/react-query';
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
