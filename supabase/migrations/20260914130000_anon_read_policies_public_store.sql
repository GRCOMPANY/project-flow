-- Fase 4b — Acceso de lectura anonimo para la tienda publica.
--
-- Objetivo:
--   Dejar preparado el rol anon ANTES de encender RLS (fase 4c). Hoy la tienda
--   publica lee sin sesion y funciona solo porque RLS esta apagado: en cuanto se
--   encienda, /tienda, /tienda/:slug, /catalogo y /producto/:id se quedan sin datos.
--
-- Decisiones tomadas (no re-discutir aqui):
--   • products queda CERRADO a anon. Los visitantes leen exclusivamente por
--     products_seller_view.
--   • La vista sigue exponiendo wholesale_price. Cerrar /catalogo a revendedores
--     es una tarea posterior e independiente.
--
-- Criterio: cada politica se acota a lo minimo que la ruta publica necesita
--   — empresa activa, producto activo, contenido activo — y las columnas se
--   recortan con GRANT a nivel de columna. RLS filtra FILAS; los GRANT filtran
--   COLUMNAS. Hacen falta los dos: sin el GRANT, una politica de fila deja leer
--   la tabla entera columna por columna via /rest/v1/<tabla>?select=*.
--
-- Alcance deliberado:
--   Esta migracion NO habilita RLS y NO abre escrituras. El INSERT anonimo sobre
--   sales que hace el modal de pedido queda sin resolver (ver seccion 8).
--
-- Depends on: 20260914120000_fix_recursive_company_rls_policies.sql


-- ── 1. products_seller_view — unica puerta de entrada a productos ─────────────
--
-- Se recrea por dos motivos:
--
--   a) security_invoker = true hace que la vista corra con los permisos de quien
--      la consulta, heredando la RLS de products. Con products cerrado a anon la
--      vista devolveria cero filas. Con security_invoker = false corre como su
--      propietario y la proyeccion de columnas seguras vuelve a ser posible.
--      Esto reactiva el aviso "Security Definer View" del Advisor: es el efecto
--      buscado, no un descuido.
--
--   b) La definicion versionada (20260326021329) no expone company_id, pero la
--      vista viva si — el frontend filtra por esa columna. Se corrige el drift.
--
-- Se agrega ademas el JOIN a companies: los productos de una empresa desactivada
-- dejan de ser visibles. El panel admin no usa la vista (lee products directo),
-- asi que el cambio solo afecta a las rutas publicas.

DROP VIEW IF EXISTS public.products_seller_view;

CREATE VIEW public.products_seller_view
WITH (security_invoker = false) AS
SELECT
  p.id,
  p.company_id,
  p.name,
  p.sku,
  p.category,
  p.status,
  p.wholesale_price,
  p.suggested_price AS retail_price,
  p.image_url,
  p.images,
  p.description,
  p.is_featured,
  p.main_channel,
  p.delivery_type,
  p.created_at,
  p.updated_at
FROM public.products p
JOIN public.companies c ON c.id = p.company_id
WHERE p.status = 'activo'
  AND c.activo = true;

COMMENT ON VIEW public.products_seller_view IS
  'Proyeccion publica de products: solo productos activos de empresas activas y '
  'solo columnas seguras (sin supplier_price, price ni internal_notes). '
  'security_invoker = false a proposito: es la unica via por la que anon accede a '
  'productos, con products cerrado bajo RLS.';

GRANT SELECT ON public.products_seller_view TO anon, authenticated;

-- products cerrado a anon tambien a nivel de privilegio, no solo de RLS: si en el
-- futuro alguien agrega una politica permisiva por error, el GRANT ya no esta.
REVOKE SELECT ON public.products FROM anon;


-- ── 2. companies — empresa activa, columnas publicas ──────────────────────────
--
-- Lo leen las cuatro rutas: por slug (/tienda/:slug), por is_grc (/tienda y
-- /catalogo) y por id (/producto/:id, para resolver el wa_number del pedido).
--
-- El recorte de columnas importa: sin el, anon podria leer owner_user_id, plan y
-- el JSON de onboarding de cualquier empresa activa.

REVOKE SELECT ON public.companies FROM anon;
GRANT  SELECT (id, name, slug, wa_number, logo_url, color_primario, is_grc, activo)
  ON public.companies TO anon;

CREATE POLICY "Anon reads active companies"
  ON public.companies
  FOR SELECT
  TO anon
  USING (activo = true);


-- ── 3. banners — hero de /tienda y /tienda/:slug ──────────────────────────────

CREATE POLICY "Anon reads active banners of active companies"
  ON public.banners
  FOR SELECT
  TO anon
  USING (
    activo = true
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = banners.company_id
        AND c.activo = true
    )
  );


-- ── 4. testimonios — bloque de resenas en /producto/:id ───────────────────────
--
-- La pagina publica solo lee testimonios de producto (filtra por product_id).
-- Los testimonios a nivel de empresa que crea /tienda-config (product_id NULL)
-- quedan fuera a proposito: hoy nadie los muestra en publico.

CREATE POLICY "Anon reads active testimonials of active products"
  ON public.testimonios
  FOR SELECT
  TO anon
  USING (
    activo = true
    AND EXISTS (
      SELECT 1
      FROM public.products p
      JOIN public.companies c ON c.id = p.company_id
      WHERE p.id = testimonios.product_id
        AND p.status = 'activo'
        AND c.activo = true
    )
  );


-- ── 5. product_videos — galeria de /producto/:id ──────────────────────────────
--
-- Se resuelve via products en vez de por company_id: la relacion product_id es la
-- unica que el codigo usa sobre esta tabla, y asi la politica no depende de que
-- product_videos tenga columna de empresa.

CREATE POLICY "Anon reads active videos of active products"
  ON public.product_videos
  FOR SELECT
  TO anon
  USING (
    activo = true
    AND EXISTS (
      SELECT 1
      FROM public.products p
      JOIN public.companies c ON c.id = p.company_id
      WHERE p.id = product_videos.product_id
        AND p.status = 'activo'
        AND c.activo = true
    )
  );


-- ── 6. creatives — video principal de la galeria de producto ──────────────────
--
-- ProductoDetalle busca un creativo publicado con video para encabezar la galeria.
-- creatives guarda metricas, aprendizajes y notas internas, asi que el recorte de
-- columnas aqui no es opcional.

REVOKE SELECT ON public.creatives FROM anon;
GRANT  SELECT (id, product_id, status, video_url, published_at)
  ON public.creatives TO anon;

CREATE POLICY "Anon reads published creative videos"
  ON public.creatives
  FOR SELECT
  TO anon
  USING (
    status = 'publicado'
    AND video_url IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.products p
      JOIN public.companies c ON c.id = p.company_id
      WHERE p.id = creatives.product_id
        AND p.status = 'activo'
        AND c.activo = true
    )
  );


-- ── 7. store_config — identidad de marca de la tienda publica ─────────────────
--
-- Necesario pero todavia NO suficiente. useStoreConfig corre con
-- enabled: !!companyId, y companyId viene de useCompany(), que es null sin sesion:
-- hoy un visitante nunca dispara esta query y siempre ve los BRAND_DEFAULTS
-- neutros. Para que esta politica sirva hace falta ademas un cambio de frontend
-- que lea store_config por la empresa resuelta (slug / is_grc), no por useCompany().
--
-- Se deja la politica igual para que el frontend no quede bloqueado por la base
-- cuando se haga ese cambio.

CREATE POLICY "Anon reads store config of active companies"
  ON public.store_config
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = store_config.company_id
        AND c.activo = true
    )
  );


-- ── 8. ROLLBACK ───────────────────────────────────────────────────────────────
--
-- Mientras RLS siga apagado las politicas no se evaluan; lo que si tiene efecto
-- inmediato son los GRANT/REVOKE y la redefinicion de la vista. El rollback
-- restaura ambas cosas.
--
--   DROP POLICY IF EXISTS "Anon reads active companies"                   ON public.companies;
--   DROP POLICY IF EXISTS "Anon reads active banners of active companies" ON public.banners;
--   DROP POLICY IF EXISTS "Anon reads active testimonials of active products" ON public.testimonios;
--   DROP POLICY IF EXISTS "Anon reads active videos of active products"   ON public.product_videos;
--   DROP POLICY IF EXISTS "Anon reads published creative videos"          ON public.creatives;
--   DROP POLICY IF EXISTS "Anon reads store config of active companies"   ON public.store_config;
--
--   GRANT SELECT ON public.companies TO anon;
--   GRANT SELECT ON public.creatives TO anon;
--   GRANT SELECT ON public.products  TO anon;
--
--   DROP VIEW IF EXISTS public.products_seller_view;
--   CREATE VIEW public.products_seller_view
--   WITH (security_invoker = true) AS
--   SELECT
--     id, name, sku, category, status,
--     wholesale_price, suggested_price as retail_price,
--     image_url, images,
--     description, is_featured,
--     main_channel, delivery_type,
--     created_at, updated_at
--   FROM public.products
--   WHERE status = 'activo';
--   GRANT SELECT ON public.products_seller_view TO anon, authenticated;
--
-- Nota: la vista restaurada vuelve a quedar SIN company_id, que es como esta en
-- control de versiones pero NO como esta en la base. Si se revierte, el frontend
-- pierde el filtro por empresa en las rutas publicas. Revertir solo como vuelta
-- atras inmediata.


-- ── 9. Bloqueante para la fase 4c, NO resuelto aqui ───────────────────────────
--
-- El modal de pedido de la tienda publica INSERTA en sales sin sesion
-- (TiendaPublica.tsx:368 y ProductoDetalle.tsx:206). Al encender RLS en sales sin
-- politica de INSERT para anon, los pedidos dejan de registrarse EN SILENCIO: el
-- codigo envuelve el insert en try/catch y abre WhatsApp igual, asi que el
-- visitante no ve ningun error y el pedido no llega al panel.
--
-- Decidir en 4c. Borrador acotado, con WITH CHECK que impide falsear importes:
--
--   CREATE POLICY "Anon creates orders from the public store"
--     ON public.sales FOR INSERT TO anon
--     WITH CHECK (
--       sales_channel = 'tienda_publica'
--       AND payment_status = 'pendiente'
--       AND order_status   = 'pendiente'
--       AND EXISTS (
--         SELECT 1 FROM public.companies c
--         WHERE c.id = sales.company_id AND c.activo = true
--       )
--     );
--
-- Ojo: anon necesitaria tambien GRANT INSERT sobre las columnas correspondientes,
-- y conviene revisar si conviene exponer el INSERT directo o moverlo a una
-- funcion SECURITY DEFINER / edge function que valide precio contra products.
