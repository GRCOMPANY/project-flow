-- ===========================================
-- MÓDULO DEFINITIVO DE TAREAS PARA ECOMMERCE
-- ===========================================

-- 1. Nuevos tipos ENUM para operación real
-- -----------------------------------------

-- Tipo de tarea por impacto operativo
CREATE TYPE task_type AS ENUM (
  'cobro',
  'seguimiento_venta',
  'creativo',
  'operacion',
  'estrategia'
);

-- Impacto económico de la tarea
CREATE TYPE task_impact AS ENUM (
  'dinero',
  'crecimiento',
  'operacion'
);

-- 2. Agregar nuevas columnas a la tabla tasks
-- -------------------------------------------

-- Tipo de tarea
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type task_type;

-- Impacto económico
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS impact task_impact;

-- Contexto operativo (CRÍTICO: explica el "por qué")
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS trigger_reason TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS consequence TEXT;

-- Acción sugerida
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS action_label TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS action_path TEXT;

-- Datos adicionales en formato JSON
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}';

-- Resolución de tareas
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS resolved_by UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Clave de deduplicación para tareas automáticas (UNIQUE para evitar duplicados)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dedup_key TEXT;

-- Agregar constraint UNIQUE para dedup_key (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_dedup_key_unique'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_dedup_key_unique UNIQUE (dedup_key);
  END IF;
END $$;

-- 3. Índices para performance
-- ---------------------------

CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_impact ON tasks(impact);
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source);
CREATE INDEX IF NOT EXISTS idx_tasks_dedup_key ON tasks(dedup_key);
CREATE INDEX IF NOT EXISTS idx_tasks_resolved_at ON tasks(resolved_at);
CREATE INDEX IF NOT EXISTS idx_tasks_created_status ON tasks(created_at, status);

-- 4. Actualizar valores por defecto para columnas existentes
-- ----------------------------------------------------------

-- Establecer valores por defecto para tareas existentes sin tipo
UPDATE tasks SET type = 'operacion' WHERE type IS NULL;
UPDATE tasks SET impact = 'operacion' WHERE impact IS NULL;
UPDATE tasks SET trigger_reason = 'Tarea creada manualmente' WHERE trigger_reason IS NULL AND source = 'manual';
UPDATE tasks SET action_label = 'Completar' WHERE action_label IS NULL;