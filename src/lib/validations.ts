/**
 * ========================================
 * VALIDAÇÕES: Schemas com Zod
 * ========================================
 * 
 * Esquemas de validação para garantir a 
 * integridade e segurança dos dados de entrada.
 * 
 * Usado em: Cart, Admin, Settings
 * ========================================
 */

import { z } from 'zod';

/**
 * Schema para validação de pedidos
 */
export const OrderSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  customer_phone: z
    .string()
    .trim()
    .max(20, 'Telefone inválido')
    .regex(/^[\d\s\-\(\)\+]*$/, 'Telefone contém caracteres inválidos'),
  address: z
    .string()
    .trim()
    .max(500, 'Endereço muito longo')
    .nullable(),
  address_complement: z
    .string()
    .trim()
    .max(200, 'Complemento muito longo')
    .nullable(),
  table_number: z
    .number()
    .int('Número da mesa deve ser inteiro')
    .positive('Número da mesa deve ser positivo')
    .max(999, 'Número da mesa inválido')
    .nullable(),
  total: z
    .number()
    .positive('Total deve ser positivo'),
  notes: z
    .string()
    .trim()
    .max(1000, 'Observações muito longas')
    .nullable(),
  order_type: z.enum(['delivery', 'pickup', 'table']),
});

export type OrderValidation = z.infer<typeof OrderSchema>;

/**
 * Schema para validação de produtos
 */
export const ProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(200, 'Nome muito longo'),
  price: z
    .number()
    .nonnegative('Preço não pode ser negativo')
    .max(99999.99, 'Preço muito alto'),
  description: z
    .string()
    .trim()
    .max(1000, 'Descrição muito longa')
    .nullable(),
  category_id: z
    .string()
    .uuid('Categoria inválida')
    .nullable(),
  image_url: z
    .string()
    .max(2000, 'URL muito longa')
    .nullable(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
});

export type ProductValidation = z.infer<typeof ProductSchema>;

/**
 * Schema para validação de categorias
 */
export const CategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo'),
  description: z
    .string()
    .trim()
    .max(500, 'Descrição muito longa')
    .nullable(),
  image_url: z
    .string()
    .max(2000, 'URL muito longa')
    .nullable(),
  sort_order: z
    .number()
    .int('Ordem deve ser um número inteiro')
    .nonnegative('Ordem não pode ser negativa')
    .max(9999, 'Ordem muito alta'),
  is_active: z.boolean(),
});

export type CategoryValidation = z.infer<typeof CategorySchema>;

/**
 * Schema para validação de configurações da loja
 */
export const SettingsSchema = z.object({
  whatsapp_number: z
    .string()
    .trim()
    .min(10, 'Número de WhatsApp deve ter pelo menos 10 dígitos')
    .max(20, 'Número de WhatsApp inválido')
    .regex(/^[\d]+$/, 'Use apenas números (código país + DDD + número)'),
  store_name: z
    .string()
    .trim()
    .max(100, 'Nome da loja muito longo'),
  store_address: z
    .string()
    .trim()
    .max(500, 'Endereço muito longo'),
  delivery_fee: z
    .number()
    .nonnegative('Taxa de entrega não pode ser negativa')
    .max(999.99, 'Taxa de entrega muito alta'),
  is_open: z.boolean(),
  pix_key: z
    .string()
    .trim()
    .max(100, 'Chave PIX muito longa'),
  opening_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de abertura inválido'),
  closing_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de fechamento inválido'),
  closed_message: z
    .string()
    .trim()
    .max(500, 'Mensagem muito longa'),
  maintenance_mode: z.boolean(),
});

export type SettingsValidation = z.infer<typeof SettingsSchema>;

/**
 * Função auxiliar para parsear número seguro
 * Retorna 0 se o valor não for um número válido
 */
export function safeParseFloat(value: string): number {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return 0;
  }
  return parsed;
}

/**
 * Função auxiliar para parsear inteiro seguro
 * Retorna null se o valor não for um inteiro válido
 */
export function safeParseInt(value: string): number | null {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return null;
  }
  return parsed;
}

/**
 * Valida dados e retorna erros ou dados validados
 * Retorna null se válido, array de erros se inválido
 */
export function getValidationErrors<T>(schema: z.ZodSchema<T>, data: unknown): string[] | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return null;
  }
  return result.error.errors.map(err => err.message);
}
