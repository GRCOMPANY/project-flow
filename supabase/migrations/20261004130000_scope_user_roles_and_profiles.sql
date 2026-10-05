-- Fase 4e-1 — Cerrar la lectura abierta de user_roles y profiles, quitar la
-- escritura global sobre user_roles y retirar EXECUTE de handle_new_user.
--
-- Problema:
--   • user_roles: SELECT USING (true) deja a cualquier usuario con sesion leer el
--     rol de todos. "Only admins can manage roles" (FOR ALL, sin WITH CHECK, sin
--     empresa) deja a cualquier admin global — es decir, a todo el que se registra
--     por /registro — insertar, cambiar o borrar el rol de cualquier usuario.
--   • profiles: SELECT USING (true) expone nombre y email de todos los usuarios de
--     todas las empresas por /rest/v1/profiles.
--   • handle_new_user es SECURITY DEFINER y tiene EXECUTE por defecto para PUBLIC.
--
-- Que hace:
--   1. user_roles: una sola politica, SELECT de las filas propias. Sin escritura:
--      la app nunca escribe aqui; solo el trigger, que corre como propietario.
--   2. profiles: SELECT del perfil propio o de miembros de alguna empresa del
--      usuario. Se mantienen "Users can insert own profile" y "Users can update
--      own profile".
--   3. REVOKE EXECUTE de handle_new_user a PUBLIC, anon y authenticated.
--
-- Por que nada se rompe:
--   • AuthContext.tsx:46-54 lee user_roles con .eq('user_id', userId): solo pide
--     la fila propia.
--   • has_role() es SECURITY DEFINER (20260112233911:31-44): lee user_roles como
--     propietario, sin pasar por esta RLS. Todas las politicas de otras tablas que
--     usan has_role siguen evaluando igual.
--   • UserSelect.tsx y los embeds assigned_user:profiles(...) solo piden perfiles
--     de miembros de la empresa actual.
--   • Un trigger no requiere EXECUTE sobre su funcion por parte de quien dispara
--     el INSERT: el privilegio se verifica al crear el trigger, no al dispararse.
--     on_auth_user_created sigue funcionando.
--
-- Por que una funcion nueva:
--   La politica de profiles necesita "usuarios que comparten empresa conmigo".
--   Resolverlo con un subselect a company_users haria depender a profiles de la
--   RLS de company_users. current_user_coworker_ids() lo resuelve como propietario,
--   mismo patron que current_user_company_ids() (20260914120000).
--   Igual que esa funcion, no filtra por company_users.status.
--
-- No toca: el trigger, la funcion handle_new_user (solo sus privilegios), filas de
-- ninguna tabla, ni otras tablas.
--
-- Depends on: 20260914120000 (current_user_company_ids)

BEGIN;


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. user_roles — solo la fila propia, sin escritura
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles"       ON public.user_roles;

CREATE POLICY "Users read their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. profiles — propio o de companeros de empresa
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.current_user_coworker_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT cu.user_id
  FROM public.company_users cu
  WHERE cu.company_id IN (
    SELECT mine.company_id
    FROM public.company_users mine
    WHERE mine.user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.current_user_coworker_ids() IS
  'user_id de todos los miembros de las empresas a las que pertenece auth.uid() '
  '(incluido el propio). SECURITY DEFINER para que la politica de profiles no '
  'dependa de la RLS de company_users.';

REVOKE ALL     ON FUNCTION public.current_user_coworker_ids() FROM PUBLIC;
REVOKE ALL     ON FUNCTION public.current_user_coworker_ids() FROM anon;
GRANT  EXECUTE ON FUNCTION public.current_user_coworker_ids() TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Users read own and coworker profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR id IN (SELECT public.current_user_coworker_ids())
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. handle_new_user — solo la dispara el trigger
-- ═══════════════════════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;


COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK (ejecutar a mano, NO forma parte de la migracion)
-- ═══════════════════════════════════════════════════════════════════════════
--
--   BEGIN;
--
--   GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC;
--   GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
--   GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
--
--   DROP POLICY IF EXISTS "Users read own and coworker profiles" ON public.profiles;
--   CREATE POLICY "Authenticated users can view all profiles"
--     ON public.profiles FOR SELECT TO authenticated USING (true);
--
--   DROP FUNCTION IF EXISTS public.current_user_coworker_ids();
--
--   DROP POLICY IF EXISTS "Users read their own roles" ON public.user_roles;
--   CREATE POLICY "Authenticated users can view roles"
--     ON public.user_roles FOR SELECT TO authenticated USING (true);
--   CREATE POLICY "Only admins can manage roles"
--     ON public.user_roles FOR ALL TO authenticated
--     USING (public.has_role(auth.uid(), 'admin'));
--
--   COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACION (ejecutar a mano en el SQL editor)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- V1 — Politicas resultantes.
--      Esperado:
--        profiles   | Users can insert own profile          | INSERT
--        profiles   | Users can update own profile          | UPDATE
--        profiles   | Users read own and coworker profiles  | SELECT
--        user_roles | Users read their own roles            | SELECT
--
--   SELECT tablename, policyname, cmd, roles, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public'
--     AND tablename IN ('profiles', 'user_roles')
--   ORDER BY tablename, policyname;
--
-- V2 — Privilegios de las funciones.
--      Esperado: handle_new_user sin EXECUTE para anon ni authenticated;
--      current_user_coworker_ids solo para authenticated.
--
--   SELECT p.proname,
--          has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated
--   FROM pg_proc p
--   WHERE p.pronamespace = 'public'::regnamespace
--     AND p.proname IN ('handle_new_user', 'current_user_coworker_ids');
--
--   SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
--   -- Esperado: una fila, tgenabled = 'O'.
--
-- V3 — Totales de referencia (como propietario, sin RLS). Esperado: 19 en profiles.
--
--   SELECT (SELECT count(*) FROM public.profiles)   AS profiles_total,
--          (SELECT count(*) FROM public.user_roles) AS user_roles_total;
--
-- V4 — Que ve un usuario autenticado. <user_A>: un usuario real con empresa.
--      Esperado:
--        perfiles_visibles = cantidad de miembros de sus empresas (< 19)
--        esperado_coworkers = el mismo numero
--        roles_visibles = 1 (solo la suya)
--        roles_ajenos = 0
--
--   BEGIN;
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claims',
--     json_build_object('sub', '<user_A>', 'role', 'authenticated')::text, true);
--
--   SELECT
--     (SELECT count(*) FROM public.profiles)                                AS perfiles_visibles,
--     (SELECT count(*) FROM public.current_user_coworker_ids())             AS esperado_coworkers,
--     (SELECT count(*) FROM public.user_roles)                              AS roles_visibles,
--     (SELECT count(*) FROM public.user_roles WHERE user_id <> '<user_A>')  AS roles_ajenos;
--
--   ROLLBACK;
--
-- V5 — Aislamiento: dos usuarios sin empresa en comun no se ven.
--      Primero, como propietario, elegir el par:
--
--   SELECT a.user_id AS user_A, b.user_id AS user_B
--   FROM public.company_users a, public.company_users b
--   WHERE a.user_id <> b.user_id
--     AND NOT EXISTS (
--       SELECT 1 FROM public.company_users x
--       JOIN public.company_users y ON y.company_id = x.company_id
--       WHERE x.user_id = a.user_id AND y.user_id = b.user_id
--     )
--   LIMIT 1;
--
--      Despues, como <user_A>. Esperado: 0 y 0.
--
--   BEGIN;
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claims',
--     json_build_object('sub', '<user_A>', 'role', 'authenticated')::text, true);
--   SELECT count(*) AS perfil_de_B    FROM public.profiles   WHERE id      = '<user_B>';
--   SELECT count(*) AS rol_de_B       FROM public.user_roles WHERE user_id = '<user_B>';
--   ROLLBACK;
--
-- V6 — Escritura en user_roles rechazada. Esperado: error 42501 en el INSERT y
--      0 filas afectadas en UPDATE/DELETE.
--
--   BEGIN;
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claims',
--     json_build_object('sub', '<user_A>', 'role', 'authenticated')::text, true);
--   SAVEPOINT s1;
--   INSERT INTO public.user_roles (user_id, role) VALUES ('<user_B>', 'admin');
--   ROLLBACK TO SAVEPOINT s1;
--   UPDATE public.user_roles SET role = role WHERE user_id = '<user_A>';
--   DELETE FROM public.user_roles WHERE user_id = '<user_B>';
--   ROLLBACK;
--
-- V7 — handle_new_user no invocable por anon. Esperado: 42501 permission denied.
--
--   BEGIN;
--   SET LOCAL ROLE anon;
--   SELECT public.handle_new_user();
--   ROLLBACK;
--
--   (Una funcion que devuelve trigger tampoco se puede llamar directamente; si el
--   error es "trigger functions can only be called as triggers", V2 es la prueba
--   valida del privilegio.)


-- ═══════════════════════════════════════════════════════════════════════════
-- PRUEBA MANUAL EN LA APP (despues de aplicar)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 1. Iniciar sesion con la cuenta de GRC.
--    Esperado: entra al Centro; el menu muestra "👑 Admin" y el item "Tienda"
--    (CommandCenterNav lee el rol desde user_roles). Si aparece "👤 Colaborador"
--    o falta "Tienda", la lectura del rol propio fallo.
--
-- 2. /tasks → abrir o crear una tarea → selector "Asignar a".
--    Esperado: lista los miembros de la empresa, igual que antes. Si sale solo
--    "Sin asignar", profiles no esta devolviendo a los companeros.
--
-- 3. /tasks con tareas que ya tienen responsable.
--    Esperado: se ve nombre y avatar del responsable (embed assigned_user).
--    Nota: si una tarea esta asignada a alguien que ya no es miembro de la
--    empresa, el responsable aparecera vacio — es el efecto buscado.
--
-- 4. En incognito, /registro → crear una empresa de prueba nueva.
--    Esperado: registro sin error; al entrar, el Centro carga con la empresa
--    nueva y el rol admin. Confirma que el trigger sigue disparando sin EXECUTE.
--    Despues, en el SQL editor, verificar que se crearon profiles, user_roles,
--    companies y company_users para ese usuario. La empresa de prueba queda
--    creada: no borrarla desde la base (regla del proyecto); desactivarla desde
--    /superadmin.
