import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, Plus, Minus, TrendingUp, Users, Star, ChevronRight, CheckCircle2 } from "lucide-react";

const GRC_WA = "573226421110";

const WA_ICON = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const CATEGORIES = ["Todos", "Electrónica", "Hogar", "Accesorios", "Tecnología", "Otro"];

interface CatalogProduct {
  id: string;
  name: string;
  image_url: string | null;
  images: string[] | null;
  wholesale_price: number | null;
  retail_price: number | null;
  category: string | null;
  description: string | null;
}

const fmt = (n: number | null) => (n != null ? `$${n.toLocaleString("es-CO")}` : "—");
const profitAmt = (p: CatalogProduct) =>
  p.retail_price != null && p.wholesale_price != null ? p.retail_price - p.wholesale_price : null;
const profitPct = (p: CatalogProduct) => {
  if (!p.wholesale_price || !p.retail_price) return null;
  return Math.round(((p.retail_price - p.wholesale_price) / p.wholesale_price) * 100);
};

/* ── CatalogCard ── */
const CatalogCard = ({
  product, qty, onQty, onWA, onDetail,
}: {
  product: CatalogProduct;
  qty: number;
  onQty: (v: number) => void;
  onWA: () => void;
  onDetail: () => void;
}) => {
  const gain = profitAmt(product);
  const pct = profitPct(product);

  return (
    <article className="cat-card bg-white rounded-3xl overflow-hidden flex flex-col border border-gray-100 hover:border-[#C1272D]/20">
      {/* Image */}
      <div
        className="relative bg-[#F5F5F5] aspect-[4/3] overflow-hidden cursor-pointer"
        onClick={onDetail}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-14 h-14 text-gray-200" />
          </div>
        )}
        {product.category && (
          <span className="absolute top-3 left-3 bg-[#1A1A1A]/80 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider font-semibold px-3 py-1.5 rounded-full">
            {product.category}
          </span>
        )}
        {pct != null && pct > 0 && (
          <span className="absolute top-3 right-3 bg-[#C1272D] text-white text-[10px] font-black px-3 py-1.5 rounded-full">
            +{pct}% ganancia
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        <h3
          className="font-bold text-[#1A1A1A] text-sm leading-snug line-clamp-2 cursor-pointer hover:text-[#C1272D] transition-colors"
          onClick={onDetail}
        >
          {product.name}
        </h3>

        {/* Price block */}
        <div className="bg-[#F5F5F5] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Tu precio</span>
            <span className="text-xl font-black text-[#C1272D]">{fmt(product.wholesale_price)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Precio cliente</span>
            <span className="text-sm font-semibold text-gray-700">{fmt(product.retail_price)}</span>
          </div>
        </div>

        {/* Profit */}
        {gain != null && gain > 0 && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
            <span className="text-emerald-500 text-base">💰</span>
            <span className="text-sm font-black text-emerald-700">
              Ganas {fmt(gain)} por unidad
            </span>
          </div>
        )}

        {/* Perks */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            Disponible bajo pedido
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            Creativos listos para vender
          </div>
        </div>

        {/* Qty */}
        <div className="flex items-center justify-between bg-[#F5F5F5] rounded-2xl px-4 py-2.5">
          <span className="text-xs font-semibold text-gray-600">Cantidad</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onQty(qty - 1)}
              className="w-7 h-7 rounded-xl bg-white border border-gray-200 hover:border-[#C1272D] flex items-center justify-center transition-colors shadow-sm"
            >
              <Minus className="w-3 h-3 text-gray-600" />
            </button>
            <span className="font-black text-[#1A1A1A] w-6 text-center text-base">{qty}</span>
            <button
              onClick={() => onQty(qty + 1)}
              className="w-7 h-7 rounded-xl bg-white border border-gray-200 hover:border-[#C1272D] flex items-center justify-center transition-colors shadow-sm"
            >
              <Plus className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onWA}
          className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-2xl text-white transition-all hover:shadow-lg hover:scale-[1.01]"
          style={{ background: "#25D366" }}
        >
          {WA_ICON}
          Pedir {qty} {qty === 1 ? "unidad" : "unidades"}
        </button>
      </div>
    </article>
  );
};

/* ── Mid CTA Banner ── */
const MidBanner = () => (
  <div className="col-span-full bg-[#F5F5F5] border-2 border-[#C1272D]/10 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
    <div>
      <span className="text-[#C1272D] text-xs font-bold uppercase tracking-widest">Modelo de negocio GRC</span>
      <h3 className="font-black text-2xl text-[#1A1A1A] mt-1 mb-2">⚡ Trabajamos bajo pedido</h3>
      <p className="text-gray-500 text-sm max-w-md">
        Tú vendes primero, nosotros conseguimos. Sin riesgo de inventario. Solo pagas lo que ya vendiste.
      </p>
    </div>
    <a
      href={`https://wa.me/${GRC_WA}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 flex items-center gap-2 bg-[#C1272D] text-white font-bold text-sm px-6 py-3.5 rounded-2xl hover:bg-[#B71C1C] transition-colors shadow-sm"
    >
      {WA_ICON}
      Hablar con George
    </a>
  </div>
);

/* ── Main ── */
export default function CatalogoPublico() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: products, isLoading } = useQuery({
    queryKey: ["catalogo-publico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_seller_view")
        .select("id, name, image_url, images, wholesale_price, retail_price, category, description")
        .eq("status", "activo")
        .order("name");
      if (error) throw error;
      return data as CatalogProduct[];
    },
  });

  const filtered =
    products?.filter((p) => {
      const ms = p.name?.toLowerCase().includes(search.toLowerCase());
      const mc = category === "Todos" || p.category?.toLowerCase() === category.toLowerCase();
      return ms && mc;
    }) ?? [];

  const getQty = (id: string) => quantities[id] ?? 1;
  const setQty = (id: string, v: number) =>
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Math.min(50, v)) }));

  const openWA = (name: string, qty: number, price: number | null) => {
    const total = price != null ? qty * price : 0;
    const msg = `Hola GRC, quiero pedir ${qty} unidades de ${name}. Total: $${total.toLocaleString("es-CO")}`;
    window.open(`https://wa.me/${GRC_WA}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="min-h-screen" style={{ background: "#F5F5F5" }}>
      <style>{`
        @keyframes catFadeUp {
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes waBounce {
          0%,88%,100%{transform:translateY(0)}
          92%{transform:translateY(-8px)}
          96%{transform:translateY(0)}
          98%{transform:translateY(-3px)}
        }
        .cat-card {
          opacity: 0;
          animation: catFadeUp 0.5s ease-out var(--delay,0ms) forwards;
          box-shadow: 0 2px 16px rgba(0,0,0,0.04);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.2s ease;
        }
        .cat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(193,39,45,0.09);
        }
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
        @media(prefers-reduced-motion:reduce){
          .cat-card{animation:none;opacity:1}
          .cat-card:hover{transform:none}
        }
      `}</style>

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo-grc.png" alt="GRC" className="h-10 object-contain" />
            <div>
              <h1 className="font-black text-[#1A1A1A] text-base leading-tight">Catálogo Mayorista</h1>
              <p className="text-gray-400 text-xs">GRC Importaciones</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${GRC_WA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#C1272D] hover:bg-[#B71C1C] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors shadow-sm"
          >
            {WA_ICON}
            <span className="hidden sm:inline">Hablar con George</span>
          </a>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="bg-white border-b border-gray-100 py-14 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#C1272D]/8 text-[#C1272D] text-xs font-bold px-4 py-2 rounded-full mb-5">
              <TrendingUp className="w-3.5 h-3.5" />
              Para revendedores y emprendedores
            </div>
            <h2 className="font-black text-4xl sm:text-5xl text-[#1A1A1A] leading-tight mb-4">
              Gana dinero vendiendo<br />
              <span className="text-[#C1272D]">lo que la gente ya quiere.</span>
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-lg">
              Sin inventario. Sin riesgo. Tú vendes primero, nosotros conseguimos.
              Márgenes reales desde el primer pedido.
            </p>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: <Users className="w-5 h-5 text-[#C1272D]" />, v: "+120", l: "Revendedores" },
                { icon: <TrendingUp className="w-5 h-5 text-[#C1272D]" />, v: "+500", l: "Pedidos/mes" },
                { icon: <Star className="w-5 h-5 text-[#D4AF37]" />, v: "4.9★", l: "Calificación" },
              ].map((s) => (
                <div key={s.l} className="bg-[#F5F5F5] rounded-2xl p-4 text-center">
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <p className="font-black text-xl text-[#1A1A1A]">{s.v}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
            <a
              href={`https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC, quiero empezar a revender sus productos. ¿Cómo funciona?")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#C1272D] hover:bg-[#B71C1C] text-white font-bold text-base px-8 py-4 rounded-2xl transition-all hover:shadow-lg hover:shadow-[#C1272D]/25"
            >
              {WA_ICON}
              Comenzar a revender
            </a>
          </div>

          {/* How to make money */}
          <div className="space-y-4">
            <p className="font-black text-[#1A1A1A] text-lg mb-5">Así ganas dinero con GRC</p>
            {[
              { n: "01", t: "Elige un producto", d: "Selecciona del catálogo lo que quieres vender" },
              { n: "02", t: "Véndelo antes de comprar", d: "Usa nuestros creativos y vende en tus redes primero" },
              { n: "03", t: "Haz el pedido", d: "Páganos el precio mayorista, tú te quedas la diferencia" },
              { n: "04", t: "Nosotros entregamos", d: "Despacho el mismo día en Bogotá, 1-3 días nacional" },
            ].map((s) => (
              <div key={s.n} className="flex gap-4 bg-[#F5F5F5] rounded-2xl p-4">
                <span className="font-black text-[#C1272D] text-lg w-8 flex-shrink-0">{s.n}</span>
                <div>
                  <p className="font-bold text-[#1A1A1A] text-sm">{s.t}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { e: "📦", t: "Sin inventario · solo bajo pedido" },
            { e: "🚚", t: "Entrega en Bogotá mismo día" },
            { e: "💰", t: "Ganancias desde $15.000 por unidad" },
          ].map((x) => (
            <div key={x.t} className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 py-1">
              <span>{x.e}</span> {x.t}
            </div>
          ))}
        </div>
      </div>

      {/* ── CATALOG ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Search + filters */}
        <div className="mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#C1272D] transition-colors shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  category === cat
                    ? "bg-[#C1272D] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-[#C1272D]/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Package className="w-14 h-14 mx-auto text-gray-200 mb-4" />
            <p className="font-bold text-xl text-[#1A1A1A] mb-1">Sin productos</p>
            <p className="text-gray-400 text-sm">Intenta con otra búsqueda</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-400">{filtered.length} productos disponibles</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Stock disponible
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((p, index) => {
                const qty = getQty(p.id);
                return (
                  <React.Fragment key={p.id}>
                    {index === 3 && <MidBanner />}
                    <CatalogCard
                      product={p}
                      qty={qty}
                      onQty={(v) => setQty(p.id, v)}
                      onWA={() => openWA(p.name, qty, p.wholesale_price)}
                      onDetail={() => navigate(`/producto/${p.id}`)}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white py-16 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-black text-3xl text-[#1A1A1A] mb-10">Lo que dicen nuestros revendedores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Diego R.", city: "Bogotá", text: "En el primer mes ya recuperé la inversión. El modelo es increíble, vendes antes de comprar." },
              { name: "Mariana T.", city: "Medellín", text: "Los creativos que dan son increíbles. Solo los publico y la gente escribe sola." },
              { name: "Felipe A.", city: "Cali", text: "Llevo 6 meses con GRC y ya tengo ingresos fijos. El soporte es muy rápido." },
            ].map((t) => (
              <div key={t.name} className="bg-[#F5F5F5] rounded-3xl p-6 text-left">
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
                    <p className="text-xs text-gray-400">{t.city} · Revendedor verificado</p>
                  </div>
                </div>
              </div>
            ))}
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
          <p className="text-gray-500 text-sm mb-1">📍 Bogotá, Colombia · 📲 +57 322 642 1110</p>
          <p className="text-gray-600 text-sm italic mb-6">Somos tu proveedor, tú eres el vendedor</p>
          <a
            href={`https://wa.me/${GRC_WA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white font-bold text-sm px-6 py-3 rounded-2xl transition-colors"
            style={{ background: "#25D366" }}
          >
            {WA_ICON}
            Escríbenos por WhatsApp
          </a>
          <div className="border-t border-white/10 mt-8 pt-5">
            <p className="text-gray-600 text-xs">© 2026 GRC Importaciones · Todos los derechos reservados</p>
          </div>
        </div>
      </footer>

      {/* Floating WA */}
      <a
        href={`https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC, quiero más info sobre el catálogo mayorista")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed z-50 group"
        style={{ bottom: 24, right: 24 }}
      >
        <span className="absolute -top-11 right-0 bg-[#1A1A1A] text-white text-xs px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
          Hablar con George
        </span>
        <div
          className="w-[58px] h-[58px] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          style={{ background: "#25D366", boxShadow: "0 4px 24px rgba(37,211,102,0.45)", animation: "waBounce 4s infinite" }}
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
      </a>
    </div>
  );
}
