-- ============================================
-- SCRIPT DE MIGRAÇÃO COMPLETO - ESPAÇO IMPERIAL
-- ============================================
-- 
-- Este script cria toda a estrutura do banco de dados
-- e insere os dados iniciais do cardápio.
--
-- COMO USAR:
-- 1. Crie uma conta em supabase.com
-- 2. Crie um novo projeto
-- 3. Vá em SQL Editor
-- 4. Cole este script inteiro e execute
--
-- ============================================

-- ============================================
-- PARTE 1: TIPOS (ENUMS)
-- ============================================

-- Tipo para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Tipo para status de pedido
CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed', 
  'preparing',
  'ready',
  'delivered',
  'cancelled'
);

-- Tipo para tipo de pedido
CREATE TYPE public.order_type AS ENUM (
  'delivery',
  'pickup',
  'table'
);

-- ============================================
-- PARTE 2: TABELAS
-- ============================================

-- Tabela de categorias
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de variações de produtos (tamanhos, sabores, etc)
CREATE TABLE public.product_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de promoções
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percent INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de configurações da loja
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name TEXT DEFAULT 'Espaço Imperial',
  whatsapp_number TEXT NOT NULL,
  delivery_fee NUMERIC DEFAULT 0,
  is_open BOOLEAN DEFAULT true,
  store_address TEXT,
  pix_key TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de pedidos
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type public.order_type NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  status public.order_status DEFAULT 'pending',
  address TEXT,
  address_complement TEXT,
  table_number INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de roles de usuários (separada por segurança)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- ============================================
-- PARTE 3: FUNÇÕES
-- ============================================

-- Função para verificar role do usuário (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PARTE 4: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: CATEGORIES
CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- POLÍTICAS: PRODUCTS  
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- POLÍTICAS: PRODUCT_VARIATIONS
CREATE POLICY "Anyone can view active variations"
  ON public.product_variations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage variations"
  ON public.product_variations FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- POLÍTICAS: PROMOTIONS
CREATE POLICY "Anyone can view active promotions"
  ON public.promotions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage promotions"
  ON public.promotions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- POLÍTICAS: SETTINGS
CREATE POLICY "Anyone can view settings"
  ON public.settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update settings"
  ON public.settings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- POLÍTICAS: ORDERS
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- POLÍTICAS: PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- POLÍTICAS: USER_ROLES
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- PARTE 5: STORAGE (Bucket de imagens)
-- ============================================

-- Criar bucket para imagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Política para permitir visualização pública
CREATE POLICY "Public can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- Política para admins fazerem upload
CREATE POLICY "Admins can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND has_role(auth.uid(), 'admin'));

-- Política para admins deletarem imagens
CREATE POLICY "Admins can delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images' AND has_role(auth.uid(), 'admin'));

-- ============================================
-- PARTE 6: DADOS INICIAIS
-- ============================================

-- Configurações da loja
INSERT INTO public.settings (store_name, whatsapp_number, delivery_fee, is_open)
VALUES ('Espaço Imperial', '5532988949994', 2.00, true);

-- Categorias
INSERT INTO public.categories (id, name, sort_order, is_active) VALUES
  ('2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'Hambúrgueres Tradicionais', 1, true),
  ('59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Hambúrgueres Artesanais', 2, true),
  ('849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Porções', 3, true),
  ('27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizzas', 4, true),
  ('8a256cf8-1f4b-4ef9-96fa-e1696366c976', 'Pizzas Doces', 5, true),
  ('87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Bebidas', 6, true),
  ('f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Churrasco', 7, true),
  ('a4891230-1f51-4291-896a-9c0d5a20bb02', 'Chapas', 8, true),
  ('6c09d0c8-0f10-41ad-87e8-2bec45f6ba82', 'Combos', 9, true);

-- ============================================
-- PARTE 7: PRODUTOS
-- ============================================

-- PIZZAS (category_id: 27a1e7a7-155b-4fb3-ac2d-56f56cfde527)
INSERT INTO public.products (id, name, description, price, image_url, category_id, is_active, is_featured) VALUES
  ('0ee2b4b8-d67a-4d50-86a5-e8291e9d9c6e', 'Pizza A Moda', 'Muçarela, presunto, calabresa, palmito, azeitona, milho, cebola, catupiry e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381321/cardapio-digital-images/wr5j7mtyj6b9qjmuxtlc.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('2faf7c3a-fb95-4746-83c0-36ae5b35aaf3', 'Pizza Americana', 'Muçarela, cheddar, tomate, pimentão, cream cheese, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381422/cardapio-digital-images/aor1ki9pjxdmmbxqoz2o.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('d76d1267-cb23-47e7-9437-3c8c7c030770', 'Pizza Bacon', 'Bacon, muçarela, tomate azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381509/cardapio-digital-images/bzeewqoz4giu1w006g9t.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('57203953-afeb-4675-aea6-5e5869233a37', 'Pizza Calabresa', 'Calabresa, muçarela, cebola, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883504/cardapio-digital-images/st4bgqj41fhwa23t25o8.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('04abe2e2-53fc-46c8-8de4-9eaa05fe072d', 'Pizza Camarão', 'Muçarela, camarão, catupiry alho frito, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751899100/cardapio-digital-images/nqsziumwawfzvr9wczxi.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('95e0cd69-fd27-4d94-90a0-c76428ea5a22', 'Pizza Carne Seca', 'Muçarela, carne seca, catupiry cebola, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883540/cardapio-digital-images/evgagksdzyjfq0he2evk.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('39ca8fc7-287e-444e-b481-0b840baa7f91', 'Pizza Costela', 'Muçarela, costela, catupiry cebola, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381581/cardapio-digital-images/fth1oejkwavmk8segpvw.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('e20c7c44-b35c-4b2a-800b-a5f14379d1c2', 'Pizza Da Roça', 'Muçarela, frango desfiado, milho Bacon, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381719/cardapio-digital-images/bgwz4czc7vlzynaxmbzu.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('587390c0-8ac8-43a4-ba16-4708a734f77d', 'Pizza Frango com Catupiry', 'Muçarela, frango desfiado, catupiry, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753538337/cardapio-digital-images/etiykagvzhq4mcd87aub.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('50f1cc36-d138-40f5-bbbd-1fb71a72db28', 'Pizza Italiana', 'Muçarela, salaminho, azeitona, cebola e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753538129/cardapio-digital-images/alipg2ejtddwas7dzg08.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('9d30f96f-89a3-4151-8e6f-e5aec5d05ec8', 'Pizza Lombo', 'Muçarela, lombo canadense, catupiry azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381793/cardapio-digital-images/kc1ohablbqsivxeo9kyw.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('77c5da13-f382-4272-9ff9-df5c4c798318', 'Pizza Margherita', 'Muçarela, tomate, parmesão, manjericão, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214129/cardapio-digital-images/d5nqwzfnfleeapi3zmzy.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('ba3b575c-1957-413d-bc39-b9bcd6a2e90c', 'Pizza Palmito', 'Muçarela, palmito, catupiry azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214077/cardapio-digital-images/yw3mqyqtcdmevqcgzxuo.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('feebf8ac-68f5-4eaf-8f0f-bb94cb220013', 'Pizza Portuguesa', 'Muçarela, calabresa, tomate, pimentão, presunto, ovo, cebola, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751990097/cardapio-digital-images/tfpgmmehimkbuz9kv0tb.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('18497416-c492-46cb-a690-ecb0a4f78fc0', 'Pizza Presunto', 'Muçarela, presunto, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883632/cardapio-digital-images/bfl2nlxijodhflhkwtqj.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('1b9f33da-18d6-402c-aeae-2b759ea408a1', 'Pizza Quatro Queijos', 'Muçarela, parmesão, provolone, catupiry, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883778/cardapio-digital-images/rvbojkqbfcb6e8zy6lqh.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false),
  ('0b80ccba-fe36-49a0-a704-9b5bbba847c0', 'Pizza Muçarela', 'Muçarela, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883839/cardapio-digital-images/hvzxqzjlxrbzs3d2hl4u.jpg', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', true, false);

-- PIZZAS DOCES (category_id: 8a256cf8-1f4b-4ef9-96fa-e1696366c976)
INSERT INTO public.products (id, name, description, price, image_url, category_id, is_active, is_featured) VALUES
  ('5818f77b-3f3b-49a0-96cf-cfe6f15f5587', 'Pizza Banana', 'Banana, açúcar, canela e leite condensado.', 25.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755382152/cardapio-digital-images/kngv1iofm0yzdfb8c3pz.jpg', '8a256cf8-1f4b-4ef9-96fa-e1696366c976', true, false),
  ('6cbe06b9-2d99-49ba-8bf1-0cec3caa5e6a', 'Pizza Brigadeiro', 'Chocolate, granulado e leite condensado.', 25.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755382277/cardapio-digital-images/xkk2qsxn6bpqpagqkdnp.jpg', '8a256cf8-1f4b-4ef9-96fa-e1696366c976', true, false),
  ('eeaa3c9f-2c13-4c75-862b-f22c8a76f5af', 'Pizza Chocolate Branco', 'Chocolate branco e leite condensado.', 25.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755382341/cardapio-digital-images/dqibl2vrvpetkhf5bnfn.jpg', '8a256cf8-1f4b-4ef9-96fa-e1696366c976', true, false),
  ('d6c7f4a2-94e8-44f5-b847-4dd42e5fc5e1', 'Pizza Prestígio', 'Chocolate, coco ralado e leite condensado.', 25.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755382424/cardapio-digital-images/y7sqmjq4vkmg0jfgf9jt.jpg', '8a256cf8-1f4b-4ef9-96fa-e1696366c976', true, false),
  ('c58e7d89-f521-48e6-b2eb-09a5d46d8c34', 'Pizza Romeu e Julieta', 'Goiabada e queijo.', 25.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755382503/cardapio-digital-images/e1kfrhykzlbv9c2rplsq.jpg', '8a256cf8-1f4b-4ef9-96fa-e1696366c976', true, false);

-- HAMBÚRGUERES TRADICIONAIS (category_id: 2b60edd5-84e9-423e-9721-33d8d5ca6adf)
INSERT INTO public.products (id, name, description, price, image_url, category_id, is_active, is_featured) VALUES
  ('0dce25cd-c8f4-4eba-a0f8-c5d6a1e17b9c', 'X-Salada', 'Pão, hambúrguer, queijo, alface, tomate e maionese.', 12.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214256/cardapio-digital-images/tradicionais/x-salada.jpg', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', true, false),
  ('1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6', 'X-Bacon', 'Pão, hambúrguer, queijo, bacon crocante e maionese.', 14.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214257/cardapio-digital-images/tradicionais/x-bacon.jpg', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', true, false),
  ('2b3c4d5e-6f7g-8h9i-0j1k-l2m3n4o5p6q7', 'X-Egg', 'Pão, hambúrguer, queijo, ovo e maionese.', 13.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214258/cardapio-digital-images/tradicionais/x-egg.jpg', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', true, false),
  ('3c4d5e6f-7g8h-9i0j-1k2l-m3n4o5p6q7r8', 'X-Tudo', 'Pão, hambúrguer, queijo, bacon, ovo, alface, tomate e maionese.', 18.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214259/cardapio-digital-images/tradicionais/x-tudo.jpg', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', true, true),
  ('4d5e6f7g-8h9i-0j1k-2l3m-n4o5p6q7r8s9', 'X-Calabresa', 'Pão, hambúrguer, queijo, calabresa fatiada e maionese.', 14.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214260/cardapio-digital-images/tradicionais/x-calabresa.jpg', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', true, false);

-- HAMBÚRGUERES ARTESANAIS (category_id: 59bf2723-57bc-48cd-a8e6-7aa66036f9b6)
INSERT INTO public.products (id, name, description, price, image_url, category_id, is_active, is_featured) VALUES
  ('5e6f7g8h-9i0j-1k2l-3m4n-o5p6q7r8s9t0', 'Burger Imperial', 'Pão brioche, blend 180g, cheddar, bacon artesanal, cebola caramelizada e molho especial.', 28.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214261/cardapio-digital-images/artesanais/imperial.jpg', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', true, true),
  ('6f7g8h9i-0j1k-2l3m-4n5o-p6q7r8s9t0u1', 'Burger Costela', 'Pão australiano, blend de costela 200g, queijo provolone, barbecue e onion rings.', 32.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214262/cardapio-digital-images/artesanais/costela.jpg', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', true, false),
  ('7g8h9i0j-1k2l-3m4n-5o6p-q7r8s9t0u1v2', 'Burger Smash', 'Pão de batata, 2 smash burgers 90g, cheddar derretido, picles e molho smash.', 26.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214263/cardapio-digital-images/artesanais/smash.jpg', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', true, false),
  ('8h9i0j1k-2l3m-4n5o-6p7q-r8s9t0u1v2w3', 'Burger Trufado', 'Pão brioche, blend 180g, queijo brie, cogumelos, rúcula e maionese trufada.', 35.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214264/cardapio-digital-images/artesanais/trufado.jpg', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', true, false);

-- PORÇÕES (category_id: 849ef7e2-6b1b-4f63-a5b6-36ff82975e4a)
INSERT INTO public.products (id, name, description, price, image_url, category_id, is_active, is_featured) VALUES
  ('9i0j1k2l-3m4n-5o6p-7q8r-s9t0u1v2w3x4', 'Batata Frita', 'Porção de batata frita crocante com sal.', 18.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214265/cardapio-digital-images/porcoes/batata.jpg', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', true, false),
  ('0j1k2l3m-4n5o-6p7q-8r9s-t0u1v2w3x4y5', 'Batata com Cheddar e Bacon', 'Batata frita coberta com cheddar cremoso e bacon crocante.', 28.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214266/cardapio-digital-images/porcoes/batata-cheddar.jpg', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', true, true),
  ('1k2l3m4n-5o6p-7q8r-9s0t-u1v2w3x4y5z6', 'Onion Rings', 'Anéis de cebola empanados e fritos.', 22.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214267/cardapio-digital-images/porcoes/onion-rings.jpg', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', true, false),
  ('2l3m4n5o-6p7q-8r9s-0t1u-v2w3x4y5z6a7', 'Frango Frito', 'Porção de frango frito crocante.', 25.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214268/cardapio-digital-images/porcoes/frango.jpg', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', true, false),
  ('3m4n5o6p-7q8r-9s0t-1u2v-w3x4y5z6a7b8', 'Calabresa Acebolada', 'Calabresa fatiada com cebola refogada.', 24.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214269/cardapio-digital-images/porcoes/calabresa.jpg', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', true, false),
  ('4n5o6p7q-8r9s-0t1u-2v3w-x4y5z6a7b8c9', 'Mandioca Frita', 'Porção de mandioca frita crocante.', 20.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214270/cardapio-digital-images/porcoes/mandioca.jpg', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', true, false);

-- BEBIDAS (category_id: 87d8df86-39f5-47ac-9015-6ba3ee2ff3cc)
INSERT INTO public.products (id, name, description, price, image_url, category_id, is_active, is_featured) VALUES
  ('5o6p7q8r-9s0t-1u2v-3w4x-y5z6a7b8c9d0', 'Coca-Cola Lata', 'Coca-Cola lata 350ml.', 6.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214271/cardapio-digital-images/bebidas/coca-lata.jpg', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', true, false),
  ('6p7q8r9s-0t1u-2v3w-4x5y-z6a7b8c9d0e1', 'Coca-Cola 600ml', 'Coca-Cola 600ml.', 8.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214272/cardapio-digital-images/bebidas/coca-600.jpg', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', true, false),
  ('7q8r9s0t-1u2v-3w4x-5y6z-a7b8c9d0e1f2', 'Guaraná Antarctica Lata', 'Guaraná Antarctica lata 350ml.', 5.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214273/cardapio-digital-images/bebidas/guarana-lata.jpg', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', true, false),
  ('8r9s0t1u-2v3w-4x5y-6z7a-b8c9d0e1f2g3', 'Água Mineral', 'Água mineral sem gás 500ml.', 4.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214274/cardapio-digital-images/bebidas/agua.jpg', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', true, false),
  ('3351a034-16b9-4f4e-b688-de0969ec0a66', 'Suco Natural', 'Suco natural de frutas - consulte sabores disponíveis.', 8.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214275/cardapio-digital-images/bebidas/suco.jpg', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', true, false),
  ('0s1t2u3v-4w5x-6y7z-8a9b-c0d1e2f3g4h5', 'Cerveja Heineken', 'Cerveja Heineken long neck 330ml.', 10.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214276/cardapio-digital-images/bebidas/heineken.jpg', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', true, false),
  ('1t2u3v4w-5x6y-7z8a-9b0c-d1e2f3g4h5i6', 'Cerveja Brahma', 'Cerveja Brahma lata 350ml.', 6.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214277/cardapio-digital-images/bebidas/brahma.jpg', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', true, false);

-- CHURRASCO (category_id: f9c1f552-6165-4426-8b2a-f63f489f5bc6)
INSERT INTO public.products (id, name, description, price, image_url, category_id, is_active, is_featured) VALUES
  ('094321be-2f6e-4218-9ae8-6d481278bf55', 'Espetinho Misto', 'Espetinho de carne bovina e frango.', 15.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214278/cardapio-digital-images/churrasco/espetinho.jpg', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', true, false),
  ('3u4v5w6x-7y8z-9a0b-1c2d-e3f4g5h6i7j8', 'Costela no Bafo', 'Costela bovina cozida lentamente, macia e suculenta.', 45.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214279/cardapio-digital-images/churrasco/costela.jpg', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', true, true),
  ('4v5w6x7y-8z9a-0b1c-2d3e-f4g5h6i7j8k9', 'Picanha na Brasa', 'Picanha grelhada na brasa, ponto a gosto.', 55.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214280/cardapio-digital-images/churrasco/picanha.jpg', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', true, false),
  ('5w6x7y8z-9a0b-1c2d-3e4f-g5h6i7j8k9l0', 'Frango a Passarinho', 'Frango empanado e frito, crocante por fora e macio por dentro.', 28.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214281/cardapio-digital-images/churrasco/frango-passarinho.jpg', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', true, false);

-- CHAPAS (category_id: a4891230-1f51-4291-896a-9c0d5a20bb02)
INSERT INTO public.products (id, name, description, price, image_url, category_id, is_active, is_featured) VALUES
  ('6x7y8z9a-0b1c-2d3e-4f5g-h6i7j8k9l0m1', 'Chapa de Carne', 'Carne na chapa com arroz, feijão tropeiro, vinagrete e farofa.', 35.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214282/cardapio-digital-images/chapas/carne.jpg', 'a4891230-1f51-4291-896a-9c0d5a20bb02', true, false),
  ('7y8z9a0b-1c2d-3e4f-5g6h-i7j8k9l0m1n2', 'Chapa de Frango', 'Frango grelhado na chapa com arroz, feijão tropeiro, vinagrete e farofa.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214283/cardapio-digital-images/chapas/frango.jpg', 'a4891230-1f51-4291-896a-9c0d5a20bb02', true, false),
  ('8z9a0b1c-2d3e-4f5g-6h7i-j8k9l0m1n2o3', 'Chapa Mista', 'Carne e frango na chapa com arroz, feijão tropeiro, vinagrete e farofa.', 40.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214284/cardapio-digital-images/chapas/mista.jpg', 'a4891230-1f51-4291-896a-9c0d5a20bb02', true, true),
  ('9a0b1c2d-3e4f-5g6h-7i8j-k9l0m1n2o3p4', 'Chapa de Calabresa', 'Calabresa fatiada na chapa com arroz, feijão tropeiro, vinagrete e farofa.', 32.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214285/cardapio-digital-images/chapas/calabresa.jpg', 'a4891230-1f51-4291-896a-9c0d5a20bb02', true, false);

-- COMBOS (category_id: 6c09d0c8-0f10-41ad-87e8-2bec45f6ba82)
INSERT INTO public.products (id, name, description, price, image_url, category_id, is_active, is_featured) VALUES
  ('0b1c2d3e-4f5g-6h7i-8j9k-l0m1n2o3p4q5', 'Combo X-Tudo', 'X-Tudo + Batata Frita + Refrigerante Lata.', 32.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214286/cardapio-digital-images/combos/x-tudo.jpg', '6c09d0c8-0f10-41ad-87e8-2bec45f6ba82', true, true),
  ('1c2d3e4f-5g6h-7i8j-9k0l-m1n2o3p4q5r6', 'Combo Imperial', 'Burger Imperial + Batata com Cheddar + Refrigerante 600ml.', 48.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214287/cardapio-digital-images/combos/imperial.jpg', '6c09d0c8-0f10-41ad-87e8-2bec45f6ba82', true, false),
  ('2d3e4f5g-6h7i-8j9k-0l1m-n2o3p4q5r6s7', 'Combo Família', '2 Pizzas Grandes + 2 Refrigerantes 2L.', 85.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214288/cardapio-digital-images/combos/familia.jpg', '6c09d0c8-0f10-41ad-87e8-2bec45f6ba82', true, false),
  ('3e4f5g6h-7i8j-9k0l-1m2n-o3p4q5r6s7t8', 'Combo Churrasco', 'Costela no Bafo + Arroz + Feijão Tropeiro + 2 Refrigerantes.', 65.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214289/cardapio-digital-images/combos/churrasco.jpg', '6c09d0c8-0f10-41ad-87e8-2bec45f6ba82', true, false);

-- ============================================
-- PARTE 8: VARIAÇÕES DE PRODUTOS
-- ============================================

-- Variações de Pizza (Pequena, Média, Grande)
INSERT INTO public.product_variations (id, product_id, name, price, sort_order, is_active) VALUES
  -- Pizza A Moda
  ('f92226b1-3292-419d-b906-6084b5fefda9', '0ee2b4b8-d67a-4d50-86a5-e8291e9d9c6e', 'Pequena', 30, 1, true),
  ('c95af6a1-7050-4236-a4e2-93e771628ff2', '0ee2b4b8-d67a-4d50-86a5-e8291e9d9c6e', 'Média', 35, 2, true),
  ('a15d0616-8512-4a9f-82b2-3d277af086c3', '0ee2b4b8-d67a-4d50-86a5-e8291e9d9c6e', 'Grande', 40, 3, true),
  -- Pizza Americana
  ('069a1b75-99aa-47ac-aa51-cf457a5079bc', '2faf7c3a-fb95-4746-83c0-36ae5b35aaf3', 'Pequena', 30, 1, true),
  ('4e900631-07da-4d61-ac92-446a5a2af084', '2faf7c3a-fb95-4746-83c0-36ae5b35aaf3', 'Média', 35, 2, true),
  ('cef87723-441a-4afc-bcbc-da2f03402fc4', '2faf7c3a-fb95-4746-83c0-36ae5b35aaf3', 'Grande', 40, 3, true),
  -- Pizza Bacon
  ('bacon-var-1', 'd76d1267-cb23-47e7-9437-3c8c7c030770', 'Pequena', 30, 1, true),
  ('bacon-var-2', 'd76d1267-cb23-47e7-9437-3c8c7c030770', 'Média', 35, 2, true),
  ('bacon-var-3', 'd76d1267-cb23-47e7-9437-3c8c7c030770', 'Grande', 40, 3, true),
  -- Pizza Calabresa
  ('04e5f287-47a6-412f-9aed-46c1b4781784', '57203953-afeb-4675-aea6-5e5869233a37', 'Pequena', 30, 1, true),
  ('39cd8d91-3300-4d77-a073-f01f7402c811', '57203953-afeb-4675-aea6-5e5869233a37', 'Média', 35, 2, true),
  ('b4943e79-14e9-4a1c-bfb9-8286c6f5e4b5', '57203953-afeb-4675-aea6-5e5869233a37', 'Grande', 40, 3, true),
  -- Pizza Camarão
  ('9cc5470d-4a29-4acc-bf40-805fcaa7e943', '04abe2e2-53fc-46c8-8de4-9eaa05fe072d', 'Pequena', 30, 1, true),
  ('e829beec-b8cc-4201-b95f-f698eb14a1c8', '04abe2e2-53fc-46c8-8de4-9eaa05fe072d', 'Média', 35, 2, true),
  ('271267dd-2ab7-44a9-b8dc-01360c8e98e5', '04abe2e2-53fc-46c8-8de4-9eaa05fe072d', 'Grande', 40, 3, true),
  -- Pizza Carne Seca
  ('carne-seca-var-1', '95e0cd69-fd27-4d94-90a0-c76428ea5a22', 'Pequena', 30, 1, true),
  ('carne-seca-var-2', '95e0cd69-fd27-4d94-90a0-c76428ea5a22', 'Média', 35, 2, true),
  ('carne-seca-var-3', '95e0cd69-fd27-4d94-90a0-c76428ea5a22', 'Grande', 40, 3, true),
  -- Pizza Costela
  ('229f84d1-94fd-40d7-a7d9-cfc7ee786c76', '39ca8fc7-287e-444e-b481-0b840baa7f91', 'Pequena', 30, 1, true),
  ('2d7b5860-b50c-4493-81d8-3d9673444365', '39ca8fc7-287e-444e-b481-0b840baa7f91', 'Média', 35, 2, true),
  ('556f75f8-688c-45cc-8f25-b27e2763602b', '39ca8fc7-287e-444e-b481-0b840baa7f91', 'Grande', 40, 3, true),
  -- Pizza Da Roça
  ('da-roca-var-1', 'e20c7c44-b35c-4b2a-800b-a5f14379d1c2', 'Pequena', 30, 1, true),
  ('da-roca-var-2', 'e20c7c44-b35c-4b2a-800b-a5f14379d1c2', 'Média', 35, 2, true),
  ('da-roca-var-3', 'e20c7c44-b35c-4b2a-800b-a5f14379d1c2', 'Grande', 40, 3, true),
  -- Pizza Frango com Catupiry
  ('frango-cat-var-1', '587390c0-8ac8-43a4-ba16-4708a734f77d', 'Pequena', 30, 1, true),
  ('frango-cat-var-2', '587390c0-8ac8-43a4-ba16-4708a734f77d', 'Média', 35, 2, true),
  ('frango-cat-var-3', '587390c0-8ac8-43a4-ba16-4708a734f77d', 'Grande', 40, 3, true),
  -- Pizza Italiana
  ('5be4272f-2123-4f56-a9aa-bc93e6fa06d6', '50f1cc36-d138-40f5-bbbd-1fb71a72db28', 'Pequena', 30, 1, true),
  ('7c7e0f2c-7ce0-4c9b-8ea9-d74b2b3b04ee', '50f1cc36-d138-40f5-bbbd-1fb71a72db28', 'Média', 35, 2, true),
  ('01118d90-6171-429f-98e9-cddb7f246ac2', '50f1cc36-d138-40f5-bbbd-1fb71a72db28', 'Grande', 40, 3, true),
  -- Pizza Lombo
  ('lombo-var-1', '9d30f96f-89a3-4151-8e6f-e5aec5d05ec8', 'Pequena', 30, 1, true),
  ('lombo-var-2', '9d30f96f-89a3-4151-8e6f-e5aec5d05ec8', 'Média', 35, 2, true),
  ('lombo-var-3', '9d30f96f-89a3-4151-8e6f-e5aec5d05ec8', 'Grande', 40, 3, true),
  -- Pizza Margherita
  ('margherita-var-1', '77c5da13-f382-4272-9ff9-df5c4c798318', 'Pequena', 30, 1, true),
  ('margherita-var-2', '77c5da13-f382-4272-9ff9-df5c4c798318', 'Média', 35, 2, true),
  ('margherita-var-3', '77c5da13-f382-4272-9ff9-df5c4c798318', 'Grande', 40, 3, true),
  -- Pizza Palmito
  ('palmito-var-1', 'ba3b575c-1957-413d-bc39-b9bcd6a2e90c', 'Pequena', 30, 1, true),
  ('palmito-var-2', 'ba3b575c-1957-413d-bc39-b9bcd6a2e90c', 'Média', 35, 2, true),
  ('palmito-var-3', 'ba3b575c-1957-413d-bc39-b9bcd6a2e90c', 'Grande', 40, 3, true),
  -- Pizza Portuguesa
  ('portuguesa-var-1', 'feebf8ac-68f5-4eaf-8f0f-bb94cb220013', 'Pequena', 30, 1, true),
  ('portuguesa-var-2', 'feebf8ac-68f5-4eaf-8f0f-bb94cb220013', 'Média', 35, 2, true),
  ('portuguesa-var-3', 'feebf8ac-68f5-4eaf-8f0f-bb94cb220013', 'Grande', 40, 3, true),
  -- Pizza Presunto
  ('66f527fe-eba3-4eaa-b187-db394feda93f', '18497416-c492-46cb-a690-ecb0a4f78fc0', 'Pequena', 30, 1, true),
  ('348ac962-25ae-47cf-8b5e-ded8b7a3fc82', '18497416-c492-46cb-a690-ecb0a4f78fc0', 'Média', 35, 2, true),
  ('178f5048-15ce-4f8f-aafa-2caf1ce249a3', '18497416-c492-46cb-a690-ecb0a4f78fc0', 'Grande', 40, 3, true),
  -- Pizza Quatro Queijos
  ('36396874-e103-4e24-b624-110c2b0a4853', '1b9f33da-18d6-402c-aeae-2b759ea408a1', 'Pequena', 30, 1, true),
  ('21247049-e710-445b-85ae-354cff40514c', '1b9f33da-18d6-402c-aeae-2b759ea408a1', 'Média', 35, 2, true),
  ('86b16da1-e6fe-4e4f-80bb-5c1aaf21a663', '1b9f33da-18d6-402c-aeae-2b759ea408a1', 'Grande', 40, 3, true),
  -- Pizza Muçarela
  ('5c385baa-a967-4901-8d22-87b9c8290bbc', '0b80ccba-fe36-49a0-a704-9b5bbba847c0', 'Pequena', 30, 1, true),
  ('54e2dc89-bba7-4bdb-ba0f-ba1770c81b28', '0b80ccba-fe36-49a0-a704-9b5bbba847c0', 'Média', 35, 2, true),
  ('16806f25-f51e-4de9-a42d-9395952a814e', '0b80ccba-fe36-49a0-a704-9b5bbba847c0', 'Grande', 40, 3, true);

-- Variações de Pizzas Doces
INSERT INTO public.product_variations (id, product_id, name, price, sort_order, is_active) VALUES
  -- Pizza Banana
  ('banana-var-1', '5818f77b-3f3b-49a0-96cf-cfe6f15f5587', 'Pequena', 25, 1, true),
  ('banana-var-2', '5818f77b-3f3b-49a0-96cf-cfe6f15f5587', 'Média', 30, 2, true),
  ('banana-var-3', '5818f77b-3f3b-49a0-96cf-cfe6f15f5587', 'Grande', 35, 3, true),
  -- Pizza Brigadeiro
  ('brigadeiro-var-1', '6cbe06b9-2d99-49ba-8bf1-0cec3caa5e6a', 'Pequena', 25, 1, true),
  ('brigadeiro-var-2', '6cbe06b9-2d99-49ba-8bf1-0cec3caa5e6a', 'Média', 30, 2, true),
  ('brigadeiro-var-3', '6cbe06b9-2d99-49ba-8bf1-0cec3caa5e6a', 'Grande', 35, 3, true),
  -- Pizza Chocolate Branco
  ('choc-branco-var-1', 'eeaa3c9f-2c13-4c75-862b-f22c8a76f5af', 'Pequena', 25, 1, true),
  ('choc-branco-var-2', 'eeaa3c9f-2c13-4c75-862b-f22c8a76f5af', 'Média', 30, 2, true),
  ('choc-branco-var-3', 'eeaa3c9f-2c13-4c75-862b-f22c8a76f5af', 'Grande', 35, 3, true),
  -- Pizza Prestígio
  ('prestigio-var-1', 'd6c7f4a2-94e8-44f5-b847-4dd42e5fc5e1', 'Pequena', 25, 1, true),
  ('prestigio-var-2', 'd6c7f4a2-94e8-44f5-b847-4dd42e5fc5e1', 'Média', 30, 2, true),
  ('prestigio-var-3', 'd6c7f4a2-94e8-44f5-b847-4dd42e5fc5e1', 'Grande', 35, 3, true),
  -- Pizza Romeu e Julieta
  ('romeu-var-1', 'c58e7d89-f521-48e6-b2eb-09a5d46d8c34', 'Pequena', 25, 1, true),
  ('romeu-var-2', 'c58e7d89-f521-48e6-b2eb-09a5d46d8c34', 'Média', 30, 2, true),
  ('romeu-var-3', 'c58e7d89-f521-48e6-b2eb-09a5d46d8c34', 'Grande', 35, 3, true);

-- Variações de Espetinhos
INSERT INTO public.product_variations (id, product_id, name, price, sort_order, is_active) VALUES
  ('13ee5645-6ac5-4755-8b40-3086ba6fecb2', '094321be-2f6e-4218-9ae8-6d481278bf55', '1 Espetinho de Boi', 15, 1, true),
  ('cde5fc27-6661-47a8-917d-aede40e6dc87', '094321be-2f6e-4218-9ae8-6d481278bf55', '1 Espetinho de Frango', 15, 2, true),
  ('8ef073bc-75d8-46ac-9cd3-2ec756d3b810', '094321be-2f6e-4218-9ae8-6d481278bf55', '2 Espetinhos de Boi', 20, 3, true),
  ('9a0a07ff-7ce5-4778-b060-84c28d657a3f', '094321be-2f6e-4218-9ae8-6d481278bf55', '2 Espetinhos de Frango', 20, 4, true),
  ('a884db82-2991-42f6-bf42-2151a692c59d', '094321be-2f6e-4218-9ae8-6d481278bf55', '1 Espet. Boi + Frango', 20, 5, true);

-- Variações de Suco
INSERT INTO public.product_variations (id, product_id, name, price, sort_order, is_active) VALUES
  ('1884992f-b763-4142-8581-8bb9fe12bf0f', '3351a034-16b9-4f4e-b688-de0969ec0a66', 'Suco Laranja', 8, 1, true),
  ('b1367617-70d2-4843-918d-5840c83a59bc', '3351a034-16b9-4f4e-b688-de0969ec0a66', 'Suco Limão', 8, 2, true);

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Após executar este script:
-- 1. Vá em Authentication > Settings e desative "Confirm email"
-- 2. Crie um usuário admin: Authentication > Users > Add user
-- 3. Adicione a role de admin executando (substitua o USER_ID):
--    INSERT INTO public.user_roles (user_id, role) 
--    VALUES ('SEU_USER_ID_AQUI', 'admin');
-- 4. Configure as variáveis de ambiente no seu projeto

SELECT 'Script executado com sucesso! ✅' as status;
