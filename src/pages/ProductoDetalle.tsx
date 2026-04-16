import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Minus, Plus, Star, Truck, Shield,
  CreditCard, Check, Play, Package, Flame, Zap,
  ChevronRight, Lock, MessageCircle
} from "lucide-react";

/* ──────────────────────────────────────
   CONFIG
────────────────────────────────────── */
const GRC_WA = "573226421110";

const waMsg = (name: string, price: string, qty: number) =>
  encodeURIComponent(
    `Hola GRC 👋 vi este producto y quiero comprarlo:\n\n🛍 Producto: ${name}\n📦 Cantidad: ${qty} unidad${qty > 1 ? "es" : ""}\n💰 Precio: ${price}\n\nMi dirección es:\nForma de pago: Contra entrega`
  );

const WASvg = ({ cls = "w-5 h-5" }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={`${cls} fill-current flex-shrink-0`}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const fmt = (v: number | null) => (v != null ? `$${v.toLocaleString("es-CO")}` : "");
const anchor = (p: number) => Math.round(p * 1.42);
const discPct = (real: number, anc: number) => Math.round(((anc - real) / anc) * 100);

/* ──────────────────────────────────────
   TYPES
────────────────────────────────────── */
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

const TESTIMONIALS = [
  { name: "Valentina R.", city: "Bogotá", text: "Vi el producto, lo compré sin pensarlo. Llegó el mismo día. Está brutal." },
  { name: "Carlos M.", city: "Medellín", text: "Lo vi en TikTok buscándolo en todas partes. GRC lo tenía. Perfecto." },
  { name: "Daniela P.", city: "Cali", text: "Llevo 4 compras en GRC. Cada producto mejor que el anterior. 100% recomendado." },
];

/* ──────────────────────────────────────
   GALLERY
────────────────────────────────────── */
const Gallery = ({
  images, active, onSelect, productName,
}: {
  images: string[];
  active: string;
  onSelect: (img: string) => void;
  productName: string;
}) => {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="space-y-3 relative">
      {/* Main */}
      <div
        className="relative rounded-3xl overflow-hidden bg-[#F5F5F5] aspect-square cursor-zoom-in"
        onClick={() => setZoomed(true)}
      >
        <img
          src={active}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        {/* Zoom hint */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-600 px-3 py-1.5 rounded-full shadow-sm">
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
                  ? "border-[#C1272D] shadow-md shadow-[#C1272D]/20"
                  : "border-transparent opacity-55 hover:opacity-90 hover:border-gray-200"
              }`}
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
          <img
            src={active}
            alt={productName}
            className="max-w-full max-h-full object-contain rounded-2xl"
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-lg hover:bg-white/30 transition-colors"
            onClick={() => setZoomed(false)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────
   COUNTDOWN URGENCY
────────────────────────────────────── */
const UrgencyBlock = () => {
  const [s, setS] = useState(3600 * 2 + 59 * 60);
  useState(() => {
    const t = setInterval(() => setS((x) => (x > 0 ? x - 1 : 10799)), 1000);
    return () => clearInterval(t);
  });
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sc = String(s % 60).padStart(2, "0");
  return (
    <div className="bg-[#C1272D]/8 border border-[#C1272D]/20 rounded-2xl px-4 py-3 flex items-center gap-3">
      <Flame className="w-5 h-5 text-[#C1272D] flex-shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-bold text-[#C1272D]">⏳ Oferta termina en:</p>
        <p className="font-mono font-black text-[#C1272D] text-lg tracking-widest">{h}:{m}:{sc}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-gray-500">Últimas unidades</p>
        <p className="text-xs font-bold text-[#111111]">No lo pierdas</p>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────
   MAIN
────────────────────────────────────── */
export default function ProductoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeImg, setActiveImg] = useState("");
  const [qty, setQty] = useState(1);

  /* Product query */
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

  /* Creative video query */
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
  const disc = anc && product?.retail_price ? discPct(product.retail_price, anc) : null;
  const totalPrice = product?.retail_price ? product.retail_price * qty : null;

  const openWA = () => {
    if (!product) return;
    window.open(
      `https://wa.me/${GRC_WA}?text=${waMsg(product.name, fmt(totalPrice), qty)}`,
      "_blank"
    );
  };

  /* Loading */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-[#C1272D] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Cargando producto...</p>
        </div>
      </div>
    );
  }

  /* Not found */
  if (!product) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Package className="w-16 h-16 text-gray-200" />
        <p className="font-black text-xl text-[#111111]">Producto no encontrado</p>
        <button onClick={() => navigate("/tienda")} className="text-[#C1272D] font-bold text-sm hover:underline">
          ← Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes waBounce{0%,88%,100%{transform:translateY(0)}92%{transform:translateY(-8px)}96%{transform:translateY(0)}98%{transform:translateY(-3px)}}
        @keyframes secIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .sec{opacity:0;animation:secIn .6s ease-out forwards}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
        @keyframes shimmerRed{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .shimmer-cta{background-size:200% 100%;background-image:linear-gradient(90deg,#C1272D 0%,#e03040 45%,#C1272D 100%);animation:shimmerRed 2.5s infinite}
      `}</style>

      <div className="min-h-screen pb-24 sm:pb-0" style={{ background: "#F5F5F5" }}>

        {/* ── TOP STRIP ── */}
        <div className="bg-[#C1272D] text-white text-xs font-bold py-2.5 text-center tracking-wide">
          🚚 Envío gratis a todo Colombia · Pago contra entrega · Respuesta inmediata
        </div>

        {/* ── HEADER ── */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full bg-[#F5F5F5] hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <a href="/tienda" className="flex items-center gap-2">
                <img src="/logo-grc.png" alt="GRC" className="h-9 object-contain" />
                <div className="hidden sm:block">
                  <p className="font-black text-[#111111] text-sm leading-none">GRC</p>
                  <p className="text-[9px] text-[#C1272D] font-bold uppercase tracking-widest">Importaciones</p>
                </div>
              </a>
            </div>
            <button
              onClick={openWA}
              className="shimmer-cta flex items-center gap-2 text-white font-black text-sm px-5 py-2.5 rounded-full transition-all hover:shadow-[0_4px_20px_rgba(193,39,45,0.4)]"
            >
              <WASvg cls="w-4 h-4" />
              <span className="hidden sm:inline">COMPRAR</span>
            </button>
          </div>
        </header>

        {/* ══════════════════════════════════
            SECCIÓN 1: HOOK VISUAL + INFO
        ══════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 sec">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">

            {/* Gallery */}
            <Gallery
              images={allImages}
              active={currentImg}
              onSelect={setActiveImg}
              productName={product.name}
            />

            {/* Info panel */}
            <div className="flex flex-col gap-5">

              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                {product.is_featured && (
                  <span className="flex items-center gap-1 bg-[#C1272D] text-white text-xs font-black px-3 py-1.5 rounded-full">
                    <Flame className="w-3 h-3" /> Más pedido en Colombia
                  </span>
                )}
                {disc && (
                  <span className="bg-[#111111] text-[#D4AF37] text-xs font-black px-3 py-1.5 rounded-full">
                    -{disc}% descuento
                  </span>
                )}
                {product.category && (
                  <span className="bg-[#F5F5F5] text-gray-500 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {product.category}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="font-black text-3xl sm:text-4xl text-[#111111] leading-tight">
                {product.name}
              </h1>

              {/* Stars + reviews */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i=><Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]"/>)}
                </div>
                <span className="text-sm text-gray-500">(127 reseñas)</span>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  ✓ Verificado
                </span>
              </div>

              {/* Price block */}
              <div className="bg-[#F5F5F5] rounded-2xl p-5">
                <div className="flex items-baseline gap-3 mb-2">
                  {anc && <span className="text-base text-gray-400 line-through">{fmt(anc)}</span>}
                  <span className="font-black text-5xl text-[#C1272D] leading-none">{fmt(product.retail_price)}</span>
                </div>
                {disc && (
                  <p className="text-sm text-emerald-600 font-bold">
                    Ahorras {fmt(anc ? anc - (product.retail_price ?? 0) : null)} en este pedido
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Disponible ahora · Entrega hoy en Bogotá
                </p>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-gray-500 text-base leading-relaxed">{product.description}</p>
              )}

              {/* URGENCY */}
              <UrgencyBlock />

              {/* Benefits */}
              <div className="space-y-2.5">
                {[
                  "Funciona desde el primer uso — sin instrucciones",
                  "Materiales premium de alta durabilidad",
                  "Envío seguro y rápido a toda Colombia",
                  "Soporte real vía WhatsApp, respuesta inmediata",
                ].map((b) => (
                  <div key={b} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-[#C1272D] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                    {b}
                  </div>
                ))}
              </div>

              {/* Qty selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-700">Cantidad:</span>
                <div className="flex items-center bg-[#F5F5F5] rounded-2xl p-1">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center shadow-sm transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="font-black text-xl w-10 text-center text-[#111111]">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(10, q + 1))}
                    className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                {qty > 1 && (
                  <span className="text-sm font-bold text-[#C1272D]">
                    Total: {fmt(totalPrice)}
                  </span>
                )}
              </div>

              {/* CTAs — DESKTOP */}
              <div className="flex flex-col gap-3 hidden sm:flex">
                <button
                  onClick={openWA}
                  className="w-full shimmer-cta text-white font-black text-lg py-4 rounded-2xl transition-all hover:shadow-[0_8px_30px_rgba(193,39,45,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <WASvg />
                  LO QUIERO — PEDIR POR WHATSAPP
                </button>
                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <Lock className="w-3 h-3" />
                  Compra 100% segura · Contra entrega disponible
                </p>
              </div>

              {/* SKU / delivery_type */}
              {(product.sku || product.delivery_type) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {product.sku && (
                    <span className="text-[10px] font-medium text-gray-400 bg-[#F5F5F5] px-3 py-1.5 rounded-full">
                      REF: {product.sku}
                    </span>
                  )}
                  {product.delivery_type && (
                    <span className="text-[10px] font-medium text-gray-400 bg-[#F5F5F5] px-3 py-1.5 rounded-full capitalize">
                      📦 {product.delivery_type}
                    </span>
                  )}
                </div>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Truck className="w-5 h-5" />, l: "Envío gratis" },
                  { icon: <Shield className="w-5 h-5" />, l: "Garantía" },
                  { icon: <CreditCard className="w-5 h-5" />, l: "Contra entrega" },
                ].map((b) => (
                  <div key={b.l} className="bg-[#F5F5F5] rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5">
                    <span className="text-[#C1272D]">{b.icon}</span>
                    <span className="text-xs font-bold text-gray-600 text-center">{b.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            SECCIÓN 2: EL PROBLEMA
        ══════════════════════════════════ */}
        <section className="bg-white py-16 px-4 sec" style={{ animationDelay: ".1s" }}>
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#C1272D]/8 text-[#C1272D] text-xs font-black px-4 py-2 rounded-full mb-5">
              <Zap className="w-3.5 h-3.5" />
              ¿Por qué todo el mundo lo está comprando?
            </div>
            <h2 className="font-black text-3xl sm:text-4xl text-[#111111] leading-tight mb-4">
              Deja de perder tiempo<br className="hidden sm:block" />
              <span className="text-[#C1272D]"> con soluciones que no funcionan.</span>
            </h2>
            <p className="text-gray-500 text-base leading-relaxed max-w-2xl mx-auto mb-8">
              Sabemos lo frustrante que es gastar dinero en productos que no cumplen lo prometido.
              En GRC solo seleccionamos lo que <strong className="text-[#111111]">ya tiene resultados comprobados.</strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { e: "😤", p: "Productos que se dañan rápido", s: "Materiales premium con garantía real" },
                { e: "😩", p: "Resultados que tardan o no llegan", s: "Funciona desde el primer uso" },
                { e: "💸", p: "Precios altos por baja calidad", s: "Precios de importación directa" },
              ].map((x) => (
                <div key={x.p} className="bg-[#F5F5F5] rounded-2xl p-5 text-left">
                  <span className="text-2xl block mb-3">{x.e}</span>
                  <p className="text-xs text-gray-400 line-through mb-1">{x.p}</p>
                  <p className="text-sm font-bold text-[#111111] flex items-center gap-2">
                    <span className="text-[#C1272D]">→</span> {x.s}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            SECCIÓN 3: LA SOLUCIÓN
        ══════════════════════════════════ */}
        <section className="py-16 px-4 sec" style={{ animationDelay: ".2s" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[#C1272D] text-xs font-black uppercase tracking-widest">La solución</span>
              <h2 className="font-black text-3xl sm:text-4xl text-[#111111] mt-2">
                {product.name} —<br className="sm:hidden" /> lo que necesitabas.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { e: "⚡", t: "Funciona al instante", d: "Sin configuraciones. Lo sacas de la caja y ya está funcionando." },
                { e: "🛡️", t: "Calidad que dura", d: "Materiales seleccionados. Garantía incluida. Si falla, lo resolvemos." },
                { e: "🚀", t: "En tu puerta hoy", d: "Entrega el mismo día en Bogotá. 1-3 días a todo Colombia." },
              ].map((b) => (
                <div
                  key={b.t}
                  className="bg-white rounded-3xl p-7 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group"
                >
                  <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform inline-block">{b.e}</span>
                  <h3 className="font-black text-[#111111] text-lg mb-2">{b.t}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            SECCIÓN 4: CTA CENTRAL
        ══════════════════════════════════ */}
        <section
          className="py-12 px-4 sec"
          style={{ background: "#111111", animationDelay: ".25s" }}
        >
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#C1272D]/20 text-[#C1272D] text-xs font-black px-4 py-2 rounded-full mb-5">
              <Flame className="w-3.5 h-3.5" />
              Este producto está explotando en ventas
            </div>
            <h2 className="font-black text-3xl sm:text-4xl text-white mb-3 leading-tight">
              Aún no ha llegado<br />
              <span className="text-[#C1272D]">a todas partes.</span>
            </h2>
            <p className="text-gray-400 mb-8 text-sm">
              Los GRC Lovers ya lo tienen. Tú también puedes ser el primero en tu círculo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
              <button
                onClick={openWA}
                className="flex-1 shimmer-cta text-white font-black text-base py-4 rounded-2xl flex items-center justify-center gap-2 hover:shadow-[0_8px_30px_rgba(193,39,45,0.4)] transition-shadow"
              >
                <WASvg />
                LO QUIERO AHORA
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-3">Precio actual: <strong className="text-white">{fmt(product.retail_price)}</strong></p>
          </div>
        </section>

        {/* ══════════════════════════════════
            SECCIÓN 5: VIDEO
        ══════════════════════════════════ */}
        {videoUrl && (
          <section className="bg-white py-16 px-4 sec" style={{ animationDelay: ".3s" }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <span className="text-[#C1272D] text-xs font-black uppercase tracking-widest">Demo real</span>
                <h2 className="font-black text-3xl text-[#111111] mt-2 flex items-center justify-center gap-3">
                  <Play className="w-7 h-7 text-[#C1272D]" />
                  Míralo en acción
                </h2>
              </div>
              <div className="rounded-3xl overflow-hidden bg-[#111111] aspect-video shadow-2xl">
                <video
                  src={videoUrl}
                  controls
                  preload="metadata"
                  poster={product.image_url ?? undefined}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════
            SECCIÓN 6: COMPARACIÓN
        ══════════════════════════════════ */}
        <section className="py-16 px-4 sec" style={{ animationDelay: ".32s" }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[#C1272D] text-xs font-black uppercase tracking-widest">La diferencia</span>
              <h2 className="font-black text-3xl text-[#111111] mt-2">
                ¿Por qué {product.name}?
              </h2>
            </div>
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
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
                ["Resultados lentos", "Funciona desde el primer uso"],
                ["Precio alto, baja calidad", "Mejor relación precio-calidad"],
              ].map(([bad, good], i) => (
                <div key={i} className="grid grid-cols-2 border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="px-5 py-4 text-sm text-gray-400 flex items-center gap-2">
                    <span className="text-red-400 font-bold flex-shrink-0">✗</span> {bad}
                  </div>
                  <div className="px-5 py-4 text-sm text-[#111111] bg-[#C1272D]/3 flex items-center gap-2 font-semibold">
                    <span className="text-emerald-500 font-bold flex-shrink-0">✓</span> {good}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            SECCIÓN 7: GALERÍA EXTRA
        ══════════════════════════════════ */}
        {allImages.length > 1 && (
          <section className="bg-white py-16 px-4 sec" style={{ animationDelay: ".35s" }}>
            <div className="max-w-5xl mx-auto">
              <h2 className="font-black text-3xl text-[#111111] text-center mb-10">
                Míralo en acción
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {allImages.slice(0, 6).map((img, i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden aspect-square bg-[#F5F5F5] cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => setActiveImg(img)}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════
            SECCIÓN 8: SOCIAL PROOF
        ══════════════════════════════════ */}
        <section className="py-16 px-4 sec" style={{ animationDelay: ".4s" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center gap-1 mb-3">
                {[1,2,3,4,5].map(i=><Star key={i} className="w-5 h-5 fill-[#D4AF37] text-[#D4AF37]"/>)}
              </div>
              <h2 className="font-black text-3xl text-[#111111]">
                Cientos de hogares<br className="sm:hidden" /> ya lo tienen
              </h2>
              <p className="text-gray-500 mt-2 text-sm">GRC Lovers en toda Colombia</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-[#C1272D]/20 hover:shadow-lg transition-all"
                >
                  <div className="flex gap-0.5 mb-3">
                    {[1,2,3,4,5].map(i=><Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]"/>)}
                  </div>
                  <p className="text-[#111111] text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#C1272D]/10 flex items-center justify-center font-black text-[#C1272D] text-sm flex-shrink-0">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-black text-xs text-[#111111]">{t.name}</p>
                      <p className="text-[10px] text-gray-400">{t.city} · GRC Lover ✓</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            SECCIÓN 9: URGENCIA FINAL
        ══════════════════════════════════ */}
        <section
          className="py-16 px-4 text-center sec"
          style={{ background: "#C1272D", animationDelay: ".45s" }}
        >
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-full mb-5">
              ⏳ Oferta por tiempo limitado
            </div>
            <p className="font-black text-6xl sm:text-7xl text-white mb-2 leading-none">
              {fmt(product.retail_price)}
            </p>
            {anc && (
              <p className="text-white/60 text-sm mb-1 line-through">{fmt(anc)}</p>
            )}
            <p className="text-white/80 text-sm mb-8">
              🚚 Envío gratis · 💳 Contra entrega · 📦 Últimas unidades
            </p>
            <button
              onClick={openWA}
              className="inline-flex items-center gap-3 bg-white text-[#C1272D] font-black text-lg px-10 py-5 rounded-2xl transition-all hover:bg-gray-50 hover:shadow-2xl hover:-translate-y-1"
            >
              <WASvg cls="w-6 h-6 text-[#C1272D]" />
              LO QUIERO AHORA
            </button>
            <p className="text-white/60 text-xs mt-4">
              Mensaje automático: nombre + precio + dirección lista para enviar
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════
            GRC LOVERS TEASER
        ══════════════════════════════════ */}
        <section
          className="py-14 px-4 text-center sec"
          style={{ background: "#111111", animationDelay: ".5s" }}
        >
          <div className="max-w-2xl mx-auto">
            <p className="text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-3">❤️ GRC LOVERS</p>
            <h2 className="font-black text-2xl sm:text-3xl text-white mb-3">
              Los que siempre encuentran<br />lo mejor primero.
            </h2>
            <p className="text-gray-400 text-sm mb-7">
              Únete a la comunidad que descubre productos virales antes que todos.
              Productos nuevos, ofertas exclusivas y acceso anticipado.
            </p>
            <button
              onClick={() =>
                window.open(
                  `https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC 👋 quiero ser GRC Lover y recibir los mejores productos primero")}`,
                  "_blank"
                )
              }
              className="inline-flex items-center gap-2 bg-[#C1272D] hover:bg-[#B71C1C] text-white font-black px-8 py-4 rounded-2xl transition-all hover:shadow-[0_8px_30px_rgba(193,39,45,0.4)]"
            >
              <WASvg />
              Únete a los GRC Lovers
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: "#111111" }} className="border-t border-white/8 px-4 py-10">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/logo-grc.png" alt="GRC" className="h-9 object-contain" />
              <div>
                <p className="font-black text-white text-base leading-none">GRC IMPORTACIONES</p>
                <p className="text-[#C1272D] text-[10px] font-bold uppercase tracking-widest">Descubre lo mejor. Antes que todos.</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm">📍 Bogotá, Colombia · 📲 +57 322 642 1110</p>
            <div className="flex items-center justify-center gap-5 mt-4">
              <a href="/tienda" className="text-gray-500 text-xs hover:text-white transition-colors">Tienda</a>
              <a href="/catalogo" className="text-gray-500 text-xs hover:text-white transition-colors">Mayorista</a>
              <button
                onClick={() =>
                  window.open(
                    `https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC 👋 quiero más información")}`,
                    "_blank"
                  )
                }
                className="text-gray-500 text-xs hover:text-[#C1272D] transition-colors flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </button>
            </div>
            <div className="border-t border-white/8 mt-6 pt-4">
              <p className="text-gray-600 text-xs">© 2026 GRC Importaciones · Todos los derechos reservados · ❤️ GRC Lovers</p>
            </div>
          </div>
        </footer>

        {/* FLOATING WA DESKTOP */}
        <a
          href={`https://wa.me/${GRC_WA}?text=${waMsg(product.name, fmt(product.retail_price), qty)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed z-50 group hidden sm:block"
          style={{ bottom: 24, right: 24 }}
        >
          <span className="absolute -top-11 right-0 bg-[#111111] text-white text-xs px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
            Comprar por WhatsApp 👋
          </span>
          <div
            className="w-[58px] h-[58px] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            style={{ background: "#25D366", boxShadow: "0 4px 24px rgba(37,211,102,0.5)", animation: "waBounce 4s infinite" }}
          >
            <WASvg cls="w-7 h-7" />
          </div>
        </a>

        {/* STICKY MOBILE BOTTOM BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 sm:hidden shadow-2xl">
          <div className="flex-1 min-w-0">
            <p className="font-black text-[#C1272D] text-2xl leading-none">{fmt(product.retail_price)}</p>
            {anc && <p className="text-xs text-gray-400 line-through mt-0.5">{fmt(anc)}</p>}
          </div>
          <button
            onClick={openWA}
            className="shimmer-cta flex items-center gap-2 text-white font-black text-sm px-5 py-3.5 rounded-2xl active:scale-95 transition-transform flex-shrink-0"
          >
            <WASvg cls="w-4 h-4" />
            LO QUIERO
          </button>
        </div>
      </div>
    </>
  );
}
