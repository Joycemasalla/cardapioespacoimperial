-- ====================================================================
-- BACKUP MASTER - CARDÁPIO ESPAÇO IMPERIAL (ESTRUTURA + DADOS REAIS)
-- ====================================================================

-- 1. LIMPEZA TOTAL (Começar do zero para evitar conflitos)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- ====================================================================
-- PARTE 1: ESTRUTURA DO BANCO (Tabelas e Tipos)
-- ====================================================================

-- Tipos (Enums)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE public.order_type AS ENUM ('delivery', 'pickup', 'table');

-- Tabelas
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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

CREATE TABLE public.product_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percent INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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

CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- ====================================================================
-- PARTE 2: SEGURANÇA E FUNÇÕES
-- ====================================================================

-- Funções Auxiliares
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar RLS (Segurança)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active variations" ON public.product_variations FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage variations" ON public.product_variations FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.settings FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Storage (Imagens)
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public can view images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Admins can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND has_role(auth.uid(), 'admin'));

-- CORREÇÃO DE PERMISSÕES (IMPORTANTE: Resolve o erro 42501)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- ====================================================================
-- PARTE 3: DADOS REAIS (Inserção de Conteúdo)
-- ====================================================================

-- Configurações Iniciais
INSERT INTO public.settings (store_name, whatsapp_number, delivery_fee, is_open)
VALUES ('Espaço Imperial', '5532988949994', 2.00, true);

-- Categorias (Estrutura Fixa)
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

-- Produtos (Dados do seu backup CSV)
INSERT INTO public.products (id, category_id, name, description, price, image_url, is_active, is_featured, created_at) VALUES
('51f12e60-68df-42fd-b9fb-9080fd453af8', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Cheddar MC Melt', 'Pão brioche, bife artesanal de boi (120g), cheddar, cebola caramelizada.', 14.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751990068/cardapio-digital-images/kbukfzahedlithi28vdq.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('ac898890-8386-4fcd-9784-8aba38ca16a2', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Super Rei Bacon', 'Pão brioche, 2 bife artesanal de boi (120g), 2 fatias de cheddar, bacon, tomate, cebola caramelizada e molho especial.', 20.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883340/cardapio-digital-images/u2h1yxwnzjroekhvaatc.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('931759ce-b5f1-4bba-a1cd-a7cea4b235c9', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Pig Melt', 'Pão de brioche, bife artesanal de lombo (150g), catupiry empanado, cheddar, tomate, alface, cebola caramelizada e barbecue.', 20.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751990046/cardapio-digital-images/ybpsjjskqyaxzpq1sdf9.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('14f9508e-7bfb-4633-90ba-c041fd3d6c80', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Rei Bacon', 'Pão brioche, bife artesanal de boi (120g), cheddar, bacon, muçarela, cebola caramelizada e barbecue.', 16.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753539518/cardapio-digital-images/wysxhcttujmcdrjxch6f.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('145653f6-90f0-4f46-949d-6e13c93279dd', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Costela Burguer', 'Pão brioche, costela desfiada, bife artesanal de boi (120g), muçarela, alface, anel de cebola, barbecue.', 18.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751899058/cardapio-digital-images/oc86btev0yx9gerewzbh.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('95ff3c46-c248-468f-97d1-7b3b65a68c56', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Cheddar Melt Duplo', 'Pão brioche, 2 bifes artesanais boi (120g), 2 fatias cheddar e cebola caramelizada.', 17.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756576117/cardapio-digital-images/t3maxgnprjyzqsfmjy5z.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('c288b84d-e6d7-4dfc-8f8d-2f3539abaf5e', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Chicken Burguer', 'Pão brioche, bife artesanal de frango (120g), queijo prato, alface, tomate e molho especial.', 15.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756576823/cardapio-digital-images/edral2fahbs3crwpsgjk.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('53d51ab9-405c-4a14-b52a-1fbc1a490c77', '59bf2723-57bc-48cd-a8e6-7aa66036f9b6', 'Chicken Especial', 'Pão brioche, bife frango empanado, cheddar, alface, tomate, anel de cebola e barbecue.', 20.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883400/cardapio-digital-images/lizkyrftbpb7rguso4m8.jpg', true, false, '2025-12-24 14:12:49.783+00'),
('feebf8ac-68f5-4eaf-8f0f-bb94cb220013', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Portuguesa', 'Muçarela, calabresa, tomate, pimentão, presunto, ovo, cebola, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751990097/cardapio-digital-images/tfpgmmehimkbuz9kv0tb.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('a4bc363d-7bb3-4363-b393-f2ecefc6e09f', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Quatro Queijos', 'Muçarela, Cheddar, catupiry, parmesão, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753193853/cardapio-digital-images/tj2r9vtk3xapu5da0m5s.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('e20c7c44-b35c-4b2a-800b-a5f14379d1c2', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Da Roça', 'Muçarela, frango desfiado, milho Bacon, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381719/cardapio-digital-images/bgwz4czc7vlzynaxmbzu.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('18497416-c492-46cb-a690-ecb0a4f78fc0', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Presunto', 'Presunto, Muçarela, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753538157/cardapio-digital-images/y0ahb4ijm3vpfa6peall.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('587390c0-8ac8-43a4-ba16-4708a734f77d', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Frango com Catupiry', 'Muçarela, frango desfiado, catupiry, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753538337/cardapio-digital-images/etiykagvzhq4mcd87aub.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('77c5da13-f382-4272-9ff9-df5c4c798318', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Margherita', 'Muçarela, tomate, parmesão, manjericão, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214129/cardapio-digital-images/d5nqwzfnfleeapi3zmzy.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('0ee2b4b8-d67a-4d50-86a5-e8291e9d9c6e', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza A Moda', 'Muçarela, presunto, calabresa, palmito, azeitona, milho, cebola, catupiry e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381321/cardapio-digital-images/wr5j7mtyj6b9qjmuxtlc.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('745222a0-f421-4dfa-9144-0a6c7336ac65', '8a256cf8-1f4b-4ef9-96fa-e1696366c976', 'Pizza Banana com Doce de Leite', 'Muçarela, banana, doce de leite e canela.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753538179/cardapio-digital-images/sewpurnqhyvqja8vegxn.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('0b80ccba-fe36-49a0-a704-9b5bbba847c0', '8a256cf8-1f4b-4ef9-96fa-e1696366c976', 'Pizza Creme de Avelã com Confete', 'Muçarela, creme de avelã e confete.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753538214/cardapio-digital-images/mckntj8dfoj3wjlmzlfd.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('c3e75c25-aaca-4761-9e7f-2505ffa7d82f', '8a256cf8-1f4b-4ef9-96fa-e1696366c976', 'Pizza Romeu e Julieta', 'Muçarela, requeijão cremoso e goiabada.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883286/cardapio-digital-images/vhiimsowmkgifpdjiai6.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('1b9f33da-18d6-402c-aeae-2b759ea408a1', '8a256cf8-1f4b-4ef9-96fa-e1696366c976', 'Pizza Prestígio', 'Muçarela, brigadeiro e coco.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883176/cardapio-digital-images/umhbmlanibq16s995gsm.jpg', true, false, '2025-12-24 14:15:20.208+00'),
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
('c613020d-d719-48d0-a5fa-9bfe42fc00bd', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Batata', 'Porção generosa de batatas fritas crocantes.', 20.00, 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true, false, '2025-12-24 14:13:14.052+00'),
('a791a124-99a8-428c-8de8-60c91b2696c1', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Batata c/ Queijo', 'Batatas fritas cobertas com delicioso queijo derretido.', 25.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751986998/cardapio-digital-images/yca7asxds4vefscii1wm.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('46244735-e3a9-4644-a6d8-726a1e4ab2c3', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Batata c/ Queijo e Bacon', 'Batatas fritas com queijo derretido e crocante bacon.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194210/cardapio-digital-images/pdwpzkyzpgud6hnwly2z.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('318570fc-691c-4b79-854e-76da49a1a014', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Batata c/ Queijo e Calabresa', 'Batatas fritas com queijo e calabresa fatiada.', 35.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755385648/cardapio-digital-images/mxl0ae528qvr7wltpfkt.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('d6142291-6053-4cc0-b60c-f479d27e579b', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Batata c/ Cheddar, Bacon e Calabresa', 'Batatas fritas com cheddar cremoso, bacon e calabresa.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752071843/cardapio-digital-images/keowhvysha9p9f8sirko.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('e0c93084-5904-4397-b8ca-11449ad21e56', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Mandioca Frita', 'Porção de mandioca frita, crocante por fora e macia por dentro.', 20.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194672/cardapio-digital-images/w0ekein6bmgaizlncxdn.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('7a78ada7-c9d0-443d-ace6-a8504a982107', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Escondidinho de Carne Seca', 'Delicioso escondidinho cremoso com carne seca desfiada.', 55.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194407/cardapio-digital-images/iewobv2o7qacqys1vp7l.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('848bdb4b-11f6-48a1-98c0-89dfbecbfa91', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Escondidinho de Camarão', 'Escondidinho cremoso e saboroso com camarão.', 60.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756576318/cardapio-digital-images/vnokdnjgind2jksei4or.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('0b1ae93d-cd53-472d-90dc-b1219952ea20', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Isca de Frango', 'Suculentas iscas de peito de frango empanadas e fritas.', 35.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756577060/cardapio-digital-images/tiw1ccmjbsgxeacq71ko.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('5f47af7d-8a07-4578-91a4-5deb32eddbbb', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Frango a passarinho', 'Frango frito a passarinho, temperado e crocante.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194473/cardapio-digital-images/w3vlls9gsq9qddhoazv7.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('e094a678-a575-47a4-b3bf-d26b7c5be67e', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Bucho à Milanesa', 'Bucho preparado à milanesa, crocante e saboroso.', 25.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194268/cardapio-digital-images/flyqau0ot1eolbslznsa.jpg', true, false, '2025-12-24 14:13:14.052+00'),
('83bb9947-b105-4108-88cc-a48018e5e238', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Salaminho', 'Porção de salaminho fatiado.', 20.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194779/cardapio-digital-images/ivd2cjzxaboa4xvyvetj.jpg', true, false, '2025-12-24 14:13:14.052+00'),
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
('63cefa9b-8672-46fc-89d3-7e454cd2682d', 'a4891230-1f51-4291-896a-9c0d5a20bb02', 'Chapa Mista [2 a 3 pessoas]', 'Frango grelhado, contra filé, calabresa e batata frita.', 95.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883112/cardapio-digital-images/nlgbiibolxwims7vjxzd.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('53fd3cbe-b65e-4cad-b6ff-56f45f7e5c5c', 'a4891230-1f51-4291-896a-9c0d5a20bb02', 'Especial da Casa [2 pessoas]', '300g de picanha, 200g mandioca na manteiga, 200g de batata frita.', 150.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883064/cardapio-digital-images/swjafvlbjowve2ltm4nd.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('f6e28a0a-314b-4fa6-9b58-ddfc94e08fcf', 'a4891230-1f51-4291-896a-9c0d5a20bb02', 'Especial da Casa [3 pessoas]', '500g de picanha, 200g mandioca na manteiga, 200g de batata frita.', 180.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883086/cardapio-digital-images/fprti847mkxxih86mo1g.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('ecf0f816-b505-405f-8695-05a6dc2064bb', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Porção de Salgadinho', 'Variedade de salgadinhos fritos.', 20.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751990252/cardapio-digital-images/vpvdypzsp8en2vonlork.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('bbdad151-d7f0-480d-9016-8d2512589c4f', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Jiló Frito Especial', 'Jiló frito crocante e temperado.', 25.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194519/cardapio-digital-images/nm0lfcbplxrhf43gcfp5.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('84d3f0ac-4892-4021-a3db-9994e2a947dc', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Trio Mineiro', 'Delicioso trio com o melhor da culinária mineira.', 55.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751990274/cardapio-digital-images/avvmvvkxefxrxxua3ppm.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('2ce41734-2ef0-4802-a5aa-2a3fb3d64b18', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Calabresa Acebolada', 'Calabresa fatiada e refogada com cebola.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194318/cardapio-digital-images/ukumpb7vhafiszf3xqoa.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('0c2a682c-d7be-431c-bbe3-272778671ead', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Linguiça com Mandioca', 'Linguiça grelhada acompanhada de mandioca cozida.', 35.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756577167/cardapio-digital-images/aopxsoxybwjl6i0exocb.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('f21e87e0-5177-42b7-b5e7-718711c23942', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Torresmo', 'Torresmo crocante e saboroso.', 20.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194793/cardapio-digital-images/icsrnhid61e3dxthgzmd.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('d316a68a-6a46-4811-87e8-71215e052786', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Torresmo com Mandioca', 'Torresmo crocante servido com mandioca cozida.', 35.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194825/cardapio-digital-images/ifmkb4fspxrppp1mewkw.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('6e514927-f42a-4f6c-ae14-f365de6d26df', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Torresmo de Rolo c/ Geleia de Abacaxi', 'Torresmo de rolo crocante servido com geleia agridoce de abacaxi.', 35.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753881601/cardapio-digital-images/abzk9hwdxeushanwa1iv.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('533201aa-a451-44e7-8fe0-440e8cafd425', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Filé de Tilápia', 'Delicioso filé de tilápia empanado.', 55.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751986784/cardapio-digital-images/k1yc8ywgpvk3laeln67n.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('f5c9b1d0-c2e1-4f24-986c-d4f3c7959888', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Filé de Tilápia c/ Fritas', 'Delicioso filé de tilápia empanado acompanhado de uma porção de batatas fritas.', 70.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755382203/cardapio-digital-images/zzrk1ijyhktl5b4vkbiu.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('6f85a6be-44ff-4b04-809c-e88f39d83187', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Contra Filé com Fritas', 'Suculento contra filé com porção de batatas fritas.', 70.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751989998/cardapio-digital-images/gcppvlte1jvyrsmblfbd.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('d26b098d-f971-4cfc-a734-d85b36ae8fe7', '849ef7e2-6b1b-4f63-a5b6-36ff82975e4a', 'Picanha (Porção)', 'Generosa porção de picanha grelhada.', 80.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752194714/cardapio-digital-images/wmzquc5gnsfsvtzwg091.jpg', true, false, '2025-12-24 14:13:39.109+00'),
('57203953-afeb-4675-aea6-5e5869233a37', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Calabresa', 'Calabresa, muçarela, cebola, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883504/cardapio-digital-images/st4bgqj41fhwa23t25o8.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('aaac74a2-b16b-452a-91cf-def72d932500', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Picanha (100g)', 'Corte nobre de carne, ideal para churrasco, acompanhada de farofa.', 16.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751898799/cardapio-digital-images/ulsohgajmesaj3x0y2yo.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('c5581b8d-83a3-4add-8244-f3acb8b4a749', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Contra Filé (100g)', 'Corte clássico, suculento e cheio de sabor, acompanhada de farofa.', 12.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751898924/cardapio-digital-images/zgfvutvswyvjtvhke43n.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('767a6b83-cc7d-48f4-9d2a-8a6e4cc8d8ff', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Alcatra (100g)', 'Carne macia e saborosa, perfeita para o seu churrasco, acompanhada de farofa.', 12.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751898878/cardapio-digital-images/pkwwbvq3u1sobsgvhyzv.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('13a7ecdd-6bde-4faf-b746-64c766f8bfb9', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Pernil de Porco (100g)', 'Delicioso pernil de porco, macio e bem temperado, acompanhado de farofa.', 7.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753213919/cardapio-digital-images/yjmt0uq7ujj8mhlkw5il.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('5658d5a6-d929-4982-a43b-1dd2c498f6dc', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Linguiça (Unid)', 'Linguiça suculenta, perfeita para acompanhar, acompanhada de farofa.', 5.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756577398/cardapio-digital-images/whkc64upshzximitwxwu.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('4a3ad0e3-dddd-44db-94b5-704921cf63d9', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Meio da Asa (UND)', 'Meio da asa de frango individual, crocante e saborosa, acompanhada de farofa.', 3.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753213557/cardapio-digital-images/rw5slyvtku1xm5arpapk.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('c67b98f7-88d4-46b7-ad5e-ab1d905ca02e', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Pão de Alho', 'Pão de alho caseiro, crocante por fora e macio por dentro, acompanhado de farofa.', 7.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752195085/cardapio-digital-images/djsgrewv2g5dmoayfyry.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('094321be-2f6e-4218-9ae8-6d481278bf55', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Baguete de Churrasco', 'Pão francês, maionese de alho, churrasco e muçarela. Acompanha vinagrete.', 0.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756577643/cardapio-digital-images/iannzafzzi353t947wxx.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('7e927f4f-25fd-4744-8b35-ac939fe3a6d7', 'f9c1f552-6165-4426-8b2a-f63f489f5bc6', 'Baguete de Costela', 'Pão francês, costela desfiada, cebola, catupiry e muçarela. Acompanha vinagrete.', 17.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753881894/cardapio-digital-images/tdi5n8hlmvpqoswbgdpi.jpg', true, false, '2025-12-24 14:12:04.058+00'),
('81ea3fee-eb6e-4f02-afeb-1ca67b947a5a', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'Hambúrguer', 'Pão brioche, bife caseiro. Acompanha alface, milho, tomate e batata.', 10.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756577019/cardapio-digital-images/puhgbhh84jffoa1zyj49.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('b0045ac1-f51a-4123-b8fa-3e3799c100a2', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'X Egg', 'Pão brioche, bife caseiro, ovo, queijo. Acompanha alface, milho, tomate e batata.', 14.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756815086/cardapio-digital-images/retgmoehsuqqplh3pb7n.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('b6ef2e85-c7aa-41c0-8c75-a623d32f2250', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'X Calabresa', 'Pão brioche, bife caseiro, calabresa, queijo. Acompanha alface, milho, tomate e batata.', 14.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756815064/cardapio-digital-images/mgpuedmnwopo0lrn1xea.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('5e225d17-6dc5-41ab-a387-ae1bda71dbf2', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'X Burguesunto', 'Pão brioche, bife caseiro, presunto, queijo. Acompanha alface, milho, tomate e batata.', 14.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756815044/cardapio-digital-images/bfh03xbjzi4nhm5p6pxy.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('e63f4902-c779-4095-aa5b-df0d83f0c573', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'FranBacon', 'Pão brioche, bife de frango caseiro, bacon, queijo e catupiry. Acompanha alface, milho, tomate e batata.', 15.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756576239/cardapio-digital-images/d07f9jc5vsz3trqlxcjx.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('53095f99-fe2d-42ea-8494-ced5886676bb', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'Bacon Burguer', 'Pão brioche, bife caseiro, bacon. Acompanha alface, milho, tomate e batata.', 12.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756577257/cardapio-digital-images/vsfsq2gngpgsev5sk7od.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('785ed808-a7d5-4485-ae11-d5b1d44f77b3', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'Misto', 'Pão de forma, presunto e muçarela.', 8.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1752062349/cardapio-digital-images/pwywlu6udipraobxxryz.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('500bf0cc-3d0e-47df-bc2c-f312f1b34504', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'X Burguer', 'Pão brioche, bife caseiro, queijo. Acompanha alface, milho, tomate e batata.', 11.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756815024/cardapio-digital-images/kulvvw1acthblyrazw3t.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('96f52c91-31e4-49d9-a5a6-658bf43019bd', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'X Bacon', 'Pão brioche, bife caseiro, queijo, bacon. Acompanha alface, milho, tomate e batata.', 14.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756576451/cardapio-digital-images/jyaaptdlgjffkj5aeevn.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('92e92080-fabc-47db-aaea-54e971dd313b', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'X Tudo', 'Pão brioche, bife caseiro, ovo, presunto, queijo, bacon. Acompanha alface, milho, tomate e batata.', 18.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883446/cardapio-digital-images/gnmxariy70iqhek01jlq.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('45d8c886-7204-4034-a1f5-77b550bf1c13', '2b60edd5-84e9-423e-9721-33d8d5ca6adf', 'Americano', 'Pão brioche, bife caseiro, ovo, queijo, bacon. Acompanha alface, milho, tomate e batata.', 15.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1756576165/cardapio-digital-images/va7pk7w4oj0xvvu2a2vq.jpg', true, false, '2025-12-24 14:12:29.126+00'),
('04abe2e2-53fc-46c8-8de4-9eaa05fe072d', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Camarão', 'Muçarela, camarão, catupiry alho frito, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1751899100/cardapio-digital-images/nqsziumwawfzvr9wczxi.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('95e0cd69-fd27-4d94-90a0-c76428ea5a22', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Carne Seca', 'Muçarela, carne seca, catupiry cebola, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753883540/cardapio-digital-images/evgagksdzyjfq0he2evk.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('39ca8fc7-287e-444e-b481-0b840baa7f91', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Costela', 'Muçarela, costela, catupiry cebola, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381581/cardapio-digital-images/fth1oejkwavmk8segpvw.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('2faf7c3a-fb95-4746-83c0-36ae5b35aaf3', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Americana', 'Muçarela, cheddar, tomate, pimentão, cream cheese, azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381422/cardapio-digital-images/aor1ki9pjxdmmbxqoz2o.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('50f1cc36-d138-40f5-bbbd-1fb71a72db28', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Italiana', 'Muçarela, salaminho, azeitona, cebola e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753538129/cardapio-digital-images/alipg2ejtddwas7dzg08.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('d76d1267-cb23-47e7-9437-3c8c7c030770', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Bacon', 'Bacon, muçarela, tomate azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381509/cardapio-digital-images/bzeewqoz4giu1w006g9t.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('9d30f96f-89a3-4151-8e6f-e5aec5d05ec8', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Lombo', 'Muçarela, lombo canadense, catupiry azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1755381793/cardapio-digital-images/kc1ohablbqsivxeo9kyw.jpg', true, false, '2025-12-24 14:15:20.208+00'),
('ba3b575c-1957-413d-bc39-b9bcd6a2e90c', '27a1e7a7-155b-4fb3-ac2d-56f56cfde527', 'Pizza Palmito', 'Muçarela, palmito, catupiry azeitona e orégano.', 30.00, 'https://res.cloudinary.com/dbes24whl/image/upload/v1753214077/cardapio-digital-images/yw3mqyqtcdmevqcgzxuo.jpg', true, false, '2025-12-24 14:15:20.208+00');

-- Variações (Dados do seu backup CSV)
INSERT INTO public.product_variations (id, product_id, name, price, sort_order, is_active, created_at) VALUES
('04e5f287-47a6-412f-9aed-46c1b4781784', '57203953-afeb-4675-aea6-5e5869233a37', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('39cd8d91-3300-4d77-a073-f01f7402c811', '57203953-afeb-4675-aea6-5e5869233a37', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('b4943e79-14e9-4a1c-bfb9-8286c6f5e4b5', '57203953-afeb-4675-aea6-5e5869233a37', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('9cc5470d-4a29-4acc-bf40-805fcaa7e943', '04abe2e2-53fc-46c8-8de4-9eaa05fe072d', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('e829beec-b8cc-4201-b95f-f698eb14a1c8', '04abe2e2-53fc-46c8-8de4-9eaa05fe072d', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('271267dd-2ab7-44a9-b8dc-01360c8e98e5', '04abe2e2-53fc-46c8-8de4-9eaa05fe072d', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('d2e21579-6c64-4d74-ad15-91afc747f8b7', '95e0cd69-fd27-4d94-90a0-c76428ea5a22', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('f814a21b-beb7-4294-8219-c8e2c280af63', '95e0cd69-fd27-4d94-90a0-c76428ea5a22', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('82238fa6-87bd-417e-99da-1a9e2608af86', '95e0cd69-fd27-4d94-90a0-c76428ea5a22', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('229f84d1-94fd-40d7-a7d9-cfc7ee786c76', '39ca8fc7-287e-444e-b481-0b840baa7f91', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('2d7b5860-b50c-4493-81d8-3d9673444365', '39ca8fc7-287e-444e-b481-0b840baa7f91', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('556f75f8-688c-45cc-8f25-b27e2763602b', '39ca8fc7-287e-444e-b481-0b840baa7f91', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('069a1b75-99aa-47ac-aa51-cf457a5079bc', '2faf7c3a-fb95-4746-83c0-36ae5b35aaf3', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('4e900631-07da-4d61-ac92-446a5a2af084', '2faf7c3a-fb95-4746-83c0-36ae5b35aaf3', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('cef87723-441a-4afc-bcbc-da2f03402fc4', '2faf7c3a-fb95-4746-83c0-36ae5b35aaf3', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('5be4272f-2123-4f56-a9aa-bc93e6fa06d6', '50f1cc36-d138-40f5-bbbd-1fb71a72db28', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('7c7e0f2c-7ce0-4c9b-8ea9-d74b2b3b04ee', '50f1cc36-d138-40f5-bbbd-1fb71a72db28', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('01118d90-6171-429f-98e9-cddb7f246ac2', '50f1cc36-d138-40f5-bbbd-1fb71a72db28', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('daaae34e-3cb1-4e38-a0cd-40a3dcf5fed7', 'd76d1267-cb23-47e7-9437-3c8c7c030770', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('ade1162c-d1e9-4217-b432-7c2b9d388ab9', 'd76d1267-cb23-47e7-9437-3c8c7c030770', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('755cb000-426c-4e0c-b708-7d31da16a427', 'd76d1267-cb23-47e7-9437-3c8c7c030770', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('01431518-beca-4bc8-9842-3f9c92ac7924', '9d30f96f-89a3-4151-8e6f-e5aec5d05ec8', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('6f71a66b-6696-4564-9d5b-0a096134f4f6', '9d30f96f-89a3-4151-8e6f-e5aec5d05ec8', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('6331fcb7-b58e-431b-b6eb-f371fe5a55be', '9d30f96f-89a3-4151-8e6f-e5aec5d05ec8', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('b06ce033-1d21-4518-bc1a-68a53fbd7d7d', 'ba3b575c-1957-413d-bc39-b9bcd6a2e90c', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('8a99b96e-6d35-4180-911e-1ce4dff688d1', 'ba3b575c-1957-413d-bc39-b9bcd6a2e90c', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('cb5b633d-3993-4129-8a56-cccda1b401f5', 'ba3b575c-1957-413d-bc39-b9bcd6a2e90c', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('a653cf91-d934-4a00-a5d3-7c402f75d3f5', 'feebf8ac-68f5-4eaf-8f0f-bb94cb220013', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('f63085bb-bc78-4518-a03d-e713fd69e525', 'feebf8ac-68f5-4eaf-8f0f-bb94cb220013', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('494a27a3-82b3-4a23-89dc-a9811b0527ea', 'feebf8ac-68f5-4eaf-8f0f-bb94cb220013', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('2435893b-0974-417d-b07c-e620bf530dd1', 'a4bc363d-7bb3-4363-b393-f2ecefc6e09f', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('8c58c3c6-6831-4383-b439-ae12cbddc3a9', 'a4bc363d-7bb3-4363-b393-f2ecefc6e09f', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('12f5858e-49a2-4e7d-8489-73a80e7679a0', 'a4bc363d-7bb3-4363-b393-f2ecefc6e09f', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('de277059-b091-46a2-9ce2-4edab161c974', 'e20c7c44-b35c-4b2a-800b-a5f14379d1c2', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('84a1fa42-7573-4370-b19d-1e6d1155354d', 'e20c7c44-b35c-4b2a-800b-a5f14379d1c2', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('85d1d47d-75f2-4652-9939-895f065ee56b', 'e20c7c44-b35c-4b2a-800b-a5f14379d1c2', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('66f527fe-eba3-4eaa-b187-db394feda93f', '18497416-c492-46cb-a690-ecb0a4f78fc0', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('348ac962-25ae-47cf-8b5e-ded8b7a3fc82', '18497416-c492-46cb-a690-ecb0a4f78fc0', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('178f5048-15ce-4f8f-aafa-2caf1ce249a3', '18497416-c492-46cb-a690-ecb0a4f78fc0', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('b19eac19-9be4-4b5b-a2ea-de1a613806a9', '587390c0-8ac8-43a4-ba16-4708a734f77d', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('892acd23-e556-4298-8dcb-8ee4cd7265c3', '587390c0-8ac8-43a4-ba16-4708a734f77d', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('8b14ef2a-919f-4477-83d6-513b242f336f', '587390c0-8ac8-43a4-ba16-4708a734f77d', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('e876d1c9-6c1d-4325-a93f-c8b9fad042eb', '77c5da13-f382-4272-9ff9-df5c4c798318', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('22c8ef40-e0b6-416d-8cfa-29ae1e68f59c', '77c5da13-f382-4272-9ff9-df5c4c798318', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('323428aa-cbd2-48eb-975f-e71974eb60bb', '77c5da13-f382-4272-9ff9-df5c4c798318', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('f92226b1-3292-419d-b906-6084b5fefda9', '0ee2b4b8-d67a-4d50-86a5-e8291e9d9c6e', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('c95af6a1-7050-4236-a4e2-93e771628ff2', '0ee2b4b8-d67a-4d50-86a5-e8291e9d9c6e', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('a15d0616-8512-4a9f-82b2-3d277af086c3', '0ee2b4b8-d67a-4d50-86a5-e8291e9d9c6e', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('d2abdd90-5fb1-494e-b1ac-c6901e6d6153', '745222a0-f421-4dfa-9144-0a6c7336ac65', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('779afefa-e1f0-417d-a7a9-f3193521bcc2', '745222a0-f421-4dfa-9144-0a6c7336ac65', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('2ca743a0-0d75-4e78-a77a-1be62f85dece', '745222a0-f421-4dfa-9144-0a6c7336ac65', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('5c385baa-a967-4901-8d22-87b9c8290bbc', '0b80ccba-fe36-49a0-a704-9b5bbba847c0', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('54e2dc89-bba7-4bdb-ba0f-ba1770c81b28', '0b80ccba-fe36-49a0-a704-9b5bbba847c0', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('16806f25-f51e-4de9-a42d-9395952a814e', '0b80ccba-fe36-49a0-a704-9b5bbba847c0', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('fe082cb1-bb0d-4a76-bead-21e677512f73', 'c3e75c25-aaca-4761-9e7f-2505ffa7d82f', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('d5d68234-cc2c-46c4-91ab-5530c78f34d3', 'c3e75c25-aaca-4761-9e7f-2505ffa7d82f', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('741b8e00-cf37-41e1-8917-4c5a1eda9fc2', 'c3e75c25-aaca-4761-9e7f-2505ffa7d82f', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('36396874-e103-4e24-b624-110c2b0a4853', '1b9f33da-18d6-402c-aeae-2b759ea408a1', 'Pequena', 30, 1, true, '2025-12-24 14:26:15.959+00'),
('21247049-e710-445b-85ae-354cff40514c', '1b9f33da-18d6-402c-aeae-2b759ea408a1', 'Média', 35, 2, true, '2025-12-24 14:26:15.959+00'),
('86b16da1-e6fe-4e4f-80bb-5c1aaf21a663', '1b9f33da-18d6-402c-aeae-2b759ea408a1', 'Grande', 40, 3, true, '2025-12-24 14:26:15.959+00'),
('13ee5645-6ac5-4755-8b40-3086ba6fecb2', '094321be-2f6e-4218-9ae8-6d481278bf55', '1 Espetinho de Boi', 15, 1, true, '2025-12-24 14:26:15.959+00'),
('cde5fc27-6661-47a8-917d-aede40e6dc87', '094321be-2f6e-4218-9ae8-6d481278bf55', '1 Espetinho de Frango', 15, 2, true, '2025-12-24 14:26:15.959+00'),
('8ef073bc-75d8-46ac-9cd3-2ec756d3b810', '094321be-2f6e-4218-9ae8-6d481278bf55', '2 Espetinhos de Boi', 20, 3, true, '2025-12-24 14:26:15.959+00'),
('9a0a07ff-7ce5-4778-b060-84c28d657a3f', '094321be-2f6e-4218-9ae8-6d481278bf55', '2 Espetinhos de Frango', 20, 4, true, '2025-12-24 14:26:15.959+00'),
('a884db82-2991-42f6-bf42-2151a692c59d', '094321be-2f6e-4218-9ae8-6d481278bf55', '1 Espet. Boi + Frango', 20, 5, true, '2025-12-24 14:26:15.959+00'),
('c6514716-5d68-4f20-aacf-431631abdc7c', 'e0ce69ba-c028-4749-817c-abbdf2c4112b', 'H2O', 6, 1, true, '2025-12-24 14:26:15.959+00'),
('c14975ca-e006-43c8-b59a-68a9678ced63', 'e0ce69ba-c028-4749-817c-abbdf2c4112b', 'Limoneto', 6, 2, true, '2025-12-24 14:26:15.959+00'),
('1884992f-b763-4142-8581-8bb9fe12bf0f', '3351a034-16b9-4f4e-b688-de0969ec0a66', 'Suco Laranja', 8, 1, true, '2025-12-24 14:26:15.959+00'),
('b1367617-70d2-4843-918d-5840c83a59bc', '3351a034-16b9-4f4e-b688-de0969ec0a66', 'Suco Limão', 8, 2, true, '2025-12-24 14:26:15.959+00');

SELECT '✅ SUCESSO: Banco de dados restaurado e populado com todos os produtos e variações!' as status;