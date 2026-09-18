-- Fase 4c (parte 2) — Encender RLS en las 7 tablas que quedan.
--
-- Esta migracion esta ESCALONADA a proposito. El paso 0 no enciende nada: deja
-- las politicas en su forma final mientras RLS sigue apagado, asi que es
-- reversible sin consecuencias. Los pasos 1 a 7 encienden una tabla cada uno,
-- pensados para ejecutarse de a uno y probar la app entre cada paso.
--
-- Orden elegido: de menor a mayor radio de impacto. suppliers toca una pantalla
-- de admin; companies toca absolutamente todo, incluida la tienda publica
-- anonima y /superadmin. Si algo va a romperse, conviene que rompa temprano y en
-- la pantalla mas chica.
--
-- Cada paso lleva su propio ROLLBACK inmediatamente debajo.
--
-- Depends on: 20260914120000 (current_user_company_ids)
--             20260914130000 (politicas anon de la tienda publica)
--             20260917120000 (create_public_order)


-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 0 — Prerrequisitos. NO enciende RLS.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 0.1 Helpers SECURITY DEFINER ─────────────────────────────────────────────
--
-- Mismo principio que current_user_company_ids(): corren como propietario, asi
-- que sus lecturas de companies y company_users no quedan sujetas a las
-- politicas de esas tablas. Sin esto, las politicas que las consultan cambian de
-- resultado en cuanto se enciende RLS.

-- Superadmin = pertenecer a la empresa marcada is_grc. Criterio aprobado;
-- migrara a un rol explicito en user_roles cuando el producto se venda como SaaS.
CREATE OR REPLACE FUNCTION public.is_grc_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users cu
    JOIN public.companies c ON c.id = cu.company_id
    WHERE cu.user_id = auth.uid()
      AND c.is_grc = true
  );
$$;

COMMENT ON FUNCTION public.is_grc_member() IS
  'true si auth.uid() pertenece a la empresa con is_grc. SECURITY DEFINER para no '
  'depender de las politicas de companies/company_users al evaluarse dentro de otra politica.';

-- Usadas por la politica de SELECT de products (feature linked_to_grc).
CREATE OR REPLACE FUNCTION public.company_is_grc(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = _company_id AND c.is_grc = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_linked_to_grc()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users cu
    JOIN public.companies c ON c.id = cu.company_id
    WHERE cu.user_id = auth.uid()
      AND c.linked_to_grc = true
      AND cu.status = 'active'
  );
$$;

REVOKE ALL     ON FUNCTION public.is_grc_member()             FROM PUBLIC;
REVOKE ALL     ON FUNCTION public.company_is_grc(uuid)        FROM PUBLIC;
REVOKE ALL     ON FUNCTION public.user_is_linked_to_grc()     FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_grc_member()             TO authenticated;
GRANT  EXECUTE ON FUNCTION public.company_is_grc(uuid)        TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.user_is_linked_to_grc()     TO anon, authenticated;


-- ── 0.2 companies: politicas de superadmin ───────────────────────────────────
--
-- Sin esto, al encender companies el usuario de GRC pasa a ver UNA empresa en
-- /superadmin en vez de todas, y el switch de activar/desactivar deja de
-- funcionar. Las politicas permisivas se combinan con OR, asi que estas se suman
-- a "Users see their companies" sin reemplazarla.

CREATE POLICY "GRC members see all companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (public.is_grc_member());

CREATE POLICY "GRC members update any company"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (public.is_grc_member())
  WITH CHECK (public.is_grc_member());


-- ── 0.3 products INSERT: acotar a admin de la empresa ────────────────────────
--
-- Estaba en WITH CHECK (true): cualquier usuario autenticado podia insertar un
-- producto en CUALQUIER empresa. Encender RLS no lo arregla; hay que reescribirla.

DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;

CREATE POLICY "Company admins can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (is_company_admin(company_id));


-- ── 0.4 products SELECT: sacar los subselects a companies/company_users ──────
--
-- La version anterior preguntaba por companies y company_users con subselects
-- directos. Al encender RLS en esas tablas, el primer EXISTS deja de encontrar la
-- fila de GRC para un usuario que no pertenece a GRC, y la feature linked_to_grc
-- deja de dar acceso a los productos de GRC — en silencio.
--
-- La logica es identica; solo cambia que ahora pasa por funciones definer.

DROP POLICY IF EXISTS "Users see own company products" ON public.products;

CREATE POLICY "Users see own company products"
  ON public.products
  FOR SELECT
  TO public
  USING (
    user_belongs_to_company(company_id)
    OR (public.company_is_grc(company_id) AND public.user_is_linked_to_grc())
  );


-- ── 0.5 sales: eliminar el INSERT anonimo abierto ────────────────────────────
--
-- tienda_publica_insert_sales permite insertar en cualquier empresa activa con el
-- precio que mande el cliente. Lo reemplaza create_public_order, que deriva
-- precio, costo, margen y company_id en el servidor.

DROP POLICY IF EXISTS "tienda_publica_insert_sales" ON public.sales;


-- ── 0.6 sales: cerrar la lectura anonima ─────────────────────────────────────
--
-- Efecto inmediato, no depende de RLS. La tienda publica escribe por la funcion
-- y nunca lee ventas.

REVOKE SELECT ON public.sales FROM anon;


-- ROLLBACK DEL PASO 0 ────────────────────────────────────────────────────────
--
--   GRANT SELECT ON public.sales TO anon;
--
--   CREATE POLICY "tienda_publica_insert_sales"
--     ON public.sales FOR INSERT TO public
--     WITH CHECK (
--       (sales_channel = 'tienda_publica'::text)
--       AND (company_id IN (SELECT companies.id FROM companies WHERE companies.activo = true))
--     );
--
--   DROP POLICY IF EXISTS "Users see own company products" ON public.products;
--   CREATE POLICY "Users see own company products"
--     ON public.products FOR SELECT TO public
--     USING (
--       user_belongs_to_company(company_id)
--       OR ((EXISTS (SELECT 1 FROM companies
--                    WHERE companies.id = products.company_id AND companies.is_grc = true))
--           AND (EXISTS (SELECT 1 FROM company_users cu
--                        JOIN companies c ON c.id = cu.company_id
--                        WHERE cu.user_id = auth.uid()
--                          AND c.linked_to_grc = true
--                          AND cu.status = 'active')))
--     );
--
--   DROP POLICY IF EXISTS "Company admins can insert products" ON public.products;
--   CREATE POLICY "Authenticated users can insert products"
--     ON public.products FOR INSERT TO authenticated WITH CHECK (true);
--
--   DROP POLICY IF EXISTS "GRC members update any company" ON public.companies;
--   DROP POLICY IF EXISTS "GRC members see all companies"  ON public.companies;
--
--   DROP FUNCTION IF EXISTS public.user_is_linked_to_grc();
--   DROP FUNCTION IF EXISTS public.company_is_grc(uuid);
--   DROP FUNCTION IF EXISTS public.is_grc_member();


-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 1 — suppliers
-- ═══════════════════════════════════════════════════════════════════════════
-- Politicas: SELECT user_belongs_to_company · INSERT/UPDATE/DELETE is_company_admin
-- Probar: /suppliers lista los proveedores y permite crear uno.
--         /products: cada producto conserva su proveedor (viene por el embed
--         supplier:suppliers(*), que se filtra por separado).

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- ROLLBACK: ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 2 — sellers
-- ═══════════════════════════════════════════════════════════════════════════
-- Probar: /sellers lista revendedores · el detalle de un revendedor muestra su
--         historial · /sales muestra el nombre del revendedor en cada venta
--         (embed seller:sellers(*)).

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- ROLLBACK: ALTER TABLE public.sellers DISABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 3 — tasks
-- ═══════════════════════════════════════════════════════════════════════════
-- Este paso cierra la fuga que origino toda la auditoria.
-- Probar: /tasks lista solo las tareas propias · crear y completar una tarea ·
--         el Command Center muestra las tareas del dia · el checklist de
--         onboarding sigue contando tareas (usa count exact sobre tasks).
-- Ojo: UPDATE exige user_belongs_to_company AND (assigned_to = auth.uid() OR
--      is_company_admin). Un colaborador no podra cerrar tareas de su empresa que
--      no le esten asignadas.

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ROLLBACK: ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 4 — products
-- ═══════════════════════════════════════════════════════════════════════════
-- Probar: /products lista y permite crear/editar · /products/:id abre ·
--         /creatives muestra el producto de cada creativo · /sales muestra el
--         producto de cada venta · el conteo de onboarding sigue vivo.
-- Probar tambien la tienda publica: /tienda y /catalogo deben seguir mostrando
--         los 12 productos. Van por products_seller_view (security_invoker =
--         false), asi que no pasan por esta politica — si se vacian, el problema
--         esta en la vista, no aca.

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ROLLBACK: ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 5 — sales
-- ═══════════════════════════════════════════════════════════════════════════
-- Probar: /sales lista y permite registrar una venta manual · Command Center
--         muestra metricas y graficos · /products/:id muestra ventas del producto.
-- Probar el camino publico completo: pedido desde /tienda en incognito →
--         debe entrar con margen real, y el BADGE REALTIME debe dispararse.
-- El badge es el fallo silencioso de este paso: useRealtimeOrders se suscribe a
--         postgres_changes sobre sales, y Realtime solo entrega las filas que el
--         usuario puede leer por SELECT. Si deja de sonar, no habra error en
--         consola: simplemente no llega el toast.

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- ROLLBACK: ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 6 — company_users
-- ═══════════════════════════════════════════════════════════════════════════
-- Probar: iniciar sesion (useCompany resuelve la empresa desde esta tabla) ·
--         el selector "asignar a" de tareas lista los miembros de la empresa ·
--         registrar una empresa nueva desde /registro (el trigger es SECURITY
--         DEFINER, deberia seguir funcionando).

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- ROLLBACK: ALTER TABLE public.company_users DISABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 7 — companies
-- ═══════════════════════════════════════════════════════════════════════════
-- El de mayor radio: lo leen la app autenticada, /superadmin y la tienda publica
-- anonima.
-- Probar CON sesion: iniciar sesion · el onboarding guarda pasos (UPDATE sobre
--         companies.onboarding) · /superadmin lista TODAS las empresas y el
--         switch de activo funciona.
-- Probar SIN sesion, en incognito: /tienda · /tienda/grc · /catalogo ·
--         /producto/:id · y un pedido de punta a punta.

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ROLLBACK: ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACION FINAL
-- ═══════════════════════════════════════════════════════════════════════════
--
--   SELECT relname, relrowsecurity AS rls_activo, relforcerowsecurity AS forzado
--   FROM pg_class
--   WHERE relnamespace = 'public'::regnamespace
--     AND relname IN ('companies','company_users','products','sales','sellers',
--                     'suppliers','tasks','banners','testimonios','product_videos',
--                     'creatives','store_config','projects','profiles','user_roles')
--   ORDER BY relname;
--
-- Las 7 de esta migracion deben quedar en rls_activo = true y forzado = false.
-- NUNCA poner FORCE ROW LEVEL SECURITY en companies ni company_users: anularia el
-- bypass de las funciones definer y reintroduciria la recursion de 4a.
--
-- Con la anon key, estas dos deben devolver cero filas:
--   GET /rest/v1/tasks?select=id
--   GET /rest/v1/sales?select=id
