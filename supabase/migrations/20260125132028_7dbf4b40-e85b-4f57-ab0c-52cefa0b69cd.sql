-- Corregir problema de seguridad: Recrear vista sin SECURITY DEFINER
DROP VIEW IF EXISTS public.products_seller_view;

-- Crear vista normal (sin SECURITY DEFINER) que respeta RLS del usuario que consulta
CREATE VIEW public.products_seller_view 
WITH (security_invoker = true) AS
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