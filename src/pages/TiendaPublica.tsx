import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Star, Truck, Shield, RefreshCw, Headphones, ChevronRight, Zap, ArrowRight } from "lucide-react";

const GRC_WA = "573226421110";
const WA_ICON = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const CATEGORIES = ["Todos", "Cocina", "Hogar", "Tecnología", "Organización", "General"];
const FOMO = ["🔥 Más vendido", "⚡ Viral", "🆕 Nuevo", "🚀 Tendencia"];
const TESTIMONIALS = [
  { name: "Carolina M.", city: "Bogotá", text: "Llegó súper rápido y funciona perfecto. Ya pedí otro para mi mamá.", rating: 5 },
  { name: "Andrés F.", city: "Medellín", text: "No pensé que fuera tan bueno por el precio. Totalmente recomendado.", rating: 5 },
  { name: "Laura G.", city: "Cali", text: "Me encantó la calidad. Ya es el tercer producto que les compro.", rating: 5 },
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

const smartCat = (name: string | null, desc: string | null, cat: string | null) => {
  const t = `${name ?? ""} ${desc ?? ""}`.toLowerCase();
  if (/hervidor|batidora|lonchera|escurridor|cocina/.test(t)) return "Cocina";
  if (/cepillo|ducha|baño|tensiómetro|hogar/.test(t)) return "Hogar";
  if (/watch|onn|proyector|aspirador|tecnología/.test(t)) return "Tecnología";
  if (/caja|almacenamiento|organiz/.test(t)) return "Organización";
  return cat ?? "General";
};

const fmt = (v: number | null) => (v != null ? `$${v.toLocaleString("es-CO")}` : "");
const anchor = (p: number) => Math.round(p * 1.4);
const fomo = (id: string) => FOMO[id.charCodeAt(0) % FOMO.length];

/* ── UrgencyBar ── */
const UrgencyBar = () => {
  const [s, setS] = useState(10799);
  useEffect(() => {
    const t = setInterval(() => setS((x) => (x > 0 ? x - 1 : 10799)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sc = String(s % 60).padStart(2, "0");
  return (
    <div className="bg-[#1A1A1A] text-white text-xs font-medium py-2.5 px-4 text-center flex items-center justify-center gap-2 flex-wrap">
      <span>🔥 Oferta del día — termina en</span>
      <span className="font-mono font-bold text-[#D4AF37] tracking-widest">{h}:{m}:{sc}</span>
      <span className="hidden sm:inline">· Envío gratis a todo Colombia</span>
    </div>
  );
};

/* ── Header ── */
const Header = ({ search, onSearch, onWA }: { search: string; onSearch: (v: string) => void; onWA: () => void }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <header
      className={`sticky top-[36px] z-40 bg-white transition-shadow duration-300 ${scrolled ? "shadow-md" : "border-b border-gray-100"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        {/* Logo */}
        <a href="/tienda" className="flex-shrink-0 flex items-center gap-2">
          <img src="/logo-grc.png" alt="GRC" className="h-10 object-contain" />
          <span className="hidden md:block font-black text-[#1A1A1A] text-lg tracking-tight">GRC</span>
        </a>
        {/* Search */}
        <div className="flex-1 relative max-w-xl mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#C1272D] focus:bg-white transition-all"
          />
        </div>
        {/* CTA */}
        <button
          onClick={onWA}
          className="flex-shrink-0 flex items-center gap-2 bg-[#C1272D] hover:bg-[#B71C1C] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors shadow-sm"
        >
          {WA_ICON}
          <span className="hidden sm:inline">Comprar</span>
        </button>
      </div>
    </header>
  );
};

/* ── Hero ── */
const Hero = ({ count, onCTA, onWA }: { count: number; onCTA: () => void; onWA: () => void }) => {
  const PHRASES = ["Tecnología para tu hogar", "que no sabías que necesitabas."];
  return (
    <section className="bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid md:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div className="order-2 md:order-1">
          <div className="inline-flex items-center gap-2 bg-[#C1272D]/8 text-[#C1272D] text-xs font-bold px-4 py-2 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            🔥 Tendencias 2026
          </div>
          <h1 className="font-black text-5xl sm:text-6xl text-[#1A1A1A] leading-[1.05] tracking-tight mb-4">
            {PHRASES[0]}<br />
            <span className="text-[#C1272D]">{PHRASES[1]}</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed max-w-md mb-8">
            Productos innovadores, útiles y al mejor precio en Colombia.
            Contra entrega disponible.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onCTA}
              className="bg-[#C1272D] hover:bg-[#B71C1C] text-white font-bold text-base px-8 py-4 rounded-2xl transition-all hover:shadow-lg hover:shadow-[#C1272D]/25 hover:-translate-y-0.5"
            >
              Ver {count > 0 ? count : ""} productos
            </button>
            <button
              onClick={onWA}
              className="flex items-center gap-2 border-2 border-gray-200 text-[#1A1A1A] font-semibold text-base px-8 py-4 rounded-2xl transition-all hover:border-[#C1272D] hover:text-[#C1272D]"
            >
              Escríbenos
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {/* Social proof micro */}
          <div className="flex items-center gap-3 mt-8">
            <div className="flex -space-x-2">
              {["C","A","L"].map((l) => (
                <div key={l} className="w-8 h-8 rounded-full bg-[#C1272D]/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#C1272D]">{l}</div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]"/>)}</div>
              <p className="text-xs text-gray-500 mt-0.5">+100 clientes satisfechos</p>
            </div>
          </div>
        </div>
        {/* Visual */}
        <div className="order-1 md:order-2 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-radial from-[#C1272D]/6 to-transparent rounded-full" />
          <div className="relative w-full aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-[#F5F5F5] to-gray-100 flex items-center justify-center">
            <img src="/logo-grc.png" alt="GRC" className="w-1/2 object-contain opacity-20" />
            <div className="absolute top-4 right-4 bg-[#C1272D] text-white text-xs font-bold px-3 py-1.5 rounded-full">
              🔥 Tendencia
            </div>
            <div className="absolute bottom-4 left-4 bg-white rounded-xl px-4 py-3 shadow-lg">
              <p className="text-xs text-gray-500">Precio especial</p>
              <p className="font-black text-[#C1272D] text-lg">Desde $29.900</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── TrustBar ── */
const TrustBar = () => (
  <div className="bg-[#F5F5F5] border-y border-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { icon: <Truck className="w-5 h-5 text-[#C1272D]" />, t: "Envío a todo Colombia" },
        { icon: <RefreshCw className="w-5 h-5 text-[#C1272D]" />, t: "Contra entrega disponible" },
        { icon: <Shield className="w-5 h-5 text-[#C1272D]" />, t: "Garantía incluida" },
        { icon: <Headphones className="w-5 h-5 text-[#C1272D]" />, t: "Soporte por WhatsApp" },
      ].map((x) => (
        <div key={x.t} className="flex items-center gap-3 justify-center">
          {x.icon}
          <span className="text-sm font-medium text-gray-700">{x.t}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ── ProductCard ── */
const ProductCard = ({ product, index, onClick }: { product: Product; index: number; onClick: () => void }) => {
  const badge = fomo(product.id);
  const anc = product.retail_price ? anchor(product.retail_price) : null;
  const disc = anc && product.retail_price ? Math.round(((anc - product.retail_price) / anc) * 100) : null;

  return (
    <article
      className="grc-card bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-[#C1272D]/20 cursor-pointer group flex flex-col"
      style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-[#F5F5F5] aspect-[4/3]">
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="absolute top-3 left-3 bg-[#1A1A1A] text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
          {badge}
        </span>
        {disc && (
          <span className="absolute top-3 right-3 bg-[#C1272D] text-white text-[10px] font-black px-2.5 py-1.5 rounded-full">
            -{disc}%
          </span>
        )}
        {product.is_featured && !disc && (
          <span className="absolute top-3 right-3 bg-[#D4AF37] text-white text-[10px] font-black px-2.5 py-1.5 rounded-full">
            ⭐ Top
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {product.category && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{product.category}</span>
        )}
        <h3 className="font-bold text-[#1A1A1A] text-sm leading-snug line-clamp-2 mb-3 group-hover:text-[#C1272D] transition-colors">
          {product.name}
        </h3>

        <div className="mt-auto">
          {anc && <p className="text-xs text-gray-400 line-through mb-0.5">{fmt(anc)}</p>}
          <p className="text-2xl font-black text-[#C1272D] leading-none">{fmt(product.retail_price)}</p>
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Disponible · Entrega Bogotá
          </p>

          <button className="mt-4 w-full bg-[#1A1A1A] hover:bg-[#C1272D] text-white font-bold text-sm py-3 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2">
            Ver producto
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};

/* ── MidBanner ── */
const MidBanner = ({ onWA }: { onWA: () => void }) => (
  <div className="bg-[#C1272D] rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden col-span-full">
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDB2Nmg2di02aC02em0xMiAwaDZ2Nmg2di02aC0xMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
    <div className="relative z-10">
      <p className="text-white/80 text-sm font-medium mb-2">Para tu hogar y tu bolsillo</p>
      <h3 className="font-black text-2xl sm:text-3xl text-white mb-3">
        Haz tu hogar más inteligente<br className="hidden sm:block" /> sin gastar de más.
      </h3>
      <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
        Descuentos reales, productos que sí funcionan, y entrega en toda Colombia.
      </p>
      <button
        onClick={onWA}
        className="inline-flex items-center gap-2 bg-white text-[#C1272D] font-black text-sm px-7 py-3.5 rounded-2xl hover:bg-gray-50 transition-colors"
      >
        {WA_ICON}
        Hablar por WhatsApp
      </button>
    </div>
  </div>
);

/* ── FeaturedProduct ── */
const FeaturedProduct = ({ product, onSelect, onWA }: { product: Product; onSelect: () => void; onWA: (name: string, price: number | null) => void }) => (
  <section className="bg-white py-20 px-4">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <span className="text-[#C1272D] text-sm font-bold uppercase tracking-widest">Producto estrella</span>
        <h2 className="font-black text-4xl sm:text-5xl text-[#1A1A1A] mt-2">El que todos quieren.</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center max-w-5xl mx-auto">
        {/* Image */}
        <div
          className="relative aspect-square rounded-3xl overflow-hidden bg-[#F5F5F5] cursor-pointer group"
          onClick={onSelect}
        >
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-5 left-5">
            <span className="bg-[#C1272D] text-white text-xs font-black px-4 py-2 rounded-full animate-pulse">
              🔥 Más vendido
            </span>
          </div>
        </div>
        {/* Info */}
        <div>
          {product.category && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{product.category}</span>
          )}
          <h3 className="font-black text-3xl sm:text-4xl text-[#1A1A1A] mt-2 mb-4 leading-tight">{product.name}</h3>
          {product.description && (
            <p className="text-gray-500 text-base leading-relaxed mb-6">{product.description}</p>
          )}
          {/* Benefits */}
          <ul className="space-y-3 mb-6">
            {["Funciona desde el primer uso", "Materiales de alta durabilidad", "Envío seguro a todo Colombia", "Soporte directo por WhatsApp"].map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-[#C1272D]/10 flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="w-3 h-3 text-[#C1272D]" />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <p className="text-4xl font-black text-[#C1272D] mb-6">{fmt(product.retail_price)}</p>
          <div className="flex gap-3">
            <button
              onClick={() => onWA(product.name, product.retail_price)}
              className="flex-1 flex items-center justify-center gap-2 bg-[#C1272D] hover:bg-[#B71C1C] text-white font-bold py-4 rounded-2xl transition-all hover:shadow-lg hover:shadow-[#C1272D]/25"
            >
              {WA_ICON}
              Pedir por WhatsApp
            </button>
            <button
              onClick={onSelect}
              className="px-6 border-2 border-gray-200 text-[#1A1A1A] font-semibold rounded-2xl hover:border-[#C1272D] transition-colors"
            >
              Ver más
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ── HowItWorks ── */
const HowItWorks = () => (
  <section className="bg-[#F5F5F5] py-20 px-4">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-14">
        <span className="text-[#C1272D] text-sm font-bold uppercase tracking-widest">Simple así</span>
        <h2 className="font-black text-4xl text-[#1A1A1A] mt-2">Cómo funciona</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { n: "01", icon: "🔍", title: "Descubre", desc: "Navega nuestro catálogo y encuentra el producto que transforma tu hogar." },
          { n: "02", icon: "💬", title: "Escríbenos", desc: "Contáctanos por WhatsApp con un solo clic. Te respondemos en minutos." },
          { n: "03", icon: "🚀", title: "Recibe en casa", desc: "Entrega en Bogotá el mismo día. A nivel nacional en 1-3 días hábiles." },
        ].map((s) => (
          <div key={s.n} className="bg-white rounded-3xl p-8 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <span className="absolute top-4 right-5 font-black text-6xl text-gray-50 select-none">{s.n}</span>
            <div className="text-4xl mb-5 relative z-10">{s.icon}</div>
            <h3 className="font-black text-xl text-[#1A1A1A] mb-2 relative z-10">{s.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed relative z-10">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Testimonials ── */
const Testimonials = () => (
  <section className="bg-white py-20 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <div className="flex justify-center gap-1 mb-3">
          {[1,2,3,4,5].map(i=><Star key={i} className="w-6 h-6 fill-[#D4AF37] text-[#D4AF37]"/>)}
        </div>
        <h2 className="font-black text-4xl text-[#1A1A1A]">Lo que dicen nuestros clientes</h2>
        <p className="text-gray-500 mt-2">+100 familias satisfechas en toda Colombia</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="bg-[#F5F5F5] rounded-3xl p-7 hover:shadow-lg transition-all duration-300">
            <div className="flex gap-0.5 mb-4">
              {[1,2,3,4,5].map(i=><Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]"/>)}
            </div>
            <p className="text-[#1A1A1A] text-base leading-relaxed mb-5 italic">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#C1272D]/10 flex items-center justify-center font-black text-[#C1272D] text-sm">
                {t.name[0]}
              </div>
              <div>
                <p className="font-bold text-sm text-[#1A1A1A]">{t.name}</p>
                <p className="text-xs text-gray-400">{t.city} · Cliente verificado</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── FloatingWA ── */
const FloatingWA = ({ href }: { href: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="fixed z-50 group" style={{ bottom: 24, right: 24 }}>
    <span className="absolute -top-11 right-0 bg-[#1A1A1A] text-white text-xs px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
      Hablar con George
    </span>
    <div
      className="w-[58px] h-[58px] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      style={{ background: "#25D366", boxShadow: "0 4px 24px rgba(37,211,102,0.45)", animation: "waBounce 4s infinite" }}
    >
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </div>
  </a>
);

/* ── Footer ── */
const Footer = ({ onWA }: { onWA: () => void }) => (
  <footer className="bg-[#1A1A1A] text-white py-14 px-4">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
        <div>
          <img src="/logo-grc.png" alt="GRC" className="h-10 mb-4 object-contain" />
          <p className="text-gray-400 text-sm leading-relaxed">
            Productos innovadores para tu hogar al mejor precio en Colombia.
          </p>
        </div>
        <div>
          <p className="font-bold text-sm mb-4 text-gray-300 uppercase tracking-wider">Categorías</p>
          <ul className="space-y-2">
            {CATEGORIES.filter(c => c !== "Todos").map(c => (
              <li key={c} className="text-gray-500 text-sm hover:text-white transition-colors cursor-pointer">{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-bold text-sm mb-4 text-gray-300 uppercase tracking-wider">Contacto</p>
          <p className="text-gray-500 text-sm mb-1">📍 Bogotá, Colombia</p>
          <p className="text-gray-500 text-sm mb-4">📲 +57 322 642 1110</p>
          <button
            onClick={onWA}
            className="flex items-center gap-2 text-white font-bold text-sm px-5 py-2.5 rounded-2xl transition-colors"
            style={{ background: "#25D366" }}
          >
            {WA_ICON}
            Escribir ahora
          </button>
        </div>
      </div>
      <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-gray-600 text-xs">© 2026 GRC Importaciones · Todos los derechos reservados</p>
        <a href="/catalogo" className="text-gray-500 text-xs hover:text-[#C1272D] transition-colors">
          ¿Eres revendedor? → Catálogo mayorista
        </a>
      </div>
    </div>
  </footer>
);

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function TiendaPublica() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const catalogRef = useRef<HTMLDivElement>(null);

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

  const filtered = products.filter((p) => {
    const ms = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const sc = smartCat(p.name, p.description, p.category);
    const mc = category === "Todos" || sc === category;
    return ms && mc;
  });

  const featured = products.find((p) => p.is_featured) ?? products[0];

  const goProduct = (p: Product) => navigate(`/producto/${p.id}`);
  const openWA = (msg = "Hola GRC, quiero más info sobre sus productos") =>
    window.open(`https://wa.me/${GRC_WA}?text=${encodeURIComponent(msg)}`, "_blank");
  const openProductWA = (name: string, price: number | null) =>
    openWA(`Hola GRC, quiero comprar: ${name}${price ? ` — $${price.toLocaleString("es-CO")}` : ""}. ¿Está disponible?`);

  /* Build grid items (insert banner after 4th product) */
  const grid: (Product | "banner")[] = [];
  filtered.forEach((p, i) => {
    if (i === 4) grid.push("banner");
    grid.push(p);
  });
  if (filtered.length > 0 && filtered.length <= 4) grid.push("banner");

  return (
    <>
      <style>{`
        @keyframes waBounce {
          0%,88%,100%{transform:translateY(0)}
          92%{transform:translateY(-8px)}
          96%{transform:translateY(0)}
          98%{transform:translateY(-3px)}
        }
        @keyframes grcFadeUp {
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }
        .grc-card {
          opacity: 0;
          animation: grcFadeUp 0.5s ease-out var(--delay, 0ms) forwards;
          box-shadow: 0 2px 16px rgba(0,0,0,0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.2s ease;
        }
        .grc-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(193,39,45,0.1);
        }
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
        @media(prefers-reduced-motion:reduce){
          .grc-card{animation:none;opacity:1}
          .grc-card:hover{transform:none}
        }
      `}</style>

      <div className="min-h-screen" style={{ background: "#F5F5F5" }}>
        {/* Top urgency bar */}
        <div className="sticky top-0 z-50">
          <UrgencyBar />
        </div>

        {/* Header */}
        <Header search={search} onSearch={setSearch} onWA={() => openWA()} />

        {/* Hero */}
        <Hero count={products.length} onCTA={() => catalogRef.current?.scrollIntoView({ behavior: "smooth" })} onWA={() => openWA()} />

        {/* Trust */}
        <TrustBar />

        {/* ── CATALOG SECTION ── */}
        <section ref={catalogRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[#C1272D] text-sm font-bold uppercase tracking-widest">Catálogo</span>
              <h2 className="font-black text-4xl text-[#1A1A1A] mt-1">Descubre lo mejor.</h2>
            </div>
            {filtered.length > 0 && (
              <p className="text-gray-400 text-sm">{filtered.length} productos disponibles</p>
            )}
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  category === c
                    ? "bg-[#C1272D] text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-[#C1272D]/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl aspect-[4/5] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-xl font-bold text-[#1A1A1A] mb-2">Sin resultados</p>
              <p className="text-gray-400 text-sm">Intenta con otra categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {grid.map((item, idx) =>
                item === "banner" ? (
                  <div key="banner" className="col-span-2 sm:col-span-3 xl:col-span-4">
                    <MidBanner onWA={() => openWA("Hola GRC, quiero ver los precios especiales de hoy")} />
                  </div>
                ) : (
                  <ProductCard key={item.id} product={item} index={idx} onClick={() => goProduct(item)} />
                )
              )}
            </div>
          )}
        </section>

        {/* Featured product */}
        {featured && (
          <FeaturedProduct
            product={featured}
            onSelect={() => goProduct(featured)}
            onWA={openProductWA}
          />
        )}

        {/* How it works */}
        <HowItWorks />

        {/* Testimonials */}
        <Testimonials />

        {/* Final CTA Section */}
        <section className="bg-[#C1272D] py-16 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-white/80 text-sm font-medium mb-2">¿Listo para mejorar tu hogar?</p>
            <h2 className="font-black text-4xl text-white mb-3">El producto que buscas<br />está a un mensaje.</h2>
            <p className="text-white/70 mb-8">Escríbenos y te respondemos en minutos.</p>
            <button
              onClick={() => openWA()}
              className="inline-flex items-center gap-3 bg-white text-[#C1272D] font-black text-base px-8 py-4 rounded-2xl hover:bg-gray-50 transition-all hover:shadow-xl"
            >
              {WA_ICON}
              Hablar por WhatsApp
            </button>
          </div>
        </section>

        {/* Footer */}
        <Footer onWA={() => openWA()} />

        {/* Floating WA */}
        <FloatingWA href={`https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC, quiero más info sobre sus productos")}`} />

        {/* Reseller float */}
        <button
          onClick={() => openWA("Hola GRC, me interesa revender sus productos. ¿Cuáles son los precios mayoristas?")}
          className="fixed z-50 font-bold text-xs text-white px-4 py-2.5 rounded-full shadow-lg transition-all hover:scale-105"
          style={{ bottom: 30, left: 24, background: "#C1272D" }}
        >
          💰 Gana vendiendo →
        </button>
      </div>
    </>
  );
}
