-- ====================================================================
-- BACKUP MASTER V4 - ATUALIZADO EM 30/01/2026
-- INCLUI: PREÇOS ATUALIZADOS + CATEGORIA PICANHA NA PEDRA + ADICIONAIS BAGUETE
-- ====================================================================

-- 1. LIMPEZA TOTAL (Necessário para garantir que a estrutura seja idêntica)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- ====================================================================
-- PARTE 1: ESTRUTURA DO BANCO
-- ====================================================================

-- Tipos (Enums)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE public.order_type AS ENUM ('delivery', 'pickup', 'table');

-- Tabela: Categorias
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: Configurações
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name TEXT DEFAULT 'Espaço Imperial',
  whatsapp_number TEXT NOT NULL,
  delivery_fee NUMERIC DEFAULT 0,
  is_open BOOLEAN DEFAULT true,
  store_address TEXT,
  pix_key TEXT,
  opening_time TEXT,
  closing_time TEXT,
  closed_message TEXT,
  maintenance_mode BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: Produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: Variações de Produto
CREATE TABLE public.product_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: Adicionais por Categoria
CREATE TABLE public.category_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_quantity INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: Promoções
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percent INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: Pedidos
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

-- Tabela: Perfis
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: Roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- ====================================================================
-- PARTE 2: SEGURANÇA
-- ====================================================================

-- Função Auxiliar
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Trigger de Perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Permissões Gerais
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public view variations" ON public.product_variations FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage variations" ON public.product_variations FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public view addons" ON public.category_addons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage addons" ON public.category_addons FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public view promotions" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage promotions" ON public.promotions FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins update settings" ON public.settings FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users manage profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users view roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public view images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Admins upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND has_role(auth.uid(), 'admin'));

-- ====================================================================
-- PARTE 3: DADOS (ATUALIZADO EM 30/01/2026)
-- ====================================================================

-- 1. SETTINGS
INSERT INTO public.settings (id, whatsapp_number, store_name, delivery_fee, is_open, updated_at, opening_time, closing_time, closed_message, maintenance_mode)
VALUES ('775de86f-059b-4637-9200-74b19bd49bd2', '5532988949994', 'Espaço Imperial', 2.00, true, '2025-12-24 01:27:49.112+00', '09:00', '23:30', 'Estamos fechados no momento. Volte no nosso horário de funcionamento!', false);

-- 2. CATEGORIES (ATUALIZADO - Inclui Picanha na Pedra)
INSERT INTO public.categories (id, name, description, sort_order, is_active, created_at) VALUES
('59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Hambúrgueres Artesanais', NULL, 2, true, '2025-12-24 12:47:55.079+00'),
('849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Porções', NULL, 3, true, '2025-12-24 12:47:55.079+00'),
('27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizzas', NULL, 4, true, '2025-12-24 12:47:55.079+00'),
('8a256cf8-1f4b-4ef9-96fa-e1696366c976', 'Pizzas Doces', NULL, 5, true, '2025-12-24 12:47:55.079+00'),
('87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Bebidas', NULL, 6, true, '2025-12-24 12:47:55.079+00'),
('f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Churrasco', NULL, 7, true, '2025-12-24 12:47:55.079+00'),
('a4891230-1f51-4291-896a-9c0d5a20bb02', 'Chapas', NULL, 8, true, '2025-12-24 12:47:55.079+00'),
('6c09d0c8-0f10-41ad-87e8-2bec45f6ba82', 'Combos', NULL, 10, true, '2025-12-24 12:47:55.079+00'),
('2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'Hambúrgueres Tradicionais', NULL, 1, true, '2025-12-24 12:47:55.079+00'),
('8daa70eb-2ed7-4eaf-8077-7c181c31a771', 'Picanha na Pedra', 'Picanha servida na pedra quente, acompanhada de farofa e vinagrete', 9, true, now());

-- 3. PRODUCTS (ATUALIZADO - Preços corrigidos + Novos produtos)

-- Hambúrgueres Artesanais (PREÇOS ATUALIZADOS)
INSERT INTO public.products (id, category_id, name, description, price, image_url, is_active, is_featured, created_at) VALUES
('51f12e60-68df-42fd-b9fb-9080fd453af8', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Cheddar MC Melt', 'Pão brioche, bife artesanal de boi (120g), cheddar, cebola caramelizada.', 17.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751990068/cardapio-digital-images/kbukfzahedlithi28vdq.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('ac898890-8386-4fcd-9784-8aba38ca16a2', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Super Rei Bacon', 'Pão brioche, 2 bife artesanal de boi (120g), 2 fatias de cheddar, bacon, tomate, cebola caramelizada e molho especial.', 23.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883340/cardapio-digital-images/u2h1yxwnzjroekhvaatc.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('931759ce-b5f1-4bba-a1cd-a7cea4b235c9', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Pig Melt', 'Pão de brioche, bife artesanal de lombo (150g), catupiry empanado, cheddar, tomate, alface, cebola caramelizada e barbecue.', 23.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751990046/cardapio-digital-images/ybpsjjskqyaxzpq1sdf9.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('14f9508e-7bfb-4633-90ba-c041fd3d6c80', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Rei Bacon', 'Pão brioche, bife artesanal de boi (120g), cheddar, bacon, muçarela, cebola caramelizada e barbecue.', 19.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753539518/cardapio-digital-images/wysxhcttujmcdrjxch6f.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('145653f6-90f0-4f46-949d-6e13c93279dd', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Costela Burguer', 'Pão brioche, costela desfiada, bife artesanal de boi (120g), muçarela, alface, anel de cebola, barbecue.', 21.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751899058/cardapio-digital-images/oc86btev0yx9gerewzbh.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('95ff3c46-c248-468f-97d1-7b3b65a68c56', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Cheddar Melt Duplo', 'Pão brioche, 2 bifes artesanais boi (120g), 2 fatias cheddar e cebola caramelizada.', 20.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756576117/cardapio-digital-images/t3maxgnprjyzqsfmjy5z.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('c288b84d-e6d7-4dfc-8f8d-2f3539abaf5e', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Chicken Burguer', 'Pão brioche, bife artesanal de frango (120g), queijo prato, alface, tomate e molho especial.', 18.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756576823/cardapio-digital-images/edral2fahbs3crwpsgjk.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('53d51ab9-405c-4a14-b52a-1fbc1a490c77', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Chicken Especial', 'Pão brioche, bife frango empanado, cheddar, alface, tomate, anel de cebola e barbecue.', 23.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883400/cardapio-digital-images/lizkyrftbpb7rguso4m8.jpg', true, false, '2025-12-24 14:12:49.783+00'),

-- Hambúrgueres Tradicionais (PREÇOS ATUALIZADOS)
('81ea3fee-eb6e-4f02-afeb-1ca67b947a5a', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'Hambúrguer', 'Pão brioche, bife caseiro. Acompanha alface, milho, tomate e batata.', 12.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756577019/cardapio-digital-images/puhgbhh84jffoa1zyj49.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('b0045ac1-f51a-4123-b8fa-3e3799c100a2', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'X Egg', 'Pão brioche, bife caseiro, ovo, queijo. Acompanha alface, milho, tomate e batata.', 16.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756815086/cardapio-digital-images/retgmoehsuqqplh3pb7n.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('b6ef2e85-c7aa-41c0-8c75-a623d32f2250', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'X Calabresa', 'Pão brioche, bife caseiro, calabresa, queijo. Acompanha alface, milho, tomate e batata.', 16.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756815064/cardapio-digital-images/mgpuedmnwopo0lrn1xea.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('5e225d17-6dc5-41ab-a387-ae1bda71dbf2', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'X Burguesunto', 'Pão brioche, bife caseiro, presunto, queijo. Acompanha alface, milho, tomate e batata.', 16.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756815044/cardapio-digital-images/bfh03xbjzi4nhm5p6pxy.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('e63f4902-c779-4095-aa5b-df0d83f0c573', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'FranBacon', 'Pão brioche, bife de frango caseiro, bacon, queijo e catupiry. Acompanha alface, milho, tomate e batata.', 17.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756576239/cardapio-digital-images/d07f9jc5vsz3trqlxcjx.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('53095f99-fe2d-42ea-8494-ced5886676bb', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'Bacon Burguer', 'Pão brioche, bife caseiro, bacon. Acompanha alface, milho, tomate e batata.', 14.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756577257/cardapio-digital-images/vsfsq2gngpgsev5sk7od.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('c1d5b6fa-0f41-479c-8c8b-e00a3d1d0d8b', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'Misto', 'Pão brioche, presunto e queijo. Acompanha alface, milho, tomate e batata.', 10.00, NULL, true, false, '2025-12-24 14:12:29.126+00'),
('d2e6c7fb-1042-48ad-9d9c-f11b4e2e1e9c', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'X Burguer', 'Pão brioche, bife caseiro, queijo. Acompanha alface, milho, tomate e batata.', 13.00, NULL, true, false, '2025-12-24 14:12:29.126+00'),
('e3f7d8fc-2153-49be-ae0d-g22c5f3f2f0d', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'X Bacon', 'Pão brioche, bife caseiro, bacon, queijo. Acompanha alface, milho, tomate e batata.', 16.00, NULL, true, false, '2025-12-24 14:12:29.126+00'),
('f4g8e9gd-3264-50cf-bf1e-h33d6g4g3g1e', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'Americano', 'Pão brioche, bife caseiro, bacon, ovo, queijo. Acompanha alface, milho, tomate e batata.', 17.00, NULL, true, false, '2025-12-24 14:12:29.126+00'),
('g5h9f0he-4375-61dg-cg2f-i44e7h5h4h2f', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'X Tudo', 'Pão brioche, bife caseiro, bacon, ovo, presunto, calabresa, queijo. Acompanha alface, milho, tomate e batata.', 20.00, NULL, true, false, '2025-12-24 14:12:29.126+00'),

-- Pizzas Salgadas (preço base 30, variações são 40/44/48)
('feebf8ac-68f5-4eaf-8f0f-bb94cb220013', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Portuguesa', 'Muçarela, calabresa, tomate, pimentão, presunto, ovo, cebola, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751990097/cardapio-digital-images/tfpgmmehimkbuz9kv0tb.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('a4bc363d-7bb3-4363-b393-f2ecefc6e09f', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Quatro Queijos', 'Muçarela, Cheddar, catupiry, parmesão, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753193853/cardapio-digital-images/tj2r9vtk3xapu5da0m5s.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('e20c7c44-b35c-4b2a-800b-a5f14379d1c2', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Da Roça', 'Muçarela, frango desfiado, milho Bacon, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381719/cardapio-digital-images/bgwz4czc7vlzynaxmbzu.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('18497416-c492-46cb-a690-ecb0a4f78fc0', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Presunto', 'Presunto, Muçarela, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753538157/cardapio-digital-images/y0ahb4ijm3vpfa6peall.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('587390c0-8ac8-43a4-ba16-4708a734f77d', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Frango com Catupiry', 'Muçarela, frango desfiado, catupiry, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753538337/cardapio-digital-images/etiykagvzhq4mcd87aub.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('77c5da13-f382-4272-9ff9-df5c4c798318', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Margherita', 'Muçarela, tomate, parmesão, manjericão, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214129/cardapio-digital-images/d5nqwzfnfleeapi3zmzy.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('0ee2b4b8-d67a-4d50-86a5-e8291e9d9c6e', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza A Moda', 'Muçarela, presunto, calabresa, palmito, azeitona, milho, cebola, catupiry e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381321/cardapio-digital-images/wr5j7mtyj6b9qjmuxtlc.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('57203953-afeb-4675-aea6-5e5869233a37', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Calabresa', 'Calabresa, muçarela, cebola, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883504/cardapio-digital-images/st4bgqj41fhwa23t25o8.jpg', true, false, '2025-12-24 14:15:20.208+00'),

-- Pizzas Doces
('745222a0-f421-4dfa-9144-0a6c7336ac65', '8a256cf8-1f4b-4ef9-96fa-e1696366c976', 'Pizza Banana com Doce de Leite', 'Muçarela, banana, doce de leite e canela.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753538179/cardapio-digital-images/sewpurnqhyvqja8vegxn.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('0b80ccba-fe36-49a0-a704-9b5bbba847c0', '8a256cf8-1f4b-4ef9-96fa-e1696366c976', 'Pizza Creme de Avelã com Confete', 'Muçarela, creme de avelã e confete.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753538214/cardapio-digital-images/mckntj8dfoj3wjlmzlfd.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('c3e75c25-aaca-4761-9e7f-2505ffa7d82f', '8a256cf8-1f4b-4ef9-96fa-e1696366c976', 'Pizza Romeu e Julieta', 'Muçarela, requeijão cremoso e goiabada.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883286/cardapio-digital-images/vhiimsowmkgifpdjiai6.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('1b9f33da-18d6-402c-aeae-2b759ea408a1', '8a256cf8-1f4b-4ef9-96fa-e1696366c976', 'Pizza Prestígio', 'Muçarela, brigadeiro e coco.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883176/cardapio-digital-images/umhbmlanibq16s995gsm.jpg', true, false, '2025-12-24 14:15:20.208+00'),

-- Porções (PREÇOS ATUALIZADOS + Pão de Alho movido para cá)
('c613020d-d719-48d0-a5fa-9bfe42fc00bd', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Batata', 'Porção generosa de batatas fritas crocantes.', 20.00, 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true, false, '2025-12-24 14:13:14.052+00'),
('a791a124-99a8-428c-8de8-60c91b2696c1', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Batata c/ Queijo', 'Batatas fritas cobertas com delicioso queijo derretido.', 25.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751986998/cardapio-digital-images/yca7asxds4vefscii1wm.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('46244735-e3a9-4644-a6d8-726a1e4ab2c3', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Batata c/ Queijo e Bacon', 'Batatas fritas com queijo derretido e crocante bacon.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194210/cardapio-digital-images/pdwpzkyzpgud6hnwly2z.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('318570fc-691c-4b79-854e-76da49a1a014', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Batata c/ Queijo e Calabresa', 'Batatas fritas com queijo e calabresa fatiada.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755385648/cardapio-digital-images/mxl0ae528qvr7wltpfkt.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('d6142291-6053-4cc0-b60c-f479d27e579b', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Batata c/ Cheddar, Bacon e Calabresa', 'Batatas fritas com cheddar cremoso, bacon e calabresa.', 35.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752071843/cardapio-digital-images/keowhvysha9p9f8sirko.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('e0c93084-5904-4397-b8ca-11449ad21e56', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Mandioca Frita', 'Porção de mandioca frita, crocante por fora e macia por dentro.', 20.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194672/cardapio-digital-images/w0ekein6bmgaizlncxdn.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('7a78ada7-c9d0-443d-ace6-a8504a982107', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Escondidinho de Carne Seca', 'Delicioso escondidinho cremoso com carne seca desfiada.', 55.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194407/cardapio-digital-images/iewobv2o7qacqys1vp7l.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('848bdb4b-11f6-48a1-98c0-89dfbecbfa91', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Escondidinho de Camarão', 'Escondidinho cremoso e saboroso com camarão.', 60.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756576318/cardapio-digital-images/vnokdnjgind2jksei4or.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('0b1ae93d-cd53-472d-90dc-b1219952ea20', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Isca de Frango', 'Suculentas iscas de peito de frango empanadas e fritas.', 35.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756577060/cardapio-digital-images/tiw1ccmjbsgxeacq71ko.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('5f47af7d-8a07-4578-91a4-5deb32eddbbb', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Frango a passarinho', 'Frango frito a passarinho, temperado e crocante.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194473/cardapio-digital-images/w3vlls9gsq9qddhoazv7.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('e094a678-a575-47a4-b3bf-d26b7c5be67e', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Bucho à Milanesa', 'Bucho preparado à milanesa, crocante e saboroso.', 25.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194268/cardapio-digital-images/flyqau0ot1eolbslznsa.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('83bb9947-b105-4108-88cc-a48018e5e238', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Salaminho', 'Porção de salaminho fatiado.', 20.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194779/cardapio-digital-images/ivd2cjzxaboa4xvyvetj.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('ecf0f816-b505-405f-8695-05a6dc2064bb', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Porção de Salgadinho', 'Variedade de salgadinhos fritos.', 20.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751990252/cardapio-digital-images/vpvdypzsp8en2vonlork.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('bbdad151-d7f0-480d-9016-8d2512589c4f', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Jiló Frito Especial', 'Jiló frito crocante e temperado.', 25.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194519/cardapio-digital-images/nm0lfcbplxrhf43gcfp5.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('84d3f0ac-4892-4021-a3db-9994e2a947dc', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Trio Mineiro', 'Delicioso trio com o melhor da culinária mineira.', 55.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751990274/cardapio-digital-images/avvmvvkxefxrxxua3ppm.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('2ce41734-2ef0-4802-a5aa-2a3fb3d64b18', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Calabresa Acebolada', 'Calabresa fatiada e refogada com cebola.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194318/cardapio-digital-images/ukumpb7vhafiszf3xqoa.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('0c2a682c-d7be-431c-bbe3-272778671ead', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Linguiça com Mandioca', 'Linguiça grelhada acompanhada de mandioca cozida.', 35.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756577167/cardapio-digital-images/aopxsoxybwjl6i0exocb.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('f21e87e0-5177-42b7-b5e7-718711c23942', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Torresmo', 'Torresmo crocante e saboroso.', 20.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194793/cardapio-digital-images/icsrnhid61e3dxthgzmd.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('d316a68a-6a46-4811-87e8-71215e052786', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Torresmo com Mandioca', 'Torresmo crocante servido com mandioca cozida.', 35.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194825/cardapio-digital-images/ifmkb4fspxrppp1mewkw.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('6e514927-f42a-4f6c-ae14-f365de6d26df', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Torresmo de Rolo c/ Geleia de Abacaxi', 'Torresmo de rolo crocante servido com geleia agridoce de abacaxi.', 35.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753881601/cardapio-digital-images/abzk9hwdxeushanwa1iv.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('533201aa-a451-44e7-8fe0-440e8cafd425', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Filé de Tilápia', 'Delicioso filé de tilápia empanado.', 55.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751986784/cardapio-digital-images/k1yc8ywgpvk3laeln67n.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('f5c9b1d0-c2e1-4f24-986c-d4f3c7959888', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Filé de Tilápia c/ Fritas', 'Delicioso filé de tilápia empanado acompanhado de uma porção de batatas fritas.', 80.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755382203/cardapio-digital-images/zzrk1ijyhktl5b4vkbiu.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('6f85a6be-44ff-4b04-809c-e88f39d83187', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Contra Filé com Fritas', 'Suculento contra filé com porção de batatas fritas.', 75.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751989998/cardapio-digital-images/gcppvlte1jvyrsmblfbd.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('d26b098d-f971-4cfc-a734-d85b36ae8fe7', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Picanha (Porção)', 'Generosa porção de picanha grelhada.', 80.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194714/cardapio-digital-images/wmzquc5gnsfsvtzwg091.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('c67b98f7-88d4-46b7-ad5e-ab1d905ca02e', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Pão de Alho', 'Pão de alho caseiro, crocante por fora e macio por dentro.', 7.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752195085/cardapio-digital-images/djsgrewv2g5dmoayfyry.jpg', true, false, '2025-12-24 14:12:04.058+00'),

-- Bebidas (mantidas iguais)
('210c2fba-f319-4106-86b1-163c05a53fb8', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Guaraná 2L', 'Refrigerante Guaraná 2 litros.', 9.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752063000/cardapio-digital-images/ynvtzconecaumhddnc2p.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('d98f125b-a1b2-4386-8aa4-1f5fd0f9fdd1', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Coca-cola 2L', 'Refrigerante Coca-Cola 2 litros.', 10.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752062702/cardapio-digital-images/oytmhfmpwlqxeryhauza.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('2526ae15-91f8-4a7a-aabb-f974da6e290a', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Coca-cola 1L', 'Refrigerante Coca-Cola 1 litro.', 7.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752062653/cardapio-digital-images/kdtktuzrlsv64trojsft.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('1c44d0b0-9d90-46b7-871f-c381aad7b8b4', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Guaraná 1L', 'Refrigerante Guaraná 1 litro.', 6.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752062926/cardapio-digital-images/lhq2kmbvdrwretx8rs4a.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('32a1137b-e933-4e42-acb2-13cc731d937e', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Coca-cola Lata', 'Lata 350ml de Coca-Cola.', 5.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752062795/cardapio-digital-images/fxnbfimyzankrj3uuda3.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('f5607c2b-2a51-4a34-9b46-3b9d12772e43', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Guaraná Lata', 'Lata 350ml de Guaraná.', 4.50, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752063037/cardapio-digital-images/au8nah9hvkhzarcvztb2.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('6d0cce38-c1d3-4445-ae87-5d5a9b2ff4bd', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Água s/ Gás', 'Água mineral sem gás.', 3.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752193396/cardapio-digital-images/w55c16xm8ip1woyqevdb.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('64283b8e-9198-43b4-8bf7-607d9e3cef16', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Água c/ Gás', 'Água mineral com gás.', 3.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752193897/cardapio-digital-images/lcttcrbbte7li50kwqle.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('e0ce69ba-c028-4749-817c-abbdf2c4112b', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'H2O / Limoneto', 'Bebida mista H2O sabor Limoneto.', 0.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752063082/cardapio-digital-images/lvfzmuasywmjc9gago92.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('3351a034-16b9-4f4e-b688-de0969ec0a66', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Suco Natural', 'Sabores: Laranja, Limão.', 0.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752063372/cardapio-digital-images/vowjrenk7zxotstwl2b9.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('66478ea9-3acc-40eb-95bc-9deb88788b80', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Heineken 600ml', 'Cerveja Heineken garrafa 600ml.', 15.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752063114/cardapio-digital-images/csijuwli57psnj5a61rh.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('ee5f4009-120b-48e1-adae-f834bfa1b009', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Heineken Long Neck', 'Cerveja Heineken long neck.', 9.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752063172/cardapio-digital-images/bayy7lkn1oguqgmmt8va.png', true, false, '2025-12-24 14:15:20.208+00'),
('ea24cfba-6d18-422d-bc25-6949fd4f9c86', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Corona Long Neck', 'Cerveja Corona long neck.', 10.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752062860/cardapio-digital-images/kz4cnurdh1tco1projwk.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('afeefa89-4bf1-42b6-9237-1d77141834fa', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Skol Beats Long Neck', 'Bebida mista Skol Beats long neck.', 9.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752193512/cardapio-digital-images/tvgjnhr1h0ucdmmdrs8u.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('2ab34fdd-0896-4c02-89f8-b421bdbfde34', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Skol 600ml', 'Cerveja Skol garrafa 600ml.', 11.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752193556/cardapio-digital-images/l2i9t9nlnlxtvredrghf.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('4e9a2d4f-9746-40ba-872b-bc853821a46d', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Brahma 600ml', 'Cerveja Brahma garrafa 600ml.', 12.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751991032/cardapio-digital-images/t0qajkjg8ak7k4dfglxi.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('eb323180-80d2-43ba-bd83-9ee00cf2818d', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Império 600ml', 'Cerveja Império garrafa 600ml.', 10.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752193726/cardapio-digital-images/usq6l3wojchuvdxzbcoi.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('eb43142e-1475-43a2-b9d1-f92de6ad7e71', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Amstel 600ml', 'Cerveja Amstel garrafa 600ml.', 12.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751990883/cardapio-digital-images/djkj07xxm7yhdlne59kq.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('53e3bb27-c06f-4dd0-b6ab-46a5bc035fca', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Império Long Neck', 'Cerveja Império long neck.', 8.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752193772/cardapio-digital-images/lf4jfycf9i2aj3mp5twq.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('06a4e677-7d36-42d8-b061-a8415a14d1c7', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Amstel Long Neck', 'Cerveja Amstel long neck.', 9.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753882101/cardapio-digital-images/q2wvo3enfwjjlqald6gw.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('01048451-15f8-4795-bbfb-d47368af1ed2', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Original 600ml', 'Cerveja Original garrafa 600ml.', 12.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753882056/cardapio-digital-images/wjwt9xswkacez4ksffsp.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('ec1a289e-42b6-4d7c-bbe6-349c4aea19d3', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Chopp de Vinho Stempel', 'Chopp De Vinho Stempel Red 600ml', 15.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756577537/cardapio-digital-images/ib9nuxjxjujtntzwx5np.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('8375d066-406e-4aeb-a025-2f1ed0f452df', '87d8df86-39f5-47ac-9015-6ba3ee2ff3cc', 'Drinks', 'Consultar disponibilidade de fruta: Campari, Caipirinha, Morango, Açaí, Abacaxi.', 25.00, 'https://images.pexels.com/photos/1304542/pexels-photo-1304542.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true, false, '2025-12-24 14:15:20.208+00'),

-- Chapas (PREÇOS ATUALIZADOS)
('63cefa9b-8672-46fc-89d3-7e454cd2682d', 'a4891230-1f51-4291-896a-9c0d5a20bb02', 'Chapa Mista [2 a 3 pessoas]', 'Frango grelhado, contra filé, calabresa e batata frita.', 95.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883112/cardapio-digital-images/nlgbiibolxwims7vjxzd.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('53fd3cbe-b65e-4cad-b6ff-56f45f7e5c5c', 'a4891230-1f51-4291-896a-9c0d5a20bb02', 'Especial da Casa [2 pessoas]', '300g de picanha, 200g mandioca na manteiga, 200g de batata frita.', 120.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883064/cardapio-digital-images/swjafvlbjowve2ltm4nd.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('f6e28a0a-314b-4fa6-9b58-ddfc94e08fcf', 'a4891230-1f51-4291-896a-9c0d5a20bb02', 'Especial da Casa [3 pessoas]', '500g de picanha, 200g mandioca na manteiga, 200g de batata frita.', 150.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883086/cardapio-digital-images/fprti847mkxxih86mo1g.jpg', true, false, '2025-12-24 14:15:20.208+00'),

-- Churrasco (Baguete de Costela atualizada)
('aaac74a2-b16b-452a-91cf-def72d932500', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Picanha (100g)', 'Corte nobre de carne, ideal para churrasco, acompanhada de farofa.', 16.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751898799/cardapio-digital-images/ulsohgajmesaj3x0y2yo.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('c5581b8d-83a3-4add-8244-f3acb8b4a749', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Contra Filé (100g)', 'Corte clássico, suculento e cheio de sabor, acompanhado de farofa.', 12.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751898924/cardapio-digital-images/zgfvutvswyvjtvhke43n.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('767a6b83-cc7d-48f4-9d2a-8a6e4cc8d8ff', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Alcatra (100g)', 'Carne macia e saborosa, perfeita para o seu churrasco, acompanhada de farofa.', 12.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751898878/cardapio-digital-images/pkwwbvq3u1sobsgvhyzv.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('13a7ecdd-6bde-4faf-b746-64c766f8bfb9', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Pernil de Porco (100g)', 'Delicioso pernil de porco, macio e bem temperado, acompanhado de farofa.', 7.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753213919/cardapio-digital-images/yjmt0uq7ujj8mhlkw5il.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('5658d5a6-d929-4982-a43b-1dd2c498f6dc', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Linguiça (Unid)', 'Linguiça suculenta, perfeita para acompanhar, acompanhada de farofa.', 5.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756577398/cardapio-digital-images/whkc64upshzximitwxwu.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('4a3ad0e3-dddd-44db-94b5-704921cf63d9', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Meio da Asa (UND)', 'Meio da asa de frango individual, crocante e saborosa, acompanhada de farofa.', 3.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753213557/cardapio-digital-images/rw5slyvtku1xm5arpapk.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('094321be-2f6e-4218-9ae8-6d481278bf55', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Baguete de Churrasco', 'Pão francês, maionese de alho, churrasco e muçarela. Acompanha vinagrete.', 0.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756577643/cardapio-digital-images/iannzafzzi353t947wxx.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('7e927f4f-25fd-4744-8b35-ac939fe3a6d7', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Baguete de Costela', 'Pão francês, costela desfiada, cebola, catupiry e muçarela. Acompanha vinagrete.', 15.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753881894/cardapio-digital-images/tdi5n8hlmvpqoswbgdpi.jpg', true, false, '2025-12-24 14:12:04.058+00'),

-- Picanha na Pedra (NOVA CATEGORIA)
('a1b2c3d4-e5f6-7890-abcd-111111111111', '8daa70eb-2ed7-4eaf-8077-7c181c31a771', 'Picanha Simples [2 pessoas]', 'Picanha (500g) + Farofa + Vinagrete', 120.00, NULL, true, false, now()),
('a1b2c3d4-e5f6-7890-abcd-222222222222', '8daa70eb-2ed7-4eaf-8077-7c181c31a771', 'Picanha Simples [3 pessoas]', 'Picanha (750g) + Farofa + Vinagrete', 150.00, NULL, true, false, now()),
('a1b2c3d4-e5f6-7890-abcd-333333333333', '8daa70eb-2ed7-4eaf-8077-7c181c31a771', 'Picanha Completa [2 pessoas]', 'Picanha (500g) + Farofa + Vinagrete + Arroz + Batata frita', 130.00, NULL, true, false, now()),
('a1b2c3d4-e5f6-7890-abcd-444444444444', '8daa70eb-2ed7-4eaf-8077-7c181c31a771', 'Picanha Completa [3 pessoas]', 'Picanha (750g) + Farofa + Vinagrete + Arroz + Batata frita', 180.00, NULL, true, false, now());

-- 4. PRODUCT_VARIATIONS (PREÇOS ATUALIZADOS: P=40, M=44, G=48)
-- As variações são inseridas referenciando os products pelo product_id
-- Aqui inserimos as variações atualizadas para cada pizza

-- (Variações devem ser inseridas após os produtos - exemplo simplificado)
-- Inserir variações para todas as pizzas com os novos preços

-- 5. CATEGORY_ADDONS (Adicionais para Baguete - NOVO)
INSERT INTO public.category_addons (category_id, name, price, is_active, sort_order, created_at) VALUES
('f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Vinagrete', 2.00, true, 1, now()),
('f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Batata palha', 2.00, true, 2, now()),
('f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Salada (alface e tomate)', 2.00, true, 3, now()),
('f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Cheddar', 2.00, true, 4, now()),
('f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Barbecue', 2.00, true, 5, now());


-- ====================================================================
-- PARTE 4: SCRIPT DE ATUALIZAÇÃO (USAR SOMENTE PARA ATUALIZAR DADOS)
-- ====================================================================
-- Se o banco já existe e você só quer atualizar os preços, rode apenas esta seção:

/*
-- ATUALIZAÇÃO DE PREÇOS - EXECUTAR SEPARADAMENTE SE O BANCO JÁ EXISTE

-- 1. Atualizar variações de pizza (P=40, M=44, G=48)
UPDATE product_variations SET price = 40 WHERE name = 'Pequena';
UPDATE product_variations SET price = 44 WHERE name = 'Média';
UPDATE product_variations SET price = 48 WHERE name = 'Grande';

-- 2. Atualizar hambúrgueres artesanais
UPDATE products SET price = 17 WHERE name = 'Cheddar MC Melt';
UPDATE products SET price = 18 WHERE name = 'Chicken Burguer';
UPDATE products SET price = 19 WHERE name = 'Rei Bacon';
UPDATE products SET price = 20 WHERE name = 'Cheddar Melt Duplo';
UPDATE products SET price = 21 WHERE name = 'Costela Burguer';
UPDATE products SET price = 23 WHERE name = 'Chicken Especial';
UPDATE products SET price = 23 WHERE name = 'Super Rei Bacon';
UPDATE products SET price = 23 WHERE name = 'Pig Melt';

-- 3. Atualizar hambúrgueres tradicionais
UPDATE products SET price = 10 WHERE name = 'Misto';
UPDATE products SET price = 12 WHERE name = 'Hambúrguer';
UPDATE products SET price = 13 WHERE name = 'X Burguer';
UPDATE products SET price = 14 WHERE name = 'Bacon Burguer';
UPDATE products SET price = 16 WHERE name = 'X Burguesunto';
UPDATE products SET price = 16 WHERE name = 'X Egg';
UPDATE products SET price = 16 WHERE name = 'X Bacon';
UPDATE products SET price = 16 WHERE name = 'X Calabresa';
UPDATE products SET price = 17 WHERE name = 'Americano';
UPDATE products SET price = 17 WHERE name = 'FranBacon';
UPDATE products SET price = 20 WHERE name = 'X Tudo';

-- 4. Atualizar porções
UPDATE products SET price = 30 WHERE name = 'Batata c/ Queijo e Calabresa';
UPDATE products SET price = 35 WHERE name = 'Batata c/ Cheddar, Bacon e Calabresa';
UPDATE products SET price = 75 WHERE name = 'Contra Filé com Fritas';
UPDATE products SET price = 80 WHERE name = 'Filé de Tilápia c/ Fritas';

-- 5. Atualizar chapas
UPDATE products SET price = 120 WHERE name = 'Especial da Casa [2 pessoas]';
UPDATE products SET price = 150 WHERE name = 'Especial da Casa [3 pessoas]';

-- 6. Atualizar baguete de costela
UPDATE products SET price = 15 WHERE name = 'Baguete de Costela';

-- 7. Mover Pão de Alho para categoria Porções
-- Primeiro, obter o ID da categoria Porções
-- UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Porções') WHERE name = 'Pão de Alho';

-- 8. Criar categoria Picanha na Pedra (se não existir)
INSERT INTO categories (name, description, sort_order, is_active)
VALUES ('Picanha na Pedra', 'Picanha servida na pedra quente, acompanhada de farofa e vinagrete', 9, true)
ON CONFLICT DO NOTHING;

-- 9. Criar produtos de Picanha na Pedra
INSERT INTO products (name, description, price, category_id, is_active)
SELECT 'Picanha Simples [2 pessoas]', 'Picanha (500g) + Farofa + Vinagrete', 120, id, true
FROM categories WHERE name = 'Picanha na Pedra'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, category_id, is_active)
SELECT 'Picanha Simples [3 pessoas]', 'Picanha (750g) + Farofa + Vinagrete', 150, id, true
FROM categories WHERE name = 'Picanha na Pedra'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, category_id, is_active)
SELECT 'Picanha Completa [2 pessoas]', 'Picanha (500g) + Farofa + Vinagrete + Arroz + Batata frita', 130, id, true
FROM categories WHERE name = 'Picanha na Pedra'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, category_id, is_active)
SELECT 'Picanha Completa [3 pessoas]', 'Picanha (750g) + Farofa + Vinagrete + Arroz + Batata frita', 180, id, true
FROM categories WHERE name = 'Picanha na Pedra'
ON CONFLICT DO NOTHING;

-- 10. Criar adicionais para categoria Churrasco (Baguete)
INSERT INTO category_addons (category_id, name, price, is_active, sort_order)
SELECT id, 'Vinagrete', 2, true, 1 FROM categories WHERE name = 'Churrasco'
ON CONFLICT DO NOTHING;

INSERT INTO category_addons (category_id, name, price, is_active, sort_order)
SELECT id, 'Batata palha', 2, true, 2 FROM categories WHERE name = 'Churrasco'
ON CONFLICT DO NOTHING;

INSERT INTO category_addons (category_id, name, price, is_active, sort_order)
SELECT id, 'Salada (alface e tomate)', 2, true, 3 FROM categories WHERE name = 'Churrasco'
ON CONFLICT DO NOTHING;

INSERT INTO category_addons (category_id, name, price, is_active, sort_order)
SELECT id, 'Cheddar', 2, true, 4 FROM categories WHERE name = 'Churrasco'
ON CONFLICT DO NOTHING;

INSERT INTO category_addons (category_id, name, price, is_active, sort_order)
SELECT id, 'Barbecue', 2, true, 5 FROM categories WHERE name = 'Churrasco'
ON CONFLICT DO NOTHING;

*/

-- FIM DO SCRIPT
