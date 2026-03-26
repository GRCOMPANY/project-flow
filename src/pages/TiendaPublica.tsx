import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Minus, Plus, X, ShoppingBag, ChevronRight } from "lucide-react";

const GRC_WHATSAPP = "573226421110";

const CATEGORIES = ["Todos", "Hogar", "Electrónica", "Cocina", "Accesorios", "Tecnología"];

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

const TiendaPublica = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [activeDrawerImage, setActiveDrawerImage] = useState<string>("");

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
    const matchCat = category === "Todos" || p.category?.toLowerCase() === category.toLowerCase();
    return matchSearch && matchCat;
  });

  const formatPrice = (v: number | null) =>
    v != null ? `$${v.toLocaleString("es-CO")}` : "";

  const getQty = (id: string) => quantities[id] ?? 1;
  const setQty = (id: string, n: number) =>
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Math.min(10, n)) }));

  const getAllImages = (p: CatalogProduct) => {
    const imgs: string[] = [];
    if (p.image_url) imgs.push(p.image_url);
    if (p.images && Array.isArray(p.images)) {
      p.images.forEach(img => { if (img && !imgs.includes(img)) imgs.push(img); });
    }
    return imgs;
  };

  const handleSelectProduct = (p: CatalogProduct) => {
    setSelectedProduct(p);
    setActiveDrawerImage(p.image_url || getAllImages(p)[0] || "");
  };

  const openWhatsApp = (name: string, qty: number) => {
    const msg = encodeURIComponent(
      `Hola GRC! Quiero comprar ${qty} unidad(es) de ${name}. ¿Está disponible?`
    );
    window.open(`https://wa.me/${GRC_WHATSAPP}?text=${msg}`, "_blank");
  };

  const openGenericWA = () => {
    const msg = encodeURIComponent("Hola GRC, quiero más info sobre sus productos");
    window.open(`https://wa.me/${GRC_WHATSAPP}?text=${msg}`, "_blank");
  };

  const truncateDesc = (desc: string | null, max = 60) => {
    if (!desc) return null;
    return desc.length > max ? desc.slice(0, max) + "…" : desc;
  };

  // Build grid items with banner inserted after 3rd product
  const gridItems: (CatalogProduct | "banner")[] = [];
  filtered.forEach((p, i) => {
    if (i === 3) gridItems.push("banner");
    gridItems.push(p);
  });
  if (filtered.length > 0 && filtered.length <= 3 && filtered.length === 3) {
    gridItems.push("banner");
  }

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
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
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .tienda-card {
          opacity: 0;
          animation: fadeSlideUp 0.5s ease-out forwards;
        }
        .shimmer-btn {
          background-size: 200% 100%;
          background-image: linear-gradient(90deg, hsl(357 78% 47%) 0%, hsl(357 78% 57%) 50%, hsl(357 78% 47%) 100%);
          animation: shimmer 2.5s infinite;
        }
        .drawer-overlay {
          animation: overlayIn 0.3s ease-out forwards;
        }
        .drawer-panel {
          animation: slideInRight 0.3s ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .tienda-card { animation: none; opacity: 1; }
          .shimmer-btn { animation: none; }
          .drawer-panel { animation: none; }
          .drawer-overlay { animation: none; }
        }
      `}</style>

      <div className="min-h-screen bg-background">
        {/* TOP BAR */}
        <div className="sticky top-0 z-50 h-8 bg-primary flex items-center justify-center">
          <p className="text-primary-foreground text-xs font-medium tracking-wide">
            🚚 Envío gratis a todo Colombia — Pago contra entrega disponible
          </p>
        </div>

        {/* HEADER */}
        <header className="sticky top-8 z-40 bg-foreground shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo-grc.png" alt="GRC" className="h-11 object-contain" />
              <div className="hidden sm:block">
                <h1 className="text-primary-foreground font-bold text-lg leading-tight">GRC Importaciones</h1>
                <p className="text-muted-foreground text-xs">Productos que transforman tu hogar</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-900/40 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                Envíos activos
              </span>
              <button
                onClick={() => {
                  const msg = encodeURIComponent("Hola GRC, quiero comprar por WhatsApp");
                  window.open(`https://wa.me/${GRC_WHATSAPP}?text=${msg}`, "_blank");
                }}
                className="shimmer-btn text-primary-foreground text-sm font-bold px-4 py-2 rounded-lg"
              >
                Comprar por WhatsApp →
              </button>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section
          className="py-16 sm:py-20 px-4 text-center"
          style={{ background: "linear-gradient(135deg, hsl(220 20% 10%) 0%, hsl(357 78% 47%) 100%)" }}
        >
          <h2 className="text-primary-foreground font-bold text-3xl sm:text-5xl max-w-3xl mx-auto leading-tight tracking-tight">
            Descubre productos que no sabías que necesitabas
          </h2>
          <p className="text-white/60 mt-4 text-sm sm:text-lg max-w-xl mx-auto">
            Innovación para tu hogar · Envío a todo Colombia · Pago contra entrega
          </p>
          <p className="text-white/40 mt-2 text-xs sm:text-sm">
            Más de 100 clientes satisfechos en Colombia
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {["🚚 Envío rápido", "✅ Contra entrega", "⭐ Garantía incluida"].map((b) => (
              <span key={b} className="bg-white/20 text-primary-foreground text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full backdrop-blur-sm">
                {b}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <button
              onClick={() => {
                const el = document.getElementById("productos");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-6 py-3 rounded-xl transition-colors"
            >
              Ver productos
            </button>
            <button
              onClick={openGenericWA}
              className="border border-white/30 hover:bg-white/10 text-primary-foreground font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
            >
              Escríbenos por WhatsApp
            </button>
          </div>
        </section>

        {/* TRUST BAR */}
        <section className="bg-card border-b border-border py-5 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            {[
              "🚚 Envíos a todo Colombia",
              "📦 Contra entrega disponible",
              "✅ Productos con garantía",
              "⭐ +100 clientes satisfechos",
            ].map((t) => (
              <div key={t} className="font-medium text-muted-foreground">{t}</div>
            ))}
          </div>
        </section>

        {/* FILTERS */}
        <section className="max-w-6xl mx-auto px-4 pt-6 pb-2" id="productos">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  category === c
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* PRODUCT GRID */}
        <section className="max-w-6xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground">Cargando productos...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No se encontraron productos</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {gridItems.map((item, idx) => {
                if (item === "banner") {
                  return (
                    <div
                      key="banner"
                      className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 bg-primary text-primary-foreground rounded-2xl p-8 text-center"
                    >
                      <h3 className="font-bold text-xl mb-2">¿Eres revendedor?</h3>
                      <p className="text-white/80 text-sm mb-4">
                        Tenemos precios especiales para emprendedores y revendedores
                      </p>
                      <a
                        href="https://wa.me/573226421110?text=Hola%20GRC%2C%20quiero%20informaci%C3%B3n%20sobre%20precios%20mayoristas"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-card text-primary font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-secondary transition-colors"
                      >
                        Ver precios mayoristas →
                      </a>
                    </div>
                  );
                }

                const p = item;
                const qty = getQty(p.id);

                return (
                  <div
                    key={p.id}
                    className="tienda-card bg-card rounded-xl shadow-md hover:shadow-premium-hover border border-border overflow-hidden transition-all duration-200 hover:scale-[1.02] flex flex-col"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    {/* Image */}
                    <div
                      className="relative overflow-hidden cursor-pointer"
                      onClick={() => handleSelectProduct(p)}
                    >
                      <img
                        src={p.image_url || "/placeholder.svg"}
                        alt={p.name ?? ""}
                        className="w-full h-[300px] object-cover transition-transform duration-500 hover:scale-105"
                      />
                      {p.category && (
                        <span className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-[10px] font-bold uppercase px-2.5 py-1 rounded-md">
                          {p.category}
                        </span>
                      )}
                      {p.is_featured && (
                        <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-md animate-pulse">
                          🔥 Más vendido
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3
                        className="font-semibold text-base text-card-foreground line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSelectProduct(p)}
                      >
                        {p.name}
                      </h3>

                      {truncateDesc(p.description) && (
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-1">
                          {truncateDesc(p.description)}
                        </p>
                      )}

                      <p className="text-primary font-bold text-2xl mt-2">
                        {formatPrice(p.retail_price)}
                      </p>

                      <p className="text-emerald-600 text-[11px] mt-1 font-medium">
                        ✓ Disponible · Entrega hoy en Bogotá
                      </p>

                      <div className="border-t border-border my-3" />

                      {/* Quantity */}
                      <div className="flex items-center justify-center gap-4 mb-3">
                        <button
                          onClick={() => setQty(p.id, qty - 1)}
                          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-secondary/70 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-lg w-6 text-center text-card-foreground">{qty}</span>
                        <button
                          onClick={() => setQty(p.id, qty + 1)}
                          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-secondary/70 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Buttons */}
                      <button
                        onClick={() => handleSelectProduct(p)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Comprar ahora
                      </button>
                      <button
                        onClick={() => openWhatsApp(p.name ?? "", qty)}
                        className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
                      >
                        Comprar por WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* GUARANTEE */}
        <section className="bg-secondary py-12 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "🔄", title: "Garantía de satisfacción", desc: "Si no estás satisfecho, lo resolvemos" },
              { icon: "📞", title: "Soporte directo por WhatsApp", desc: "Respuesta en menos de 1 hora" },
              { icon: "🚀", title: "Entrega rápida en Bogotá", desc: "Recibe tu pedido el mismo día" },
            ].map((g) => (
              <div key={g.title} className="bg-card rounded-2xl p-6 text-center shadow-premium border border-border">
                <div className="text-4xl mb-3">{g.icon}</div>
                <h4 className="font-bold text-card-foreground mb-1">{g.title}</h4>
                <p className="text-muted-foreground text-sm">{g.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-foreground text-primary-foreground px-4 py-10">
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
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
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
          <span className="absolute -top-10 right-0 bg-foreground text-primary-foreground text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Comprar por WhatsApp
          </span>
          <div
            className="w-[60px] h-[60px] rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.5)]"
            style={{ animation: "bounceSubtle 4s infinite" }}
          >
            <svg viewBox="0 0 32 32" className="w-8 h-8 fill-white">
              <path d="M16.004 3.2C9.158 3.2 3.6 8.758 3.6 15.604c0 2.186.57 4.322 1.654 6.21L3.2 28.8l7.19-2.016a12.36 12.36 0 005.614 1.352c6.846 0 12.396-5.558 12.396-12.404S22.85 3.2 16.004 3.2zm0 22.654a10.2 10.2 0 01-5.21-1.428l-.374-.222-3.876 1.086 1.04-3.81-.242-.386A10.16 10.16 0 015.754 15.6c0-5.65 4.6-10.248 10.25-10.248 5.65 0 10.244 4.598 10.244 10.248 0 5.652-4.594 10.254-10.244 10.254zm5.616-7.674c-.308-.154-1.822-.9-2.104-.998-.282-.1-.488-.154-.694.154-.206.308-.796.998-.976 1.204-.18.206-.36.23-.668.076-.308-.154-1.3-.48-2.476-1.528-.916-.816-1.534-1.824-1.714-2.132-.18-.308-.02-.474.134-.628.14-.138.308-.36.462-.54.154-.18.206-.308.308-.514.102-.206.052-.386-.026-.54-.076-.154-.694-1.672-.95-2.29-.25-.6-.506-.52-.694-.528-.18-.01-.386-.01-.592-.01a1.136 1.136 0 00-.822.386c-.282.308-1.078 1.054-1.078 2.57 0 1.516 1.104 2.98 1.258 3.186.154.206 2.172 3.316 5.264 4.65.736.318 1.31.508 1.758.65.738.236 1.41.202 1.942.122.592-.088 1.822-.746 2.08-1.466.256-.72.256-1.336.18-1.466-.078-.128-.284-.206-.592-.36z" />
            </svg>
          </div>
        </a>

        {/* DRAWER */}
        {selectedProduct && (
          <div
            className="fixed inset-0 z-50 drawer-overlay"
            onClick={() => setSelectedProduct(null)}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Panel */}
            <div
              className="drawer-panel absolute right-0 top-0 h-full w-full sm:w-[480px] bg-card shadow-premium-lg overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/40 backdrop-blur text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image */}
              <img
                src={selectedProduct.image_url || "/placeholder.svg"}
                alt={selectedProduct.name ?? ""}
                className="w-full h-[280px] sm:h-[320px] object-cover"
              />

              <div className="p-6">
                {selectedProduct.category && (
                  <span className="text-[10px] font-bold uppercase bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md">
                    {selectedProduct.category}
                  </span>
                )}

                <h3 className="font-bold text-xl text-card-foreground mt-3">
                  {selectedProduct.name}
                </h3>

                <p className="text-primary font-bold text-3xl mt-2">
                  {formatPrice(selectedProduct.retail_price)}
                </p>

                <p className="text-emerald-600 text-xs font-medium mt-1">
                  ✓ Disponible · Entrega hoy en Bogotá
                </p>

                {selectedProduct.description && (
                  <p className="text-muted-foreground text-sm mt-4 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                )}

                <div className="border-t border-border my-5" />

                <p className="font-semibold text-card-foreground text-sm mb-3">¿Por qué este producto?</p>
                <div className="space-y-2 text-sm">
                  {[
                    "Envío a todo Colombia",
                    "Pago contra entrega",
                    "Garantía incluida",
                    "Soporte por WhatsApp",
                  ].map((b) => (
                    <div key={b} className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                      {b}
                    </div>
                  ))}
                </div>

                <div className="border-t border-border my-5" />

                {/* Quantity */}
                <div className="flex items-center justify-center gap-5 mb-5">
                  <button
                    onClick={() => setQty(selectedProduct.id, getQty(selectedProduct.id) - 1)}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-secondary/70 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-xl w-8 text-center text-card-foreground">
                    {getQty(selectedProduct.id)}
                  </span>
                  <button
                    onClick={() => setQty(selectedProduct.id, getQty(selectedProduct.id) + 1)}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-secondary/70 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => openWhatsApp(selectedProduct.name ?? "", getQty(selectedProduct.id))}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
                >
                  Comprar por WhatsApp
                  <ChevronRight className="w-4 h-4" />
                </button>

                <p className="text-center text-muted-foreground text-xs mt-3">
                  Te responderemos en menos de 1 hora
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TiendaPublica;
