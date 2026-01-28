-- Fase 1: Congelado Financiero de Ventas
-- Agregar campos para congelar datos financieros al momento de la venta

-- Campos financieros congelados
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cost_at_sale NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS margin_at_sale NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS margin_percent_at_sale NUMERIC DEFAULT 0;

-- Relación con creativo que originó la venta
ALTER TABLE sales ADD COLUMN IF NOT EXISTS related_creative_id UUID REFERENCES creatives(id) ON DELETE SET NULL;

-- Índice para consultas de rentabilidad
CREATE INDEX IF NOT EXISTS idx_sales_margin_at_sale ON sales(margin_at_sale);
CREATE INDEX IF NOT EXISTS idx_sales_related_creative_id ON sales(related_creative_id);

-- Comentarios para documentación
COMMENT ON COLUMN sales.cost_at_sale IS 'Costo del producto congelado al momento de la venta';
COMMENT ON COLUMN sales.margin_at_sale IS 'Margen calculado y congelado (unit_price - cost_at_sale)';
COMMENT ON COLUMN sales.margin_percent_at_sale IS 'Porcentaje de margen congelado';
COMMENT ON COLUMN sales.related_creative_id IS 'Creativo que originó esta venta (si aplica)';