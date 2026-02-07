-- Crear tipos ENUM para archivos de creativos
CREATE TYPE creative_file_type AS ENUM ('imagen', 'video');
CREATE TYPE creative_file_role AS ENUM ('principal', 'variacion', 'referencia');
CREATE TYPE creative_file_status AS ENUM ('borrador', 'publicado', 'descartado');

-- Crear tabla de archivos
CREATE TABLE creative_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID NOT NULL REFERENCES creatives(id) ON DELETE CASCADE,
  
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type creative_file_type NOT NULL,
  file_role creative_file_role NOT NULL DEFAULT 'principal',
  status creative_file_status NOT NULL DEFAULT 'borrador',
  
  channel_used TEXT,
  notes TEXT,
  
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE creative_files ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Authenticated can view creative files" 
ON creative_files FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert creative files" 
ON creative_files FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update creative files" 
ON creative_files FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete creative files" 
ON creative_files FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_creative_files_updated_at
  BEFORE UPDATE ON creative_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índice para consultas
CREATE INDEX idx_creative_files_creative_id ON creative_files(creative_id);