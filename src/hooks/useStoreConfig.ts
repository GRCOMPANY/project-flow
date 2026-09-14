import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";

export const BRAND_DEFAULTS = {
  // Defaults NEUTROS a proposito. La identidad de cada empresa vive en
  // store_config y se edita desde /tienda-config; nada de marca va aqui.
  // Consecuencia: con estos valores la tienda publica oculta las secciones
  // vacias y no pinta CTAs de WhatsApp (ver waConfigured).
  // ── Identidad de marca ──────────────────────────────────────
  wa_number:        "",
  store_name:       "Mi tienda",
  store_slogan:     "",
  store_logo_url:   "",
  store_instagram:  "",
  color_primario:   "#1A1A1A",
  // ── Secciones — visibilidad ("true" | "false") ───────────────
  seccion_topbar_activa:        "true",
  topbar_texto:                 "",
  seccion_hero_activa:          "true",
  seccion_trust_activa:         "true",
  trust_items:                  "[]",
  productos_limite:             "8",
  seccion_storytelling_activa:  "true",
  story_titulo:                 "",
  story_texto:                  "",
  seccion_videos_activa:        "true",
  seccion_testimonios_activa:   "true",
  // ── Página de producto ──────────────────────────────────────
  garantia_1:       "",
  garantia_2:       "",
  garantia_3:       "",
  badge_1:          "",
  badge_2:          "",
  badge_3:          "",
  caracteristica_1: "",
  caracteristica_2: "",
  caracteristica_3: "",
  caracteristica_4: "",
  caracteristica_5: "",
  caracteristica_6: "",
} as const;

export type BrandKey = keyof typeof BRAND_DEFAULTS;

/**
 * Fetches all store configuration from store_config table.
 * Falls back to BRAND_DEFAULTS if a key is missing from the DB.
 * Results are cached for 5 minutes.
 */
export function useStoreConfig() {
  const db = supabase as any;
  const { companyId } = useCompany();

  const { data = {} } = useQuery({
    queryKey: ["store-brand-config", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await db
        .from("store_config")
        .select("clave, valor")
        .eq("company_id", companyId)
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
  const waConfigured  = !!(data as Record<string, string>)['wa_number'];
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
    waConfigured,
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
