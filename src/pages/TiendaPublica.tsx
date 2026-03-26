import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

const GRC_WHATSAPP = "573226421110";

const HERO_TEXTS = [
  "Descubre lo que todos están comprando",
  "Productos que transforman tu hogar",
  "Innovación que llega a tu puerta",
];

const CATEGORIES = ["Todos", "Cocina", "Hogar", "Tecnología", "Organización", "General"];

const FOMO_BADGES = ["🔥 Popular", "⚡ Viral", "🆕 Nuevo", "🚀 Más vendido"];

const TESTIMONIALS = [
  { name: "Carolina M.", city: "Bogotá", text: "Llegó súper rápido y funciona perfecto. Ya pedí otro para mi mamá." },
  { name: "Andrés F.", city: "Medellín", text: "No pensé que fuera tan bueno por el precio. Totalmente recomendado." },
  { name: "Laura G.", city: "Cali", text: "Me encantó la calidad. Ya es el tercer producto que les compro." },
];

interface CatalogProduct {
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

const smartCategory = (name: string | null, desc: string | null, category: string | null): string => {
  const text = `${name ?? ""} ${desc ?? ""}`.toLowerCase();
  if (/hervidor|batidora|lonchera|escurridor|cocina/.test(text)) return "Cocina";
  if (/cepillo|esquinero|ducha|baño|tensiómetro|hogar/.test(text)) return "Hogar";
  if (/watch|onn|proyector|aspirador|tecnología|tech/.test(text)) return "Tecnología";
  if (/caja|almacenamiento|organiz/.test(text)) return "Organización";
  if (category) return category;
  return "General";
};

const getAnchorPrice = (price: number) => Math.round(price * 1.35);
const formatPrice = (v: number | null) => (v != null ? `$${v.toLocaleString("es-CO")}` : "");
const getFomoBadge = (id: string) => FOMO_BADGES[id.charCodeAt(0) % FOMO_BADGES.length];

/* ─── UrgencyTimer ─── */
const UrgencyTimer = () => {
  const [secs, setSecs] = useState(2 * 3600 + 59 * 60 + 59);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 10799)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return (
    <span className="font-mono font-bold tracking-wider">
      {h}:{m}:{s}
    </span>
  );
};

/* ─── SmartProductCard ─── */
const SmartProductCard = ({
  product,
  index,
  onClick,
}: {
  product: CatalogProduct;
  index: number;
  onClick: () => void;
}) => {
  const badge = getFomoBadge(product.id);
  const anchor = product.retail_price ? getAnchorPrice(product.retail_price) : null;

  return (
    <div
      className="tienda-card bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-[#E85D00] hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer group"
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={onClick}
    >
      <div className="relative overflow-hidden">
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name ?? ""}
          loading="lazy"
          className="w-full h-[180px] object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute top-2 left-2 bg-[#1A1A1A] text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
          {badge}
        </span>
        {product.is_featured && (
          <span className="absolute top-2 right-2 bg-[#E85D00] text-white text-[10px] font-bold px-2.5 py-1 rounded-md animate-pulse">
            🔥 Tendencia
          </span>
        )}
      </div>

      <div className="p-3.5 flex flex-col flex-1">
        <h3 className="font-semibold text-sm text-[#1A1A1A] line-clamp-2 leading-snug">
          {product.name}
        </h3>

        <div className="mt-2">
          {anchor != null && (
            <p className="text-xs text-gray-400 line-through">{formatPrice(anchor)}</p>
          )}
          <p className="text-[#E85D00] font-extrabold text-xl">{formatPrice(product.retail_price)}</p>
        </div>

        <p className="text-emerald-600 text-[10px] mt-1.5 font-medium">
          ✅ Disponible ahora · Entrega Bogotá
        </p>
        <p className="text-[#E85D00] text-[10px] mt-0.5 font-semibold">
          🔥 Alta demanda hoy
        </p>

        <div className="mt-auto pt-3">
          <button className="w-full bg-[#E85D00] hover:bg-[#d05400] text-white font-bold text-sm py-2.5 rounded-lg transition-colors">
            Ver producto →
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── TrendingCarousel ─── */
const TrendingCarousel = ({
  products,
  onSelect,
}: {
  products: CatalogProduct[];
  onSelect: (p: CatalogProduct) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = setInterval(() => {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += 1;
      }
    }, 30);
    return () => clearInterval(t);
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-10 px-4" style={{ background: "#FFF3EC" }}>
      <h2 className="text-center font-bold text-xl text-[#1A1A1A] mb-6">
        🔥 Lo que todos están comprando
      </h2>
      <div ref={ref} className="flex gap-4 overflow-x-auto scrollbar-hide max-w-6xl mx-auto">
        {products.concat(products).map((p, i) => (
          <div
            key={`${p.id}-${i}`}
            className="flex-shrink-0 w-40 bg-white rounded-xl overflow-hidden border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelect(p)}
          >
            <img
              src={p.image_url || "/placeholder.svg"}
              alt={p.name ?? ""}
              loading="lazy"
              className="w-full h-28 object-cover"
            />
            <div className="p-2">
              <p className="text-xs font-semibold text-[#1A1A1A] line-clamp-1">{p.name}</p>
              <p className="text-[#E85D00] font-bold text-sm mt-0.5">{formatPrice(p.retail_price)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ─── SocialProofSection ─── */
const SocialProofSection = () => (
  <section className="py-12 px-4" style={{ background: "#FAFAFA" }}>
    <div className="max-w-5xl mx-auto text-center">
      <p className="text-[#E85D00] font-bold text-sm mb-1">⭐⭐⭐⭐⭐</p>
      <h2 className="font-bold text-xl text-[#1A1A1A] mb-6">
        +100 clientes satisfechos en Colombia
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-[#E85D00] text-xs mb-2">⭐⭐⭐⭐⭐</p>
            <p className="text-[#1A1A1A] text-sm italic mb-3">"{t.text}"</p>
            <p className="font-bold text-xs text-[#1A1A1A]">{t.name}</p>
            <p className="text-gray-400 text-[10px]">{t.city}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Page ─── */
const TiendaPublica = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [heroTextIndex, setHeroTextIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeroTextIndex((i) => (i + 1) % HERO_TEXTS.length), 3000);
    return () => clearInterval(t);
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["tienda-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_seller_view")
        .select("id, name, description, category, image_url, images, retail_price, is_featured, status")
        .eq("status", "activo");
      if (error) throw error;
      return (data ?? []) as CatalogProduct[];
    },
  });

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const sc = smartCategory(p.name, p.description, p.category);
    const matchCat = category === "Todos" || sc === category;
    return matchSearch && matchCat;
  });

  const trendingProducts = products.filter((p) => p.is_featured).length > 0
    ? products.filter((p) => p.is_featured)
    : products.slice(0, 6);

  const handleSelectProduct = (p: CatalogProduct) => {
    navigate(`/producto/${p.id}`);
  };

  const openGenericWA = () => {
    const msg = encodeURIComponent("Hola GRC, quiero más info sobre sus productos");
    window.open(`https://wa.me/${GRC_WHATSAPP}?text=${msg}`, "_blank");
  };

  // Grid items with banner after 3rd product
  const gridItems: (CatalogProduct | "banner")[] = [];
  filtered.forEach((p, i) => {
    if (i === 3) gridItems.push("banner");
    gridItems.push(p);
  });
  if (filtered.length === 3) gridItems.push("banner");

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceSubtle {
          0%, 88%, 100% { transform: translateY(0); }
          92% { transform: translateY(-8px); }
          96% { transform: translateY(0); }
          98% { transform: translateY(-3px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes heroFade {
          0% { opacity: 0; transform: translateY(8px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        .tienda-card {
          opacity: 0;
          animation: fadeSlideUp 0.5s ease-out forwards;
        }
        .shimmer-btn {
          background-size: 200% 100%;
          background-image: linear-gradient(90deg, #E85D00 0%, #ff7a22 50%, #E85D00 100%);
          animation: shimmer 2.5s infinite;
        }
        .hero-text-anim {
          animation: heroFade 3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .tienda-card { animation: none; opacity: 1; }
          .shimmer-btn { animation: none; }
          .hero-text-anim { animation: none; }
        }
      `}</style>

      <div className="min-h-screen" style={{ background: "#FAFAFA" }}>
        {/* TOP BAR — Urgency */}
        <div className="sticky top-0 z-50 py-2 px-4 flex items-center justify-center gap-2 text-white text-xs font-medium" style={{ background: "#E85D00" }}>
          <span>⏰ Oferta del día termina en:</span>
          <UrgencyTimer />
        </div>

        {/* HEADER */}
        <header className="sticky top-[36px] z-40 shadow-lg" style={{ background: "#1A1A1A" }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo-grc.png" alt="GRC" className="h-11 object-contain" />
              <div className="hidden sm:block">
                <h1 className="text-white font-bold text-lg leading-tight">GRC Importaciones</h1>
                <p className="text-gray-400 text-xs">Productos que todos quieren</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full animate-pulse" style={{ background: "rgba(232,93,0,0.15)", color: "#E85D00" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: "#E85D00" }} />
                🔥 Tendencia hoy
              </span>
              <button
                onClick={openGenericWA}
                className="shimmer-btn text-white text-sm font-bold px-4 py-2 rounded-lg"
              >
                Comprar por WhatsApp →
              </button>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section
          className="py-16 sm:py-20 px-4 text-center"
          style={{ background: "linear-gradient(135deg, #FFF3EC 0%, #FAFAFA 100%)", backgroundSize: "200% 200%", animation: "gradientShift 8s ease infinite" }}
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full mb-6 animate-pulse" style={{ background: "rgba(232,93,0,0.12)", color: "#E85D00" }}>
            🔥 Tendencia hoy
          </div>
          <h2 className="font-bold text-3xl sm:text-5xl max-w-3xl mx-auto leading-tight tracking-tight text-[#1A1A1A] min-h-[2.6em] sm:min-h-[1.4em]">
            <span key={heroTextIndex} className="hero-text-anim inline-block">
              {HERO_TEXTS[heroTextIndex]}
            </span>
          </h2>
          <p className="text-gray-500 mt-4 text-sm sm:text-lg max-w-xl mx-auto">
            Innovación para tu hogar · Envío a todo Colombia · Pago contra entrega
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <button
              onClick={() => document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" })}
              className="text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors hover:opacity-90"
              style={{ background: "#E85D00" }}
            >
              Ver productos
            </button>
            <button
              onClick={openGenericWA}
              className="border font-semibold text-sm px-6 py-3 rounded-xl transition-colors hover:bg-gray-50"
              style={{ borderColor: "#E85D00", color: "#E85D00" }}
            >
              Escríbenos por WhatsApp
            </button>
          </div>
        </section>

        {/* TRUST BAR */}
        <section className="bg-white border-b border-gray-100 py-5 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            {[
              "🚚 Envíos a todo Colombia",
              "📦 Contra entrega disponible",
              "✅ Productos con garantía",
              "⭐ +100 clientes satisfechos",
            ].map((t) => (
              <div key={t} className="font-medium text-gray-500">{t}</div>
            ))}
          </div>
        </section>

        {/* FILTERS */}
        <section className="max-w-6xl mx-auto px-4 pt-6 pb-2" id="productos">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 transition-shadow"
              style={{ boxShadow: "none" }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px rgba(232,93,0,0.3)")}
              onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                  category === c
                    ? "text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
                style={category === c ? { background: "#E85D00", borderColor: "#E85D00" } : {}}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* PRODUCT GRID */}
        <section className="max-w-6xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="text-center py-20 text-gray-400">Cargando productos...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No se encontraron productos</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {gridItems.map((item, idx) => {
                if (item === "banner") {
                  return (
                    <div
                      key="banner"
                      className="col-span-2 sm:col-span-3 xl:col-span-4 rounded-2xl p-8 text-center text-white"
                      style={{ background: "#E85D00" }}
                    >
                      <h3 className="font-bold text-xl mb-2">💰 ¿Quieres ganar dinero con estos productos?</h3>
                      <p className="text-white/80 text-sm mb-4">
                        Tenemos precios especiales para emprendedores y revendedores
                      </p>
                      <a
                        href={`https://wa.me/${GRC_WHATSAPP}?text=${encodeURIComponent("Hola GRC, quiero información sobre precios mayoristas")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-white font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{ color: "#E85D00" }}
                      >
                        Ver precios mayoristas →
                      </a>
                    </div>
                  );
                }

                return (
                  <SmartProductCard
                    key={item.id}
                    product={item}
                    index={idx}
                    onClick={() => handleSelectProduct(item)}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* TRENDING CAROUSEL */}
        <TrendingCarousel products={trendingProducts} onSelect={handleSelectProduct} />

        {/* SOCIAL PROOF */}
        <SocialProofSection />

        {/* GUARANTEE */}
        <section className="py-12 px-4 bg-white">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "🔄", title: "Garantía de satisfacción", desc: "Si no estás satisfecho, lo resolvemos" },
              { icon: "📞", title: "Soporte directo por WhatsApp", desc: "Respuesta en menos de 1 hora" },
              { icon: "🚀", title: "Entrega rápida en Bogotá", desc: "Recibe tu pedido el mismo día" },
            ].map((g) => (
              <div key={g.title} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                <div className="text-4xl mb-3">{g.icon}</div>
                <h4 className="font-bold text-[#1A1A1A] mb-1">{g.title}</h4>
                <p className="text-gray-500 text-sm">{g.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="px-4 py-10 text-white" style={{ background: "#1A1A1A" }}>
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/logo-grc.png" alt="GRC" className="h-10 object-contain" />
              <span className="font-bold text-lg">GRC Importaciones</span>
            </div>
            <p className="text-white/50 text-sm">Productos innovadores para tu hogar</p>
            <p className="text-white/40 text-xs mt-2">📍 Bogotá, Colombia</p>
            <p className="text-white/40 text-xs">📲 +57 322 642 1110</p>
            <button
              onClick={openGenericWA}
              className="mt-4 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
              style={{ background: "#25D366" }}
            >
              Escríbenos ahora
            </button>
            <div className="border-t border-white/10 mt-6 pt-4">
              <p className="text-white/30 text-xs">
                © 2026 GRC Importaciones · Todos los derechos reservados
              </p>
            </div>
          </div>
        </footer>

        {/* FLOATING WHATSAPP */}
        <a
          href={`https://wa.me/${GRC_WHATSAPP}?text=${encodeURIComponent("Hola GRC, quiero más info sobre sus productos")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed z-50 group"
          style={{ bottom: 24, right: 24 }}
        >
          <span className="absolute -top-10 right-0 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: "#1A1A1A" }}>
            Hablar con George
          </span>
          <div
            className="w-[60px] h-[60px] rounded-full flex items-center justify-center"
            style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.5)", animation: "bounceSubtle 4s infinite" }}
          >
            <svg viewBox="0 0 32 32" className="w-8 h-8 fill-white">
              <path d="M16.004 3.2C9.158 3.2 3.6 8.758 3.6 15.604c0 2.186.57 4.322 1.654 6.21L3.2 28.8l7.19-2.016a12.36 12.36 0 005.614 1.352c6.846 0 12.396-5.558 12.396-12.404S22.85 3.2 16.004 3.2zm0 22.654a10.2 10.2 0 01-5.21-1.428l-.374-.222-3.876 1.086 1.04-3.81-.242-.386A10.16 10.16 0 015.754 15.6c0-5.65 4.6-10.248 10.25-10.248 5.65 0 10.244 4.598 10.244 10.248 0 5.652-4.594 10.254-10.244 10.254zm5.616-7.674c-.308-.154-1.822-.9-2.104-.998-.282-.1-.488-.154-.694.154-.206.308-.796.998-.976 1.204-.18.206-.36.23-.668.076-.308-.154-1.3-.48-2.476-1.528-.916-.816-1.534-1.824-1.714-2.132-.18-.308-.02-.474.134-.628.14-.138.308-.36.462-.54.154-.18.206-.308.308-.514.102-.206.052-.386-.026-.54-.076-.154-.694-1.672-.95-2.29-.25-.6-.506-.52-.694-.528-.18-.01-.386-.01-.592-.01a1.136 1.136 0 00-.822.386c-.282.308-1.078 1.054-1.078 2.57 0 1.516 1.104 2.98 1.258 3.186.154.206 2.172 3.316 5.264 4.65.736.318 1.31.508 1.758.65.738.236 1.41.202 1.942.122.592-.088 1.822-.746 2.08-1.466.256-.72.256-1.336.18-1.466-.078-.128-.284-.206-.592-.36z" />
            </svg>
          </div>
        </a>

        {/* FLOATING "GANA VENDIENDO" */}
        <button
          onClick={() => window.open("/catalogo", "_blank")}
          className="fixed z-50 font-bold text-xs text-white px-4 py-2.5 rounded-full shadow-lg transition-transform hover:scale-105"
          style={{ bottom: 28, left: 24, background: "#E85D00" }}
        >
          💰 Gana vendiendo esto →
        </button>
      </div>
    </>
  );
};

export default TiendaPublica;
