import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CommandCenterNav } from "@/components/command-center/CommandCenterNav";
import { useToast } from "@/hooks/use-toast";
import {
  Store, Image as ImageIcon, Layout, Tag, Star,
  Plus, Trash2, Upload, Save, ToggleLeft, ToggleRight,
  Loader2, GripVertical, Pencil, X, Check, Palette,
  AlignLeft, Settings2
} from "lucide-react";

/* ──────────────────────────────────────
   TIPOS
────────────────────────────────────── */
interface Banner {
  id: string;
  titulo: string | null;
  subtitulo: string | null;
  texto_boton: string | null;
  imagen_url: string | null;
  activo: boolean;
  orden: number;
  created_at: string;
}

interface StoreConfigRow {
  clave: string;
  valor: string | null;
}

interface Categoria {
  key: string;
  icon: string;
  label: string;
}

interface Testimonio {
  id: string;
  nombre: string;
  texto: string;
  calificacion: number;
  created_at: string;
}

/* ──────────────────────────────────────
   HELPERS SUPABASE
────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const getConfig = async (clave: string): Promise<string | null> => {
  const { data } = await db.from("store_config").select("valor").eq("clave", clave).maybeSingle();
  return data?.valor ?? null;
};

const setConfig = async (clave: string, valor: string) => {
  await db.from("store_config").upsert({ clave, valor }, { onConflict: "clave" });
};

const setConfigBatch = async (entries: Record<string, string>) => {
  const rows = Object.entries(entries).map(([clave, valor]) => ({ clave, valor }));
  await db.from("store_config").upsert(rows, { onConflict: "clave" });
};

/* ──────────────────────────────────────
   DEFAULT CATEGORIES
────────────────────────────────────── */
const DEFAULT_CATS: Categoria[] = [
  { key: "Todos",        icon: "⚡", label: "Todo el catálogo" },
  { key: "Cocina",       icon: "🍳", label: "Cocina inteligente" },
  { key: "Hogar",        icon: "🏠", label: "Hogar del futuro" },
  { key: "Tecnología",   icon: "💡", label: "Tech viral" },
  { key: "Organización", icon: "📦", label: "Organización pro" },
  { key: "General",      icon: "🔥", label: "Productos virales" },
];

/* ══════════════════════════════════════
   TAB: MARCA
══════════════════════════════════════ */
const MARCA_KEYS = [
  "store_name", "store_slogan", "wa_number",
  "store_instagram", "store_logo_url", "color_primario",
] as const;

const MARCA_DEFAULTS: Record<string, string> = {
  store_name:      "GRC IMPORTACIONES",
  store_slogan:    "Lo mejor del mundo",
  wa_number:       "573226421110",
  store_instagram: "@grc.importaciones",
  store_logo_url:  "",
  color_primario:  "#C1272D",
};

function MarcaTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});

  const { data: config, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["store-config-marca"],
    queryFn: async () => {
      const { data } = await db
        .from("store_config")
        .select("clave,valor")
        .in("clave", [...MARCA_KEYS]);
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: StoreConfigRow) => { if (r.valor) map[r.clave] = r.valor; });
      return map;
    },
  });

  const get = (key: string) => fields[key] ?? config?.[key] ?? MARCA_DEFAULTS[key] ?? "";
  const set = (key: string, val: string) => setFields((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const merged = { ...MARCA_DEFAULTS, ...config, ...fields };
      await setConfigBatch(merged);
      toast({ title: "Marca actualizada ✓" });
      qc.invalidateQueries({ queryKey: ["store-config-marca"] });
      qc.invalidateQueries({ queryKey: ["store-brand-config"] });
      qc.invalidateQueries({ queryKey: ["tienda-hero-config"] });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const FIELD_DEFS = [
    { key: "store_name",      label: "Nombre de la tienda",   placeholder: "GRC IMPORTACIONES",          type: "text" },
    { key: "store_slogan",    label: "Slogan",                 placeholder: "Lo mejor del mundo",         type: "text" },
    { key: "wa_number",       label: "Número WhatsApp",        placeholder: "573226421110",               type: "text", hint: "Con código de país, sin + ni espacios" },
    { key: "store_instagram", label: "Instagram",              placeholder: "@grc.importaciones",         type: "text" },
    { key: "store_logo_url",  label: "URL del logo",           placeholder: "https://…/logo.png",         type: "url",  hint: "Déjalo vacío para usar la inicial del nombre" },
    { key: "color_primario",  label: "Color primario",         placeholder: "#C1272D",                    type: "color" },
  ];

  return (
    <div className="space-y-8">
      {/* Preview strip */}
      <div className="rounded-2xl p-6 border border-border bg-card flex items-center gap-4 flex-wrap">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
          style={{ background: get("color_primario") || "#C1272D" }}
        >
          {get("store_logo_url") ? (
            <img src={get("store_logo_url")} alt="" className="w-full h-full object-contain rounded-xl" />
          ) : (
            (get("store_name") || "G").charAt(0)
          )}
        </div>
        <div>
          <p className="font-black text-foreground text-base leading-none">{get("store_name") || "Nombre de tienda"}</p>
          <p className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: get("color_primario") || "#C1272D" }}>
            {get("store_slogan") || "Slogan"}
          </p>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">Vista previa del logo</div>
      </div>

      {/* Fields */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FIELD_DEFS.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                {f.label}
              </label>
              {f.type === "color" ? (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={get(f.key) || "#C1272D"}
                    onChange={(e) => set(f.key, e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-background p-0.5"
                  />
                  <input
                    type="text"
                    value={get(f.key)}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="flex-1 px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors font-mono"
                  />
                </div>
              ) : (
                <input
                  type={f.type === "url" ? "url" : "text"}
                  value={get(f.key)}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                />
              )}
              {f.hint && <p className="text-[11px] text-muted-foreground mt-1">{f.hint}</p>}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar identidad de marca
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   TAB: HERO
══════════════════════════════════════ */
function HeroTab() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const DEFAULTS = {
    hero_titulo_1: "Lo mejor del mundo,",
    hero_titulo_2: "primero en Colombia.",
    hero_badge: "Lo más viral en Colombia 2026",
    hero_subtexto: "Productos innovadores que transforman tu hogar. Los descubrimos antes que todos.",
    hero_boton_1: "Descubrir productos",
    hero_boton_2: "Hablar con George",
  };

  const { data: config, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["store-config-hero"],
    queryFn: async () => {
      const { data } = await db
        .from("store_config")
        .select("clave,valor")
        .in("clave", Object.keys(DEFAULTS));
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: StoreConfigRow) => { if (r.valor) map[r.clave] = r.valor; });
      return map;
    },
  });

  const getValue = (key: keyof typeof DEFAULTS) => config?.[key] ?? DEFAULTS[key];
  const [fields, setFields] = useState<Record<string, string>>({});
  const set = (key: string, val: string) => setFields((p) => ({ ...p, [key]: val }));
  const merged = { ...DEFAULTS, ...config, ...fields };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setConfigBatch({ ...DEFAULTS, ...config, ...fields });
      toast({ title: "Hero actualizado ✓" });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const FIELD_GROUPS = [
    {
      title: "Títulos del hero",
      fields: [
        { key: "hero_titulo_1", label: "Línea 1", placeholder: "Lo mejor del mundo," },
        { key: "hero_titulo_2", label: "Línea 2 (roja)", placeholder: "primero en Colombia." },
      ],
    },
    {
      title: "Badge y subtexto",
      fields: [
        { key: "hero_badge",    label: "Texto del badge superior", placeholder: "Lo más viral en Colombia 2026" },
        { key: "hero_subtexto", label: "Subtexto / descripción",   placeholder: "Productos innovadores..." },
      ],
    },
    {
      title: "Botones",
      fields: [
        { key: "hero_boton_1", label: "Botón principal (rojo)", placeholder: "Descubrir productos" },
        { key: "hero_boton_2", label: "Botón secundario",       placeholder: "Hablar con George" },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Preview */}
      <div className="rounded-2xl p-8 text-center relative overflow-hidden" style={{ background: "#111111" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#C1272D]/20 blur-[50px]" />
        </div>
        <span className="relative z-10 inline-block text-[#C1272D] text-xs font-black border border-[#C1272D]/40 bg-[#C1272D]/8 px-3 py-1 rounded-full mb-3">
          ✦ {merged.hero_badge}
        </span>
        <h2 className="relative z-10 font-black text-2xl sm:text-3xl text-white leading-tight">
          {merged.hero_titulo_1}<br />
          <span className="text-[#C1272D]">{merged.hero_titulo_2}</span>
        </h2>
        <p className="relative z-10 text-gray-400 text-sm mt-3 max-w-sm mx-auto">{merged.hero_subtexto}</p>
        <div className="relative z-10 flex justify-center gap-3 mt-4 flex-wrap">
          <span className="bg-[#C1272D] text-white font-bold text-xs px-4 py-2 rounded-xl">{merged.hero_boton_1}</span>
          <span className="border border-white/30 text-white font-bold text-xs px-4 py-2 rounded-xl">{merged.hero_boton_2}</span>
        </div>
        <p className="absolute bottom-2 right-3 text-[10px] text-white/20">Vista previa</p>
      </div>

      {/* Form groups */}
      {FIELD_GROUPS.map((group) => (
        <div key={group.title} className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-bold text-foreground text-sm">{group.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {group.fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  {f.label}
                </label>
                <input
                  type="text"
                  value={fields[f.key] ?? getValue(f.key as keyof typeof DEFAULTS)}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar cambios en el hero
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   TAB: SECCIONES
══════════════════════════════════════ */
interface SeccionDef {
  key: string;
  label: string;
  desc: string;
  fields?: { key: string; label: string; placeholder: string; multiline?: boolean }[];
}

const SECCIONES: SeccionDef[] = [
  {
    key: "seccion_topbar_activa",
    label: "Barra de anuncio",
    desc: "Franja roja superior con texto y cuenta regresiva",
    fields: [
      { key: "topbar_texto", label: "Texto del anuncio", placeholder: "Lo mejor del mundo, primero en Colombia · Envío gratis a Bogotá" },
    ],
  },
  {
    key: "seccion_hero_activa",
    label: "Sección Hero",
    desc: "Bloque principal con título, subtexto y botones CTA",
  },
  {
    key: "seccion_trust_activa",
    label: "Barra de confianza",
    desc: "Íconos de Envío, Contra entrega, Garantía y Soporte",
  },
  {
    key: "seccion_storytelling_activa",
    label: "Storytelling",
    desc: "Bloque de historia de marca con frase y texto",
    fields: [
      { key: "story_titulo", label: "Frase principal",  placeholder: '"En GRC no vendemos productos comunes."' },
      { key: "story_texto",  label: "Texto secundario", placeholder: "Buscamos lo más innovador del mundo..." },
    ],
  },
  {
    key: "seccion_videos_activa",
    label: "Videos de productos",
    desc: "Galería de videos cortos en formato vertical (reels)",
  },
  {
    key: "seccion_testimonios_activa",
    label: "Testimonios",
    desc: "Reseñas de clientes — gestiona en el tab Testimonios",
  },
];

const SECCIONES_DEFAULTS: Record<string, string> = {
  seccion_topbar_activa:       "true",
  topbar_texto:                "Lo mejor del mundo, primero en Colombia · Envío gratis a Bogotá",
  seccion_hero_activa:         "true",
  seccion_trust_activa:        "true",
  seccion_storytelling_activa: "true",
  story_titulo:                '"En GRC no vendemos productos comunes."',
  story_texto:                 "Buscamos lo más innovador del mundo para que tú lo tengas primero en Colombia.",
  seccion_videos_activa:       "true",
  seccion_testimonios_activa:  "true",
  productos_limite:            "8",
};

function SeccionesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const allKeys = Object.keys(SECCIONES_DEFAULTS);

  const { data: config = {}, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["store-config-secciones"],
    queryFn: async () => {
      const { data } = await db.from("store_config").select("clave,valor").in("clave", allKeys);
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: StoreConfigRow) => { if (r.valor !== null) map[r.clave] = r.valor!; });
      return map;
    },
  });

  const [fields, setFields] = useState<Record<string, string>>({});
  const get = (key: string): string => fields[key] ?? config[key] ?? SECCIONES_DEFAULTS[key] ?? "true";
  const set = (key: string, val: string) => setFields((p) => ({ ...p, [key]: val }));

  const isActive = (key: string) => get(key) !== "false";

  /* Toggle saves immediately */
  const handleToggle = async (key: string) => {
    const next = isActive(key) ? "false" : "true";
    set(key, next);
    try {
      await setConfig(key, next);
      qc.invalidateQueries({ queryKey: ["store-config-secciones"] });
      qc.invalidateQueries({ queryKey: ["tienda-hero-config"] });
    } catch {
      toast({ title: "Error al cambiar toggle", variant: "destructive" });
      set(key, isActive(key) ? "true" : "false"); // revert
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSaveFields = async () => {
    setSaving(true);
    try {
      const toSave: Record<string, string> = {};
      for (const sec of SECCIONES) {
        for (const f of sec.fields ?? []) {
          toSave[f.key] = get(f.key);
        }
      }
      toSave["productos_limite"] = get("productos_limite");
      await setConfigBatch(toSave);
      toast({ title: "Secciones guardadas ✓" });
      qc.invalidateQueries({ queryKey: ["store-config-secciones"] });
      qc.invalidateQueries({ queryKey: ["tienda-hero-config"] });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Los toggles guardan al instante. Los campos de texto se guardan con el botón inferior.
      </p>

      {SECCIONES.map((sec) => (
        <div key={sec.key} className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-start gap-4">
            {/* Toggle */}
            <button
              type="button"
              onClick={() => handleToggle(sec.key)}
              className="mt-0.5 transition-colors flex-shrink-0"
            >
              {isActive(sec.key)
                ? <ToggleRight className="w-8 h-8 text-primary" />
                : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-sm text-foreground">{sec.label}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive(sec.key) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {isActive(sec.key) ? "ON" : "OFF"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{sec.desc}</p>

              {/* Editable fields for this section */}
              {sec.fields && isActive(sec.key) && (
                <div className="space-y-3 pt-2 border-t border-border/50">
                  {sec.fields.map((f) => (
                    <div key={f.key}>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                        {f.label}
                      </label>
                      {f.multiline ? (
                        <textarea
                          value={get(f.key)}
                          onChange={(e) => set(f.key, e.target.value)}
                          placeholder={f.placeholder}
                          rows={3}
                          className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={get(f.key)}
                          onChange={(e) => set(f.key, e.target.value)}
                          placeholder={f.placeholder}
                          className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Productos límite */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="font-semibold text-sm text-foreground mb-1">Límite de productos por tanda</p>
        <p className="text-xs text-muted-foreground mb-3">Cuántos productos mostrar en cada sección del grid</p>
        <input
          type="number"
          min={4}
          max={24}
          value={get("productos_limite")}
          onChange={(e) => set("productos_limite", e.target.value)}
          className="w-28 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <button
        onClick={handleSaveFields}
        disabled={saving}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar textos de secciones
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   TAB: BANNERS
══════════════════════════════════════ */
function BannersTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    titulo: "",
    subtitulo: "",
    texto_boton: "Ver productos",
    activo: true,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await db
        .from("banners")
        .select("*")
        .order("orden", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      await db.from("banners").update({ activo }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await db.from("banners").delete().eq("id", id);
    },
    onSuccess: () => {
      toast({ title: "Banner eliminado" });
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!form.titulo.trim()) {
      toast({ title: "El título es requerido", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      // PASO 1: INSERT sin imagen para aislar si el problema es tabla o storage
      const orden = banners?.length ?? 0;
      const insertPayload = { ...form, imagen_url: null, orden };
      console.log("[banners] PASO 1 - INSERT sin imagen:", insertPayload);
      const { data: inserted, error: insertError } = await db
        .from("banners")
        .insert(insertPayload)
        .select("id")
        .single();
      if (insertError) {
        console.error("[banners] PASO 1 FALLÓ - error en insert:", insertError);
        throw insertError;
      }
      console.log("[banners] PASO 1 OK - banner creado con id:", inserted.id);

      // PASO 2: determinar imagen_url — URL externa tiene prioridad sobre archivo
      const urlTrimmed = externalUrl.trim();
      if (urlTrimmed) {
        console.log("[banners] PASO 2 - usando URL externa:", urlTrimmed);
        const { error: updateError } = await db
          .from("banners")
          .update({ imagen_url: urlTrimmed })
          .eq("id", inserted.id);
        if (updateError) {
          console.error("[banners] PASO 2 - UPDATE con URL externa falló:", updateError);
        } else {
          console.log("[banners] PASO 2 OK - imagen_url actualizada con URL externa");
        }
      } else if (file) {
        console.log("[banners] PASO 2 - upload imagen:", file.name, file.size, "bytes");
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("banners")
          .upload(path, file, { upsert: false });
        if (upErr) {
          console.error("[banners] PASO 2 FALLÓ - error storage:", upErr);
          toast({
            title: "Banner guardado sin imagen",
            description: `Upload falló: ${upErr.message}`,
            variant: "destructive",
          });
        } else {
          const { data: urlData } = supabase.storage.from("banners").getPublicUrl(path);
          const imagen_url = urlData.publicUrl;
          console.log("[banners] PASO 2 OK - imagen subida:", imagen_url);
          const { error: updateError } = await db
            .from("banners")
            .update({ imagen_url })
            .eq("id", inserted.id);
          if (updateError) {
            console.error("[banners] PASO 2 - UPDATE con imagen falló:", updateError);
          } else {
            console.log("[banners] PASO 2 OK - UPDATE con imagen_url completado");
          }
        }
      }

      toast({ title: "Banner creado ✓" });
      setForm({ titulo: "", subtitulo: "", texto_boton: "Ver productos", activo: true });
      setExternalUrl("");
      setPreview(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    } catch (err: unknown) {
      console.error("[banners] Error general al guardar:", err);
      const sbErr = err as { code?: string; message?: string; hint?: string; details?: string };
      const description = sbErr.code
        ? [sbErr.code, sbErr.message, sbErr.hint].filter(Boolean).join(" - ")
        : err instanceof Error
        ? err.message
        : "Intenta de nuevo";
      toast({
        title: "Error al guardar",
        description,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Formulario nuevo banner */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Nuevo banner
        </h3>
        <div
          className="border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {(externalUrl.trim() || preview) ? (
            <img
              src={externalUrl.trim() || preview!}
              alt="preview"
              className="max-h-40 mx-auto rounded-xl object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="w-10 h-10 opacity-40" />
              <p className="text-sm font-medium">Haz clic para subir imagen</p>
              <p className="text-xs">PNG, JPG, WebP — recomendado 1400×500px</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            O pega una URL de imagen externa
          </label>
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
          />
          {externalUrl.trim() && (
            <p className="text-xs text-primary mt-1">✓ Se usará esta URL (prioridad sobre archivo subido)</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Título *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              placeholder="Descubre lo mejor"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Subtítulo</label>
            <input
              type="text"
              value={form.subtitulo}
              onChange={(e) => setForm((p) => ({ ...p, subtitulo: e.target.value }))}
              placeholder="Oferta limitada"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Texto del botón</label>
            <input
              type="text"
              value={form.texto_boton}
              onChange={(e) => setForm((p) => ({ ...p, texto_boton: e.target.value }))}
              placeholder="Ver productos"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-3 cursor-pointer">
              <button type="button" onClick={() => setForm((p) => ({ ...p, activo: !p.activo }))}>
                {form.activo
                  ? <ToggleRight className="w-8 h-8 text-primary" />
                  : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
              </button>
              <span className="text-sm font-medium text-foreground">{form.activo ? "Activo" : "Inactivo"}</span>
            </label>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar banner
        </button>
      </div>

      {/* Lista banners */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          Banners existentes
          {banners.length > 0 && <span className="ml-auto text-xs text-muted-foreground font-normal">{banners.length} total</span>}
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay banners todavía</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((b) => (
              <div
                key={b.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  b.activo ? "border-border bg-background" : "border-border/40 bg-muted/20 opacity-60"
                }`}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                <div className="w-20 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {b.imagen_url ? (
                    <img src={b.imagen_url} alt={b.titulo ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{b.titulo || "Sin título"}</p>
                  {b.subtitulo && <p className="text-xs text-muted-foreground truncate">{b.subtitulo}</p>}
                  {b.texto_boton && (
                    <span className="inline-block mt-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      Botón: {b.texto_boton}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleMut.mutate({ id: b.id, activo: !b.activo })}>
                    {b.activo
                      ? <ToggleRight className="w-6 h-6 text-primary" />
                      : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
                  </button>
                  <button
                    onClick={() => deleteMut.mutate(b.id)}
                    disabled={deleteMut.isPending}
                    className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   TAB: TESTIMONIOS
══════════════════════════════════════ */
function TestimoniosTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ nombre: "", texto: "", calificacion: 5 });
  const [saving, setSaving] = useState(false);

  const { data: testimonios = [], isLoading } = useQuery<Testimonio[]>({
    queryKey: ["admin-testimonios"],
    queryFn: async () => {
      const { data, error } = await db
        .from("testimonios")
        .select("id, nombre, texto, calificacion, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("testimonios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Testimonio eliminado" });
      qc.invalidateQueries({ queryKey: ["admin-testimonios"] });
      qc.invalidateQueries({ queryKey: ["tienda-testimonios"] });
    },
    onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
  });

  const handleAdd = async () => {
    if (!form.nombre.trim() || !form.texto.trim()) {
      toast({ title: "Nombre y texto son requeridos", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await db.from("testimonios").insert({
        nombre: form.nombre.trim(),
        texto: form.texto.trim(),
        calificacion: form.calificacion,
      });
      if (error) throw error;
      toast({ title: "Testimonio agregado ✓" });
      setForm({ nombre: "", texto: "", calificacion: 5 });
      qc.invalidateQueries({ queryKey: ["admin-testimonios"] });
      qc.invalidateQueries({ queryKey: ["tienda-testimonios"] });
    } catch (err: unknown) {
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star
            className={`w-6 h-6 transition-colors ${n <= value ? "fill-[#D4AF37] text-[#D4AF37]" : "text-muted-foreground"}`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Formulario */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Agregar testimonio
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Nombre del cliente *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Valentina R."
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Calificación
            </label>
            <StarPicker value={form.calificacion} onChange={(v) => setForm((p) => ({ ...p, calificacion: v }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Testimonio *
            </label>
            <textarea
              value={form.texto}
              onChange={(e) => setForm((p) => ({ ...p, texto: e.target.value }))}
              placeholder="Vi el producto, lo compré sin pensarlo dos veces..."
              rows={3}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Agregar testimonio
        </button>
      </div>

      {/* Lista */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          Testimonios existentes
          {testimonios.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground font-normal">{testimonios.length} total</span>
          )}
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : testimonios.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay testimonios todavía</p>
            <p className="text-xs mt-1">La tienda mostrará ejemplos por defecto</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testimonios.map((t) => (
              <div key={t.id} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-background">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
                  {t.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-foreground">{t.nombre}</p>
                    <div className="flex gap-0.5">
                      {[...Array(t.calificacion)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">"{t.texto}"</p>
                </div>
                <button
                  onClick={() => deleteMut.mutate(t.id)}
                  disabled={deleteMut.isPending}
                  className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   TAB: CATEGORÍAS
══════════════════════════════════════ */
function CategoriasTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [newCat, setNewCat] = useState<Categoria>({ key: "", icon: "🔥", label: "" });
  const [saving, setSaving] = useState(false);

  const { data: cats = DEFAULT_CATS, isLoading } = useQuery<Categoria[]>({
    queryKey: ["store-config-cats"],
    queryFn: async () => {
      const val = await getConfig("categorias");
      if (!val) return DEFAULT_CATS;
      try { return JSON.parse(val) as Categoria[]; } catch { return DEFAULT_CATS; }
    },
  });

  const saveCats = async (updated: Categoria[]) => {
    setSaving(true);
    try {
      await setConfig("categorias", JSON.stringify(updated));
      toast({ title: "Categorías actualizadas ✓" });
      qc.invalidateQueries({ queryKey: ["store-config-cats"] });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addCat = async () => {
    if (!newCat.key.trim() || !newCat.label.trim()) {
      toast({ title: "Nombre e icono requeridos", variant: "destructive" });
      return;
    }
    await saveCats([...cats, newCat]);
    setNewCat({ key: "", icon: "🔥", label: "" });
  };

  const deleteCat = async (idx: number) => saveCats(cats.filter((_, i) => i !== idx));

  const [editBuf, setEditBuf] = useState<Partial<Categoria>>({});

  const updateCat = async (idx: number, partial: Partial<Categoria>) => {
    const updated = cats.map((c, i) => (i === idx ? { ...c, ...partial } : c));
    await saveCats(updated);
    setEditingIdx(null);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" /> Categorías actuales
        </h3>
        <div className="space-y-2">
          {cats.map((cat, idx) => (
            <div key={`${cat.key}-${idx}`} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border">
              {editingIdx === idx ? (
                <>
                  <input
                    type="text"
                    value={editBuf.icon ?? cat.icon}
                    onChange={(e) => setEditBuf((p) => ({ ...p, icon: e.target.value }))}
                    className="w-14 px-2 py-1.5 bg-muted border border-border rounded-lg text-center text-base focus:outline-none focus:border-primary"
                    placeholder="🔥"
                  />
                  <input
                    type="text"
                    value={editBuf.key ?? cat.key}
                    onChange={(e) => setEditBuf((p) => ({ ...p, key: e.target.value }))}
                    placeholder="Clave (ej: Cocina)"
                    className="w-28 px-2 py-1.5 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    value={editBuf.label ?? cat.label}
                    onChange={(e) => setEditBuf((p) => ({ ...p, label: e.target.value }))}
                    placeholder="Etiqueta visible"
                    className="flex-1 px-2 py-1.5 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => updateCat(idx, editBuf)}
                    disabled={saving}
                    className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingIdx(null)}
                    className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xl w-8 text-center flex-shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{cat.label}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">key: {cat.key}</p>
                  </div>
                  <button
                    onClick={() => { setEditingIdx(idx); setEditBuf({}); }}
                    className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteCat(idx)}
                    disabled={saving}
                    className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agregar nueva */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Nueva categoría
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Icono emoji</label>
            <input
              type="text"
              value={newCat.icon}
              onChange={(e) => setNewCat((p) => ({ ...p, icon: e.target.value }))}
              placeholder="🔥"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-base text-center focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Clave interna</label>
            <input
              type="text"
              value={newCat.key}
              onChange={(e) => setNewCat((p) => ({ ...p, key: e.target.value }))}
              placeholder="Cocina"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Etiqueta visible</label>
            <input
              type="text"
              value={newCat.label}
              onChange={(e) => setNewCat((p) => ({ ...p, label: e.target.value }))}
              placeholder="Cocina inteligente"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        <button
          onClick={addCat}
          disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Agregar categoría
        </button>
      </div>

      <button
        onClick={() => saveCats(DEFAULT_CATS)}
        disabled={saving}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
      >
        Restaurar categorías por defecto
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   PAGE PRINCIPAL
══════════════════════════════════════ */
type Tab = "marca" | "hero" | "secciones" | "banners" | "testimonios" | "categorias";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "marca",       label: "Marca",       icon: Palette },
  { id: "hero",        label: "Hero",        icon: Layout },
  { id: "secciones",   label: "Secciones",   icon: Settings2 },
  { id: "banners",     label: "Banners",     icon: ImageIcon },
  { id: "testimonios", label: "Testimonios", icon: Star },
  { id: "categorias",  label: "Categorías",  icon: Tag },
];

export default function TiendaConfig() {
  const [tab, setTab] = useState<Tab>("marca");

  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />

      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuración de Tienda</h1>
            <p className="text-sm text-muted-foreground">
              Personaliza el contenido visible en{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/tienda</code>
            </p>
          </div>
          <a
            href="/tienda"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1"
          >
            Ver tienda →
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-2xl mb-8 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                tab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "marca"       && <MarcaTab />}
        {tab === "hero"        && <HeroTab />}
        {tab === "secciones"   && <SeccionesTab />}
        {tab === "banners"     && <BannersTab />}
        {tab === "testimonios" && <TestimoniosTab />}
        {tab === "categorias"  && <CategoriasTab />}
      </div>
    </div>
  );
}
