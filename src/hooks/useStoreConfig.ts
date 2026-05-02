import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BRAND_DEFAULTS = {
  // ── Identidad de marca ──────────────────────────────────────
  wa_number:        "573226421110",
  store_name:       "GRC IMPORTACIONES",
  store_slogan:     "Lo mejor del mundo",
  store_logo_url:   "",
  store_instagram:  "@grc.importaciones",
  color_primario:   "#C1272D",
  // ── Secciones — visibilidad ("true" | "false") ───────────────
  seccion_topbar_activa:        "true",
  topbar_texto:                 "Lo mejor del mundo, primero en Colombia · Envío gratis a Bogotá",
  seccion_hero_activa:          "true",
  seccion_trust_activa:         "true",
  trust_items:                  JSON.stringify([
    { title: "Envío a Colombia",  sub: "Todo el país"           },
    { title: "Contra entrega",    sub: "Pagas al recibir"        },
    { title: "Garantía GRC",      sub: "Satisfacción asegurada"  },
    { title: "Soporte WhatsApp",  sub: "Respuesta en minutos"    },
  ]),
  productos_limite:             "8",
  seccion_storytelling_activa:  "true",
  story_titulo:                 '"En GRC no vendemos productos comunes."',
  story_texto:                  "Buscamos lo más innovador del mundo para que tú lo tengas primero en Colombia.",
  seccion_videos_activa:        "true",
  seccion_testimonios_activa:   "true",
} as const;

export type BrandKey = keyof typeof BRAND_DEFAULTS;

/**
 * Fetches all store configuration from store_config table.
 * Falls back to BRAND_DEFAULTS if a key is missing from the DB.
 * Results are cached for 5 minutes.
 */
export function useStoreConfig() {
  const db = supabase as any;

  const { data = {} } = useQuery({
    queryKey: ["store-brand-config"],
    queryFn: async () => {
      const { data } = await db
        .from("store_config")
        .select("clave, valor")
        .in("clave", Object.keys(BRAND_DEFAULTS));
      const map: Record<string, string> = {};
      (data ?? []).forEach((row: { clave: string; valor: string }) => {
        map[row.clave] = row.valor;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const get = (key: BrandKey): string =>
    (data as Record<string, string>)[key] ?? BRAND_DEFAULTS[key];

  /** Returns true unless the stored value is exactly "false" */
  const isActive = (key: BrandKey): boolean => get(key) !== "false";

  const waNumber      = get("wa_number");
  const storeName     = get("store_name");
  const storeSlogan   = get("store_slogan");
  const logoUrl       = get("store_logo_url");
  const instagram     = get("store_instagram");
  const primaryColor  = get("color_primario");

  const waUrl = (msg: string) =>
    `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

  const waGenericUrl = waUrl(
    `Hola ${storeName} 👋 Quiero ver los productos disponibles`
  );

  return {
    waNumber,
    storeName,
    storeSlogan,
    logoUrl,
    instagram,
    primaryColor,
    waUrl,
    waGenericUrl,
    get,
    isActive,
  };
}
