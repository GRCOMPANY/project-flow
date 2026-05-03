import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { Search, ChevronLeft, ChevronRight, Package, Instagram } from "lucide-react";

/* ══════════════════════════════════════
   TYPES
══════════════════════════════════════ */
interface Product {
  id: string;
  name: string | null;
  description: string | null;
  category: string | null;
  image_url: string | null;
  retail_price: number | null;
  wholesale_price: number | null;
  is_featured: boolean | null;
  status: string | null;
  created_at: string | null;
}

interface Banner {
  id: string;
  imagen_url: string | null;
  imagen_posicion: string | null;
  titulo: string | null;
  subtitulo: string | null;
  texto_boton: string | null;
  boton_link: string | null;
  activo: boolean;
  orden: number;
}

interface Categoria {
  key: string;
  icon: string;
  label: string;
}

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
const fmt = (v: number | null) =>
  v != null ? `$${v.toLocaleString("es-CO")}` : "";

const isNewProduct = (created_at: string | null): boolean => {
  if (!created_at) return false;
  return new Date(created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
};

const DEFAULT_CATS: Categoria[] = [
  { key: "Todos",        icon: "⚡", label: "Todo" },
  { key: "Cocina",       icon: "🍳", label: "Cocina" },
  { key: "Hogar",        icon: "🏠", label: "Hogar" },
  { key: "Tecnología",   icon: "💡", label: "Tecnología" },
  { key: "Organización", icon: "📦", label: "Organización" },
  { key: "General",      icon: "🔥", label: "General" },
];

/* ══════════════════════════════════════
   WA SVG
══════════════════════════════════════ */
const WASvg = ({ cls = "w-5 h-5" }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={`${cls} fill-current flex-shrink-0`}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ══════════════════════════════════════
   HERO CAROUSEL
══════════════════════════════════════ */
interface Slide {
  id: string;
  imagen_url: string | null;
  imagen_posicion: string | null;
  titulo: string | null;
  subtitulo: string | null;
  texto_boton: string | null;
  boton_link: string | null;
}

function HeroCarousel({
  slides,
  waGenericUrl,
  navigate,
}: {
  slides: Slide[];
  waGenericUrl: string;
  navigate: (to: string) => void;
}) {
  const handleButtonClick = (boton_link: string | null) => {
    const link = (boton_link ?? "").trim();
    if (!link || link === "whatsapp") {
      window.open(waGenericUrl, "_blank");
    } else if (link.startsWith("/")) {
      navigate(link);
    } else {
      window.open(link, "_blank");
    }
  };
  const [current, setCurrent] = useState(0);

  /* Auto-advance every 4 s */
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(
      () => setCurrent((c) => (c + 1) % slides.length),
      4000
    );
    return () => clearInterval(id);
  }, [slides.length]);

  const prev = () =>
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  return (
    <div className="relative w-full h-[280px] md:h-[500px] overflow-hidden select-none bg-[#C1272D]">
      {/* Track */}
      <div
        className="flex h-full transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id || i}
            className="relative w-full h-full flex-shrink-0"
          >
            {/* Background image */}
            {slide.imagen_url && (
              <img
                src={slide.imagen_url}
                alt={slide.titulo ?? ""}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: slide.imagen_posicion || "center" }}
                loading={i === 0 ? "eager" : "lazy"}
              />
            )}
            {/* Overlay — only when image is present */}
            {slide.imagen_url && (
              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent" />
            )}
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-14 lg:px-20">
              <div className="max-w-xl">
                {slide.titulo && (
                  <h2 className="text-white font-black text-3xl sm:text-5xl lg:text-6xl leading-tight mb-3 drop-shadow-sm">
                    {slide.titulo}
                  </h2>
                )}
                {slide.subtitulo && (
                  <p className="text-white/90 text-sm sm:text-lg mb-7 leading-relaxed max-w-md">
                    {slide.subtitulo}
                  </p>
                )}
                {slide.texto_boton && (
                  <button
                    onClick={() => handleButtonClick(slide.boton_link)}
                    className="inline-block bg-white text-[#C1272D] font-black text-sm px-7 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {slide.texto_boton}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows — only when multiple slides */}
      {slides.length > 1 && (
        <>
          <button
            aria-label="Anterior"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            aria-label="Siguiente"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   PRODUCT CARD
══════════════════════════════════════ */
function ProductCard({
  p,
  onDetail,
  waHref,
}: {
  p: Product;
  onDetail: () => void;
  waHref: string;
}) {
  const isNew = isNewProduct(p.created_at);

  return (
    <article
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
      onClick={onDetail}
    >
      {/* Image */}
      <div className="relative bg-[#F5F5F5] aspect-square overflow-hidden">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name ?? "Producto"}
            loading="lazy"
            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-200" />
          </div>
        )}

        {/* Category badge — top left */}
        {p.category && (
          <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wide bg-[#C1272D]">
            {p.category}
          </span>
        )}

        {/* NUEVO badge — top right */}
        {isNew && (
          <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wide bg-[#111]">
            NUEVO
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 mb-2 flex-1">
          {p.name}
        </h3>
        <p className="font-bold text-[#C1272D] text-base leading-none">
          {fmt(p.retail_price)}
        </p>
      </div>

      {/* "Lo quiero" — always in DOM for consistent height; visible on hover */}
      <div className="px-3 pb-3">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center w-full py-2 bg-[#C1272D] hover:bg-[#A01E22] text-white font-bold text-sm rounded-lg transition-colors opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto duration-200"
        >
          Lo quiero
        </a>
      </div>
    </article>
  );
}

/* ══════════════════════════════════════
   FEATURED ROW (horizontal scroll + arrows)
══════════════════════════════════════ */
function FeaturedRow({
  products,
  onDetail,
  makeWaHref,
}: {
  products: Product[];
  onDetail: (id: string) => void;
  makeWaHref: (p: Product) => string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "right" ? 260 : -260,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* Cards track */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map((p) => (
          <div key={p.id} className="flex-shrink-0 w-44 sm:w-52">
            <ProductCard
              p={p}
              onDetail={() => onDetail(p.id)}
              waHref={makeWaHref(p)}
            />
          </div>
        ))}
      </div>

      {/* Arrows — only if overflow likely */}
      {products.length > 3 && (
        <>
          <button
            aria-label="Scroll izquierda"
            onClick={() => scroll("left")}
            className="absolute -left-4 top-[40%] -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            aria-label="Scroll derecha"
            onClick={() => scroll("right")}
            className="absolute -right-4 top-[40%] -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function TiendaPublica() {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    storeName,
    storeSlogan,
    logoUrl,
    instagram,
    waGenericUrl,
    waUrl,
  } = useStoreConfig();

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Todos");
  const [scrolled, setScrolled] = useState(false);
  const catalogRef = useRef<HTMLElement>(null);

  /* Sticky header shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Queries ── */

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["tienda-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_seller_view")
        .select(
          "id, name, description, category, image_url, retail_price, wholesale_price, is_featured, status, created_at"
        )
        .eq("status", "activo")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Filter out rows with null id (view artefact)
      return ((data ?? []) as Product[]).filter((p) => p.id != null);
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: banners = [] } = useQuery({
    queryKey: ["tienda-banners"],
    queryFn: async () => {
      const { data } = await db
        .from("banners")
        .select("id, imagen_url, imagen_posicion, titulo, subtitulo, texto_boton, boton_link, activo, orden")
        .eq("activo", true)
        .order("orden", { ascending: true });
      return (data ?? []) as Banner[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: cats = DEFAULT_CATS } = useQuery({
    queryKey: ["tienda-cats"],
    queryFn: async () => {
      const { data } = await db
        .from("store_config")
        .select("valor")
        .eq("clave", "categorias")
        .maybeSingle();
      if (!data?.valor) return DEFAULT_CATS;
      try {
        return JSON.parse(data.valor) as Categoria[];
      } catch {
        return DEFAULT_CATS;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  /* ── Derived ── */

  // Hero slides: DB banners or single default slide using brand config
  const slides: Slide[] =
    banners.length > 0
      ? banners
      : [
          {
            id: "default",
            imagen_url: null,
            titulo: storeName,
            subtitulo: storeSlogan || null,
            texto_boton: "Ver productos",
          },
        ];

  // Build a WA href per product
  const makeWaHref = (p: Product): string =>
    waUrl(
      `Hola ${storeName} 👋 Quiero el producto "${p.name ?? ""}". ¿Está disponible?\n\nDirección de entrega: ___\nPago: Contra entrega`
    );

  // Filter products by search text and active category
  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      (p.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat =
      activeCat === "Todos" || p.category === activeCat;
    return matchSearch && matchCat;
  });

  // Featured products for the horizontal row
  const featured = products.filter((p) => p.is_featured);

  const scrollToCatalog = () =>
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });

  /* ── Render ── */
  return (
    <>
      <style>{`
        .hide-scroll { scrollbar-width: none; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <div className="min-h-screen bg-[#F8F8F8]">

        {/* ══ HEADER ══ */}
        <header
          className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
            scrolled ? "shadow-md" : "border-b border-gray-100"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-5">
            {/* Logo + name */}
            <a
              href="/tienda"
              className="flex items-center gap-2.5 shrink-0 group"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={storeName}
                  className="h-8 object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm bg-[#C1272D]">
                  {storeName.charAt(0)}
                </div>
              )}
              <span className="font-black text-[#111] text-sm hidden sm:block tracking-tight group-hover:text-[#C1272D] transition-colors">
                {storeName}
              </span>
            </a>

            {/* Search — expands to fill center */}
            <div className="flex-1 max-w-lg mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  scrollToCatalog();
                }}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-transparent rounded-full text-sm focus:outline-none focus:bg-white focus:border-gray-300 transition-all"
              />
            </div>

            {/* WhatsApp button */}
            <a
              href={waGenericUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 bg-[#25D366] text-white font-bold text-sm px-4 py-2 rounded-full hover:bg-[#1fba59] transition-colors shadow-sm"
            >
              <WASvg cls="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </header>

        {/* ══ HERO CAROUSEL ══ */}
        <HeroCarousel slides={slides} waGenericUrl={waGenericUrl} navigate={navigate} />

        {/* ══ CATEGORY BAR ══ */}
        <nav className="bg-white border-b border-gray-100 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex gap-1 overflow-x-auto hide-scroll py-3">
              {cats.map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setActiveCat(c.key);
                    scrollToCatalog();
                  }}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeCat === c.key
                      ? "bg-[#C1272D] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* ══ CONTENT ══ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">

          {/* ─ DESTACADOS ─ */}
          {featured.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-[#111] mb-5 flex items-center gap-2">
                ⚡ Imperdibles
              </h2>
              <FeaturedRow
                products={featured}
                onDetail={(id) => navigate(`/producto/${id}`)}
                makeWaHref={makeWaHref}
              />
            </section>
          )}

          {/* ─ GRID PRINCIPAL ─ */}
          <section ref={catalogRef} id="catalogo">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-xl font-bold text-[#111]">
                {activeCat === "Todos" ? "Todo el catálogo" : activeCat}
              </h2>
              {filtered.length > 0 && (
                <span className="text-sm text-gray-400">
                  {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {isLoading ? (
              /* Skeleton */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                    <div className="bg-gray-100 animate-pulse aspect-square" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-100 animate-pulse rounded w-full" />
                      <div className="h-3 bg-gray-100 animate-pulse rounded w-2/3" />
                      <div className="h-4 bg-gray-100 animate-pulse rounded w-1/3 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              /* Empty state */
              <div className="text-center py-24">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium text-sm">
                  {search
                    ? `Sin resultados para "${search}"`
                    : `No hay productos en "${activeCat}"`}
                </p>
                {(search || activeCat !== "Todos") && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setActiveCat("Todos");
                    }}
                    className="mt-3 text-[#C1272D] text-sm font-semibold underline underline-offset-2"
                  >
                    Ver todos los productos
                  </button>
                )}
              </div>
            ) : (
              /* Product grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    onDetail={() => navigate(`/producto/${p.id}`)}
                    waHref={makeWaHref(p)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ══ FOOTER ══ */}
        <footer className="bg-[#111] text-white mt-16 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              {/* Brand */}
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={storeName} className="h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm bg-[#C1272D]">
                    {storeName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-black text-sm">{storeName}</p>
                  {storeSlogan && (
                    <p className="text-gray-400 text-xs mt-0.5">{storeSlogan}</p>
                  )}
                </div>
              </div>

              {/* Social / contact */}
              <div className="flex items-center gap-5 flex-wrap">
                {instagram && (
                  <a
                    href={`https://instagram.com/${instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    <Instagram className="w-4 h-4" />
                    {instagram}
                  </a>
                )}
                <a
                  href={waGenericUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <WASvg cls="w-4 h-4" />
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-500 text-xs">
                © {new Date().getFullYear()} {storeName} · Todos los derechos reservados
              </p>
            </div>
          </div>
        </footer>

        {/* ══ FLOATING WA BUTTON ══ */}
        <a
          href={waGenericUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chatear por WhatsApp"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-xl hover:bg-[#1fba59] hover:scale-110 transition-all duration-200"
        >
          <WASvg cls="w-6 h-6" />
        </a>

      </div>
    </>
  );
}
