-- Fix order creation for public checkout (no login)
-- Ensure anon/authenticated can INSERT into public.orders without needing SELECT access.

DO $$
BEGIN
  -- Drop existing policy if it exists (name may vary)
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'Anyone can create orders'
  ) THEN
    EXECUTE 'DROP POLICY "Anyone can create orders" ON public.orders';
  END IF;
END $$;

CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
