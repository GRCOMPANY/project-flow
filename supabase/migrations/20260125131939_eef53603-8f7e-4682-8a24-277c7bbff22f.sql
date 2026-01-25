-- Fase 1: Migración de Base de Datos para Módulo de Productos

-- 1. Agregar nuevas columnas
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS main_channel TEXT DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'contra_entrega',
  ADD COLUMN IF NOT EXISTS auto_promote BOOLEAN DEFAULT false;

-- 2. Migrar datos existentes: supplier_price → cost_price conceptualmente
-- No renombramos la columna para mantener compatibilidad, pero usaremos supplier_price como cost_price

-- 3. Actualizar wholesale_price con un valor inicial basado en el cost + 30% margen
UPDATE public.products 
SET wholesale_price = COALESCE(supplier_price, 0) * 1.3
WHERE wholesale_price = 0 OR wholesale_price IS NULL;

-- 4. Agregar constraint UNIQUE para SKU (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_sku_unique'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT products_sku_unique UNIQUE (sku);
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    -- Si hay SKUs duplicados, no podemos agregar el constraint
    RAISE NOTICE 'Cannot add unique constraint: duplicate SKU values exist';
END $$;

-- 5. Crear vista segura para vendedores (sin costos)
CREATE OR REPLACE VIEW public.products_seller_view AS
SELECT 
  id, 
  name, 
  sku, 
  category, 
  status, 
  wholesale_price, 
  suggested_price as retail_price,
  image_url, 
  description, 
  is_featured,
  main_channel, 
  delivery_type,
  created_at,
  updated_at
FROM public.products
WHERE status = 'activo';