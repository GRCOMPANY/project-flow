
-- Enum para origen de venta
CREATE TYPE sale_source AS ENUM ('digital', 'presencial');

-- Nuevos campos en tabla sales
ALTER TABLE sales ADD COLUMN sale_source sale_source NOT NULL DEFAULT 'digital';
ALTER TABLE sales ADD COLUMN my_percentage numeric NOT NULL DEFAULT 100;
ALTER TABLE sales ADD COLUMN partner_percentage numeric NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN my_profit_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN partner_profit_amount numeric NOT NULL DEFAULT 0;
