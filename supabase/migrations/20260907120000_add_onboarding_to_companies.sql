
-- Add onboarding JSONB column to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS onboarding JSONB DEFAULT NULL;

-- Update register_company RPC to initialize onboarding on company creation
CREATE OR REPLACE FUNCTION public.register_company(
  p_user_id   UUID,
  p_name      TEXT,
  p_wa_number TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id uuid;
  v_base_slug  text;
  v_slug       text;
  v_counter    int := 0;
BEGIN
  v_base_slug := lower(regexp_replace(
    regexp_replace(trim(p_name), '[^a-zA-Z0-9\s]', '', 'g'),
    '\s+', '-', 'g'
  ));
  v_slug := v_base_slug;

  WHILE EXISTS (SELECT 1 FROM companies WHERE slug = v_slug) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter;
  END LOOP;

  INSERT INTO companies (name, owner_user_id, slug, activo, plan, onboarding)
  VALUES (
    p_name,
    p_user_id,
    v_slug,
    true,
    'free',
    jsonb_build_object(
      'steps', jsonb_build_object(
        'empresa',  true,
        'tienda',   false,
        'producto', false,
        'tarea',    false,
        'link',     false
      ),
      'completedAt', null,
      'dismissed',   false
    )
  )
  RETURNING id INTO v_company_id;

  INSERT INTO company_users (company_id, user_id, role)
  VALUES (v_company_id, p_user_id, 'admin');

  INSERT INTO store_config (company_id, clave, valor)
  VALUES (v_company_id, 'wa_number', p_wa_number)
  ON CONFLICT (company_id, clave) DO UPDATE SET valor = EXCLUDED.valor;
END;
$$;
