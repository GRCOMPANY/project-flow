import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, Star, Truck, Shield, MessageCircle, Package,
  Check, Play, Instagram, ChevronRight, Heart, Zap, Clock
} from "lucide-react";

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const GRC_WA = "573226421110";
const fmt = (v: number | null) => (v != null ? `$${v.toLocaleString("es-CO")}` : "");
const anchorPrice = (p: number) => Math.round(p * 1.42);
const discPct = (real: number, anc: number) => Math.round(((anc - real) / anc) * 100);

const waProduct = (name: string, price: string) =>
  `https://wa.me/${GRC_WA}?text=${encodeURIComponent(
    `Hola GRC 👋 Quiero ${name} por ${price}.\n\nDirección: ___\nPago: Contra entrega`
  )}`;

const waGenericUrl = `https://wa.me/${GRC_WA}?text=${encodeURIComponent("Hola GRC 👋 Quiero ver los productos disponibles")}`;

const CATS = [
  { key: "Todos",        icon: "✦", label: "Todo" },
  { key: "Hogar",        icon: "🏠", label: "Hogar inteligente" },
  { key: "Tecnología",   icon: "⚡", label: "Tech viral" },
  { key: "Cocina",       icon: "🍳", label: "Cocina" },
  { key: "Organización", icon: "📦", label: "Organización" },
  { key: "General",      icon: "🔥", label: "Más vendidos" },
];

const PRODUCT_BADGES: Record<number, { label: string; color: string }> = {
  0: { label: "🔥 Popular",   color: "#C1272D" },
  1: { label: "⭐ Nuevo",     color: "#D4AF37" },
  2: { label: "✦ Top ventas", color: "#111111" },
  3: { label: "💥 Viral",     color: "#C1272D" },
};
const getBadge = (id: string) => PRODUCT_BADGES[id.charCodeAt(0) % 4];

const TESTIMONIALS = [
  { name: "Valentina R.", city: "Bogotá",      text: "Vi el producto, lo compré sin pensarlo dos veces. Ya pedí el doble para regalar.", stars: 5, initial: "V" },
  { name: "Santiago M.", city: "Medellín",     text: "Pensé que era como los demás. No. Está brutal. Lo tienen todos en mi trabajo.",    stars: 5, initial: "S" },
  { name: "Daniela P.", city: "Cali",          text: "GRC siempre me sorprende. Llevo 4 compras y cada una mejor que la anterior.",       stars: 5, initial: "D" },
];

const INITIALS_COLORS = ["#C1272D", "#D4AF37", "#111111", "#2563EB", "#059669"];

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
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

interface ProductVideo {
  id: string;
  product_id: string;
  video_url: string;
  titulo: string | null;
  orden: number;
  activo: boolean;
  product_name?: string;
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
  hero_titulo_1: "Lo mejor del mundo,",
  hero_titulo_2: "primero en Colombia.",
  hero_badge: "Lo más viral en Colombia 2026",
  hero_subtexto: "Productos innovadores que transforman tu hogar. Los descubrimos antes que todos.",
  hero_boton_1: "Descubrir productos",
  hero_boton_2: "Hablar con George",
};

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
const smartCat = (name: string | null, desc: string | null, cat: string | null) => {
  const t = `${name ?? ""} ${desc ?? ""}`.toLowerCase();
  if (/hervidor|batidora|lonchera|escurridor|cocina/.test(t)) return "Cocina";
  if (/cepillo|ducha|baño|tensiómetro|hogar/.test(t)) return "Hogar";
  if (/watch|proyector|aspirador|tecnología|tech/.test(t)) return "Tecnología";
  if (/caja|almacenamiento|organiz/.test(t)) return "Organización";
  return cat ?? "General";
};

/* ═══════════════════════════════════════════
   COUNTDOWN HOOK
═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   WA SVG
═══════════════════════════════════════════ */
const WASvg = ({ cls = "w-5 h-5" }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={`${cls} fill-current flex-shrink-0`}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ═══════════════════════════════════════════
   PRODUCT CARD
═══════════════════════════════════════════ */
const ProductCard = ({ p, onDetail }: { p: Product; onDetail: () => void }) => {
  const badge = getBadge(p.id);
  const anc = p.retail_price ? anchorPrice(p.retail_price) : null;
  const disc = anc && p.retail_price ? discPct(p.retail_price, anc) : null;

  return (
    <article
      className="group bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
      onClick={onDetail}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(193,39,45,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.06)";
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-[#F8F5F2] aspect-square">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-200" />
          </div>
        )}
        {/* Badge */}
        <span
          className="absolute top-3 left-3 text-[10px] font-black px-3 py-1.5 rounded-full text-white"
          style={{ background: badge.color }}
        >
          {badge.label}
        </span>
        {disc && (
          <span className="absolute top-3 right-3 bg-white text-[#C1272D] font-black text-xs px-2.5 py-1 rounded-full shadow-sm">
            -{disc}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[#C1272D] text-[10px] font-black uppercase tracking-widest mb-1">
          {smartCat(p.name, p.description, p.category)}
        </p>
        <h3 className="font-bold text-[#111111] text-sm leading-snug mb-2 line-clamp-2">{p.name}</h3>
        <div className="flex items-baseline gap-2 mb-1">
          {anc && <span className="text-gray-400 text-xs line-through">{fmt(anc)}</span>}
          <span className="text-[#C1272D] font-black text-base">{fmt(p.retail_price)}</span>
        </div>
        <p className="text-[#25D366] text-[11px] font-semibold mb-3 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] inline-block" />
          Disponible · Entrega hoy Bogotá
        </p>
        <button
          className="w-full py-2.5 rounded-xl font-black text-sm text-white transition-all hover:opacity-90"
          style={{ background: "#C1272D" }}
          onClick={(e) => {
            e.stopPropagation();
            window.open(waProduct(p.name, fmt(p.retail_price)), "_blank");
          }}
        >
          Lo quiero
        </button>
      </div>
    </article>
  );
};

/* ═══════════════════════════════════════════
   TRUST BAR
═══════════════════════════════════════════ */
const TrustBar = () => (
  <section className="bg-white border-y border-gray-100 py-5 px-4">
    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { icon: <Truck className="w-5 h-5" />, title: "Envío a Colombia", sub: "Todo el país" },
        { icon: <Shield className="w-5 h-5" />, title: "Contra entrega", sub: "Pagas al recibir" },
        { icon: <Check className="w-5 h-5" />, title: "Garantía GRC", sub: "Satisfacción asegurada" },
        { icon: <MessageCircle className="w-5 h-5" />, title: "Soporte WhatsApp", sub: "Respuesta en minutos" },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF0F0] flex items-center justify-center text-[#C1272D] flex-shrink-0">
            {item.icon}
          </div>
          <div>
            <p className="font-bold text-[#111111] text-sm leading-none mb-0.5">{item.title}</p>
            <p className="text-gray-500 text-xs">{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

/* ═══════════════════════════════════════════
   VIDEO CARD
═══════════════════════════════════════════ */
const VideoCard = ({ v }: { v: ProductVideo | null; }) => {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  if (!v) {
    return (
      <div className="rounded-2xl overflow-hidden bg-[#F8F5F2] aspect-[9/16] flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
          <Play className="w-6 h-6 text-gray-300 ml-1" />
        </div>
        <p className="text-gray-400 text-sm font-medium">Próximamente</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-[#111111] aspect-[9/16] relative group cursor-pointer"
      onClick={() => {
        setPlaying(!playing);
        if (!playing) ref.current?.play();
        else ref.current?.pause();
      }}
    >
      <video
        ref={ref}
        src={v.video_url}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted={!playing}
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-[#C1272D] ml-1" />
          </div>
        </div>
      )}
      {v.titulo && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-xs font-semibold">{v.titulo}</p>
        </div>
      )}
    </div>
  );
};

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
  const db = supabase as any;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* ── Queries ── */
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

  const { data: heroConfig = {} } = useQuery({
    queryKey: ["tienda-hero-config"],
    queryFn: async () => {
      const keys = Object.keys(HERO_DEFAULTS);
      const { data } = await db.from("store_config").select("clave, valor").in("clave", keys);
      const map: Record<string, string> = {};
      (data ?? []).forEach((row: { clave: string; valor: string }) => { map[row.clave] = row.valor; });
      return map;
    },
  });

  const { data: banners = [] } = useQuery({
    queryKey: ["tienda-banners"],
    queryFn: async () => {
      const { data } = await db.from("banners").select("id, imagen_url, titulo, subtitulo, texto_boton, activo, orden").eq("activo", true).order("orden", { ascending: true });
      return (data ?? []) as Banner[];
    },
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["tienda-videos"],
    queryFn: async () => {
      const { data } = await db
        .from("product_videos")
        .select("id, product_id, video_url, titulo, orden, activo")
        .eq("activo", true)
        .order("orden", { ascending: true })
        .limit(3);
      return (data ?? []) as ProductVideo[];
    },
  });

  /* ── Derived ── */
  const hero = (key: keyof typeof HERO_DEFAULTS): string =>
    (heroConfig as Record<string, string>)[key] ?? HERO_DEFAULTS[key];

  const filtered = products.filter((p) => {
    const ms = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const mc = activeCat === "Todos" || smartCat(p.name, p.description, p.category) === activeCat;
    return ms && mc;
  });

  const featured = products.find((p) => p.is_featured) ?? products[0];
  const firstBatch = filtered.slice(0, 8);
  const secondBatch = filtered.slice(8, 16);
  const scrollToCatalog = () => catalogRef.current?.scrollIntoView({ behavior: "smooth" });

  /* ── Video placeholders ── */
  const videoSlots: (ProductVideo | null)[] = [
    videos[0] ?? null,
    videos[1] ?? null,
    videos[2] ?? null,
  ];

  return (
    <>
      <style>{`
        @keyframes grcFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes waPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(37,211,102,0.4); } 50% { box-shadow: 0 0 0 10px rgba(37,211,102,0); } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .fade-up { animation: grcFadeUp 0.5s ease-out forwards; }
        .wa-float { animation: waPulse 2.5s infinite; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <div className="min-h-screen" style={{ background: "#F8F5F2" }}>

        {/* ══ 1. TOP BAR ══ */}
        <div className="py-2.5 px-4 flex items-center justify-center gap-3 flex-wrap" style={{ background: "#C1272D" }}>
          <span className="text-white text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white inline-block" style={{ animation: "pulseDot 1.5s infinite" }} />
            🔥 Lo mejor del mundo, primero en Colombia · Envío gratis a Bogotá
          </span>
          <span className="font-mono font-black text-white text-xs tracking-widest bg-[#A01E22] px-2.5 py-1 rounded-lg">
            {h}:{m}:{s}
          </span>
        </div>

        {/* ══ 2. HEADER ══ */}
        <header className={`sticky top-0 z-50 bg-white transition-all duration-300 ${scrolled ? "shadow-md" : "border-b border-gray-100"}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-4">
            {/* Logo */}
            <a href="/tienda" className="flex-shrink-0 flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: "#C1272D" }}>
                G
              </div>
              <div>
                <p className="font-black text-[#111111] text-sm leading-none tracking-tight">GRC IMPORTACIONES</p>
                <p className="text-[9px] font-bold uppercase tracking-widest leading-none" style={{ color: "#C1272D" }}>
                  Lo mejor del mundo
                </p>
              </div>
            </a>

            {/* Nav */}
            <nav className="hidden lg:flex items-center gap-6 mx-4 flex-1">
              {["Inicio", "Productos", "Novedades", "Sobre GRC"].map((item) => (
                <a
                  key={item}
                  href={item === "Productos" ? "#catalogo" : "/tienda"}
                  onClick={item === "Productos" ? (e) => { e.preventDefault(); scrollToCatalog(); } : undefined}
                  className="text-sm font-medium text-gray-600 hover:text-[#C1272D] transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* Search */}
            <div className="flex-1 lg:flex-none lg:w-56 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={scrollToCatalog}
                className="w-full pl-9 pr-4 py-2 bg-[#F8F5F2] border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#C1272D] focus:bg-white transition-all"
              />
            </div>

            {/* WA Button */}
            <a
              href={waGenericUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-2 text-white font-bold text-sm px-4 py-2 rounded-full transition-all hover:opacity-90 hover:shadow-lg"
              style={{ background: "#25D366" }}
            >
              <WASvg cls="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </header>

        {/* ══ 3. HERO ══ */}
        <section className="bg-white border-b border-gray-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text */}
              <div className="fade-up">
                <div
                  className="inline-flex items-center gap-2 text-xs font-black px-4 py-1.5 rounded-full mb-6"
                  style={{ background: "#FFF0F0", color: "#C1272D" }}
                >
                  ✦ {hero("hero_badge")}
                </div>
                <h1 className="font-black text-5xl sm:text-6xl lg:text-7xl text-[#111111] leading-[1.05] tracking-tight mb-4">
                  {hero("hero_titulo_1")}<br />
                  <span style={{ color: "#C1272D" }}>{hero("hero_titulo_2")}</span>
                </h1>
                <p className="text-gray-500 text-lg sm:text-xl leading-relaxed mb-8 max-w-md">
                  {hero("hero_subtexto")}
                </p>
                <div className="flex flex-wrap gap-3 mb-10">
                  <button
                    onClick={scrollToCatalog}
                    className="flex items-center gap-2 text-white font-bold text-base px-7 py-3.5 rounded-2xl transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5"
                    style={{ background: "#C1272D" }}
                  >
                    {hero("hero_boton_1")}
                  </button>
                  <a
                    href={waGenericUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-bold text-base px-7 py-3.5 rounded-2xl border-2 border-[#111111] text-[#111111] transition-all hover:bg-[#111111] hover:text-white"
                  >
                    <WASvg cls="w-4 h-4" />
                    {hero("hero_boton_2")}
                  </a>
                </div>
                {/* Stats */}
                <div className="flex items-center gap-6 flex-wrap">
                  <div>
                    <p className="font-black text-2xl text-[#111111]">+500</p>
                    <p className="text-gray-500 text-xs">Pedidos este mes</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="font-black text-2xl text-[#111111]">4.9</p>
                      <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                    </div>
                    <p className="text-gray-500 text-xs">Calificación media</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div>
                    <p className="font-black text-2xl text-[#111111]">24h</p>
                    <p className="text-gray-500 text-xs">Entrega Bogotá</p>
                  </div>
                </div>
              </div>

              {/* Hero image / featured product */}
              {featured?.image_url ? (
                <div
                  className="relative rounded-3xl overflow-hidden cursor-pointer group"
                  style={{ background: "#F8F5F2" }}
                  onClick={() => navigate(`/producto/${featured.id}`)}
                >
                  <img
                    src={featured.image_url}
                    alt={featured.name}
                    className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white/80 to-transparent">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#C1272D" }}>
                      Producto estrella
                    </p>
                    <p className="font-bold text-[#111111] text-lg leading-snug">{featured.name}</p>
                    <p className="font-black text-2xl mt-1" style={{ color: "#C1272D" }}>{fmt(featured.retail_price)}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl bg-[#F8F5F2] aspect-square flex items-center justify-center">
                  <Package className="w-20 h-20 text-gray-200" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══ BANNERS (si hay en BD) ══ */}
        {banners.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className={`grid gap-4 ${banners.length === 1 ? "grid-cols-1" : banners.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
              {banners.map((b) => (
                <div key={b.id} className="relative overflow-hidden rounded-2xl min-h-[160px]">
                  {b.imagen_url
                    ? <img src={b.imagen_url} alt={b.titulo ?? ""} className="absolute inset-0 w-full h-full object-cover" />
                    : <div className="absolute inset-0" style={{ background: "#C1272D" }} />
                  }
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="relative z-10 p-6 flex flex-col justify-end min-h-[160px]">
                    {b.titulo && <h3 className="font-black text-white text-xl leading-tight mb-1">{b.titulo}</h3>}
                    {b.subtitulo && <p className="text-white/80 text-sm mb-3">{b.subtitulo}</p>}
                    {b.texto_boton && (
                      <button
                        onClick={scrollToCatalog}
                        className="self-start text-white font-bold text-sm px-5 py-2 rounded-xl transition-all hover:opacity-90"
                        style={{ background: "#C1272D" }}
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

        {/* ══ 4. TRUST BAR ══ */}
        <TrustBar />

        {/* ══ 5. CATEGORÍAS ══ */}
        <section className="bg-white border-b border-gray-100 py-5 px-4">
          <div className="max-w-7xl mx-auto overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-2.5 w-max mx-auto sm:w-auto sm:flex-wrap sm:justify-center">
              {CATS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => { setActiveCat(c.key); scrollToCatalog(); }}
                  className="flex items-center gap-1.5 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200"
                  style={
                    activeCat === c.key
                      ? { background: "#C1272D", color: "#fff" }
                      : { background: "#F8F5F2", color: "#666" }
                  }
                >
                  <span>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 6. PRIMERA TANDA PRODUCTOS ══ */}
        <section ref={catalogRef} id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#C1272D" }}>
              SELECCIÓN GRC
            </p>
            <h2 className="font-black text-4xl text-[#111111]">
              Productos que no sabías<br />que necesitabas.
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                  <div className="bg-gray-100 animate-pulse aspect-square" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 animate-pulse rounded w-1/3" />
                    <div className="h-4 bg-gray-100 animate-pulse rounded" />
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : firstBatch.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No hay productos disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {firstBatch.map((p) => (
                <ProductCard key={p.id} p={p} onDetail={() => navigate(`/producto/${p.id}`)} />
              ))}
            </div>
          )}
        </section>

        {/* ══ 7. VIDEOS ══ */}
        <section className="bg-white py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#C1272D" }}>EN ACCIÓN</p>
              <h2 className="font-black text-4xl text-[#111111] mb-3">Míralo en acción</h2>
              <p className="text-gray-500 text-lg">Videos reales de nuestros productos</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {videoSlots.map((v, i) => (
                <VideoCard key={i} v={v} />
              ))}
            </div>
          </div>
        </section>

        {/* ══ 8. STORYTELLING BANNER ══ */}
        <section className="py-20 px-4" style={{ background: "#F8F5F2" }}>
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-black text-4xl sm:text-5xl text-[#111111] leading-tight mb-6">
              "En GRC no vendemos<br />
              <span style={{ color: "#C1272D" }}>productos comunes.</span>"
            </p>
            <p className="text-gray-500 text-xl leading-relaxed mb-8 max-w-xl mx-auto">
              Buscamos lo más innovador del mundo para que tú lo tengas primero en Colombia.
            </p>
            <a
              href={waGenericUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: "#C1272D" }}
            >
              Conocer nuestra historia
            </a>
          </div>
        </section>

        {/* ══ 9. PRODUCTO ESTRELLA ══ */}
        {featured && (
          <section className="bg-white py-16 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Image */}
                <div
                  className="rounded-3xl overflow-hidden cursor-pointer group"
                  style={{ background: "#F8F5F2" }}
                  onClick={() => navigate(`/producto/${featured.id}`)}
                >
                  {featured.image_url ? (
                    <img
                      src={featured.image_url}
                      alt={featured.name}
                      className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-103"
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center">
                      <Package className="w-20 h-20 text-gray-200" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <span
                    className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-white mb-4"
                    style={{ background: "#C1272D" }}
                  >
                    EL MÁS PEDIDO
                  </span>
                  <h2 className="font-black text-4xl sm:text-5xl text-[#111111] leading-tight mb-4">
                    {featured.name}
                  </h2>
                  {featured.description && (
                    <p className="text-gray-500 text-lg leading-relaxed mb-6">{featured.description}</p>
                  )}
                  {/* Benefits */}
                  <ul className="space-y-3 mb-8">
                    {[
                      "Diseño premium de importación directa",
                      "Ideal para regalo o uso personal",
                      "Disponible para entrega inmediata",
                      "Garantía GRC incluida",
                    ].map((b, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#FFF0F0" }}>
                          <Check className="w-3 h-3" style={{ color: "#C1272D" }} />
                        </div>
                        <span className="text-gray-700 text-sm">{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-baseline gap-3 mb-6">
                    {featured.retail_price && (
                      <>
                        <span className="text-gray-400 line-through text-lg">{fmt(anchorPrice(featured.retail_price))}</span>
                        <span className="font-black text-4xl" style={{ color: "#C1272D" }}>{fmt(featured.retail_price)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={waProduct(featured.name, fmt(featured.retail_price))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-white font-bold text-base px-7 py-3.5 rounded-2xl transition-all hover:opacity-90 hover:shadow-lg"
                      style={{ background: "#C1272D" }}
                    >
                      <WASvg />
                      Pedir por WhatsApp
                    </a>
                    <button
                      onClick={() => navigate(`/producto/${featured.id}`)}
                      className="flex items-center justify-center gap-2 font-bold text-base px-7 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 hover:border-gray-400 transition-all"
                    >
                      Ver todos los detalles <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══ 10. SEGUNDA TANDA PRODUCTOS ══ */}
        {secondBatch.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14" style={{ background: "#F8F5F2" }}>
            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#C1272D" }}>MÁS PRODUCTOS</p>
              <h2 className="font-black text-4xl text-[#111111]">Sigue explorando.</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {secondBatch.map((p) => (
                <ProductCard key={p.id} p={p} onDetail={() => navigate(`/producto/${p.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* ══ 11. ¿POR QUÉ GRC? ══ */}
        <section className="bg-white py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#C1272D" }}>NUESTRA PROMESA</p>
              <h2 className="font-black text-4xl text-[#111111]">¿Por qué GRC?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <Zap className="w-6 h-6" />, title: "Productos que se venden solos", desc: "Seleccionamos solo lo que tiene demanda probada en el mercado global." },
                { icon: <Package className="w-6 h-6" />, title: "Precios de importación directa", desc: "Sin intermediarios. Precio de fábrica para ti y máximo margen para revender." },
                { icon: <Shield className="w-6 h-6" />, title: "Pago contra entrega", desc: "Pagas cuando tienes el producto en tus manos. Sin riesgo." },
                { icon: <Heart className="w-6 h-6" />, title: "Lo más viral, primero", desc: "Antes de que llegue a todas partes, ya lo tienes en Colombia." },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:border-[#C1272D]/20 transition-colors hover:shadow-sm">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#FFF0F0", color: "#C1272D" }}>
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-[#111111] text-base mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 12. TESTIMONIOS ══ */}
        <section className="py-16 px-4" style={{ background: "#F8F5F2" }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#C1272D" }}>COMUNIDAD</p>
              <h2 className="font-black text-4xl text-[#111111]">Lo dicen los GRC Lovers</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                      style={{ background: INITIALS_COLORS[i % INITIALS_COLORS.length] }}
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

        {/* ══ 13. CTA FINAL ══ */}
        <section className="py-20 px-4" style={{ background: "#C1272D" }}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-black text-4xl sm:text-5xl text-white leading-tight mb-4">
              ¿Listo para descubrir<br />tu próximo producto favorito?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Más de 500 colombianos ya lo hicieron este mes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={scrollToCatalog}
                className="font-bold text-base px-8 py-4 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-0.5 bg-white"
                style={{ color: "#C1272D" }}
              >
                Ver catálogo completo
              </button>
              <a
                href={waGenericUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-bold text-base px-8 py-4 rounded-2xl border-2 border-white text-white transition-all hover:bg-white/10"
              >
                <WASvg />
                Hablar por WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* ══ 14. FOOTER ══ */}
        <footer className="py-14 px-4" style={{ background: "#111111" }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: "#C1272D" }}>
                    G
                  </div>
                  <p className="font-black text-white text-sm">GRC IMPORTACIONES</p>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Lo mejor del mundo,<br />primero en Colombia.
                </p>
              </div>

              {/* Productos */}
              <div>
                <p className="font-bold text-white text-sm mb-4 uppercase tracking-wider">Productos</p>
                <ul className="space-y-2.5">
                  {["Hogar inteligente", "Tech viral", "Cocina", "Organización", "Novedades"].map((item) => (
                    <li key={item}>
                      <a href="/tienda" className="text-gray-400 text-sm hover:text-white transition-colors">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ayuda */}
              <div>
                <p className="font-bold text-white text-sm mb-4 uppercase tracking-wider">Ayuda</p>
                <ul className="space-y-2.5">
                  {["Cómo comprar", "Envíos y entregas", "Garantías", "Devoluciones", "Contacto"].map((item) => (
                    <li key={item}>
                      <a href={waGenericUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm hover:text-white transition-colors">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Síguenos */}
              <div>
                <p className="font-bold text-white text-sm mb-4 uppercase tracking-wider">Síguenos</p>
                <div className="flex gap-3 mb-4">
                  <a href="#" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href={waGenericUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                    <WASvg cls="w-4 h-4" />
                  </a>
                </div>
                <p className="text-gray-400 text-xs">@grc.importaciones</p>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 text-center">
              <p className="text-gray-500 text-sm">
                © 2026 GRC Importaciones · Todos los derechos reservados
              </p>
            </div>
          </div>
        </footer>

        {/* ══ 15. FLOATING WA ══ */}
        <a
          href={waGenericUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl wa-float group"
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
