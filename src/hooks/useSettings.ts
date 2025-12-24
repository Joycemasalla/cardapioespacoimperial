/**
 * ========================================
 * HOOK: useSettings (Configurações)
 * ========================================
 * 
 * Gerencia as configurações gerais da loja:
 * - Buscar configurações atuais
 * - Atualizar configurações (admin)
 * 
 * CONFIGURAÇÕES DISPONÍVEIS:
 * - whatsapp_number: Número do WhatsApp para pedidos
 * - store_name: Nome da loja
 * - store_address: Endereço físico
 * - delivery_fee: Taxa de entrega
 * - is_open: Se a loja está aberta
 * - pix_key: Chave PIX para pagamentos
 * 
 * DEPENDÊNCIAS:
 * - Supabase (banco de dados)
 * - TanStack Query (cache e sincronização)
 * 
 * TABELA NO BANCO: settings
 * 
 * COMO USAR:
 * ```typescript
 * import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
 * 
 * // Buscar configurações
 * const { data: config } = useSettings();
 * console.log(config?.whatsapp_number);
 * 
 * // Atualizar configurações
 * const atualizar = useUpdateSettings();
 * await atualizar.mutateAsync({ id: config.id, delivery_fee: 10 });
 * ```
 * 
 * ========================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Settings } from '@/types';

/**
 * Busca as configurações da loja
 * Retorna apenas um registro (a loja tem uma única configuração)
 */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as Settings | null;
    },
  });
}

/**
 * Atualiza as configurações da loja
 * Requer permissão de admin
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<Settings> & { id: string }) => {
      const { data, error } = await supabase
        .from('settings')
        .update(settings)
        .eq('id', settings.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalida cache para recarregar
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
