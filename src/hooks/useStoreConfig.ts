import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BRAND_DEFAULTS = {
  wa_number: "573226421110",
  store_name: "GRC IMPORTACIONES",
  store_slogan: "Lo mejor del mundo",
  store_logo_url: "",
  store_instagram: "@grc.importaciones",
} as const;

export type BrandKey = keyof typeof BRAND_DEFAULTS;

/**
 * Fetches brand-level configuration from store_config table.
 * Falls back to BRAND_DEFAULTS if a key is not in the DB.
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

  const waNumber = get("wa_number");
  const storeName = get("store_name");
  const storeSlogan = get("store_slogan");
  const logoUrl = get("store_logo_url");
  const instagram = get("store_instagram");

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
    waUrl,
    waGenericUrl,
    get,
  };
}
