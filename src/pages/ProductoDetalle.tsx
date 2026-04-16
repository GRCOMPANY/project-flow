import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Star, Truck, Shield, Check,
  Play, Package, ChevronRight, Clock, Instagram
} from "lucide-react";

/* ═══════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════ */
const GRC_WA = "573226421110";
const fmt = (v: number | null) => (v != null ? `$${v.toLocaleString("es-CO")}` : "");
const anchorPrice = (p: number) => Math.round(p * 1.42);
const discPct = (real: number, anc: number) => Math.round(((anc - real) / anc) * 100);
const waGenericUrl = `https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC 👋 Quiero ver los productos disponibles")}`;

const waMsg = (name: string, price: string, qty: number) =>
  `https://wa.me/${GRC_WA}?text=${encodeURIComponent(
    `Hola GRC 👋 Quiero ${name} por ${price}${qty > 1 ? ` (${qty} unidades)` : ""}.\n\nDirección: ___\nPago: Contra entrega`
  )}`;

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
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

const TESTIMONIALS = [
  { name: "Valentina R.", city: "Bogotá",  text: "Vi el producto, lo compré sin pensarlo. Llegó el mismo día. Está brutal.", stars: 5, initial: "V" },
  { name: "Carlos M.",   city: "Medellín", text: "Lo vi en TikTok buscándolo en todas partes. GRC lo tenía. Perfecto.", stars: 5, initial: "C" },
  { name: "Daniela P.",  city: "Cali",     text: "Llevo 4 compras en GRC. Cada producto mejor que el anterior. 100% recomendado.", stars: 5, initial: "D" },
];
const INITIALS_COLORS = ["#C1272D", "#D4AF37", "#059669"];

/* ═══════════════════════════════════════════
   WA SVG
═══════════════════════════════════════════ */
const WASvg = ({ cls = "w-5 h-5" }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={`${cls} fill-current flex-shrink-0`}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ═══════════════════════════════════════════
   GALLERY
═══════════════════════════════════════════ */
const Gallery = ({
  images, videoUrl, active, onSelect, productName,
}: {
  images: string[];
  videoUrl: string | null;
  active: string;
  onSelect: (v: string) => void;
  productName: string;
}) => {
  const [zoomed, setZoomed] = useState(false);
  const [activeTab, setActiveTab] = useState<"photo" | "video">("photo");

  return (
    <div className="space-y-3">
      {/* Tab bar — show only if there's a video */}
      {videoUrl && (
        <div className="flex gap-2 bg-[#F8F5F2] rounded-2xl p-1">
          {(["photo", "video"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
              style={
                activeTab === tab
                  ? { background: "#fff", color: "#C1272D", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }
                  : { color: "#888" }
              }
            >
              {tab === "photo" ? "📷 Fotos" : "▶ Video"}
            </button>
          ))}
        </div>
      )}

      {/* Main display */}
      <div className="relative rounded-3xl overflow-hidden bg-[#F8F5F2] aspect-square cursor-zoom-in"
        onClick={() => activeTab === "photo" && setZoomed(true)}
      >
        {activeTab === "video" && videoUrl ? (
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <>
            <img
              src={active}
              alt={productName}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
            <div className="absolute bottom-4 right-4 bg-white/80 text-[10px] font-bold text-gray-500 px-3 py-1.5 rounded-full">
              Toca para ampliar
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && activeTab === "photo" && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onSelect(img)}
              className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all"
              style={{
                borderColor: active === img ? "#C1272D" : "transparent",
                opacity: active === img ? 1 : 0.55,
              }}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {zoomed && (
        <div
          className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <img src={active} alt={productName} className="max-w-full max-h-full object-contain rounded-2xl" />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center font-bold hover:bg-white/30 transition-colors"
            onClick={() => setZoomed(false)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function ProductoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeImg, setActiveImg] = useState("");
  const [qty, setQty] = useState(1);
  const [scrolled, setScrolled] = useState(false);
  const db = supabase as any;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* ── Product query ── */
  const { data: product, isLoading } = useQuery({
    queryKey: ["producto-detalle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_seller_view")
        .select("id, name, description, category, image_url, images, retail_price, is_featured, wholesale_price, sku, delivery_type")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as ProductData;
    },
    enabled: !!id,
  });

  /* ── Video from creatives table ── */
  const { data: videoUrl } = useQuery({
    queryKey: ["producto-video", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("creatives")
        .select("video_url")
        .eq("product_id", id!)
        .not("video_url", "is", null)
        .eq("status", "publicado")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.video_url ?? null;
    },
    enabled: !!id,
  });

  /* ── Video from product_videos table ── */
  const { data: productVideo } = useQuery({
    queryKey: ["producto-product-video", id],
    queryFn: async () => {
      const { data } = await db
        .from("product_videos")
        .select("video_url, titulo")
        .eq("product_id", id!)
        .eq("activo", true)
        .order("orden", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data?.video_url ?? null;
    },
    enabled: !!id,
  });

  /* ── Related products ── */
  const { data: related = [] } = useQuery({
    queryKey: ["producto-related", id, product?.category],
    queryFn: async () => {
      const { data } = await supabase
        .from("products_seller_view")
        .select("id, name, image_url, retail_price, category")
        .eq("status", "activo")
        .neq("id", id!)
        .limit(4);
      return (data ?? []) as RelatedProduct[];
    },
    enabled: !!id && !!product,
  });

  /* ── Derived ── */
  const getAllImages = (p: ProductData) => {
    const imgs: string[] = [];
    if (p.image_url) imgs.push(p.image_url);
    if (p.images && Array.isArray(p.images)) {
      p.images.forEach((img) => { if (img && !imgs.includes(img)) imgs.push(img); });
    }
    return imgs.length > 0 ? imgs : ["/placeholder.svg"];
  };

  const allImages = product ? getAllImages(product) : [];
  const currentImg = activeImg || allImages[0] || "/placeholder.svg";
  const anc = product?.retail_price ? anchorPrice(product.retail_price) : null;
  const disc = anc && product?.retail_price ? discPct(product.retail_price, anc) : null;
  const totalPrice = product?.retail_price ? product.retail_price * qty : null;
  const finalVideoUrl = videoUrl ?? productVideo ?? null;

  const openWA = () => {
    if (!product) return;
    window.open(waMsg(product.name, fmt(totalPrice), qty), "_blank");
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F5F2" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "#C1272D", borderTopColor: "transparent" }} />
          <p className="text-gray-400 text-sm">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center" style={{ background: "#F8F5F2" }}>
        <Package className="w-16 h-16 text-gray-200" />
        <p className="font-black text-xl text-[#111111]">Producto no encontrado</p>
        <button onClick={() => navigate("/tienda")} className="font-bold text-sm hover:underline" style={{ color: "#C1272D" }}>
          ← Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes waPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(37,211,102,0.4); } 50% { box-shadow: 0 0 0 10px rgba(37,211,102,0); } }
        .fade-up { animation: fadeUp 0.5s ease-out forwards; }
        .wa-pulse { animation: waPulse 2.5s infinite; }
      `}</style>

      <div className="min-h-screen pb-24 lg:pb-0" style={{ background: "#F8F5F2" }}>

        {/* ── TOP BAR ── */}
        <div className="py-2.5 text-center text-white text-xs font-bold tracking-wide" style={{ background: "#C1272D" }}>
          🚚 Envío gratis a todo Colombia · Pago contra entrega · Respuesta inmediata
        </div>

        {/* ── HEADER ── */}
        <header className={`sticky top-0 z-40 bg-white transition-all duration-300 ${scrolled ? "shadow-md" : "border-b border-gray-100"}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                style={{ background: "#F8F5F2" }}
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <a href="/tienda" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs" style={{ background: "#C1272D" }}>G</div>
                <div className="hidden sm:block">
                  <p className="font-black text-[#111111] text-sm leading-none">GRC IMPORTACIONES</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#C1272D" }}>Lo mejor del mundo</p>
                </div>
              </a>
            </div>
            <a
              href={waGenericUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white font-bold text-sm px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
              style={{ background: "#25D366" }}
            >
              <WASvg cls="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </header>

        {/* ══ 1. HERO PRODUCTO ══ */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

              {/* Gallery */}
              <div className="fade-up">
                <Gallery
                  images={allImages}
                  videoUrl={finalVideoUrl}
                  active={currentImg}
                  onSelect={setActiveImg}
                  productName={product.name}
                />
              </div>

              {/* Info */}
              <div className="fade-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
                {/* Category breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-3">
                  <a href="/tienda" className="hover:text-[#C1272D] transition-colors">Tienda</a>
                  <ChevronRight className="w-3 h-3" />
                  <span style={{ color: "#C1272D" }}>{product.category ?? "Productos"}</span>
                </div>

                <h1 className="font-black text-3xl sm:text-4xl text-[#111111] leading-tight mb-4">
                  {product.name}
                </h1>

                {/* Stars */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />)}
                  </div>
                  <span className="text-sm text-gray-500 font-medium">4.9 · +50 reseñas</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-3">
                  {anc && <span className="text-gray-400 text-lg line-through">{fmt(anc)}</span>}
                  <span className="font-black text-4xl" style={{ color: "#C1272D" }}>{fmt(product.retail_price)}</span>
                  {disc && (
                    <span className="text-xs font-black text-white px-2.5 py-1 rounded-full" style={{ background: "#C1272D" }}>
                      -{disc}%
                    </span>
                  )}
                </div>

                {/* Availability */}
                <p className="flex items-center gap-2 text-sm font-semibold mb-5" style={{ color: "#25D366" }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#25D366" }} />
                  Disponible · Entrega hoy Bogotá
                </p>

                {/* Description */}
                {product.description && (
                  <p className="text-gray-600 text-base leading-relaxed mb-6">{product.description}</p>
                )}

                {/* Qty selector */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-bold text-gray-600">Cantidad:</span>
                  <div className="flex items-center gap-2 bg-[#F8F5F2] rounded-xl px-1 py-1">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg font-bold text-lg transition-colors hover:bg-white flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold text-[#111111]">{qty}</span>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="w-8 h-8 rounded-lg font-bold text-lg transition-colors hover:bg-white flex items-center justify-center"
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

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <button
                    onClick={openWA}
                    className="flex-1 flex items-center justify-center gap-2.5 text-white font-black text-base py-4 px-6 rounded-2xl transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5"
                    style={{ background: "#C1272D" }}
                  >
                    <WASvg />
                    Pedir por WhatsApp
                  </button>
                  <a
                    href="#detalles"
                    className="flex items-center justify-center gap-2 font-bold text-sm py-4 px-6 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
                  >
                    Ver detalles ↓
                  </a>
                </div>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: <Shield className="w-4 h-4" />, label: "Garantía GRC" },
                    { icon: <Truck className="w-4 h-4" />, label: "Envío rápido" },
                    { icon: <Check className="w-4 h-4" />, label: "Contra entrega" },
                  ].map((b, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-center" style={{ background: "#F8F5F2" }}>
                      <div style={{ color: "#C1272D" }}>{b.icon}</div>
                      <span className="text-[10px] font-bold text-gray-600 leading-tight">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ 2. BENEFICIOS ══ */}
        <section id="detalles" className="py-16 px-4" style={{ background: "#F8F5F2" }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#C1272D" }}>POR QUÉ ESTE PRODUCTO</p>
              <h2 className="font-black text-3xl text-[#111111]">Lo que lo hace diferente</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Diseño premium de importación directa, no consigues esto en Colombia",
                "Calidad verificada antes de salir al mercado colombiano",
                "Entrega ultra rápida — mismo día en Bogotá, 24-48h resto del país",
                "Pago contra entrega: pagas cuando lo tienes en tus manos",
                "Garantía GRC: si no te encanta, lo resolvemos",
                "Soporte por WhatsApp en minutos, no bots, persona real",
              ].map((b, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#FFF0F0" }}>
                    <Check className="w-3.5 h-3.5" style={{ color: "#C1272D" }} />
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 3. VIDEO ══ */}
        {finalVideoUrl && (
          <section className="bg-white py-16 px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#C1272D" }}>EN ACCIÓN</p>
                <h2 className="font-black text-3xl text-[#111111]">Míralo en acción</h2>
              </div>
              <div className="rounded-3xl overflow-hidden" style={{ background: "#F8F5F2" }}>
                <video
                  src={finalVideoUrl}
                  className="w-full"
                  controls
                  playsInline
                  style={{ maxHeight: 500 }}
                />
              </div>
            </div>
          </section>
        )}

        {/* ══ 4. CÓMO FUNCIONA ══ */}
        <section className="py-16 px-4" style={{ background: "#F8F5F2" }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#C1272D" }}>PROCESO</p>
              <h2 className="font-black text-3xl text-[#111111]">Cómo funciona</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { num: "01", title: "Escríbenos por WhatsApp", desc: "Toca el botón y cuéntanos qué quieres pedir. Te respondemos en minutos." },
                { num: "02", title: "Confirmamos tu pedido", desc: "Te confirmamos disponibilidad, precio y fecha de entrega. Sin sorpresas." },
                { num: "03", title: "Recibe y paga", desc: "El producto llega a tu puerta. Pagas solo cuando lo tienes en tus manos." },
              ].map((step, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
                  <p className="font-black text-5xl mb-3" style={{ color: "#C1272D" }}>{step.num}</p>
                  <h3 className="font-bold text-[#111111] text-base mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 5. TESTIMONIOS ══ */}
        <section className="bg-white py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#C1272D" }}>RESEÑAS</p>
              <h2 className="font-black text-3xl text-[#111111]">Lo que dicen nuestros compradores</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="rounded-2xl p-6 border border-gray-100 hover:border-[#C1272D]/20 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                      style={{ background: INITIALS_COLORS[i] }}
                    >
                      {t.initial}
                    </div>
                    <div>
                      <p className="font-bold text-[#111111] text-sm leading-none mb-0.5">{t.name}</p>
                      <p className="text-gray-400 text-xs">{t.city}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">"{t.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 6. PRODUCTOS RELACIONADOS ══ */}
        {related.length > 0 && (
          <section className="py-16 px-4" style={{ background: "#F8F5F2" }}>
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#C1272D" }}>TAMBIÉN TE PUEDE GUSTAR</p>
                <h2 className="font-black text-3xl text-[#111111]">Productos relacionados</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {related.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                    onClick={() => { navigate(`/producto/${p.id}`); window.scrollTo(0, 0); }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(193,39,45,0.12)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
                  >
                    <div className="bg-[#F8F5F2] aspect-square overflow-hidden">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105" loading="lazy" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-gray-200" /></div>
                      }
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-[#111111] text-sm leading-snug mb-1 line-clamp-2">{p.name}</p>
                      <p className="font-black text-base" style={{ color: "#C1272D" }}>{fmt(p.retail_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ FOOTER ══ */}
        <footer className="py-10 px-4" style={{ background: "#111111" }}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs" style={{ background: "#C1272D" }}>G</div>
              <div>
                <p className="font-black text-white text-sm leading-none">GRC IMPORTACIONES</p>
                <p className="text-gray-500 text-xs">Lo mejor del mundo, primero en Colombia</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={waGenericUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <WASvg cls="w-4 h-4" />
              </a>
            </div>
            <p className="text-gray-500 text-xs">© 2026 GRC Importaciones</p>
          </div>
        </footer>

        {/* ══ 7. STICKY MOBILE CTA ══ */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 lg:hidden" style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
          <div className="flex-1">
            <p className="font-black text-[#111111] text-sm leading-none">{fmt(totalPrice ?? product.retail_price)}</p>
            {qty > 1 && <p className="text-gray-400 text-xs">{qty} unidades</p>}
          </div>
          <button
            onClick={openWA}
            className="flex items-center gap-2 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all hover:opacity-90 wa-pulse"
            style={{ background: "#C1272D" }}
          >
            <WASvg cls="w-4 h-4" />
            Pedir ahora
          </button>
        </div>

        {/* ══ FLOATING WA desktop ══ */}
        <a
          href={waGenericUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full hidden lg:flex items-center justify-center text-white shadow-2xl wa-pulse group"
          style={{ background: "#25D366" }}
          title="Hablar con George"
        >
          <WASvg cls="w-6 h-6" />
          <span className="absolute right-16 bg-white text-[#111111] text-xs font-bold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Hablar con George
          </span>
        </a>

      </div>
    </>
  );
}
