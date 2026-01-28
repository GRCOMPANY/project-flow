-- Crear enum para estados operativos de venta
CREATE TYPE operational_status AS ENUM (
  'nuevo',
  'contactado',
  'confirmado',
  'sin_respuesta',
  'en_ruta',
  'entregado',
  'riesgo_devolucion'
);

-- Agregar columna de estado operativo a sales
ALTER TABLE sales ADD COLUMN operational_status operational_status DEFAULT 'nuevo';

-- Agregar campo para tracking de fecha de cambio de estado
ALTER TABLE sales ADD COLUMN status_updated_at TIMESTAMPTZ DEFAULT now();

-- Índice para consultas de seguimiento
CREATE INDEX idx_sales_operational_status ON sales(operational_status);

-- Índice para consultas por fecha de estado
CREATE INDEX idx_sales_status_updated_at ON sales(status_updated_at);