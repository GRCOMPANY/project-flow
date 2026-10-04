-- Fase 4d — Cerrar las politicas abiertas (true) de banners, testimonios,
-- product_videos y task_outcomes, y acotarlas a la empresa del usuario.
--
-- Problema:
--   Estas cuatro tablas tienen politicas permisivas con USING/WITH CHECK (true),
--   creadas desde el dashboard. Como las politicas permisivas se combinan con OR,
--   cualquier otra politica mas estricta queda anulada: cualquier usuario puede
--   leer, crear, editar y borrar banners, testimonios y videos de CUALQUIER
--   empresa, y crear resultados sobre tareas ajenas.
--
-- Que hace:
--   • Borra las politicas abiertas por nombre.
--   • Para authenticated crea, por tabla:
--       - lectura publica de contenido activo de empresas activas (la misma regla
--         que anon: un usuario con sesion tambien navega /tienda y /producto/:id);
--       - lectura de todo el contenido de sus empresas (user_belongs_to_company);
--       - INSERT/UPDATE/DELETE acotados a sus empresas, con USING y WITH CHECK
--         para que una fila no pueda moverse a otra empresa en un UPDATE.
--   • task_outcomes: solo se reemplaza el INSERT abierto, resolviendo la empresa
--     via tasks.
--
-- No toca:
--   • Las politicas de anon (20260914130000).
--   • Las politicas de SELECT y UPDATE de task_outcomes.
--   • "Admins can insert outcomes" (20260127201356): sigue vigente y se suma por OR.
--
-- Por que dos funciones nuevas:
--   La lectura publica de anon consulta companies y products directamente. Para
--   authenticated esas dos tablas tienen RLS (fase 4c): un usuario de la empresa X
--   no ve la fila de la empresa Y ni sus productos, asi que una copia literal de la
--   politica de anon le ocultaria los banners/videos/testimonios de cualquier
--   tienda que no sea la suya. Las funciones SECURITY DEFINER responden "esta
--   empresa/producto es publico" sin pasar por esa RLS — mismo patron que
--   company_is_grc() en 20260918120000.
--
-- Supuestos sobre el esquema (las tablas se crearon fuera de migraciones):
--   banners        (company_id, activo)
--   testimonios    (company_id NULL, product_id NULL, activo)
--                    — /tienda-config inserta con company_id y sin product_id;
--                      /products/:id inserta con product_id y sin company_id.
--   product_videos (product_id, activo) — sin company_id.
--   task_outcomes  (task_id) — sin company_id.
--
-- Depends on: 20260914130000 (politicas anon), 20260918120000 (RLS en companies,
--             products y tasks).

BEGIN;


-- ═══════════════════════════════════════════════════════════════════════════
-- 0. Helpers SECURITY DEFINER para la lectura publica con sesion
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.company_is_active(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = _company_id AND c.activo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.product_is_public(_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.companies c ON c.id = p.company_id
    WHERE p.id = _product_id
      AND p.status = 'activo'
      AND c.activo = true
  );
$$;

COMMENT ON FUNCTION public.company_is_active(uuid) IS
  'true si la empresa existe y esta activa. SECURITY DEFINER para que la lectura '
  'publica de authenticated no dependa de la RLS de companies.';
COMMENT ON FUNCTION public.product_is_public(uuid) IS
  'true si el producto esta activo y su empresa tambien. SECURITY DEFINER para que '
  'la lectura publica de authenticated no dependa de la RLS de products/companies.';

REVOKE ALL     ON FUNCTION public.company_is_active(uuid)  FROM PUBLIC;
REVOKE ALL     ON FUNCTION public.product_is_public(uuid)  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.company_is_active(uuid)  TO authenticated;
GRANT  EXECUTE ON FUNCTION public.product_is_public(uuid)  TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. banners
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "allow_select" ON public.banners;
DROP POLICY IF EXISTS "allow_insert" ON public.banners;
DROP POLICY IF EXISTS "allow_update" ON public.banners;
DROP POLICY IF EXISTS "allow_delete" ON public.banners;

CREATE POLICY "Authenticated reads active banners of active companies"
  ON public.banners
  FOR SELECT
  TO authenticated
  USING (activo = true AND public.company_is_active(company_id));

CREATE POLICY "Members read their company banners"
  ON public.banners
  FOR SELECT
  TO authenticated
  USING (user_belongs_to_company(company_id));

CREATE POLICY "Members insert banners in their company"
  ON public.banners
  FOR INSERT
  TO authenticated
  WITH CHECK (user_belongs_to_company(company_id));

CREATE POLICY "Members update their company banners"
  ON public.banners
  FOR UPDATE
  TO authenticated
  USING      (user_belongs_to_company(company_id))
  WITH CHECK (user_belongs_to_company(company_id));

CREATE POLICY "Members delete their company banners"
  ON public.banners
  FOR DELETE
  TO authenticated
  USING (user_belongs_to_company(company_id));


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. testimonios
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Una fila pertenece a una empresa por company_id, por product_id, o por ambos.
-- La regla de escritura exige que al menos uno este presente y que CADA uno que
-- venga apunte a una empresa del usuario: asi no se puede colgar un testimonio de
-- la empresa propia sobre un producto ajeno, ni al reves.
--
-- La lectura publica es identica a la de anon: solo testimonios de producto.

DROP POLICY IF EXISTS "test_select" ON public.testimonios;
DROP POLICY IF EXISTS "test_insert" ON public.testimonios;
DROP POLICY IF EXISTS "test_update" ON public.testimonios;
DROP POLICY IF EXISTS "test_delete" ON public.testimonios;

CREATE POLICY "Authenticated reads active testimonials of active products"
  ON public.testimonios
  FOR SELECT
  TO authenticated
  USING (activo = true AND public.product_is_public(product_id));

CREATE POLICY "Members read their company testimonials"
  ON public.testimonios
  FOR SELECT
  TO authenticated
  USING (
    (company_id IS NOT NULL OR product_id IS NOT NULL)
    AND (company_id IS NULL OR user_belongs_to_company(company_id))
    AND (product_id IS NULL OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = testimonios.product_id
        AND user_belongs_to_company(p.company_id)
    ))
  );

CREATE POLICY "Members insert testimonials in their company"
  ON public.testimonios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (company_id IS NOT NULL OR product_id IS NOT NULL)
    AND (company_id IS NULL OR user_belongs_to_company(company_id))
    AND (product_id IS NULL OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = testimonios.product_id
        AND user_belongs_to_company(p.company_id)
    ))
  );

CREATE POLICY "Members update their company testimonials"
  ON public.testimonios
  FOR UPDATE
  TO authenticated
  USING (
    (company_id IS NOT NULL OR product_id IS NOT NULL)
    AND (company_id IS NULL OR user_belongs_to_company(company_id))
    AND (product_id IS NULL OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = testimonios.product_id
        AND user_belongs_to_company(p.company_id)
    ))
  )
  WITH CHECK (
    (company_id IS NOT NULL OR product_id IS NOT NULL)
    AND (company_id IS NULL OR user_belongs_to_company(company_id))
    AND (product_id IS NULL OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = testimonios.product_id
        AND user_belongs_to_company(p.company_id)
    ))
  );

CREATE POLICY "Members delete their company testimonials"
  ON public.testimonios
  FOR DELETE
  TO authenticated
  USING (
    (company_id IS NOT NULL OR product_id IS NOT NULL)
    AND (company_id IS NULL OR user_belongs_to_company(company_id))
    AND (product_id IS NULL OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = testimonios.product_id
        AND user_belongs_to_company(p.company_id)
    ))
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. product_videos — empresa resuelta via products
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "pv_select" ON public.product_videos;
DROP POLICY IF EXISTS "pv_insert" ON public.product_videos;
DROP POLICY IF EXISTS "pv_update" ON public.product_videos;
DROP POLICY IF EXISTS "pv_delete" ON public.product_videos;

CREATE POLICY "Authenticated reads active videos of active products"
  ON public.product_videos
  FOR SELECT
  TO authenticated
  USING (activo = true AND public.product_is_public(product_id));

CREATE POLICY "Members read their company product videos"
  ON public.product_videos
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_videos.product_id
      AND user_belongs_to_company(p.company_id)
  ));

CREATE POLICY "Members insert videos on their company products"
  ON public.product_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_videos.product_id
      AND user_belongs_to_company(p.company_id)
  ));

CREATE POLICY "Members update their company product videos"
  ON public.product_videos
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_videos.product_id
      AND user_belongs_to_company(p.company_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_videos.product_id
      AND user_belongs_to_company(p.company_id)
  ));

CREATE POLICY "Members delete their company product videos"
  ON public.product_videos
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_videos.product_id
      AND user_belongs_to_company(p.company_id)
  ));


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. task_outcomes — solo el INSERT, empresa resuelta via tasks
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Allow authenticated insert outcomes" ON public.task_outcomes;

CREATE POLICY "Members insert outcomes on their company tasks"
  ON public.task_outcomes
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_outcomes.task_id
      AND user_belongs_to_company(t.company_id)
  ));


COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK (ejecutar a mano, NO forma parte de la migracion)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Los cuerpos originales nunca estuvieron versionados. Se reconstruyen como
-- TO public con true; ANTES de aplicar la migracion, guardar la salida de la
-- consulta V0 de abajo y, si roles o comandos difieren, ajustar este bloque.
--
--   BEGIN;
--
--   DROP POLICY IF EXISTS "Members insert outcomes on their company tasks"       ON public.task_outcomes;
--   CREATE POLICY "Allow authenticated insert outcomes"
--     ON public.task_outcomes FOR INSERT TO authenticated WITH CHECK (true);
--
--   DROP POLICY IF EXISTS "Members delete their company product videos"          ON public.product_videos;
--   DROP POLICY IF EXISTS "Members update their company product videos"          ON public.product_videos;
--   DROP POLICY IF EXISTS "Members insert videos on their company products"      ON public.product_videos;
--   DROP POLICY IF EXISTS "Members read their company product videos"            ON public.product_videos;
--   DROP POLICY IF EXISTS "Authenticated reads active videos of active products" ON public.product_videos;
--   CREATE POLICY "pv_select" ON public.product_videos FOR SELECT USING (true);
--   CREATE POLICY "pv_insert" ON public.product_videos FOR INSERT WITH CHECK (true);
--   CREATE POLICY "pv_update" ON public.product_videos FOR UPDATE USING (true) WITH CHECK (true);
--   CREATE POLICY "pv_delete" ON public.product_videos FOR DELETE USING (true);
--
--   DROP POLICY IF EXISTS "Members delete their company testimonials"                  ON public.testimonios;
--   DROP POLICY IF EXISTS "Members update their company testimonials"                  ON public.testimonios;
--   DROP POLICY IF EXISTS "Members insert testimonials in their company"               ON public.testimonios;
--   DROP POLICY IF EXISTS "Members read their company testimonials"                    ON public.testimonios;
--   DROP POLICY IF EXISTS "Authenticated reads active testimonials of active products" ON public.testimonios;
--   CREATE POLICY "test_select" ON public.testimonios FOR SELECT USING (true);
--   CREATE POLICY "test_insert" ON public.testimonios FOR INSERT WITH CHECK (true);
--   CREATE POLICY "test_update" ON public.testimonios FOR UPDATE USING (true) WITH CHECK (true);
--   CREATE POLICY "test_delete" ON public.testimonios FOR DELETE USING (true);
--
--   DROP POLICY IF EXISTS "Members delete their company banners"                  ON public.banners;
--   DROP POLICY IF EXISTS "Members update their company banners"                  ON public.banners;
--   DROP POLICY IF EXISTS "Members insert banners in their company"               ON public.banners;
--   DROP POLICY IF EXISTS "Members read their company banners"                    ON public.banners;
--   DROP POLICY IF EXISTS "Authenticated reads active banners of active companies" ON public.banners;
--   CREATE POLICY "allow_select" ON public.banners FOR SELECT USING (true);
--   CREATE POLICY "allow_insert" ON public.banners FOR INSERT WITH CHECK (true);
--   CREATE POLICY "allow_update" ON public.banners FOR UPDATE USING (true) WITH CHECK (true);
--   CREATE POLICY "allow_delete" ON public.banners FOR DELETE USING (true);
--
--   DROP FUNCTION IF EXISTS public.product_is_public(uuid);
--   DROP FUNCTION IF EXISTS public.company_is_active(uuid);
--
--   COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACION (ejecutar a mano en el SQL editor)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- V0 — ANTES y DESPUES de aplicar: inventario de politicas.
--
--   SELECT tablename, policyname, cmd, roles, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public'
--     AND tablename IN ('banners','testimonios','product_videos','task_outcomes')
--   ORDER BY tablename, cmd, policyname;
--
-- V1 — DESPUES: no debe quedar ninguna politica abierta salvo las de task_outcomes
--      que estan fuera de alcance. Esperado: cero filas.
--      (Si aparece alguna, el DROP por nombre no la encontro: la politica viva
--      tenia otro nombre y sigue abriendo la tabla.)
--
--   SELECT tablename, policyname, cmd, roles
--   FROM pg_policies
--   WHERE schemaname = 'public'
--     AND tablename IN ('banners','testimonios','product_videos','task_outcomes')
--     AND (qual = 'true' OR with_check = 'true')
--     AND NOT (tablename = 'task_outcomes' AND cmd IN ('SELECT','UPDATE'));
--
-- V2 — RLS encendido en las cuatro tablas. Esperado: rls_activo = true.
--
--   SELECT relname, relrowsecurity AS rls_activo, relforcerowsecurity AS forzado
--   FROM pg_class
--   WHERE relnamespace = 'public'::regnamespace
--     AND relname IN ('banners','testimonios','product_videos','task_outcomes');
--
-- V3 — Probar como ANON. Todo dentro de una transaccion que se descarta.
--      Esperado: solo filas activas de empresas/productos activos; ningun error.
--      Si testimonios o product_videos fallan con 42501 "permission denied for
--      table products", el problema esta en las politicas anon de 4b (products
--      revocado a anon), no en esta migracion.
--
--   BEGIN;
--   SET LOCAL ROLE anon;
--   SELECT count(*) AS banners_visibles,   bool_and(activo) AS todos_activos FROM public.banners;
--   SELECT count(*) AS testimonios_visibles, bool_and(activo) AS todos_activos FROM public.testimonios;
--   SELECT count(*) AS videos_visibles,    bool_and(activo) AS todos_activos FROM public.product_videos;
--   SELECT count(*) AS outcomes_visibles FROM public.task_outcomes;          -- esperado 0
--   ROLLBACK;
--
--   Y escritura anonima rechazada (esperado: error 42501 / new row violates RLS):
--
--   BEGIN;
--   SET LOCAL ROLE anon;
--   INSERT INTO public.banners (company_id, titulo, activo)
--   VALUES ('<company_id_cualquiera>', 'prueba anon', true);
--   ROLLBACK;
--
-- V4 — Probar como AUTHENTICATED, suplantando a un usuario real.
--      <user_id>: un miembro de la empresa A. <company_ajena>: una empresa B a la
--      que NO pertenece. <task_ajena>: una tarea de B. <producto_ajeno>: producto de B.
--
--   BEGIN;
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claims',
--     json_build_object('sub', '<user_id>', 'role', 'authenticated')::text, true);
--
--   -- Lectura: lo suyo completo + lo publico de otras empresas activas.
--   SELECT company_id, count(*), bool_and(activo) FROM public.banners GROUP BY 1;
--   SELECT count(*) FROM public.testimonios;
--   SELECT count(*) FROM public.product_videos;
--
--   -- Cada INSERT siguiente debe fallar con 42501. Ejecutarlos de a uno: el
--   -- primer error aborta la transaccion (usar SAVEPOINT entre ellos si se
--   -- quieren correr juntos).
--   SAVEPOINT s1;
--   INSERT INTO public.banners (company_id, titulo, activo)
--   VALUES ('<company_ajena>', 'prueba cruce', true);
--   ROLLBACK TO SAVEPOINT s1;
--
--   SAVEPOINT s2;
--   INSERT INTO public.testimonios (product_id, nombre, texto, calificacion, activo)
--   VALUES ('<producto_ajeno>', 'x', 'x', 5, true);
--   ROLLBACK TO SAVEPOINT s2;
--
--   SAVEPOINT s3;
--   INSERT INTO public.product_videos (product_id, video_url, activo, orden)
--   VALUES ('<producto_ajeno>', 'https://example.com/x.mp4', true, 0);
--   ROLLBACK TO SAVEPOINT s3;
--
--   SAVEPOINT s4;
--   INSERT INTO public.task_outcomes (task_id, result)
--   VALUES ('<task_ajena>', 'exitoso');
--   ROLLBACK TO SAVEPOINT s4;
--   -- Ojo: si <user_id> tiene rol admin en user_roles, s4 PASA por la politica
--   -- "Admins can insert outcomes", que sigue vigente y es global.
--
--   -- UPDATE/DELETE sobre filas ajenas: deben afectar 0 filas (no dan error).
--   UPDATE public.banners SET titulo = titulo WHERE company_id = '<company_ajena>';
--   DELETE FROM public.banners WHERE company_id = '<company_ajena>';
--
--   ROLLBACK;
