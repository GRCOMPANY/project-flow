-- ============================================
-- GRC IMPORTACIONES OPERATING SYSTEM
-- Phase 1: Proveedores + Extensión Productos
-- ============================================

-- 1. ENUM para estado de producto
CREATE TYPE public.product_status AS ENUM ('activo', 'pausado', 'agotado');

-- 2. TABLA DE PROVEEDORES
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  conditions TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para proveedores
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view suppliers"
  ON public.suppliers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update suppliers"
  ON public.suppliers FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete suppliers"
  ON public.suppliers FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. EXTENDER TABLA PRODUCTS
ALTER TABLE public.products
  ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN supplier_price NUMERIC DEFAULT 0,
  ADD COLUMN suggested_price NUMERIC DEFAULT 0,
  ADD COLUMN status product_status NOT NULL DEFAULT 'activo',
  ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN category TEXT,
  ADD COLUMN internal_notes TEXT,
  ADD COLUMN sku TEXT;