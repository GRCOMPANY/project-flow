-- Agregar campos faltantes a creatives para el sistema de experimentos comerciales
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS publication_reference text;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS cta_text text;

-- Comentarios descriptivos
COMMENT ON COLUMN creatives.publication_reference IS 
  'Referencia de publicación: ej. "Historia IG 06/02", "Post FB"';
COMMENT ON COLUMN creatives.cta_text IS 
  'Call to Action principal del creativo';

-- Crear bucket para creativos si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('creatives', 'creatives', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para creativos
CREATE POLICY "Allow public read access to creatives" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'creatives');

CREATE POLICY "Allow authenticated uploads to creatives" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'creatives');

CREATE POLICY "Allow authenticated updates to creatives" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'creatives');

CREATE POLICY "Allow authenticated deletes from creatives" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'creatives');