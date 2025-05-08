-- Este script debe ejecutarse en el Editor SQL de Supabase
-- Puedes acceder a él desde el panel de administración en https://app.supabase.com

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  product_code TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" 
  ON public.orders FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders" 
  ON public.orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders" 
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for order_items table
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
CREATE POLICY "Users can view their order items" 
  ON public.order_items FOR SELECT 
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Users can insert order items" 
  ON public.order_items FOR INSERT 
  WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- Allow service role (admin) to manage all orders and items
DROP POLICY IF EXISTS "Service role can manage all orders" ON public.orders;
CREATE POLICY "Service role can manage all orders" 
  ON public.orders FOR ALL 
  USING (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

DROP POLICY IF EXISTS "Service role can manage all order items" ON public.order_items;
CREATE POLICY "Service role can manage all order items" 
  ON public.order_items FOR ALL 
  USING (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false);

-- Grant permissions on the tables
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role; 