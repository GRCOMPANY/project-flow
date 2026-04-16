import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, Star, Truck, Shield, MessageCircle, Zap, Package,
  TrendingUp, Eye, ChevronRight, Flame, Sparkles, Lock
} from "lucide-react";

/* ─────────────────────────────────────────
   CONSTANTES GLOBALES
───────────────────────────────────────── */
const GRC_WA = "573226421110";

const waMsg = (name: string, price: string) =>
  encodeURIComponent(
    `Hola GRC 👋 vi este producto y quiero comprarlo:\n\n🛍 Producto: ${name}\n💰 Precio: ${price}\n\nMi dirección es:\nForma de pago: Contra entrega`
  );

const waGeneric = () =>
  window.open(`https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC 👋 quiero ver los productos disponibles")}`, "_blank");

const WASvg = ({ cls = "w-5 h-5" }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={`${cls} fill-current flex-shrink-0`}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const fmt = (v: number | null) => (v != null ? `$${v.toLocaleString("es-CO")}` : "");
const anchor = (p: number) => Math.round(p * 1.42);
const discPct = (real: number, anc: number) => Math.round(((anc - real) / anc) * 100);

/* ─────────────────────────────────────────
   CATEGORÍAS DE OPORTUNIDAD
───────────────────────────────────────── */
const OPP_CATS = [
  { key: "Todos",         icon: "⚡", label: "Todo el catálogo" },
  { key: "Cocina",        icon: "🍳", label: "Cocina inteligente" },
  { key: "Hogar",         icon: "🏠", label: "Hogar del futuro" },
  { key: "Tecnología",    icon: "💡", label: "Tech viral" },
  { key: "Organización",  icon: "📦", label: "Organización pro" },
  { key: "General",       icon: "🔥", label: "Productos virales" },
];

/* ─────────────────────────────────────────
   BADGE CONFIG
───────────────────────────────────────── */
const BADGES = [
  { label: "🔥 Se está vendiendo",  bg: "#C1272D", text: "#fff" },
  { label: "💥 Oferta limitada",    bg: "#111111", text: "#D4AF37" },
  { label: "⭐ Recomendado",        bg: "#D4AF37", text: "#111111" },
  { label: "🚀 Viral ahora",        bg: "#C1272D", text: "#fff" },
];
const getBadge = (id: string) => BADGES[id.charCodeAt(0) % BADGES.length];

const TESTIMONIALS = [
  { name: "Valentina R.", city: "Bogotá", text: "Vi el producto, lo compré sin pensarlo dos veces. Ya pedí el doble para regalar.", stars: 5 },
  { name: "Santiago M.", city: "Medellín", text: "Pensé que era como los demás. No. Este está brutal. Lo tienen todos en mi trabajo.", stars: 5 },
  { name: "Daniela P.", city: "Cali", text: "GRC siempre me sorprende. Llevo 4 compras y cada una mejor que la anterior.", stars: 5 },
  { name: "Camilo T.", city: "Barranquilla", text: "Lo vi en redes y no lo conseguía en ningún lado. GRC lo tenía. Perfecto.", stars: 5 },
  { name: "Isabella V.", city: "Bucaramanga", text: "Calidad increíble por el precio. Ya se lo recomendé a toda mi familia.", stars: 5 },
  { name: "Felipe A.", city: "Pereira", text: "El producto llegó el mismo día. Funciona exactamente como prometen.", stars: 5 },
];

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  images: string[] | null;
  retail_price: number | null;
  is_featured: boolean | null;
  status: string | null;
}

interface Banner {
  id: string;
  imagen_url: string | null;
  titulo: string | null;
  subtitulo: string | null;
  texto_boton: string | null;
  activo: boolean;
  orden: number;
}

const HERO_DEFAULTS = {
  hero_titulo_1: "DESCUBRE",
  hero_titulo_2: "PRODUCTOS",
  hero_titulo_3: "QUE SE",
  hero_titulo_4: "VENDEN SOLOS",
  hero_badge: "Lo más viral en Colombia 2026",
  hero_subtexto: "Lo que ves aquí, en 30 días está en todas partes. Sé el primero.",
  hero_boton_1: "VER PRODUCTOS 🔥",
  hero_boton_2: "Hablar con George",
};

const smartCat = (name: string | null, desc: string | null, cat: string | null) => {
  const t = `${name ?? ""} ${desc ?? ""}`.toLowerCase();
  if (/hervidor|batidora|lonchera|escurridor|cocina/.test(t)) return "Cocina";
  if (/cepillo|ducha|baño|tensiómetro|hogar/.test(t)) return "Hogar";
  if (/watch|proyector|aspirador|tecnología|tech/.test(t)) return "Tecnología";
  if (/caja|almacenamiento|organiz/.test(t)) return "Organización";
  return cat ?? "General";
};

/* ─────────────────────────────────────────
   COUNTDOWN
───────────────────────────────────────── */
const useCountdown = (init = 10799) => {
  const [s, setS] = useState(init);
  useEffect(() => {
    const t = setInterval(() => setS((x) => (x > 0 ? x - 1 : init)), 1000);
    return () => clearInterval(t);
  }, [init]);
  return {
    h: String(Math.floor(s / 3600)).padStart(2, "0"),
    m: String(Math.floor((s % 3600) / 60)).padStart(2, "0"),
    s: String(s % 60).padStart(2, "0"),
  };
};

/* ─────────────────────────────────────────
   PRODUCT CARD
───────────────────────────────────────── */
const ProductCard = ({ p, idx, onDetail }: { p: Product; idx: number; onDetail: () => void }) => {
  const badge = getBadge(p.id);
  const anc = p.retail_price ? anchor(p.retail_price) : null;
  const disc = anc && p.retail_price ? discPct(p.retail_price, anc) : null;

  const handleWA = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(
      `https://wa.me/${GRC_WA}?text=${waMsg(p.name, fmt(p.retail_price))}`,
      "_blank"
    );
  };

  return (
    <article
      className="grc-card bg-white rounded-2xl overflow-hidden flex flex-col cursor-pointer group"
      style={{ "--d": `${idx * 55}ms` } as React.CSSProperties}
      onClick={onDetail}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-[#F5F5F5] aspect-square">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-200" />
          </div>
        )}

        {/* Badge */}
        <span
          className="absolute top-3 left-3 text-[10px] font-black px-3 py-1.5 rounded-full"
          style={{ background: badge.bg, color: badge.text }}
        >
          {badge.label}
        </span>

        {/* Discount */}
        {disc && (
          <span className="absolute top-3 right-3 bg-white text-[#C1272D] font-black text-xs px-2.5 py-1 rounded-full shadow-sm">
            -{disc}%
          </span>
        )}

        {/* Featured star */}
        {p.is_featured && (
          <span className="absolute bottom-3 left-3 bg-[#D4AF37] text-[#111111] font-black text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" /> TOP GRC
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[#C1272D]/0 group-hover:bg-[#C1272D]/5 transition-all duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-[#C1272D] font-bold text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Ver producto
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {p.category && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{p.category}</span>
        )}
        <h3 className="font-bold text-[#111111] text-sm leading-snug line-clamp-2 group-hover:text-[#C1272D] transition-colors">
          {p.name}
        </h3>

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2 mb-3">
            {anc && <span className="text-xs text-gray-400 line-through">{fmt(anc)}</span>}
            <span className="font-black text-2xl text-[#C1272D] leading-none">{fmt(p.retail_price)}</span>
          </div>

          <div className="flex flex-col gap-2">
            {/* WhatsApp CTA */}
            <button
              onClick={handleWA}
              className="w-full flex items-center justify-center gap-2 bg-[#C1272D] hover:bg-[#B71C1C] text-white font-black text-sm py-3 rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-[0_4px_20px_rgba(193,39,45,0.3)]"
            >
              <WASvg cls="w-4 h-4" />
              LO QUIERO
            </button>
            <p className="text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Disponible · Entrega hoy Bogotá
            </p>
          </div>
        </div>
      </div>
    </article>
  );
};

/* ─────────────────────────────────────────
   FEATURED MINI-LANDING
───────────────────────────────────────── */
const FeaturedLanding = ({ p, onDetail }: { p: Product; onDetail: () => void }) => {
  const anc = p.retail_price ? anchor(p.retail_price) : null;
  const disc = anc && p.retail_price ? discPct(p.retail_price, anc) : null;

  const handleWA = () =>
    window.open(`https://wa.me/${GRC_WA}?text=${waMsg(p.name, fmt(p.retail_price))}`, "_blank");

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-[#C1272D]/8 text-[#C1272D] text-xs font-black px-4 py-2 rounded-full mb-3">
            <Flame className="w-3.5 h-3.5" /> PRODUCTO ESTRELLA DE LA SEMANA
          </span>
          <h2 className="font-black text-3xl sm:text-4xl text-[#111111]">
            El que todos están pidiendo.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center bg-[#F5F5F5] rounded-3xl overflow-hidden">
          {/* Image */}
          <div
            className="relative aspect-square overflow-hidden cursor-pointer"
            onClick={onDetail}
          >
            <img
              src={p.image_url || "/placeholder.svg"}
              alt={p.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
            {disc && (
              <div className="absolute top-5 left-5 bg-[#C1272D] text-white rounded-2xl px-5 py-3 text-center">
                <p className="font-black text-2xl leading-none">-{disc}%</p>
                <p className="text-[10px] font-medium opacity-80 mt-0.5">DESCUENTO</p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8 lg:p-10">
            {/* Hook */}
            <p className="text-[#C1272D] text-sm font-black uppercase tracking-widest mb-2">
              ⚡ Agotándose rápido
            </p>

            <h3 className="font-black text-2xl sm:text-3xl text-[#111111] leading-tight mb-3">
              {p.name}
            </h3>

            {p.description && (
              <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-3">
                {p.description}
              </p>
            )}

            {/* Problem → Solution */}
            <div className="bg-white rounded-2xl p-4 mb-5 border-l-4 border-[#C1272D]">
              <p className="text-sm font-bold text-[#111111] mb-1">¿Cansado de soluciones que no funcionan?</p>
              <p className="text-xs text-gray-500">Este producto resuelve el problema de raíz. Sin complicaciones.</p>
            </div>

            {/* Benefits */}
            <ul className="space-y-2 mb-6">
              {[
                "Funciona desde el primer uso",
                "Materiales de calidad premium",
                "Entrega el mismo día en Bogotá",
                "Pago cómodo contra entrega",
              ].map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-[#C1272D] flex items-center justify-center flex-shrink-0">
                    <ChevronRight className="w-3 h-3 text-white" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              {anc && <span className="text-lg text-gray-400 line-through">{fmt(anc)}</span>}
              <span className="font-black text-4xl text-[#C1272D]">{fmt(p.retail_price)}</span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleWA}
                className="w-full flex items-center justify-center gap-2 bg-[#C1272D] hover:bg-[#B71C1C] text-white font-black text-base py-4 rounded-2xl transition-all hover:shadow-[0_8px_30px_rgba(193,39,45,0.35)] hover:-translate-y-0.5"
              >
                <WASvg />
                PEDIR POR WHATSAPP
              </button>
              <button
                onClick={onDetail}
                className="w-full text-[#C1272D] font-bold text-sm py-3 rounded-2xl border-2 border-[#C1272D]/20 hover:border-[#C1272D] transition-colors flex items-center justify-center gap-2"
              >
                Ver todos los detalles <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────
   POR QUÉ GRC (PSICOLÓGICA)
───────────────────────────────────────── */
const WhyGRC = () => (
  <section className="py-16 px-4" style={{ background: "#111111" }}>
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest block mb-3">La verdad detrás de GRC</span>
        <h2 className="font-black text-3xl sm:text-4xl text-white leading-tight">
          ¿Por qué todos están<br className="hidden sm:block" /> comprando en GRC?
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            icon: <TrendingUp className="w-7 h-7" />,
            title: "Productos que se venden solos",
            desc: "Seleccionamos solo lo que ya tiene demanda comprobada en el mercado global.",
          },
          {
            icon: <Zap className="w-7 h-7" />,
            title: "Precios de importación directa",
            desc: "Sin intermediarios. Compramos directo para darte el mejor precio en Colombia.",
          },
          {
            icon: <Shield className="w-7 h-7" />,
            title: "Pago contra entrega",
            desc: "Recibes tu producto primero. Pagas cuando lo tienes en tus manos.",
          },
          {
            icon: <Sparkles className="w-7 h-7" />,
            title: "Lo más viral primero",
            desc: "Si está en tendencia global, en GRC ya lo tienes antes que en cualquier tienda.",
          },
        ].map((x) => (
          <div
            key={x.title}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-[#C1272D]/40 transition-all duration-300 group"
          >
            <span className="text-[#C1272D] block mb-4 group-hover:scale-110 transition-transform inline-block">
              {x.icon}
            </span>
            <h3 className="font-black text-white text-base mb-2">{x.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{x.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────
   GRC LOVERS
───────────────────────────────────────── */
const GRCLovers = () => (
  <section className="py-16 px-4 bg-white overflow-hidden relative">
    {/* Decorative */}
    <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#C1272D]/4 rounded-full pointer-events-none" />
    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#D4AF37]/5 rounded-full pointer-events-none" />

    <div className="max-w-5xl mx-auto relative z-10">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        {/* Text */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#C1272D] text-white text-xs font-black px-4 py-2 rounded-full mb-5">
            ❤️ GRC LOVERS
          </div>
          <h2 className="font-black text-4xl sm:text-5xl text-[#111111] leading-tight mb-4">
            No somos clientes.<br />
            <span className="text-[#C1272D]">Somos los primeros.</span>
          </h2>
          <p className="text-gray-500 text-base leading-relaxed mb-6">
            En GRC no vendemos productos comunes.<br />
            Buscamos lo más innovador del mundo para que <strong className="text-[#111111]">tú lo tengas primero.</strong>
          </p>
          <ul className="space-y-3 mb-8">
            {[
              "Compras antes que los demás lo descubran",
              "Acceso a productos virales del mercado global",
              "Precios directos sin intermediarios",
              "Comunidad de personas que encuentran lo mejor",
            ].map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-gray-700">
                <span className="w-2 h-2 rounded-full bg-[#C1272D] flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <button
            onClick={() =>
              window.open(
                `https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC 👋 quiero ser parte de los GRC Lovers y recibir los productos más nuevos")}`,
                "_blank"
              )
            }
            className="inline-flex items-center gap-2 bg-[#C1272D] hover:bg-[#B71C1C] text-white font-black px-8 py-4 rounded-2xl transition-all hover:shadow-[0_8px_30px_rgba(193,39,45,0.3)] hover:-translate-y-0.5"
          >
            <WASvg />
            Únete a los GRC Lovers
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { n: "+500", l: "Pedidos al mes" },
            { n: "+100", l: "GRC Lovers activos" },
            { n: "4.9★", l: "Calificación promedio" },
            { n: "24h", l: "Entrega en Bogotá" },
          ].map((s) => (
            <div
              key={s.l}
              className="bg-[#F5F5F5] rounded-2xl p-6 text-center border-2 border-transparent hover:border-[#C1272D]/20 transition-colors"
            >
              <p className="font-black text-3xl text-[#C1272D] mb-1">{s.n}</p>
              <p className="text-xs text-gray-500 font-medium">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────── */
const Testimonials = () => (
  <section className="py-16 px-4" style={{ background: "#F5F5F5" }}>
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <div className="flex justify-center gap-1 mb-3">
          {[1,2,3,4,5].map((i) => <Star key={i} className="w-5 h-5 fill-[#D4AF37] text-[#D4AF37]" />)}
        </div>
        <h2 className="font-black text-3xl sm:text-4xl text-[#111111]">Lo dicen los GRC Lovers</h2>
        <p className="text-gray-500 mt-2">Personas reales de toda Colombia</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#C1272D]/20 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex gap-0.5 mb-3">
              {[1,2,3,4,5].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />)}
            </div>
            <p className="text-[#111111] text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#C1272D]/10 flex items-center justify-center font-black text-[#C1272D] text-sm flex-shrink-0">
                {t.name[0]}
              </div>
              <div>
                <p className="font-black text-xs text-[#111111]">{t.name}</p>
                <p className="text-[10px] text-gray-400">{t.city} · GRC Lover verificado ✓</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────
   BENEFITS BAR
───────────────────────────────────────── */
const Benefits = () => (
  <section className="bg-white border-y border-gray-100 py-8 px-4">
    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
      {[
        { icon: <Truck className="w-6 h-6 text-[#C1272D]" />, t: "Envíos rápidos", s: "A todo Colombia" },
        { icon: <Lock className="w-6 h-6 text-[#C1272D]" />, t: "Compra segura", s: "100% garantizado" },
        { icon: <MessageCircle className="w-6 h-6 text-[#C1272D]" />, t: "Atención real", s: "Respuesta < 1 hora" },
        { icon: <Shield className="w-6 h-6 text-[#C1272D]" />, t: "Contra entrega", s: "Pagas al recibir" },
      ].map((b) => (
        <div key={b.t} className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C1272D]/8 flex items-center justify-center flex-shrink-0">
            {b.icon}
          </div>
          <div>
            <p className="font-bold text-sm text-[#111111]">{b.t}</p>
            <p className="text-xs text-gray-400">{b.s}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

/* ─────────────────────────────────────────
   FLOATING WA
───────────────────────────────────────── */
const FloatingWA = () => (
  <a
    href={`https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC 👋 quiero ver los productos disponibles")}`}
    target="_blank"
    rel="noopener noreferrer"
    className="fixed z-50 group"
    style={{ bottom: 24, right: 24 }}
  >
    <span className="absolute -top-11 right-0 bg-[#111111] text-white text-xs px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
      Hablar con George 👋
    </span>
    <div
      className="w-[58px] h-[58px] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
      style={{
        background: "#25D366",
        boxShadow: "0 4px 24px rgba(37,211,102,0.5)",
        animation: "waBounce 4s infinite",
      }}
    >
      <WASvg cls="w-7 h-7" />
    </div>
  </a>
);

/* ═══════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════ */
export default function TiendaPublica() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Todos");
  const [scrolled, setScrolled] = useState(false);
  const catalogRef = useRef<HTMLElement>(null);
  const { h, m, s } = useCountdown();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["tienda-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_seller_view")
        .select("id, name, description, category, image_url, images, retail_price, is_featured, status")
        .eq("status", "activo");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const db = supabase as any;

  const { data: heroConfig = {} } = useQuery({
    queryKey: ["tienda-hero-config"],
    queryFn: async () => {
      const keys = Object.keys(HERO_DEFAULTS);
      const { data } = await db
        .from("store_config")
        .select("clave, valor")
        .in("clave", keys);
      const map: Record<string, string> = {};
      (data ?? []).forEach((row: { clave: string; valor: string }) => {
        map[row.clave] = row.valor;
      });
      return map;
    },
  });

  const { data: banners = [] } = useQuery({
    queryKey: ["tienda-banners"],
    queryFn: async () => {
      const { data } = await db
        .from("banners")
        .select("id, imagen_url, titulo, subtitulo, texto_boton, activo, orden")
        .eq("activo", true)
        .order("orden", { ascending: true });
      return (data ?? []) as Banner[];
    },
  });

  const hero = (key: keyof typeof HERO_DEFAULTS): string =>
    (heroConfig as Record<string, string>)[key] ?? HERO_DEFAULTS[key];

  const filtered = products.filter((p) => {
    const ms = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const sc = smartCat(p.name, p.description, p.category);
    const mc = activeCat === "Todos" || sc === activeCat;
    return ms && mc;
  });

  const featured = products.find((p) => p.is_featured) ?? products[0];

  const scrollToCatalog = () =>
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });

  /* Insert MID-BANNER after 4th card */
  const grid: (Product | "banner")[] = [];
  filtered.forEach((p, i) => {
    if (i === 4) grid.push("banner");
    grid.push(p);
  });
  if (filtered.length > 0 && filtered.length <= 4) grid.push("banner");

  return (
    <>
      <style>{`
        @keyframes waBounce{0%,88%,100%{transform:translateY(0)}92%{transform:translateY(-8px)}96%{transform:translateY(0)}98%{transform:translateY(-3px)}}
        @keyframes grcUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmerRed{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.4}}
        .grc-card{opacity:0;animation:grcUp 0.45s ease-out var(--d,0ms) forwards;box-shadow:0 2px 12px rgba(0,0,0,.05);transition:transform .25s ease,box-shadow .25s ease,border-color .2s ease}
        .grc-card:hover{transform:translateY(-5px);box-shadow:0 16px 48px rgba(193,39,45,.12)}
        .scale-108{transform:scale(1.08)}
        .shimmer-cta{background-size:200% 100%;background-image:linear-gradient(90deg,#C1272D 0%,#e03040 45%,#C1272D 100%);animation:shimmerRed 2.5s infinite}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
        @media(prefers-reduced-motion:reduce){.grc-card{animation:none;opacity:1}.grc-card:hover{transform:none}}
      `}</style>

      <div className="min-h-screen" style={{ background: "#F5F5F5" }}>

        {/* ══ 1. URGENCY BAR ══ */}
        <div className="sticky top-0 z-50 bg-[#C1272D] py-2.5 px-4 flex items-center justify-center gap-3 flex-wrap">
          <span className="text-white text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white" style={{ animation: "pulse-dot 1.5s infinite" }} />
            🔥 OFERTAS ACTIVAS — TERMINAN EN:
          </span>
          <span className="font-mono font-black text-white text-sm tracking-widest bg-[#B71C1C] px-3 py-1 rounded-lg">
            {h}:{m}:{s}
          </span>
          <span className="hidden sm:inline text-white/80 text-xs">· Envío gratis a Colombia</span>
        </div>

        {/* ══ 2. HEADER ══ */}
        <header
          className={`sticky top-[40px] z-40 bg-white transition-all duration-300 ${scrolled ? "shadow-lg" : "border-b border-gray-100"}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
            {/* Logo */}
            <a href="/tienda" className="flex-shrink-0 flex items-center gap-2">
              <img src="/logo-grc.png" alt="GRC" className="h-10 object-contain" />
              <div className="hidden md:block">
                <p className="font-black text-[#111111] text-base leading-none">GRC</p>
                <p className="text-[9px] text-[#C1272D] font-bold uppercase tracking-widest leading-none">Importaciones</p>
              </div>
            </a>

            {/* Search */}
            <div className="flex-1 relative max-w-lg mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Busca el producto que te sorprenda..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => scrollToCatalog()}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F5] border-2 border-transparent rounded-full text-sm focus:outline-none focus:border-[#C1272D] focus:bg-white transition-all"
              />
            </div>

            {/* WA button */}
            <button
              onClick={waGeneric}
              className="shimmer-cta flex-shrink-0 flex items-center gap-2 text-white font-black text-sm px-5 py-2.5 rounded-full transition-all hover:shadow-[0_4px_20px_rgba(193,39,45,0.4)]"
            >
              <WASvg cls="w-4 h-4" />
              <span className="hidden sm:inline">Comprar</span>
            </button>
          </div>
        </header>

        {/* ══ 3. HERO ══ */}
        <section className="relative overflow-hidden" style={{ background: "#111111" }}>
          {/* Background texture */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#C1272D]/10 blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#C1272D]/5 blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#D4AF37]/3 blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 border border-[#C1272D]/40 text-[#C1272D] text-xs font-black px-4 py-2 rounded-full mb-6 bg-[#C1272D]/8">
                <Flame className="w-3.5 h-3.5" />
                {hero("hero_badge")}
              </div>
              <h1 className="font-black text-5xl sm:text-7xl text-white leading-[1.0] tracking-tight mb-5">
                {hero("hero_titulo_1")}<br />
                <span className="text-[#C1272D]">{hero("hero_titulo_2")}</span><br />
                {hero("hero_titulo_3")}<br />
                <span className="relative inline-block">
                  {hero("hero_titulo_4")}
                  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#D4AF37] rounded-full" />
                </span>
              </h1>
              <p className="text-gray-400 text-base sm:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
                {hero("hero_subtexto")}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={scrollToCatalog}
                  className="shimmer-cta flex items-center gap-2 text-white font-black text-base px-8 py-4 rounded-2xl transition-all hover:shadow-[0_8px_30px_rgba(193,39,45,0.4)] hover:-translate-y-1"
                >
                  {hero("hero_boton_1")}
                </button>
                <button
                  onClick={waGeneric}
                  className="flex items-center gap-2 border-2 border-white/20 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all hover:border-white/50 hover:bg-white/5"
                >
                  <WASvg />
                  {hero("hero_boton_2")}
                </button>
              </div>

              {/* Social proof micro */}
              <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-center">
                <div>
                  <p className="font-black text-2xl text-white">+500</p>
                  <p className="text-gray-500 text-xs">Pedidos este mes</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <p className="font-black text-2xl text-white">4.9</p>
                  <div className="flex justify-center gap-0.5">
                    {[1,2,3,4,5].map(i=><Star key={i} className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]"/>)}
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <p className="font-black text-2xl text-white">24h</p>
                  <p className="text-gray-500 text-xs">Entrega Bogotá</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <p className="font-black text-2xl text-[#D4AF37]">GRC</p>
                  <p className="text-gray-500 text-xs">Lovers</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ BANNERS ══ */}
        {banners.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className={`grid gap-4 ${banners.length === 1 ? "grid-cols-1" : banners.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="relative overflow-hidden rounded-2xl"
                  style={{ minHeight: 180 }}
                >
                  {b.imagen_url ? (
                    <img
                      src={b.imagen_url}
                      alt={b.titulo ?? "Banner GRC"}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#C1272D] to-[#8B0000]" />
                  )}
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative z-10 p-6 flex flex-col justify-end h-full" style={{ minHeight: 180 }}>
                    {b.titulo && (
                      <h3 className="font-black text-white text-xl sm:text-2xl leading-tight mb-1">
                        {b.titulo}
                      </h3>
                    )}
                    {b.subtitulo && (
                      <p className="text-white/80 text-sm mb-3">{b.subtitulo}</p>
                    )}
                    {b.texto_boton && (
                      <button
                        onClick={scrollToCatalog}
                        className="self-start shimmer-cta text-white font-black text-sm px-5 py-2.5 rounded-xl transition-all hover:shadow-[0_4px_16px_rgba(193,39,45,0.4)]"
                      >
                        {b.texto_boton}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══ BENEFITS ══ */}
        <Benefits />

        {/* ══ 4. CATEGORÍAS = OPORTUNIDADES ══ */}
        <section className="bg-white border-b border-gray-100 py-5 px-4">
          <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 w-max mx-auto sm:w-auto sm:justify-center sm:flex-wrap">
              {OPP_CATS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setActiveCat(c.key);
                    scrollToCatalog();
                  }}
                  className={`flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 ${
                    activeCat === c.key
                      ? "bg-[#C1272D] text-white shadow-md shadow-[#C1272D]/20"
                      : "bg-[#F5F5F5] text-gray-600 hover:bg-[#C1272D]/8 hover:text-[#C1272D]"
                  }`}
                >
                  <span>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 5. PRODUCT GRID ══ */}
        <section ref={catalogRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
            <div>
              <p className="text-[#C1272D] text-xs font-black uppercase tracking-widest mb-1">
                {activeCat === "Todos" ? "Catálogo completo" : OPP_CATS.find(c=>c.key===activeCat)?.label}
              </p>
              <h2 className="font-black text-3xl text-[#111111]">
                {search ? `Resultados para "${search}"` : "Descubre lo mejor."}
              </h2>
            </div>
            {filtered.length > 0 && (
              <span className="text-sm text-gray-400 flex-shrink-0">{filtered.length} productos</span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-black text-xl text-[#111111] mb-2">Sin resultados</p>
              <p className="text-gray-400 text-sm mb-6">Intenta con otra categoría o búsqueda</p>
              <button
                onClick={() => { setSearch(""); setActiveCat("Todos"); }}
                className="bg-[#C1272D] text-white font-bold px-6 py-3 rounded-xl text-sm"
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {grid.map((item, idx) =>
                item === "banner" ? (
                  /* MID-BANNER */
                  <div
                    key="banner"
                    className="col-span-2 sm:col-span-3 xl:col-span-4 rounded-3xl overflow-hidden relative"
                    style={{ background: "#111111" }}
                  >
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-[#C1272D]/15 blur-[60px]" />
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 p-8 sm:p-10">
                      <div className="text-center sm:text-left">
                        <span className="inline-block bg-[#D4AF37] text-[#111111] text-[10px] font-black px-3 py-1 rounded-full mb-3">
                          ❤️ GRC LOVERS
                        </span>
                        <h3 className="font-black text-2xl sm:text-3xl text-white mb-2">
                          Los que siempre encuentran<br className="hidden sm:block" /> lo mejor primero.
                        </h3>
                        <p className="text-gray-400 text-sm max-w-md">
                          Únete a la comunidad que descubre productos virales antes que todos.
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          window.open(
                            `https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC 👋 quiero ser GRC Lover y recibir los mejores productos primero")}`,
                            "_blank"
                          )
                        }
                        className="flex-shrink-0 flex items-center gap-2 bg-[#C1272D] text-white font-black text-sm px-7 py-4 rounded-2xl hover:bg-[#B71C1C] transition-all hover:shadow-[0_8px_30px_rgba(193,39,45,0.4)]"
                      >
                        <WASvg />
                        Únete ahora
                      </button>
                    </div>
                  </div>
                ) : (
                  <ProductCard
                    key={item.id}
                    p={item}
                    idx={idx}
                    onDetail={() => navigate(`/producto/${item.id}`)}
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* ══ 6. FEATURED PRODUCT MINI-LANDING ══ */}
        {featured && (
          <FeaturedLanding
            p={featured}
            onDetail={() => navigate(`/producto/${featured.id}`)}
          />
        )}

        {/* ══ 7. POR QUÉ GRC (PSICOLÓGICA) ══ */}
        <WhyGRC />

        {/* ══ 8. GRC LOVERS ══ */}
        <GRCLovers />

        {/* ══ 9. TESTIMONIOS ══ */}
        <Testimonials />

        {/* ══ 10. MARCA (EMOCIONAL) ══ */}
        <section className="py-20 px-4 bg-white text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-block bg-[#C1272D] text-white font-black text-xs px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
              Nuestra filosofía
            </div>
            <h2 className="font-black text-4xl sm:text-5xl text-[#111111] leading-tight mb-6">
              "En GRC no vendemos<br />
              <span className="text-[#C1272D]">productos comunes.</span>"
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed max-w-xl mx-auto mb-8">
              Buscamos lo más innovador del mundo para que tú lo tengas primero.
              No es una tienda. Es un descubrimiento constante.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={scrollToCatalog}
                className="bg-[#C1272D] text-white font-black px-8 py-4 rounded-2xl hover:bg-[#B71C1C] transition-all hover:shadow-[0_8px_30px_rgba(193,39,45,0.3)]"
              >
                Descubrir productos
              </button>
              <button
                onClick={() =>
                  window.open(
                    `https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC 👋 quiero conocer más sobre la marca")}`,
                    "_blank"
                  )
                }
                className="border-2 border-[#C1272D]/30 text-[#C1272D] font-bold px-8 py-4 rounded-2xl hover:border-[#C1272D] transition-colors"
              >
                Hablar con nosotros
              </button>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer style={{ background: "#111111" }} className="px-4 pt-14 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
              {/* Brand */}
              <div>
                <img src="/logo-grc.png" alt="GRC" className="h-10 mb-4 object-contain" />
                <p className="font-black text-white text-base mb-1">GRC IMPORTACIONES</p>
                <p className="text-[#C1272D] text-xs font-bold uppercase tracking-widest mb-3">
                  Descubre lo mejor. Antes que todos.
                </p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Productos innovadores para tu hogar al mejor precio en Colombia.
                </p>
              </div>

              {/* Categorías */}
              <div>
                <p className="font-black text-xs text-gray-400 uppercase tracking-wider mb-4">Oportunidades</p>
                <ul className="space-y-2">
                  {OPP_CATS.filter(c=>c.key!=="Todos").map(c=>(
                    <li key={c.key}>
                      <button
                        onClick={() => { setActiveCat(c.key); scrollToCatalog(); }}
                        className="text-gray-500 text-sm hover:text-white transition-colors flex items-center gap-2"
                      >
                        <span>{c.icon}</span> {c.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contacto */}
              <div>
                <p className="font-black text-xs text-gray-400 uppercase tracking-wider mb-4">Contáctanos</p>
                <p className="text-gray-500 text-sm mb-1">📍 Bogotá, Colombia</p>
                <p className="text-gray-500 text-sm mb-5">📲 +57 322 642 1110</p>
                <button
                  onClick={waGeneric}
                  className="flex items-center gap-2 text-white font-black text-sm px-5 py-3 rounded-2xl transition-colors"
                  style={{ background: "#25D366" }}
                >
                  <WASvg />
                  Escribir ahora
                </button>
                <a
                  href="/catalogo"
                  className="block mt-3 text-gray-500 text-xs hover:text-[#D4AF37] transition-colors"
                >
                  ¿Eres revendedor? → Catálogo mayorista
                </a>
              </div>
            </div>

            <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-gray-600 text-xs">
                © 2026 GRC Importaciones · Todos los derechos reservados
              </p>
              <p className="text-gray-600 text-xs font-bold">
                ❤️ GRC LOVERS — Los primeros siempre
              </p>
            </div>
          </div>
        </footer>

        {/* FLOATING WA */}
        <FloatingWA />

        {/* RESELLER FLOAT */}
        <button
          onClick={() =>
            window.open(
              `https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC 👋 me interesa revender sus productos. ¿Cuáles son los precios mayoristas?")}`,
              "_blank"
            )
          }
          className="fixed z-50 font-black text-xs text-white px-4 py-2.5 rounded-full shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          style={{ bottom: 30, left: 24, background: "#C1272D" }}
        >
          💰 Gana revendiendo →
        </button>
      </div>
    </>
  );
}
