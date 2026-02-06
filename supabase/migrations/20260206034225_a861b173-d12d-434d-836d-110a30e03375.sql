-- ================================================
-- RESELLER MODEL MIGRATION
-- Transforms system from commission-based to wholesale model
-- ================================================

-- 1. Add type column to sellers table
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS type text DEFAULT 'revendedor';

-- Add comment to mark commission as deprecated
COMMENT ON COLUMN sellers.commission IS 'DEPRECATED - Reseller model does not use commission. Kept for data migration safety.';

-- 2. Add reseller pricing columns to sales table
-- reseller_price: Price you sell to the reseller (your revenue)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS reseller_price numeric DEFAULT 0;

-- final_price: Optional price reseller sells to end customer (informational)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS final_price numeric DEFAULT 0;

-- reseller_profit: Calculated informational field (final_price - reseller_price)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS reseller_profit numeric DEFAULT 0;

-- 3. Migrate existing data: copy unit_price to reseller_price for existing sales
UPDATE sales 
SET reseller_price = unit_price 
WHERE reseller_price = 0 AND unit_price > 0;

-- 4. Add comments for clarity
COMMENT ON COLUMN sales.cost_at_sale IS 'Product cost at time of sale (China + import). Frozen for audit.';
COMMENT ON COLUMN sales.reseller_price IS 'Price sold to reseller. Your revenue per unit.';
COMMENT ON COLUMN sales.final_price IS 'Optional: Price reseller sells to end customer. Informational only.';
COMMENT ON COLUMN sales.reseller_profit IS 'Calculated: final_price - reseller_price. Informational only.';
COMMENT ON COLUMN sales.margin_at_sale IS 'Your profit per unit: reseller_price - cost_at_sale';
COMMENT ON COLUMN sales.margin_percent_at_sale IS 'Your margin percentage: ((reseller_price - cost) / cost) * 100';