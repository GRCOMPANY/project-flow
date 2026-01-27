-- Enum para resultados de cierre de tarea
CREATE TYPE task_outcome_result AS ENUM (
  'exitoso',
  'fallido', 
  'reprogramado',
  'cancelado'
);

-- Tabla de resultados de tareas
CREATE TABLE public.task_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL UNIQUE REFERENCES public.tasks(id) ON DELETE CASCADE,
  
  -- Resultado operativo
  result task_outcome_result NOT NULL,
  
  -- Impacto económico
  generated_income BOOLEAN NOT NULL DEFAULT false,
  income_amount NUMERIC DEFAULT 0,
  
  -- Nota
  notes TEXT,
  
  -- Metadata
  completed_by UUID,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_task_outcomes_task_id ON public.task_outcomes(task_id);
CREATE INDEX idx_task_outcomes_result ON public.task_outcomes(result);
CREATE INDEX idx_task_outcomes_completed_at ON public.task_outcomes(completed_at);
CREATE INDEX idx_task_outcomes_generated_income ON public.task_outcomes(generated_income);

-- Habilitar RLS
ALTER TABLE public.task_outcomes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view outcomes"
  ON public.task_outcomes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert outcomes"
  ON public.task_outcomes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update outcomes"
  ON public.task_outcomes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));