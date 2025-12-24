/**
 * ========================================
 * ARQUIVO: types/index.ts
 * ========================================
 * 
 * Define todos os TIPOS DE DADOS usados na aplicação.
 * Esses tipos garantem que o código esteja correto e
 * ajudam o VS Code a mostrar sugestões e erros.
 * 
 * TIPOS DEFINIDOS:
 * - Category: Categoria de produtos (Pizzas, Bebidas, etc)
 * - ProductVariation: Variação de produto (tamanhos, sabores)
 * - Product: Produto do cardápio
 * - Promotion: Promoção aplicada a um produto
 * - CartItem: Item no carrinho de compras
 * - Order: Pedido realizado
 * - Settings: Configurações da loja
 * 
 * ========================================
 */

/**
 * Categoria de produtos
 * Exemplo: "Pizzas", "Bebidas", "Sobremesas"
 */
export interface Category {
  id: string;                    // Identificador único (UUID)
  name: string;                  // Nome da categoria
  description: string | null;    // Descrição (opcional)
  image_url: string | null;      // URL da imagem (opcional)
  sort_order: number;            // Ordem de exibição
  is_active: boolean;            // Se está visível no cardápio
  created_at: string;            // Data de criação
}

/**
 * Variação de produto
 * Usado para tamanhos diferentes (P, M, G) com preços diferentes
 */
export interface ProductVariation {
  id: string;                    // Identificador único
  product_id: string;            // ID do produto relacionado
  name: string;                  // Nome da variação (ex: "Grande")
  price: number;                 // Preço dessa variação
  sort_order: number;            // Ordem de exibição
  is_active: boolean;            // Se está disponível
  created_at: string;            // Data de criação
}

/**
 * Produto do cardápio
 */
export interface Product {
  id: string;                    // Identificador único
  category_id: string | null;    // ID da categoria (opcional)
  name: string;                  // Nome do produto
  description: string | null;    // Descrição (opcional)
  price: number;                 // Preço base
  image_url: string | null;      // URL da imagem (opcional)
  is_active: boolean;            // Se está disponível
  is_featured: boolean;          // Se é destaque
  created_at: string;            // Data de criação
  category?: Category;           // Categoria relacionada (join)
  promotion?: Promotion;         // Promoção ativa (join)
  variations?: ProductVariation[]; // Variações do produto (join)
}

/**
 * Promoção de produto
 * Aplica desconto percentual ao produto
 */
export interface Promotion {
  id: string;                    // Identificador único
  product_id: string;            // ID do produto
  discount_percent: number;      // Porcentagem de desconto (ex: 20 = 20%)
  starts_at: string;             // Data de início
  ends_at: string | null;        // Data de fim (opcional)
  is_active: boolean;            // Se está ativa
  created_at: string;            // Data de criação
}

/**
 * Item no carrinho de compras
 */
export interface CartItem {
  product: Product;              // Produto adicionado
  quantity: number;              // Quantidade
  notes?: string;                // Observações (opcional)
  variation?: ProductVariation;  // Variação escolhida (ex: "Grande")
  secondFlavor?: Product;        // Segundo sabor (para pizzas meio-a-meio)
}

/**
 * Pedido realizado
 * Armazena todos os dados de um pedido completo
 */
export interface Order {
  id: string;                    // Identificador único
  customer_name: string;         // Nome do cliente
  customer_phone: string;        // WhatsApp do cliente
  order_type: 'delivery' | 'pickup' | 'table'; // Tipo: entrega, retirada ou mesa
  table_number: number | null;   // Número da mesa (se aplicável)
  address: string | null;        // Endereço de entrega
  address_complement: string | null; // Complemento do endereço
  items: CartItem[];             // Lista de itens do pedido
  total: number;                 // Valor total
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  notes: string | null;          // Observações gerais
  created_at: string;            // Data/hora do pedido
}

/**
 * Configurações da loja
 * Armazena informações gerais do estabelecimento
 */
export interface Settings {
  id: string;                    // Identificador único
  whatsapp_number: string;       // Número do WhatsApp para pedidos
  store_name: string;            // Nome da loja
  store_address: string | null;  // Endereço físico
  delivery_fee: number;          // Taxa de entrega
  is_open: boolean;              // Se a loja está aberta
  pix_key: string | null;        // Chave PIX para pagamentos
  updated_at: string;            // Última atualização
}
