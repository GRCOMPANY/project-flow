-- Fase 4c (parte 1) — Registro de pedidos de la tienda publica sin abrir sales.
--
-- Problema que resuelve:
--   Hoy el modal de pedido hace un INSERT directo sobre sales desde el navegador.
--   Eso obliga a dejar sales escribible por anon, y ademas deja que el cliente
--   dicte valores que no deberia controlar:
--
--     • company_id  → un visitante puede registrar el pedido en la cuenta de otra
--                     empresa (la misma fuga de la fase 3, pero de escritura).
--     • unit_price  → precio arbitrario, incluido 0.
--     • cost_at_sale = 0 fijo → TODA venta publica entra al panel con margen cero,
--                     asi que aparece en revenue pero no aporta ganancia al
--                     dashboard ni a la rentabilidad por producto.
--
-- Solucion:
--   Una funcion SECURITY DEFINER que recibe solo los datos del comprador y deriva
--   todo lo demas leyendo products. Con esto sales queda CERRADA a anon: no hace
--   falta GRANT INSERT ni politica de INSERT para el rol anonimo. Esta funcion
--   reemplaza el borrador de politica con WITH CHECK que quedo anotado en la
--   seccion 9 de 20260914130000.
--
-- Alcance:
--   Esta migracion NO habilita RLS en sales. Solo crea la via de escritura segura
--   que debe existir ANTES de encenderlo.
--
-- Depends on: 20260914130000_anon_read_policies_public_store.sql


-- ── 1. La funcion ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_public_order(
  p_product_id          uuid,
  p_quantity            integer,
  p_client_name         text,
  p_client_phone        text,
  p_address             text,
  p_notes               text    DEFAULT NULL,
  p_expected_unit_price numeric DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name        text := btrim(coalesce(p_client_name, ''));
  v_phone       text := btrim(coalesce(p_client_phone, ''));
  v_address     text := btrim(coalesce(p_address, ''));
  v_notes       text := btrim(coalesce(p_notes, ''));
  v_company_id  uuid;
  v_wa_number   text;
  v_unit_price  numeric;
  v_cost        numeric;
  v_total       numeric;
  v_margin      numeric;
  v_margin_pct  numeric;
  v_notes_full  text;
  v_sale_id     uuid;
BEGIN
  -- ── Validacion de entrada ──
  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100 THEN
    RAISE EXCEPTION 'Cantidad invalida' USING ERRCODE = '22023';
  END IF;

  IF length(v_name) < 2 OR length(v_name) > 120 THEN
    RAISE EXCEPTION 'Nombre invalido' USING ERRCODE = '22023';
  END IF;

  IF length(v_phone) < 7 OR length(v_phone) > 20 OR v_phone !~ '^[0-9+][0-9 +-]*$' THEN
    RAISE EXCEPTION 'Telefono invalido' USING ERRCODE = '22023';
  END IF;

  IF length(v_address) < 5 OR length(v_address) > 300 THEN
    RAISE EXCEPTION 'Direccion invalida' USING ERRCODE = '22023';
  END IF;

  IF length(v_notes) > 500 THEN
    RAISE EXCEPTION 'Notas demasiado largas' USING ERRCODE = '22023';
  END IF;

  -- ── Producto y empresa ──
  -- El mensaje de error es generico a proposito: distinguir "no existe" de
  -- "inactivo" de "empresa desactivada" convertiria la funcion en un enumerador
  -- del catalogo ajeno.
  SELECT p.company_id,
         p.suggested_price,
         coalesce(p.supplier_price, 0),
         c.wa_number
    INTO v_company_id, v_unit_price, v_cost, v_wa_number
  FROM public.products p
  JOIN public.companies c ON c.id = p.company_id
  WHERE p.id     = p_product_id
    AND p.status = 'activo'
    AND c.activo = true;

  IF NOT FOUND OR v_unit_price IS NULL OR v_unit_price <= 0 THEN
    RAISE EXCEPTION 'Producto no disponible' USING ERRCODE = '22023';
  END IF;

  -- ── Concurrencia optimista sobre el precio ──
  -- Si el precio cambio entre que el visitante cargo la pagina y confirmo, se
  -- rechaza en vez de cobrarle un total distinto del que acepto en pantalla.
  IF p_expected_unit_price IS NOT NULL
     AND round(p_expected_unit_price, 2) <> round(v_unit_price, 2) THEN
    RAISE EXCEPTION 'El precio cambio, recarga la pagina' USING ERRCODE = '22023';
  END IF;

  -- ── Derivados en el servidor ──
  -- La formula de margen replica la de useSales.ts para que las ventas publicas
  -- y las manuales sean comparables en el dashboard.
  v_total      := v_unit_price * p_quantity;
  v_margin     := v_unit_price - v_cost;
  v_margin_pct := CASE WHEN v_cost > 0
                       THEN round(((v_unit_price - v_cost) / v_cost) * 100, 2)
                       ELSE 0
                  END;

  -- Mismo formato de notas que usaba el frontend, para que el panel no cambie.
  v_notes_full := concat_ws(E'\n', 'Direccion: ' || v_address, nullif(v_notes, ''));

  INSERT INTO public.sales (
    company_id, product_id, client_name, client_phone,
    quantity, unit_price, total_amount,
    sales_channel, operational_status, payment_status, order_status,
    sale_type, sale_source, sale_date, notes,
    cost_at_sale, margin_at_sale, margin_percent_at_sale,
    my_percentage, partner_percentage, my_profit_amount, partner_profit_amount,
    seller_id
  ) VALUES (
    v_company_id, p_product_id, v_name, v_phone,
    p_quantity, v_unit_price, v_total,
    'tienda_publica', 'nuevo', 'pendiente', 'pendiente',
    'directa', 'digital', current_date, v_notes_full,
    v_cost, v_margin, v_margin_pct,
    100, 0, v_margin * p_quantity, 0,
    NULL
  )
  RETURNING id INTO v_sale_id;

  RETURN json_build_object(
    'sale_id',      v_sale_id,
    'unit_price',   v_unit_price,
    'total_amount', v_total,
    'wa_number',    v_wa_number
  );
END;
$$;

COMMENT ON FUNCTION public.create_public_order(uuid, integer, text, text, text, text, numeric) IS
  'Registra un pedido de la tienda publica. Unica via de escritura sobre sales '
  'para el rol anon: precio, costo, margen y company_id se derivan de products en '
  'el servidor, nunca se aceptan del cliente.';


-- ── 2. Permisos ───────────────────────────────────────────────────────────────
--
-- Importante lo que NO esta aqui: ningun GRANT INSERT sobre sales para anon y
-- ninguna politica de INSERT para anon. sales queda cerrada; la funcion es la
-- unica puerta, y no acepta precios.

REVOKE ALL ON FUNCTION public.create_public_order(uuid, integer, text, text, text, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_order(uuid, integer, text, text, text, text, numeric) TO anon, authenticated;


-- ── 3. ROLLBACK ───────────────────────────────────────────────────────────────
--
--   DROP FUNCTION IF EXISTS public.create_public_order(uuid, integer, text, text, text, text, numeric);
--
-- Ojo: revertir esto sin revertir tambien el frontend deja la tienda publica sin
-- forma de registrar pedidos — los modales ya no hacen INSERT directo. Si hay que
-- volver atras, revertir primero el codigo (TiendaPublica.tsx y ProductoDetalle.tsx)
-- y solo despues borrar la funcion.


-- ── 4. Pendiente de 4c ────────────────────────────────────────────────────────
--
-- Con la funcion en su lugar, ya se puede encender RLS en sales sin politica de
-- INSERT para anon. Falta decidir en esa migracion:
--
--   • ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY, mas el resto de las
--     tablas que siguen abiertas: tasks, sellers, suppliers, products,
--     companies, company_users.
--   • REVOKE SELECT ON public.sales FROM anon: la tienda publica escribe via la
--     funcion, no necesita leer sales.
--
-- Sin limite de tasa: cualquiera con la publishable key puede llamar la funcion y
-- crear pedidos falsos. Es la misma exposicion que ya existia con el INSERT
-- abierto, no un retroceso, pero queda sin resolver. Un contador por telefono o
-- un captcha en el frontend serian el siguiente paso.
