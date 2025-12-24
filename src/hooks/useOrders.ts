/**
 * ========================================
 * HOOK: useOrders (Pedidos)
 * ========================================
 * 
 * Gerencia todas as operações com pedidos:
 * - Buscar lista de pedidos (admin)
 * - Criar novo pedido (cliente)
 * - Atualizar status do pedido (admin)
 * 
 * STATUS DISPONÍVEIS:
 * - pending: Pendente (aguardando confirmação)
 * - confirmed: Confirmado
 * - preparing: Em preparo
 * - ready: Pronto
 * - delivered: Entregue
 * - cancelled: Cancelado
 * 
 * DEPENDÊNCIAS:
 * - Supabase (banco de dados)
 * - TanStack Query (cache e sincronização)
 * 
 * TABELA NO BANCO: orders
 * 
 * COMO USAR:
 * ```typescript
 * import { useOrders, useCreateOrder } from '@/hooks/useOrders';
 * 
 * // Buscar todos os pedidos (admin)
 * const { data: pedidos } = useOrders();
 * 
 * // Criar novo pedido
 * const criarPedido = useCreateOrder();
 * await criarPedido.mutateAsync({
 *   customer_name: 'João',
 *   customer_phone: '11999999999',
 *   order_type: 'delivery',
 *   items: [...],
 *   total: 100
 * });
 * ```
 * 
 * ========================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, CartItem } from '@/types';

/**
 * Busca lista de pedidos
 * Ordenados do mais recente para o mais antigo
 * Requer permissão de admin para ver todos
 */
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Converte o JSON de items para o tipo correto
      return data.map((order) => ({
        ...order,
        items: order.items as unknown as CartItem[],
      })) as Order[];
    },
  });
}

/**
 * Cria um novo pedido
 * Qualquer usuário pode criar (não requer login)
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: Omit<Order, 'id' | 'created_at' | 'status'>) => {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          ...order,
          items: order.items as any, // Converte para JSON
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalida cache para recarregar lista
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Atualiza o status de um pedido
 * Requer permissão de admin
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order['status'] }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
