export interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductVariation {
  id: string;
  product_id: string;
  name: string;
  price: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  category?: Category;
  promotion?: Promotion;
  variations?: ProductVariation[];
}

export interface Promotion {
  id: string;
  product_id: string;
  discount_percent: number;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  variation?: ProductVariation;
  secondFlavor?: Product; // For half-and-half pizzas
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  order_type: 'delivery' | 'pickup' | 'table';
  table_number: number | null;
  address: string | null;
  address_complement: string | null;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  notes: string | null;
  created_at: string;
}

export interface Settings {
  id: string;
  whatsapp_number: string;
  store_name: string;
  store_address: string | null;
  delivery_fee: number;
  is_open: boolean;
  updated_at: string;
}
