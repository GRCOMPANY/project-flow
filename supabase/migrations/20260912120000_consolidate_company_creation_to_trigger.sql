-- Consolidate company creation into handle_new_user trigger.
--
-- Before this migration, two competing paths created company rows:
--   1. handle_new_user trigger  → bare INSERT (no slug, no onboarding)
--   2. register_company RPC     → full INSERT (slug + onboarding)
-- This caused duplicate/incomplete rows whenever a user registered.
--
-- After this migration:
--   • handle_new_user creates a complete company (slug + onboarding) for 'admin' users only.
--   • 'colaborador' users get only profiles + user_roles (no company).
--   • register_company is dropped — nothing calls it anymore.
--
-- Depends on: 20260907120000_add_onboarding_to_companies.sql (onboarding column + app_role enum)

-- ── 1. Replace handle_new_user ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name    TEXT;
  v_role         TEXT;
  v_company_name TEXT;
  v_wa_number    TEXT;
  v_base_slug    TEXT;
  v_slug         TEXT;
  v_counter      INT := 0;
  v_company_id   UUID;
BEGIN
  v_full_name := COALESCE(new.raw_user_meta_data ->> 'full_name', 'Usuario');
  v_role      := COALESCE(new.raw_user_meta_data ->> 'role', 'colaborador');

  -- 1. Profile — all users
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, v_full_name, new.email);

  -- 2. Role — all users; unknown roles fall back to 'colaborador'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    CASE WHEN v_role = 'admin' THEN 'admin'::app_role
         ELSE 'colaborador'::app_role
    END
  );

  -- 3. Company block — admin only
  IF v_role = 'admin' THEN

    v_company_name := COALESCE(new.raw_user_meta_data ->> 'company_name', v_full_name);
    v_wa_number    := COALESCE(new.raw_user_meta_data ->> 'wa_number', '');

    -- Slug: strip special chars, replace spaces with hyphens, deduplicate with -1 -2 …
    v_base_slug := lower(regexp_replace(
      regexp_replace(trim(v_company_name), '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+', '-', 'g'
    ));
    IF v_base_slug = '' THEN
      v_base_slug := 'empresa';
    END IF;
    v_slug := v_base_slug;
    WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = v_slug) LOOP
      v_counter := v_counter + 1;
      v_slug    := v_base_slug || '-' || v_counter;
    END LOOP;

    -- Company row
    INSERT INTO public.companies (name, owner_user_id, slug, activo, plan, onboarding)
    VALUES (
      v_company_name,
      new.id,
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

    -- Membership
    INSERT INTO public.company_users (company_id, user_id, role)
    VALUES (v_company_id, new.id, 'admin');

    -- Initial store config (wa_number only if provided)
    IF v_wa_number <> '' THEN
      INSERT INTO public.store_config (company_id, clave, valor)
      VALUES (v_company_id, 'wa_number', v_wa_number)
      ON CONFLICT (company_id, clave) DO UPDATE SET valor = EXCLUDED.valor;
    END IF;

  END IF;

  RETURN new;
END;
$$;

-- ── 2. Drop register_company — no longer called by any code ───────────────────

DROP FUNCTION IF EXISTS public.register_company(UUID, TEXT, TEXT);
