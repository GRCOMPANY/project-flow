-- Fase 1: Crear enum sale_type y agregar columna a sales

-- Crear el tipo enum para tipo de venta
CREATE TYPE sale_type AS ENUM ('directa', 'revendedor');

-- Agregar columna sale_type a la tabla sales
ALTER TABLE sales ADD COLUMN sale_type sale_type NOT NULL DEFAULT 'revendedor';

-- Migrar datos existentes basándose en si tienen seller_id o no
UPDATE sales 
SET sale_type = CASE 
  WHEN seller_id IS NOT NULL THEN 'revendedor'::sale_type
  ELSE 'directa'::sale_type
END;

-- Agregar comentario descriptivo
COMMENT ON COLUMN sales.sale_type IS 'Tipo de venta: directa (cliente final) o revendedor (mayorista). Campo obligatorio que gobierna la lógica de precios y métricas.';