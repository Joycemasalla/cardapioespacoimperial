-- Create category_addons table for product add-ons
CREATE TABLE public.category_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_addons ENABLE ROW LEVEL SECURITY;

-- Anyone can view active addons
CREATE POLICY "Anyone can view active addons"
ON public.category_addons
FOR SELECT
USING (is_active = true);

-- Admins can manage addons
CREATE POLICY "Admins can manage addons"
ON public.category_addons
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add operating hours and maintenance mode to settings
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS opening_time TEXT DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS closing_time TEXT DEFAULT '23:30',
ADD COLUMN IF NOT EXISTS closed_message TEXT DEFAULT 'Estamos fechados no momento. Volte no nosso horário de funcionamento!',
ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_category_addons_category_id ON public.category_addons(category_id);
CREATE INDEX IF NOT EXISTS idx_category_addons_is_active ON public.category_addons(is_active);