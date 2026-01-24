-- Agregar teléfono del cliente y canal de venta a la tabla sales
ALTER TABLE public.sales 
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS sales_channel TEXT DEFAULT 'whatsapp';