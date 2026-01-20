-- Crear ENUMs para creativos inteligentes
CREATE TYPE public.creative_type AS ENUM ('imagen', 'video', 'copy');
CREATE TYPE public.creative_channel AS ENUM ('whatsapp', 'instagram', 'tiktok', 'facebook', 'web');
CREATE TYPE public.creative_objective AS ENUM ('vender', 'atraer', 'probar');
CREATE TYPE public.creative_status AS ENUM ('pendiente', 'generando', 'generado', 'publicado', 'descartado');
CREATE TYPE public.creative_result AS ENUM ('sin_evaluar', 'funciono', 'no_funciono');

-- Crear tabla de creativos inteligentes
CREATE TABLE public.creatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  type creative_type NOT NULL DEFAULT 'imagen',
  channel creative_channel NOT NULL DEFAULT 'instagram',
  objective creative_objective NOT NULL DEFAULT 'vender',
  status creative_status NOT NULL DEFAULT 'pendiente',
  result creative_result NOT NULL DEFAULT 'sin_evaluar',
  
  -- Contenido generado
  title TEXT,
  copy TEXT,
  image_url TEXT,
  video_url TEXT,
  script TEXT,
  
  -- Metadatos
  learning TEXT,
  ai_prompt TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view creatives" 
ON public.creatives FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert creatives" 
ON public.creatives FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update creatives" 
ON public.creatives FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete creatives" 
ON public.creatives FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_creatives_updated_at
BEFORE UPDATE ON public.creatives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();