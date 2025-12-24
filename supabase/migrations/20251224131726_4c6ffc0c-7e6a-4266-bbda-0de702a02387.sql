-- Create table for product variations (pizza sizes)
CREATE TABLE public.product_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'Pequena', 'Média', 'Grande'
  price NUMERIC NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active variations" 
ON public.product_variations 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage variations" 
ON public.product_variations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));