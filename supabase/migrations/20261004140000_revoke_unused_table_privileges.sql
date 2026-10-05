-- Fase 4e-2 — Quitar a anon y authenticated los privilegios de tabla que no usan.
--
-- Problema:
--   Por el default de Supabase, anon y authenticated tienen DELETE, INSERT,
--   REFERENCES, SELECT, TRIGGER, TRUNCATE y UPDATE sobre todas las tablas de
--   public. Hoy RLS bloquea las escrituras en 19 de las 20 tablas, pero eso deja
--   una sola capa de defensa: una politica permisiva de mas, o una tabla con RLS
--   apagado, abre la escritura a cualquiera. Y TRUNCATE no pasa por RLS.
--
-- Que hace:
--   1. anon:          REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
--   2. authenticated: REVOKE TRUNCATE, REFERENCES, TRIGGER
--   SELECT queda intacto para ambos.
--
-- Por que nada se rompe:
--   • Las paginas publicas solo escriben via create_public_order (SECURITY
--     DEFINER, duena postgres: escribe con los privilegios de postgres) y
--     auth.signUp (escribe en el esquema auth; los INSERT en public los hace
--     handle_new_user, tambien SECURITY DEFINER).
--   • El panel con sesion usa INSERT/UPDATE/DELETE de authenticated, que se
--     conservan. Ningun codigo de la app usa TRUNCATE, REFERENCES ni TRIGGER.
--
-- Por que un bucle y no "ON ALL TABLES IN SCHEMA public":
--   ALL TABLES incluye vistas, vistas materializadas y tablas foraneas. El alcance
--   de esta migracion es solo tablas: el bucle filtra pg_class.relkind a 'r'
--   (tabla) y 'p' (tabla particionada). products_seller_view y cualquier otra
--   vista quedan como estan.
--
-- Columnas:
--   Revocar un privilegio de tabla revoca tambien ese privilegio en cada columna.
--   Los GRANT por columna de 4b (companies, creatives) son de SELECT y no se tocan.
--
-- Fuera de alcance, a proposito:
--   • Funciones (EXECUTE), secuencias y vistas.
--   • SELECT, service_role y postgres.
--   • ALTER DEFAULT PRIVILEGES: una tabla NUEVA que se cree en public seguira
--     naciendo con todos los privilegios para anon y authenticated. Esta migracion
--     solo corrige las tablas existentes.
--
-- No modifica filas de ninguna tabla.

BEGIN;

DO $$
DECLARE
  t     record;
  n     int := 0;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace
      AND c.relkind IN ('r', 'p')
    ORDER BY c.relname
  LOOP
    EXECUTE format(
      'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I FROM anon',
      t.relname
    );
    EXECUTE format(
      'REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I FROM authenticated',
      t.relname
    );
    n := n + 1;
  END LOOP;

  RAISE NOTICE 'Privilegios revocados en % tablas de public (esperado: 20)', n;
END
$$;

COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK (ejecutar a mano, NO forma parte de la migracion)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Mismo bucle, mismo filtro de relkind. Restaura el default de Supabase.
--
--   BEGIN;
--   DO $$
--   DECLARE t record;
--   BEGIN
--     FOR t IN
--       SELECT c.relname FROM pg_class c
--       WHERE c.relnamespace = 'public'::regnamespace
--         AND c.relkind IN ('r', 'p')
--     LOOP
--       EXECUTE format(
--         'GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I TO anon',
--         t.relname);
--       EXECUTE format(
--         'GRANT TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I TO authenticated',
--         t.relname);
--     END LOOP;
--   END
--   $$;
--   COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACION (ejecutar a mano en el SQL editor)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- V1 — Permisos resultantes por tabla y rol.
--      Esperado, en las 20 filas:
--        anon:          SELECT=true, el resto false
--        authenticated: SELECT/INSERT/UPDATE/DELETE=true; TRUNCATE/REFERENCES/TRIGGER=false
--      (Excepciones conocidas, anon_select=false: companies, creatives y products
--      por 4b, y sales por 4c. anon lee companies y creatives por GRANT de
--      columna, que has_table_privilege no cuenta como SELECT de tabla.)
--
--   SELECT c.relname AS tabla,
--          has_table_privilege('anon', c.oid, 'SELECT')     AS anon_select,
--          has_table_privilege('anon', c.oid, 'INSERT')     AS anon_insert,
--          has_table_privilege('anon', c.oid, 'UPDATE')     AS anon_update,
--          has_table_privilege('anon', c.oid, 'DELETE')     AS anon_delete,
--          has_table_privilege('anon', c.oid, 'TRUNCATE')   AS anon_truncate,
--          has_table_privilege('anon', c.oid, 'REFERENCES') AS anon_references,
--          has_table_privilege('anon', c.oid, 'TRIGGER')    AS anon_trigger,
--          has_table_privilege('authenticated', c.oid, 'SELECT')     AS auth_select,
--          has_table_privilege('authenticated', c.oid, 'INSERT')     AS auth_insert,
--          has_table_privilege('authenticated', c.oid, 'UPDATE')     AS auth_update,
--          has_table_privilege('authenticated', c.oid, 'DELETE')     AS auth_delete,
--          has_table_privilege('authenticated', c.oid, 'TRUNCATE')   AS auth_truncate,
--          has_table_privilege('authenticated', c.oid, 'REFERENCES') AS auth_references,
--          has_table_privilege('authenticated', c.oid, 'TRIGGER')    AS auth_trigger
--   FROM pg_class c
--   WHERE c.relnamespace = 'public'::regnamespace
--     AND c.relkind IN ('r', 'p')
--   ORDER BY c.relname;
--
-- V2 — Resumen: ninguna tabla debe conservar un privilegio revocado.
--      Esperado: cero filas.
--
--   SELECT grantee, table_name, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public'
--     AND table_name IN (SELECT relname FROM pg_class
--                        WHERE relnamespace = 'public'::regnamespace
--                          AND relkind IN ('r', 'p'))
--     AND (
--       (grantee = 'anon'
--         AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'))
--       OR
--       (grantee = 'authenticated'
--         AND privilege_type IN ('TRUNCATE','REFERENCES','TRIGGER'))
--     )
--   ORDER BY grantee, table_name, privilege_type;
--
-- V3 — Privilegios de columna de anon con INSERT o UPDATE. Esperado: cero filas.
--
--   SELECT table_name, column_name, privilege_type
--   FROM information_schema.column_privileges
--   WHERE table_schema = 'public'
--     AND grantee = 'anon'
--     AND privilege_type IN ('INSERT', 'UPDATE')
--   ORDER BY table_name, column_name, privilege_type;
--
-- V4 — Las vistas no se tocaron. Esperado: products_seller_view sigue con
--      SELECT para anon y authenticated, igual que antes.
--
--   SELECT table_name, grantee, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public'
--     AND table_name = 'products_seller_view'
--     AND grantee IN ('anon', 'authenticated')
--   ORDER BY grantee, privilege_type;
--
-- V5 — Como anon, el INSERT falla por PRIVILEGIO, no por RLS.
--      Esperado:  ERROR: permission denied for table banners      (42501)
--      Antes de la migracion el error era:
--                 ERROR: new row violates row-level security policy for table "banners"
--      Ambos son 42501: lo que distingue es el texto del mensaje.
--
--   BEGIN;
--   SET LOCAL ROLE anon;
--   INSERT INTO public.banners (titulo) VALUES ('prueba privilegio');
--   ROLLBACK;
--
--      Y TRUNCATE como authenticated. Esperado: permission denied for table banners.
--
--   BEGIN;
--   SET LOCAL ROLE authenticated;
--   TRUNCATE public.banners;
--   ROLLBACK;
--
-- V6 — La funcion del pedido sigue pudiendo escribir (es SECURITY DEFINER).
--      Esperado: prosecdef = true, propietario = postgres.
--
--   SELECT proname, prosecdef, pg_get_userbyid(proowner) AS propietario
--   FROM pg_proc
--   WHERE pronamespace = 'public'::regnamespace
--     AND proname IN ('create_public_order', 'handle_new_user');


-- ═══════════════════════════════════════════════════════════════════════════
-- PRUEBA MANUAL EN LA APP (despues de aplicar)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- SIN SESION, en incognito:
--
-- 1. /tienda, /tienda/grc, /catalogo y /producto/:id de un producto activo.
--    Esperado: cargan productos, banners, videos y testimonios igual que antes.
--
-- 2. Desde /producto/:id (o el modal de /tienda) hacer un pedido de prueba con
--    nombre de cliente "PRUEBA".
--    Esperado: no aparece el aviso "No pudimos registrar el pedido" y se abre
--    WhatsApp. Despues, con sesion, el pedido aparece en /sales y suena el badge.
--    El pedido NO se borra (regla del proyecto); queda identificado por el nombre.
--
--    Confirmacion en el SQL editor:
--      SELECT id, client_name, total_amount, sales_channel, created_at
--      FROM public.sales
--      WHERE client_name = 'PRUEBA'
--      ORDER BY created_at DESC
--      LIMIT 1;
--
-- CON SESION (cuenta de GRC):
--
-- 3. /products: lista, crear un producto y editarlo.
-- 4. /sales: lista, registrar una venta manual y cambiar su estado.
-- 5. /tasks: lista, crear una tarea, asignarla y cerrarla con resultado.
-- 6. /tienda-config → Banners: crear un banner y luego editarlo.
--    Esperado en 3-6: ningun "permission denied" en pantalla ni en la consola.
--
-- 7. En incognito, /registro → registrar una empresa de prueba nueva.
--    Esperado: registro sin error y el Centro carga con la empresa nueva
--    (el trigger escribe como propietario, no como anon). La empresa de prueba
--    no se borra desde la base: desactivarla desde /superadmin.
