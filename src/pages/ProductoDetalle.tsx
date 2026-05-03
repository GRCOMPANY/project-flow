import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Package, X, Instagram,
  Loader2, Video, ToggleLeft, ToggleRight,
} from "lucide-react";

/* ─── utils ──────────────────────────────────────────────── */
const fmt = (v: number | null) => (v != null ? `$${v.toLocaleString("es-CO")}` : "");
const db = supabase as any;

/* ─── types ──────────────────────────────────────────────── */
interface ProductData {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  images: string[] | null;
  retail_price: number | null;
  is_featured: boolean | null;
  wholesale_price: number | null;
  sku: string | null;
  delivery_type: string | null;
}

interface RelatedProduct {
  id: string;
  name: string;
  image_url: string | null;
  retail_price: number | null;
  category: string | null;
}

interface ProductVideo {
  id: string;
  video_url: string;
  titulo: string | null;
  activo: boolean;
  orden: number;
}

interface VideoSlot {
  id: string | null;
  video_url: string;
  activo: boolean;
}

/* ─── WA SVG ─────────────────────────────────────────────── */
const WASvg = ({ cls = "w-5 h-5" }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={`${cls} fill-current flex-shrink-0`}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ─── Gallery ────────────────────────────────────────────── */
const Gallery = ({
  images,
  videoUrl,
  productName,
}: {
  images: string[];
  videoUrl: string | null;
  productName: string;
}) => {
  const [activeImg, setActiveImg] = useState(images[0] ?? "/placeholder.svg");
  const [tab, setTab] = useState<"photo" | "video">("photo");
  const [fading, setFading] = useState(false);

  const changeImg = (src: string) => {
    if (src === activeImg) return;
    setFading(true);
    setTimeout(() => {
      setActiveImg(src);
      setFading(false);
    }, 180);
  };

  return (
    <div className="space-y-3">
      {/* Tabs — solo si hay video */}
      {videoUrl && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {(["photo", "video"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-white text-[#C1272D] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "photo" ? "📷 Fotos" : "▶ Video"}
            </button>
          ))}
        </div>
      )}

      {/* Imagen / Video principal */}
      <div
        className="rounded-xl overflow-hidden aspect-square flex items-center justify-center"
        style={{ background: "#F8F8F8", borderRadius: 12 }}
      >
        {tab === "video" && videoUrl ? (
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img
            src={activeImg}
            alt={productName}
            className={`w-full h-full object-contain transition-opacity duration-200 ${
              fading ? "opacity-0" : "opacity-100"
            }`}
          />
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && tab === "photo" && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => changeImg(img)}
              className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
              style={{
                borderColor: activeImg === img ? "#C1272D" : "transparent",
                background: "#F8F8F8",
                borderRadius: 8,
              }}
            >
              <img src={img} alt="" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Video Admin Modal ──────────────────────────────────── */
const VideoAdminModal = ({
  productId,
  onClose,
}: {
  productId: string;
  onClose: () => void;
}) => {
  const qc = useQueryClient();
  const [slots, setSlots] = useState<VideoSlot[]>([
    { id: null, video_url: "", activo: true },
    { id: null, video_url: "", activo: true },
    { id: null, video_url: "", activo: true },
  ]);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { data: existingVideos, isLoading } = useQuery({
    queryKey: ["admin-product-videos", productId],
    queryFn: async () => {
      const { data } = await db
        .from("product_videos")
        .select("id, video_url, activo, orden")
        .eq("product_id", productId)
        .order("orden", { ascending: true });
      return (data ?? []) as ProductVideo[];
    },
  });

  useEffect(() => {
    if (existingVideos && !initialized) {
      setSlots(
        Array.from({ length: 3 }, (_, i) => ({
          id: existingVideos[i]?.id ?? null,
          video_url: existingVideos[i]?.video_url ?? "",
          activo: existingVideos[i]?.activo ?? true,
        }))
      );
      setInitialized(true);
    }
  }, [existingVideos, initialized]);

  const updateSlot = (i: number, patch: Partial<VideoSlot>) =>
    setSlots((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await db.from("product_videos").delete().eq("product_id", productId);
      const toInsert = slots
        .filter((s) => s.video_url.trim())
        .map((s, i) => ({
          product_id: productId,
          video_url: s.video_url.trim(),
          activo: s.activo,
          orden: i,
        }));
      if (toInsert.length > 0) {
        await db.from("product_videos").insert(toInsert);
      }
      qc.invalidateQueries({ queryKey: ["producto-videos", productId] });
      qc.invalidateQueries({ queryKey: ["producto-gallery-video", productId] });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Gestionar videos del producto</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Hasta 3 videos en formato vertical (9:16). Pega la URL directa del video (.mp4, etc.).
        </p>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-400 w-5 text-center flex-shrink-0">
                  {i + 1}
                </span>
                <input
                  type="url"
                  value={slot.video_url}
                  onChange={(e) => updateSlot(i, { video_url: e.target.value })}
                  placeholder="https://... (URL del video)"
                  className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#C1272D] transition-colors min-w-0"
                />
                <button
                  type="button"
                  onClick={() => updateSlot(i, { activo: !slot.activo })}
                  className="flex-shrink-0"
                  title={slot.activo ? "Activo" : "Inactivo"}
                >
                  {slot.activo ? (
                    <ToggleRight className="w-7 h-7 text-[#C1272D]" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-gray-300" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-[#C1272D] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Loading skeleton ───────────────────────────────────── */
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-white">
    <div className="h-9 bg-[#C1272D]" />
    <div className="h-14 bg-white border-b border-gray-100" />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
        <div className="space-y-5 pt-2">
          <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-9 w-3/4 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-12 w-2/5 bg-gray-100 rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-px bg-gray-100" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
          <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

/* ─── Main ───────────────────────────────────────────────── */
export default function ProductoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { storeName, storeSlogan, logoUrl, instagram, waGenericUrl, waUrl } =
    useStoreConfig();

  const [qty, setQty] = useState(1);
  const [showVideoAdmin, setShowVideoAdmin] = useState(false);

  /* ── Product ── */
  const { data: product, isLoading } = useQuery({
    queryKey: ["producto-detalle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_seller_view")
        .select(
          "id, name, description, category, image_url, images, retail_price, is_featured, wholesale_price, sku, delivery_type"
        )
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as ProductData;
    },
    enabled: !!id,
  });

  /* ── Gallery video (creatives → product_videos fallback) ── */
  const { data: galleryVideoUrl = null } = useQuery({
    queryKey: ["producto-gallery-video", id],
    queryFn: async () => {
      const { data: creative } = await supabase
        .from("creatives")
        .select("video_url")
        .eq("product_id", id!)
        .not("video_url", "is", null)
        .eq("status", "publicado")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (creative?.video_url) return creative.video_url as string;
      const { data: pv } = await db
        .from("product_videos")
        .select("video_url")
        .eq("product_id", id!)
        .eq("activo", true)
        .order("orden", { ascending: true })
        .limit(1)
        .maybeSingle();
      return (pv?.video_url as string) ?? null;
    },
    enabled: !!id,
  });

  /* ── Product videos section (up to 3) ── */
  const { data: productVideos = [] } = useQuery({
    queryKey: ["producto-videos", id],
    queryFn: async () => {
      const { data } = await db
        .from("product_videos")
        .select("id, video_url, titulo, activo, orden")
        .eq("product_id", id!)
        .eq("activo", true)
        .order("orden", { ascending: true })
        .limit(3);
      return (data ?? []) as ProductVideo[];
    },
    enabled: !!id,
  });

  /* ── Related products (same category) ── */
  const { data: related = [] } = useQuery({
    queryKey: ["producto-related", id, product?.category],
    queryFn: async () => {
      const base = db
        .from("products_seller_view")
        .select("id, name, image_url, retail_price, category")
        .eq("status", "activo")
        .neq("id", id!);
      const { data } = await (
        product?.category ? base.eq("category", product.category) : base
      ).limit(4);
      return (data ?? []) as RelatedProduct[];
    },
    enabled: !!id && !!product,
  });

  /* ── Derived ── */
  const allImages = (() => {
    if (!product) return ["/placeholder.svg"];
    const imgs: string[] = [];
    if (product.image_url) imgs.push(product.image_url);
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && !imgs.includes(img)) imgs.push(img);
      });
    }
    return imgs.length > 0 ? imgs : ["/placeholder.svg"];
  })();

  const unitPrice = product?.retail_price ?? null;
  const totalPrice = unitPrice !== null ? unitPrice * qty : null;

  const openWA = () => {
    if (!product) return;
    window.open(
      waUrl(`Hola, quiero ${qty}x ${product.name} a ${fmt(unitPrice)}`),
      "_blank"
    );
  };

  const openQuestion = () => {
    if (!product) return;
    window.open(
      waUrl(`Hola, tengo una pregunta sobre el producto "${product.name}"`),
      "_blank"
    );
  };

  /* ── Guards ── */
  if (isLoading) return <LoadingSkeleton />;

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Package className="w-16 h-16 text-gray-200" />
        <p className="font-bold text-xl text-gray-900">Producto no encontrado</p>
        <button
          onClick={() => navigate("/tienda")}
          className="text-sm font-semibold text-[#C1272D] hover:underline"
        >
          ← Volver a la tienda
        </button>
      </div>
    );
  }

  const showVideosSection = productVideos.length > 0 || isAdmin;

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">

      {/* ── Top bar ── */}
      <div className="bg-[#C1272D] text-white text-xs font-semibold text-center py-2 px-4 tracking-wide">
        🚚 Envío gratis · Pago contra entrega · Respuesta inmediata por WhatsApp
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <a href="/tienda" className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#C1272D] flex items-center justify-center text-white font-black text-xs">
                  {storeName.charAt(0)}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="font-black text-gray-900 text-sm leading-none">{storeName}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#C1272D]">
                  {storeSlogan}
                </p>
              </div>
            </a>
          </div>
          <a
            href={waGenericUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-bold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            <WASvg cls="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </header>

      {/* ══ HERO — dos columnas 50/50 ══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* COLUMNA IZQUIERDA — Galería */}
          <Gallery
            images={allImages}
            videoUrl={galleryVideoUrl}
            productName={product.name}
          />

          {/* COLUMNA DERECHA — Info */}
          <div className="space-y-5">

            {/* Badge categoría */}
            {product.category && (
              <span className="inline-block bg-[#C1272D] text-white text-xs font-bold px-3 py-1 rounded-full">
                {product.category}
              </span>
            )}

            {/* Nombre */}
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Precio */}
            <p className="text-4xl font-bold" style={{ color: "#C1272D" }}>
              {fmt(unitPrice)}
            </p>

            {/* Descripción */}
            {product.description && (
              <p className="text-gray-600 leading-relaxed text-base">
                {product.description}
              </p>
            )}

            <hr className="border-gray-100" />

            {/* Garantías */}
            <ul className="space-y-2.5">
              {[
                "Entrega en Bogotá en 24 horas",
                "Pago al recibir — sin riesgo",
                "Soporte directo por WhatsApp",
              ].map((g) => (
                <li key={g} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span
                    className="font-black text-base leading-none flex-shrink-0"
                    style={{ color: "#C1272D" }}
                  >
                    ✓
                  </span>
                  {g}
                </li>
              ))}
            </ul>

            {/* Selector de cantidad */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600">Cantidad:</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold transition-colors"
                >
                  −
                </button>
                <span className="w-10 text-center font-bold text-gray-900 text-sm">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
              {qty > 1 && (
                <span className="text-sm font-bold" style={{ color: "#C1272D" }}>
                  Total: {fmt(totalPrice)}
                </span>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              <button
                onClick={openWA}
                className="w-full flex items-center justify-center gap-2.5 text-white font-bold text-base py-4 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                style={{ background: "#C1272D" }}
              >
                <WASvg />
                💬 Lo quiero — Escribir por WhatsApp
              </button>
              <button
                onClick={openQuestion}
                className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold text-sm py-3.5 rounded-xl hover:border-gray-400 transition-colors"
              >
                Hacer una pregunta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN VIDEOS ══ */}
      {showVideosSection && (
        <section className="bg-gray-50 py-12 px-4">
          <div className="max-w-7xl mx-auto space-y-6">

            {productVideos.length > 0 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 text-center">
                  Ve el producto en acción
                </h2>
                <div
                  className={`grid gap-4 mx-auto ${
                    productVideos.length === 1
                      ? "grid-cols-1 max-w-[200px]"
                      : productVideos.length === 2
                      ? "grid-cols-2 max-w-sm"
                      : "grid-cols-3 max-w-lg"
                  }`}
                >
                  {productVideos.map((vid) => (
                    <div
                      key={vid.id}
                      className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-md"
                    >
                      <video
                        src={vid.video_url}
                        className="w-full h-full object-cover"
                        controls
                        playsInline
                        preload="metadata"
                        loop
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Botón gestionar — solo admin */}
            {isAdmin && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setShowVideoAdmin(true)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-400 px-4 py-2 rounded-xl transition-colors"
                >
                  <Video className="w-4 h-4" />
                  Gestionar videos
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══ PRODUCTOS RELACIONADOS ══ */}
      {related.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Productos que te pueden interesar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-[#C1272D]/30 hover:-translate-y-0.5 transition-all shadow-sm"
                >
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                      {p.name}
                    </p>
                    <p className="font-bold text-[#C1272D]">{fmt(p.retail_price)}</p>
                    <button
                      onClick={() => {
                        navigate(`/producto/${p.id}`);
                        window.scrollTo(0, 0);
                      }}
                      className="w-full text-xs font-bold text-[#C1272D] border border-[#C1272D]/30 hover:bg-[#C1272D] hover:text-white py-1.5 rounded-lg transition-colors"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ Footer ══ */}
      <footer className="bg-gray-900 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#C1272D] flex items-center justify-center text-white font-black text-xs">
                {storeName.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-black text-white text-sm leading-none">{storeName}</p>
              <p className="text-gray-500 text-xs">{storeSlogan}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {instagram && (
              <a
                href={`https://instagram.com/${instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            <a
              href={waGenericUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <WASvg cls="w-4 h-4" />
            </a>
          </div>
          <p className="text-gray-500 text-xs">© 2026 {storeName}</p>
        </div>
      </footer>

      {/* ══ Mobile sticky CTA ══ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3"
        style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 text-sm leading-none truncate">
            {fmt(totalPrice ?? unitPrice)}
          </p>
          {qty > 1 && <p className="text-xs text-gray-400 mt-0.5">{qty} unidades</p>}
        </div>
        <button
          onClick={openWA}
          className="flex items-center gap-2 text-white font-bold text-sm px-5 py-3 rounded-xl hover:opacity-90 transition-opacity flex-shrink-0"
          style={{ background: "#C1272D" }}
        >
          <WASvg cls="w-4 h-4" />
          Lo quiero
        </button>
      </div>

      {/* ══ Floating WA desktop ══ */}
      <a
        href={waGenericUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 hidden lg:flex w-14 h-14 rounded-full items-center justify-center text-white shadow-xl hover:scale-110 transition-transform"
        style={{ background: "#25D366" }}
        title="WhatsApp"
      >
        <WASvg cls="w-6 h-6" />
      </a>

      {/* ══ Admin video modal ══ */}
      {showVideoAdmin && (
        <VideoAdminModal
          productId={product.id}
          onClose={() => setShowVideoAdmin(false)}
        />
      )}
    </div>
  );
}
