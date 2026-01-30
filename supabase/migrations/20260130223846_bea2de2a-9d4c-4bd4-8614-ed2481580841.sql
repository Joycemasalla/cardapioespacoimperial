-- =============================================
-- CORREÇÃO COMPLETA DE SEGURANÇA E PERFORMANCE RLS
-- =============================================

-- =============================================
-- PARTE 1: REMOVER POLICIES EXISTENTES
-- =============================================

-- orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;

-- products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- product_variations
DROP POLICY IF EXISTS "Admins can manage variations" ON public.product_variations;
DROP POLICY IF EXISTS "Anyone can view active variations" ON public.product_variations;

-- category_addons
DROP POLICY IF EXISTS "Admins can manage addons" ON public.category_addons;
DROP POLICY IF EXISTS "Anyone can view active addons" ON public.category_addons;

-- promotions
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;
DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.promotions;

-- settings
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.settings;

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- =============================================
-- PARTE 2: FUNÇÃO OTIMIZADA PARA VERIFICAR ADMIN
-- (já existe, mas vamos garantir que está otimizada)
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =============================================
-- PARTE 3: CRIAR POLICIES OTIMIZADAS E SEGURAS
-- =============================================

-- =============================================
-- ORDERS - CORRIGIDO (era WITH CHECK (true))
-- =============================================

-- INSERT: Qualquer pessoa pode criar pedidos (anônimo ou autenticado)
-- Isso é necessário pois clientes não precisam de conta para pedir
-- A segurança está em não permitir SELECT/UPDATE/DELETE para anônimos
CREATE POLICY "orders_insert_public"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Validação: campos obrigatórios devem estar preenchidos
  customer_name IS NOT NULL 
  AND customer_phone IS NOT NULL 
  AND items IS NOT NULL 
  AND total > 0
);

-- SELECT: Apenas admins podem ver pedidos
CREATE POLICY "orders_select_admin"
ON public.orders
FOR SELECT
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role));

-- UPDATE: Apenas admins podem atualizar pedidos
CREATE POLICY "orders_update_admin"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

-- =============================================
-- CATEGORIES - OTIMIZADO
-- =============================================

-- SELECT público: qualquer um pode ver categorias ativas
CREATE POLICY "categories_select_public"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- SELECT admin: admins podem ver todas as categorias
CREATE POLICY "categories_select_admin"
ON public.categories
FOR SELECT
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role));

-- INSERT/UPDATE/DELETE admin
CREATE POLICY "categories_insert_admin"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "categories_update_admin"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "categories_delete_admin"
ON public.categories
FOR DELETE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role));

-- =============================================
-- PRODUCTS - OTIMIZADO
-- =============================================

CREATE POLICY "products_select_public"
ON public.products
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "products_select_admin"
ON public.products
FOR SELECT
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "products_insert_admin"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "products_update_admin"
ON public.products
FOR UPDATE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "products_delete_admin"
ON public.products
FOR DELETE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role));

-- =============================================
-- PRODUCT_VARIATIONS - OTIMIZADO
-- =============================================

CREATE POLICY "variations_select_public"
ON public.product_variations
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "variations_select_admin"
ON public.product_variations
FOR SELECT
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "variations_insert_admin"
ON public.product_variations
FOR INSERT
TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "variations_update_admin"
ON public.product_variations
FOR UPDATE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "variations_delete_admin"
ON public.product_variations
FOR DELETE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role));

-- =============================================
-- CATEGORY_ADDONS - OTIMIZADO
-- =============================================

CREATE POLICY "addons_select_public"
ON public.category_addons
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "addons_select_admin"
ON public.category_addons
FOR SELECT
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "addons_insert_admin"
ON public.category_addons
FOR INSERT
TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "addons_update_admin"
ON public.category_addons
FOR UPDATE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "addons_delete_admin"
ON public.category_addons
FOR DELETE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role));

-- =============================================
-- PROMOTIONS - OTIMIZADO
-- =============================================

CREATE POLICY "promotions_select_public"
ON public.promotions
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "promotions_select_admin"
ON public.promotions
FOR SELECT
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "promotions_insert_admin"
ON public.promotions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "promotions_update_admin"
ON public.promotions
FOR UPDATE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "promotions_delete_admin"
ON public.promotions
FOR DELETE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role));

-- =============================================
-- SETTINGS - OTIMIZADO
-- =============================================

CREATE POLICY "settings_select_public"
ON public.settings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "settings_update_admin"
ON public.settings
FOR UPDATE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "settings_insert_admin"
ON public.settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "settings_delete_admin"
ON public.settings
FOR DELETE
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::app_role));

-- =============================================
-- PROFILES - OTIMIZADO
-- =============================================

CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING ((select auth.uid()) = id);

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- =============================================
-- USER_ROLES - OTIMIZADO
-- =============================================

CREATE POLICY "user_roles_select_own"
ON public.user_roles
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);