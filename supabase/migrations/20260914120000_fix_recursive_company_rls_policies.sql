-- Fase 4a — Eliminar la recursion infinita de las politicas RLS de multi-tenancy.
--
-- Problema:
--   Dos politicas se consultan a si mismas a traves de company_users. Hoy son
--   inertes porque RLS esta DESACTIVADO en ambas tablas, pero al encender RLS
--   (fase 4b) Postgres entraria en recursion infinita y toda query a companies
--   o company_users fallaria con 42P17 "infinite recursion detected in policy".
--
--     companies     "Users see their companies"            → subselect a company_users
--     company_users "Users see members of their companies" → subselect a company_users (a si misma)
--
-- Solucion:
--   • Ambas politicas se resuelven con una misma funcion SECURITY DEFINER. Al
--     correr como propietario de la tabla, su lectura de company_users no evalua
--     las politicas de company_users: ahi se corta el ciclo.
--   • Ninguna de las dos pierde semantica. Cambia de donde sale la lista de
--     empresas del usuario, no el recorte que aplica cada politica.
--
-- Alcance deliberado:
--   Esta migracion NO habilita RLS en ninguna tabla. Solo deja las politicas en
--   un estado en el que encenderlo sea seguro. El ALTER TABLE ... ENABLE ROW
--   LEVEL SECURITY va en la fase 4b, y antes hay que resolver el acceso anonimo
--   (ver nota al final del archivo).
--
-- Supuesto declarado:
--   Ambas politicas se asumen FOR SELECT, segun su nombre y su enunciado. Sus
--   cuerpos originales nunca estuvieron en control de versiones (se crearon
--   desde el dashboard), asi que se reemplazan por nombre. Las demas politicas
--   de estas tablas (escritura, via is_company_admin) no se tocan.
--
-- Depends on: las tablas companies y company_users, creadas fuera de migraciones.


-- ── 1. Funcion SECURITY DEFINER: empresas del usuario actual ──────────────────
--
-- SECURITY DEFINER es el punto clave: al ejecutarse con los privilegios del
-- propietario, la lectura de company_users omite RLS y no reentra en la politica
-- que estamos definiendo. STABLE permite al planner cachearla dentro del statement.
--
-- Se crea con nombre propio en vez de reescribir user_belongs_to_company() para
-- no alterar el comportamiento de las politicas ya existentes que dependen de ella.

CREATE OR REPLACE FUNCTION public.current_user_company_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cu.company_id
  FROM public.company_users cu
  WHERE cu.user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.current_user_company_ids() IS
  'Ids de empresa a las que pertenece auth.uid(). SECURITY DEFINER a proposito: '
  'omite RLS sobre company_users para evitar recursion en las politicas de '
  'companies y de la propia company_users.';

REVOKE ALL     ON FUNCTION public.current_user_company_ids() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.current_user_company_ids() TO authenticated;


-- ── 2. company_users — sin autoconsulta ───────────────────────────────────────
--
-- La version anterior resolvia "¿a que empresas pertenece el usuario?" con un
-- subselect a company_users dentro de una politica sobre company_users: ese es
-- exactamente el ciclo. La nueva hace la misma pregunta via la funcion del paso 1.
--
-- A primera vista parece igual de recursiva — una politica sobre company_users
-- que termina leyendo company_users — pero no lo es. La funcion es SECURITY
-- DEFINER: corre como su propietario, que es el dueno de la tabla, y un dueno de
-- tabla no queda sujeto a sus propias politicas RLS salvo que se declare FORCE
-- ROW LEVEL SECURITY. La lectura interna no reevalua esta politica: ahi muere el
-- ciclo.
--
-- Corolario operativo: NO declarar FORCE ROW LEVEL SECURITY sobre company_users,
-- porque reintroduciria la recursion justamente por esta via.
--
-- La semantica original se conserva: cada usuario ve a los miembros de las
-- empresas a las que pertenece. De eso depende el selector de asignacion de
-- tareas (UserSelect.tsx saca los user_id de company_users para listar usuarios);
-- recortarlo a la fila propia lo dejaria mostrando solo al usuario logueado en
-- cuanto una empresa tuviera mas de un miembro.

DROP POLICY IF EXISTS "Users see members of their companies" ON public.company_users;

CREATE POLICY "Users see members of their companies"
  ON public.company_users
  FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT public.current_user_company_ids()));


-- ── 3. companies — via funcion, no subselect ──────────────────────────────────

DROP POLICY IF EXISTS "Users see their companies" ON public.companies;

CREATE POLICY "Users see their companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (id IN (SELECT public.current_user_company_ids()));


-- ── 4. Verificacion (ejecutar a mano, no forma parte de la migracion) ─────────
--
-- Antes de encender RLS en la fase 4b, comprobar que ningun CUERPO de politica
-- contiene un subselect a company_users. El acceso a esa tabla debe quedar
-- encapsulado dentro de la funcion, que es la unica que puede omitir RLS:
--
--   SELECT tablename, policyname, cmd, qual
--   FROM pg_policies
--   WHERE schemaname = 'public'
--     AND tablename IN ('companies', 'company_users')
--   ORDER BY tablename, policyname;
--
-- Esperado: en ambas filas, qual referencia current_user_company_ids() y ninguna
-- contiene un SELECT sobre company_users.


-- ── 5. ROLLBACK ───────────────────────────────────────────────────────────────
--
-- Revertir es de bajo riesgo mientras RLS siga DESACTIVADO en ambas tablas: las
-- politicas no se evaluan. Los cuerpos originales no estaban versionados, asi que
-- se reconstruyen a partir de su enunciado — vuelven a ser las recursivas.
--
--   DROP POLICY IF EXISTS "Users see their companies"            ON public.companies;
--   DROP POLICY IF EXISTS "Users see members of their companies" ON public.company_users;
--
--   CREATE POLICY "Users see members of their companies"
--     ON public.company_users
--     FOR SELECT
--     TO authenticated
--     USING (
--       company_id IN (
--         SELECT cu.company_id FROM public.company_users cu WHERE cu.user_id = auth.uid()
--       )
--     );
--
--   CREATE POLICY "Users see their companies"
--     ON public.companies
--     FOR SELECT
--     TO authenticated
--     USING (
--       id IN (
--         SELECT cu.company_id FROM public.company_users cu WHERE cu.user_id = auth.uid()
--       )
--     );
--
--   DROP FUNCTION IF EXISTS public.current_user_company_ids();
--
-- Advertencia: restaurar estas dos politicas reintroduce la recursion. Solo tiene
-- sentido como vuelta atras inmediata, y nunca con RLS encendido.


-- ── 6. Pendiente para la fase 4b, NO resuelto aqui ────────────────────────────
--
-- Las politicas de arriba son TO authenticated. La tienda publica lee companies
-- de forma ANONIMA (TiendaPublica.tsx busca por slug y por is_grc; ProductoDetalle
-- resuelve el wa_number de la empresa del producto). Encender RLS en companies sin
-- una politica de lectura para el rol anon dejaria /tienda, /tienda/:slug y
-- /producto/:id sin datos de empresa.
--
-- Hara falta algo del estilo (a decidir en 4b, acotando columnas si corresponde):
--
--   CREATE POLICY "Anyone can view active companies"
--     ON public.companies FOR SELECT TO anon
--     USING (activo = true);
