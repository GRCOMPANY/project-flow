import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CommandCenterNav } from "@/components/command-center/CommandCenterNav";
import { useToast } from "@/hooks/use-toast";
import {
  Store, Image as ImageIcon, Layout, Tag,
  Plus, Trash2, Upload, Save, ToggleLeft, ToggleRight,
  Loader2, GripVertical, Pencil, X, Check
} from "lucide-react";

/* ──────────────────────────────────────
   TIPOS LOCALES (tablas no generadas aún)
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

/* ──────────────────────────────────────
   HELPERS SUPABASE (tablas dinámicas)
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
  const [uploading, setUploading] = useState(false);

  /* Fetch banners */
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

  /* Toggle active */
  const toggleMut = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      await db.from("banners").update({ activo }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  /* Delete */
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
      let imagen_url: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("banners")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("banners").getPublicUrl(path);
        imagen_url = urlData.publicUrl;
      }

      const orden = (banners?.length ?? 0);
      const { error } = await db.from("banners").insert({
        ...form,
        imagen_url,
        orden,
      });
      if (error) throw error;

      toast({ title: "Banner creado ✓" });
      setForm({ titulo: "", subtitulo: "", texto_boton: "Ver productos", activo: true });
      setPreview(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    } catch (err: unknown) {
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Formulario nuevo banner ── */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Nuevo banner
        </h3>

        {/* Upload */}
        <div
          className="border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-xl object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="w-10 h-10 opacity-40" />
              <p className="text-sm font-medium">Haz clic para subir imagen</p>
              <p className="text-xs">PNG, JPG, WebP — recomendado 1400×500px</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Título *
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              placeholder="Descubre lo mejor"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Subtítulo
            </label>
            <input
              type="text"
              value={form.subtitulo}
              onChange={(e) => setForm((p) => ({ ...p, subtitulo: e.target.value }))}
              placeholder="Oferta limitada"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Texto del botón
            </label>
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
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, activo: !p.activo }))}
                className="transition-colors"
              >
                {form.activo
                  ? <ToggleRight className="w-8 h-8 text-primary" />
                  : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
              </button>
              <span className="text-sm font-medium text-foreground">
                {form.activo ? "Activo" : "Inactivo"}
              </span>
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

      {/* ── Lista banners ── */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          Banners existentes
          {banners.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground font-normal">{banners.length} total</span>
          )}
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

                {/* Thumbnail */}
                <div className="w-20 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {b.imagen_url ? (
                    <img src={b.imagen_url} alt={b.titulo ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{b.titulo || "Sin título"}</p>
                  {b.subtitulo && (
                    <p className="text-xs text-muted-foreground truncate">{b.subtitulo}</p>
                  )}
                  {b.texto_boton && (
                    <span className="inline-block mt-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      Botón: {b.texto_boton}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleMut.mutate({ id: b.id, activo: !b.activo })}
                    title={b.activo ? "Desactivar" : "Activar"}
                    className="transition-colors"
                  >
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
   TAB: HERO
══════════════════════════════════════ */
function HeroTab() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const DEFAULTS = {
    hero_titulo_1: "DESCUBRE",
    hero_titulo_2: "PRODUCTOS",
    hero_titulo_3: "QUE SE",
    hero_titulo_4: "VENDEN SOLOS",
    hero_badge: "Lo más viral en Colombia 2026",
    hero_subtexto: "Lo que ves aquí, en 30 días está en todas partes. Sé el primero.",
    hero_boton_1: "VER PRODUCTOS 🔥",
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
      (data ?? []).forEach((r: StoreConfigRow) => {
        if (r.valor) map[r.clave] = r.valor;
      });
      return map;
    },
  });

  const getValue = (key: keyof typeof DEFAULTS) =>
    config?.[key] ?? DEFAULTS[key];

  const [fields, setFields] = useState<Record<string, string>>({});

  const set = (key: string, val: string) =>
    setFields((p) => ({ ...p, [key]: val }));

  const merged = { ...DEFAULTS, ...config, ...fields };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries({ ...DEFAULTS, ...config, ...fields });
      for (const [clave, valor] of entries) {
        await setConfig(clave, valor);
      }
      toast({ title: "Hero actualizado ✓" });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const FIELD_GROUPS = [
    {
      title: "Títulos del hero",
      fields: [
        { key: "hero_titulo_1", label: "Línea 1", placeholder: "DESCUBRE" },
        { key: "hero_titulo_2", label: "Línea 2 (roja)", placeholder: "PRODUCTOS" },
        { key: "hero_titulo_3", label: "Línea 3", placeholder: "QUE SE" },
        { key: "hero_titulo_4", label: "Línea 4 (subrayada dorada)", placeholder: "VENDEN SOLOS" },
      ],
    },
    {
      title: "Badge y subtexto",
      fields: [
        { key: "hero_badge", label: "Texto del badge superior", placeholder: "Lo más viral en Colombia 2026" },
        { key: "hero_subtexto", label: "Subtexto / descripción", placeholder: "Lo que ves aquí..." },
      ],
    },
    {
      title: "Botones",
      fields: [
        { key: "hero_boton_1", label: "Botón principal (rojo)", placeholder: "VER PRODUCTOS 🔥" },
        { key: "hero_boton_2", label: "Botón secundario (borde)", placeholder: "Hablar con George" },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Preview mini */}
      <div
        className="rounded-2xl p-8 text-center relative overflow-hidden"
        style={{ background: "#111111" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#C1272D]/20 blur-[50px]" />
        </div>
        <span className="relative z-10 inline-block text-[#C1272D] text-xs font-black border border-[#C1272D]/40 bg-[#C1272D]/8 px-3 py-1 rounded-full mb-3">
          {merged.hero_badge}
        </span>
        <h2 className="relative z-10 font-black text-2xl sm:text-3xl text-white leading-tight">
          {merged.hero_titulo_1}<br />
          <span className="text-[#C1272D]">{merged.hero_titulo_2}</span><br />
          {merged.hero_titulo_3}<br />
          <span className="relative inline-block">
            {merged.hero_titulo_4}
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />
          </span>
        </h2>
        <p className="relative z-10 text-gray-400 text-sm mt-3 max-w-sm mx-auto">
          {merged.hero_subtexto}
        </p>
        <div className="relative z-10 flex justify-center gap-3 mt-4 flex-wrap">
          <span className="bg-[#C1272D] text-white font-bold text-xs px-4 py-2 rounded-xl">
            {merged.hero_boton_1}
          </span>
          <span className="border border-white/30 text-white font-bold text-xs px-4 py-2 rounded-xl">
            {merged.hero_boton_2}
          </span>
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
   TAB: CATEGORÍAS
══════════════════════════════════════ */
function CategoriasTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [newCat, setNewCat] = useState<Categoria>({ key: "", icon: "🔥", label: "" });
  const [saving, setSaving] = useState(false);

  /* Fetch */
  const { data: cats = DEFAULT_CATS, isLoading } = useQuery<Categoria[]>({
    queryKey: ["store-config-cats"],
    queryFn: async () => {
      const val = await getConfig("categorias");
      if (!val) return DEFAULT_CATS;
      try {
        return JSON.parse(val) as Categoria[];
      } catch {
        return DEFAULT_CATS;
      }
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
    const updated = [...cats, newCat];
    await saveCats(updated);
    setNewCat({ key: "", icon: "🔥", label: "" });
  };

  const deleteCat = async (idx: number) => {
    const updated = cats.filter((_, i) => i !== idx);
    await saveCats(updated);
  };

  const updateCat = async (idx: number, partial: Partial<Categoria>) => {
    const updated = cats.map((c, i) => (i === idx ? { ...c, ...partial } : c));
    await saveCats(updated);
    setEditingIdx(null);
  };

  const [editBuf, setEditBuf] = useState<Partial<Categoria>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Lista */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          Categorías actuales
        </h3>
        <div className="space-y-2">
          {cats.map((cat, idx) => (
            <div
              key={`${cat.key}-${idx}`}
              className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border"
            >
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Icono emoji
            </label>
            <input
              type="text"
              value={newCat.icon}
              onChange={(e) => setNewCat((p) => ({ ...p, icon: e.target.value }))}
              placeholder="🔥"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-base text-center focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Clave interna
            </label>
            <input
              type="text"
              value={newCat.key}
              onChange={(e) => setNewCat((p) => ({ ...p, key: e.target.value }))}
              placeholder="Cocina"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Etiqueta visible
            </label>
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

      {/* Restore defaults */}
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
type Tab = "banners" | "hero" | "categorias";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "banners",    label: "Banners",    icon: ImageIcon },
  { id: "hero",       label: "Hero",       icon: Layout },
  { id: "categorias", label: "Categorías", icon: Tag },
];

export default function TiendaConfig() {
  const [tab, setTab] = useState<Tab>("banners");

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
              Personaliza el contenido visible en <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/tienda</code>
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
        <div className="flex gap-1 bg-muted/50 p-1 rounded-2xl mb-8 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
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
        {tab === "banners"    && <BannersTab />}
        {tab === "hero"       && <HeroTab />}
        {tab === "categorias" && <CategoriasTab />}
      </div>
    </div>
  );
}
