import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Minus, Plus, Star, Truck, Shield, CreditCard, Check, Play, Package } from "lucide-react";

const GRC_WA = "573226421110";

const WA_SVG = (cls = "w-5 h-5") => (
  <svg viewBox="0 0 24 24" className={`${cls} fill-current`}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

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

const fmt = (v: number | null) => (v != null ? `$${v.toLocaleString("es-CO")}` : "");
const anchor = (p: number) => Math.round(p * 1.38);

const TESTIMONIALS = [
  { name: "María R.", city: "Bogotá", text: "Llegó super rápido y funciona increíble. Ya pedí otro para mi mamá." },
  { name: "Carlos G.", city: "Medellín", text: "Lo vi en TikTok y lo compré. Mejor inversión que he hecho para mi hogar." },
  { name: "Laura M.", city: "Cali", text: "La calidad es impresionante por el precio. Ya van 3 que compro." },
];

/* ── Gallery ── */
const Gallery = ({
  images,
  active,
  onSelect,
}: {
  images: string[];
  active: string;
  onSelect: (img: string) => void;
}) => (
  <div className="space-y-3">
    {/* Main image */}
    <div className="relative rounded-3xl overflow-hidden bg-[#F5F5F5] aspect-square">
      <img
        src={active}
        alt=""
        className="w-full h-full object-cover transition-opacity duration-300"
        loading="lazy"
      />
      {/* Zoom hint */}
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm text-[10px] font-medium text-gray-500 px-3 py-1.5 rounded-full">
        Toca para ampliar
      </div>
    </div>
    {/* Thumbnails */}
    {images.length > 1 && (
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => onSelect(img)}
            className={`flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
              active === img
                ? "border-[#C1272D] shadow-md"
                : "border-transparent opacity-55 hover:opacity-90"
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    )}
  </div>
);

/* ── Stars ── */
const Stars = ({ count = 5, label = "" }: { count?: number; label?: string }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
    ))}
    {label && <span className="text-sm text-gray-400 ml-1">{label}</span>}
  </div>
);

/* ── Main ── */
export default function ProductoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeImg, setActiveImg] = useState("");
  const [qty, setQty] = useState(1);

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

  // Fetch best creative video for this product (public-safe: only fetches video_url)
  const { data: creativeVideo } = useQuery({
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
  const anc = product?.retail_price ? anchor(product.retail_price) : null;
  const disc = anc && product?.retail_price ? Math.round(((anc - product.retail_price) / anc) * 100) : null;

  const openWA = () => {
    if (!product) return;
    const price = product.retail_price;
    const total = price != null ? qty * price : null;
    const msg =
      `Hola GRC! Quiero comprar ${qty} unidad${qty > 1 ? "es" : ""} de *${product.name}*` +
      (total ? ` por ${fmt(total)}` : "") +
      `. Mi dirección: ___ Pago: contra entrega`;
    window.open(`https://wa.me/${GRC_WA}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const openGenericWA = () => {
    window.open(`https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC, quiero más info sobre sus productos")}`, "_blank");
  };

  /* Loading */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[#C1272D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* Not found */
  if (!product) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Package className="w-16 h-16 text-gray-200" />
        <p className="font-bold text-xl text-[#1A1A1A]">Producto no encontrado</p>
        <button
          onClick={() => navigate("/tienda")}
          className="text-[#C1272D] font-semibold text-sm hover:underline"
        >
          ← Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes waBounce{0%,88%,100%{transform:translateY(0)}92%{transform:translateY(-8px)}96%{transform:translateY(0)}98%{transform:translateY(-3px)}}
        @keyframes grcIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .sec-in{opacity:0;animation:grcIn 0.6s ease-out forwards}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      <div className="min-h-screen pb-24 sm:pb-0" style={{ background: "#F5F5F5" }}>

        {/* ── TOP STRIP ── */}
        <div className="bg-[#C1272D] text-white text-xs font-medium py-2.5 text-center tracking-wide">
          🚚 Envío gratis a todo Colombia · Pago contra entrega disponible
        </div>

        {/* ── HEADER ── */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full bg-[#F5F5F5] hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <img src="/logo-grc.png" alt="GRC" className="h-9 object-contain" />
              <span className="hidden sm:block font-black text-[#1A1A1A]">GRC Importaciones</span>
            </div>
            <button
              onClick={openGenericWA}
              className="flex items-center gap-2 bg-[#C1272D] hover:bg-[#B71C1C] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
            >
              {WA_SVG("w-4 h-4")}
              <span className="hidden sm:inline">Comprar</span>
            </button>
          </div>
        </header>

        {/* ── PRODUCT HERO ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 sec-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

            {/* Gallery */}
            <Gallery images={allImages} active={currentImg} onSelect={setActiveImg} />

            {/* Info panel */}
            <div className="flex flex-col gap-5">

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {product.is_featured && (
                  <span className="bg-[#C1272D] text-white text-xs font-bold px-4 py-1.5 rounded-full animate-pulse">
                    🔥 Más vendido en Colombia
                  </span>
                )}
                {disc && (
                  <span className="bg-[#1A1A1A] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    -{disc}% descuento
                  </span>
                )}
              </div>

              {/* Category */}
              {product.category && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {product.category}
                </span>
              )}

              {/* Name */}
              <h1 className="font-black text-3xl sm:text-4xl text-[#1A1A1A] leading-tight">
                {product.name}
              </h1>

              {/* Stars */}
              <Stars label="(127 reseñas)" />

              {/* Price */}
              <div>
                {anc && (
                  <p className="text-sm text-gray-400 line-through mb-1">{fmt(anc)}</p>
                )}
                <p className="font-black text-5xl text-[#C1272D] leading-none">{fmt(product.retail_price)}</p>
                <p className="text-emerald-600 text-sm font-semibold mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Disponible · Entrega hoy en Bogotá
                </p>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-gray-500 text-base leading-relaxed">{product.description}</p>
              )}

              {/* Benefits */}
              <div className="space-y-2.5">
                {[
                  "Fácil de usar — sin instrucciones complicadas",
                  "Resultados inmediatos desde el primer uso",
                  "Alta durabilidad — materiales premium",
                  "Envío seguro a todo Colombia",
                ].map((b) => (
                  <div key={b} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-[#C1272D]/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#C1272D]" />
                    </span>
                    {b}
                  </div>
                ))}
              </div>

              {/* Qty */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700">Cantidad:</span>
                <div className="flex items-center gap-3 bg-[#F5F5F5] rounded-2xl p-1.5">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="font-black text-xl w-8 text-center text-[#1A1A1A]">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(10, q + 1))}
                    className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3 hidden sm:flex">
                <button
                  onClick={openWA}
                  className="w-full bg-[#C1272D] hover:bg-[#B71C1C] text-white font-black text-lg py-4 rounded-2xl transition-all hover:shadow-xl hover:shadow-[#C1272D]/25 hover:-translate-y-0.5"
                >
                  COMPRAR AHORA
                </button>
                <button
                  onClick={openWA}
                  className="w-full flex items-center justify-center gap-2 text-white font-bold text-base py-4 rounded-2xl transition-all hover:shadow-lg"
                  style={{ background: "#25D366" }}
                >
                  {WA_SVG()}
                  Pedir por WhatsApp
                </button>
              </div>

              {/* SKU & delivery */}
              {(product.sku || product.delivery_type) && (
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  {product.sku && (
                    <span className="bg-[#F5F5F5] px-3 py-1.5 rounded-full font-medium">
                      SKU: {product.sku}
                    </span>
                  )}
                  {product.delivery_type && (
                    <span className="bg-[#F5F5F5] px-3 py-1.5 rounded-full font-medium capitalize">
                      📦 {product.delivery_type}
                    </span>
                  )}
                </div>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Truck className="w-5 h-5" />, l: "Envío rápido" },
                  { icon: <Shield className="w-5 h-5" />, l: "Garantía" },
                  { icon: <CreditCard className="w-5 h-5" />, l: "Contra entrega" },
                ].map((b) => (
                  <div key={b.l} className="bg-[#F5F5F5] rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5">
                    <span className="text-[#C1272D]">{b.icon}</span>
                    <span className="text-xs font-semibold text-gray-600 text-center">{b.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY THIS PRODUCT ── */}
        <section className="bg-white py-16 px-4 sec-in" style={{ animationDelay: "0.15s" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[#C1272D] text-xs font-bold uppercase tracking-widest">Por qué funciona</span>
              <h2 className="font-black text-3xl sm:text-4xl text-[#1A1A1A] mt-2">
                La solución que estabas buscando.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { e: "⚡", t: "Funciona al instante", d: "Sin configuraciones complicadas. Lo sacas de la caja y listo para usar." },
                { e: "🛡️", t: "Calidad garantizada", d: "Materiales premium con garantía incluida. Si no funciona, lo resolvemos." },
                { e: "🚀", t: "Entrega rápida", d: "Hoy en Bogotá. 1-3 días hábiles a todo Colombia con seguimiento." },
              ].map((b) => (
                <div
                  key={b.t}
                  className="bg-[#F5F5F5] rounded-3xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <span className="text-4xl mb-4 block">{b.e}</span>
                  <h3 className="font-black text-[#1A1A1A] text-lg mb-2">{b.t}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON ── */}
        <section className="py-16 px-4 sec-in" style={{ animationDelay: "0.25s" }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[#C1272D] text-xs font-bold uppercase tracking-widest">La diferencia</span>
              <h2 className="font-black text-3xl text-[#1A1A1A] mt-2">
                ¿Por qué elegir {product.name}?
              </h2>
            </div>
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-2">
                <div className="bg-[#F5F5F5] px-5 py-4 text-sm font-bold text-gray-400 text-center">
                  Método tradicional
                </div>
                <div className="bg-[#C1272D] px-5 py-4 text-sm font-black text-white text-center">
                  {product.name}
                </div>
              </div>
              {[
                ["Difícil de limpiar", "Limpieza rápida y fácil"],
                ["Se daña rápido", "Materiales de alta durabilidad"],
                ["Resultados lentos", "Resultados desde el primer uso"],
                ["Precio alto, baja calidad", "Mejor relación precio-calidad"],
              ].map(([bad, good], i) => (
                <div key={i} className="grid grid-cols-2 border-t border-gray-100">
                  <div className="px-5 py-4 text-sm text-gray-400 flex items-center gap-2">
                    <span className="text-red-400 flex-shrink-0">✗</span> {bad}
                  </div>
                  <div className="px-5 py-4 text-sm text-[#1A1A1A] bg-[#C1272D]/3 flex items-center gap-2 font-semibold">
                    <span className="text-emerald-500 flex-shrink-0">✓</span> {good}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VIDEO SECTION ── */}
        {creativeVideo && (
          <section className="bg-white py-16 px-4 sec-in" style={{ animationDelay: "0.28s" }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <span className="text-[#C1272D] text-xs font-bold uppercase tracking-widest">Demo real</span>
                <h2 className="font-black text-3xl text-[#1A1A1A] mt-2 flex items-center justify-center gap-3">
                  <Play className="w-7 h-7 text-[#C1272D]" />
                  Míralo funcionar
                </h2>
              </div>
              <div className="rounded-3xl overflow-hidden bg-[#1A1A1A] aspect-video shadow-2xl">
                <video
                  src={creativeVideo}
                  controls
                  preload="metadata"
                  poster={product?.image_url ?? undefined}
                  className="w-full h-full object-contain"
                >
                  Tu navegador no soporta video.
                </video>
              </div>
            </div>
          </section>
        )}

        {/* ── IMAGE GALLERY (if multiple) ── */}
        {allImages.length > 1 && (
          <section className="bg-white py-16 px-4 sec-in" style={{ animationDelay: "0.3s" }}>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-black text-3xl text-[#1A1A1A]">Míralo en acción</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {allImages.slice(0, 6).map((img, i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden aspect-square bg-[#F5F5F5] cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setActiveImg(img)}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── TESTIMONIALS ── */}
        <section className="py-16 px-4 sec-in" style={{ animationDelay: "0.35s" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center gap-1 mb-3">
                {[1,2,3,4,5].map(i=><Star key={i} className="w-5 h-5 fill-[#D4AF37] text-[#D4AF37]"/>)}
              </div>
              <h2 className="font-black text-3xl text-[#1A1A1A]">
                Miles de hogares ya lo están usando
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex gap-0.5 mb-3">
                    {[1,2,3,4,5].map(i=><Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]"/>)}
                  </div>
                  <p className="text-[#1A1A1A] text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#C1272D]/10 flex items-center justify-center font-black text-[#C1272D] text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#1A1A1A]">{t.name}</p>
                      <p className="text-[10px] text-gray-400">{t.city} · Cliente verificado</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="bg-[#C1272D] py-16 px-4 text-center sec-in" style={{ animationDelay: "0.4s" }}>
          <div className="max-w-2xl mx-auto">
            <p className="text-white/80 text-sm font-medium mb-2">Oferta especial — tiempo limitado</p>
            <p className="font-black text-6xl sm:text-7xl text-white mb-2">{fmt(product.retail_price)}</p>
            <p className="text-white/70 text-sm mb-8">
              ⏳ Últimas unidades disponibles · Envío gratis
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
              <button
                onClick={openWA}
                className="flex-1 bg-white text-[#C1272D] font-black py-4 rounded-2xl transition-all hover:bg-gray-50 hover:shadow-xl text-base"
              >
                Comprar ahora
              </button>
              <button
                onClick={openWA}
                className="flex-1 flex items-center justify-center gap-2 font-black py-4 rounded-2xl text-white transition-all hover:shadow-xl text-base"
                style={{ background: "#25D366" }}
              >
                {WA_SVG()}
                WhatsApp
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-[#1A1A1A] py-12 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/logo-grc.png" alt="GRC" className="h-9 object-contain" />
              <span className="font-black text-white text-lg">GRC Importaciones</span>
            </div>
            <p className="text-gray-500 text-sm mb-1">📍 Bogotá, Colombia</p>
            <p className="text-gray-500 text-sm">📲 +57 322 642 1110</p>
            <div className="flex items-center justify-center gap-4 mt-5">
              <a href="/tienda" className="text-gray-500 text-xs hover:text-white transition-colors">Tienda</a>
              <a href="/catalogo" className="text-gray-500 text-xs hover:text-white transition-colors">Mayorista</a>
            </div>
            <div className="border-t border-white/10 mt-6 pt-5">
              <p className="text-gray-600 text-xs">© 2026 GRC Importaciones · Todos los derechos reservados</p>
            </div>
          </div>
        </footer>

        {/* Floating WA desktop */}
        <a
          href={`https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC, quiero comprar " + product.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed z-50 group hidden sm:block"
          style={{ bottom: 24, right: 24 }}
        >
          <span className="absolute -top-11 right-0 bg-[#1A1A1A] text-white text-xs px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
            Comprar por WhatsApp
          </span>
          <div
            className="w-[58px] h-[58px] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            style={{ background: "#25D366", boxShadow: "0 4px 24px rgba(37,211,102,0.45)", animation: "waBounce 4s infinite" }}
          >
            {WA_SVG("w-7 h-7")}
          </div>
        </a>

        {/* ── STICKY MOBILE BOTTOM BAR ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 sm:hidden shadow-xl">
          <div className="flex-1 min-w-0">
            <p className="font-black text-[#C1272D] text-xl leading-tight">{fmt(product.retail_price)}</p>
            {anc && <p className="text-xs text-gray-400 line-through">{fmt(anc)}</p>}
          </div>
          <button
            onClick={openWA}
            className="flex items-center gap-2 bg-[#C1272D] text-white font-black text-sm px-5 py-3.5 rounded-2xl transition-all active:scale-95"
          >
            {WA_SVG("w-4 h-4")}
            Comprar
          </button>
        </div>
      </div>
    </>
  );
}
