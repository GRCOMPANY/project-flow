
-- Add images array column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Recreate view to include images
DROP VIEW IF EXISTS public.products_seller_view;
CREATE VIEW public.products_seller_view 
WITH (security_invoker = true) AS
SELECT 
  id, name, sku, category, status, 
  wholesale_price, suggested_price as retail_price,
  image_url, images,
  description, is_featured,
  main_channel, delivery_type,
  created_at, updated_at
FROM public.products
WHERE status = 'activo';
