-- ============================================
-- GRC IMPORTACIONES OPERATING SYSTEM
-- Phase 2: Vendedores + Ventas
-- ============================================

-- 1. ENUM para estado de vendedor
CREATE TYPE public.seller_status AS ENUM ('activo', 'inactivo');

-- 2. ENUM para estado de pago
CREATE TYPE public.payment_status AS ENUM ('pendiente', 'pagado');

-- 3. TABLA DE VENDEDORES
CREATE TABLE public.sellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  commission NUMERIC DEFAULT 0,
  status seller_status NOT NULL DEFAULT 'activo',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_sellers_updated_at
  BEFORE UPDATE ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para vendedores
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sellers"
  ON public.sellers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert sellers"
  ON public.sellers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sellers"
  ON public.sellers FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sellers"
  ON public.sellers FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. TABLA DE VENTAS
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL,
  client_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status payment_status NOT NULL DEFAULT 'pendiente',
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para ventas
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sales"
  ON public.sales FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert sales"
  ON public.sales FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sales"
  ON public.sales FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sales"
  ON public.sales FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));