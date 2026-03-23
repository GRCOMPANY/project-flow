import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Minus, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";

const GRC_WHATSAPP = "573226421110";

const CATEGORIES = ["Todos", "Hogar", "Electrónica", "Cocina", "Accesorios", "Tecnología"];

interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  retail_price: number | null;
  is_featured: boolean | null;
  status: string | null;
}

const TiendaPublica = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["tienda-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_seller_view")
        .select("id, name, description, category, image_url, retail_price, is_featured, status")
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
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tienda-card {
          opacity: 0;
          animation: fadeSlideUp 0.5s ease-out forwards;
        }
        .shimmer-btn {
          background-size: 200% 100%;
          background-image: linear-gradient(90deg, #C1272D 0%, #e04a50 50%, #C1272D 100%);
          animation: shimmer 2.5s infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .tienda-card { animation: none; opacity: 1; }
          .shimmer-btn { animation: none; }
        }
      `}</style>

      <div className="min-h-screen bg-white">
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-[#111111] shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo-grc.png" alt="GRC" className="h-11 object-contain" />
              <div className="hidden sm:block">
                <h1 className="text-white font-bold text-lg leading-tight">GRC Importaciones</h1>
                <p className="text-gray-400 text-xs">Productos que transforman tu hogar</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-green-900/40 text-green-400 text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                Envíos activos
              </span>
              <button
                onClick={() => {
                  const msg = encodeURIComponent("Hola GRC, quiero comprar por WhatsApp");
                  window.open(`https://wa.me/${GRC_WHATSAPP}?text=${msg}`, "_blank");
                }}
                className="shimmer-btn text-white text-sm font-bold px-4 py-2 rounded-lg"
              >
                Comprar por WhatsApp →
              </button>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section
          className="py-14 px-4 text-center"
          style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #C1272D 100%)" }}
        >
          <h2 className="text-white font-bold text-2xl sm:text-4xl max-w-2xl mx-auto leading-tight">
            Descubre productos que no sabías que necesitabas
          </h2>
          <p className="text-white/60 mt-3 text-sm sm:text-base max-w-xl mx-auto">
            Innovación para tu hogar · Envío a todo Colombia · Pago contra entrega
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {["🚚 Envío rápido", "✅ Contra entrega", "⭐ Garantía incluida"].map((b) => (
              <span key={b} className="bg-white/15 text-white text-xs font-semibold px-4 py-2 rounded-full backdrop-blur">
                {b}
              </span>
            ))}
          </div>
        </section>

        {/* TRUST BAR */}
        <section className="bg-white border-b py-5 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            {[
              "🚚 Envíos a todo Colombia",
              "📦 Contra entrega disponible",
              "✅ Productos con garantía",
              "⭐ +100 clientes satisfechos",
            ].map((t) => (
              <div key={t} className="font-medium text-gray-700">{t}</div>
            ))}
          </div>
        </section>

        {/* FILTERS */}
        <section className="max-w-6xl mx-auto px-4 pt-6 pb-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C1272D]/40"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  category === c
                    ? "bg-[#C1272D] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            <div className="text-center py-20 text-gray-400">Cargando productos...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No se encontraron productos</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {gridItems.map((item, idx) => {
                if (item === "banner") {
                  return (
                    <div
                      key="banner"
                      className="col-span-2 lg:col-span-3 bg-[#C1272D] text-white rounded-2xl p-8 text-center"
                    >
                      <h3 className="font-bold text-xl mb-2">¿Eres revendedor?</h3>
                      <p className="text-white/80 text-sm mb-4">
                        Tenemos precios especiales para emprendedores y revendedores
                      </p>
                      <a
                        href="https://wa.me/573226421110?text=Hola%20GRC%2C%20quiero%20informaci%C3%B3n%20sobre%20precios%20mayoristas"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-white text-[#C1272D] font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
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
                    className="tienda-card bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgba(193,39,45,0.15)] hover:border-[#C1272D] flex flex-col"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    {/* Image */}
                    <div
                      className="relative overflow-hidden cursor-pointer"
                      onClick={() => setSelectedProduct(p)}
                    >
                      <img
                        src={p.image_url || "/placeholder.svg"}
                        alt={p.name ?? ""}
                        className="w-full h-[280px] object-cover transition-transform duration-500 hover:scale-105"
                      />
                      {p.category && (
                        <span className="absolute top-3 left-3 bg-black/50 text-white text-[10px] font-bold uppercase px-2 py-1 rounded backdrop-blur-sm">
                          {p.category}
                        </span>
                      )}
                      {p.is_featured && (
                        <span className="absolute top-3 right-3 bg-[#C1272D] text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse">
                          🔥 Más vendido
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3
                        className="font-bold text-[15px] text-gray-900 line-clamp-2 cursor-pointer hover:text-[#C1272D] transition-colors"
                        onClick={() => setSelectedProduct(p)}
                      >
                        {p.name}
                      </h3>

                      <p className="text-gray-400 text-[11px] mt-1">Precio</p>
                      <p className="text-[#C1272D] font-bold text-2xl">
                        {formatPrice(p.retail_price)}
                      </p>

                      <p className="text-[#C1272D] text-[11px] mt-1">
                        ⚡ Disponible ahora · Entrega hoy en Bogotá
                      </p>

                      <div className="border-t border-gray-100 my-3" />

                      {/* Quantity */}
                      <div className="flex items-center justify-center gap-4 mb-3">
                        <button
                          onClick={() => setQty(p.id, qty - 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-lg w-6 text-center">{qty}</span>
                        <button
                          onClick={() => setQty(p.id, qty + 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => openWhatsApp(p.name ?? "", qty)}
                        className="mt-auto w-full bg-[#25D366] hover:bg-[#1fbe59] text-white font-bold text-sm py-3 rounded-xl transition-colors"
                      >
                        🛒 Comprar {qty > 1 ? `${qty} ` : ""}por WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* GUARANTEE */}
        <section className="bg-[#F8F8F8] py-12 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "🔄", title: "Garantía de satisfacción", desc: "Si no estás satisfecho, lo resolvemos" },
              { icon: "📞", title: "Soporte directo por WhatsApp", desc: "Respuesta en menos de 1 hora" },
              { icon: "🚀", title: "Entrega rápida en Bogotá", desc: "Recibe tu pedido el mismo día" },
            ].map((g) => (
              <div key={g.title} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="text-4xl mb-3">{g.icon}</div>
                <h4 className="font-bold text-gray-900 mb-1">{g.title}</h4>
                <p className="text-gray-500 text-sm">{g.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#111111] text-white px-4 py-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/logo-grc.png" alt="GRC" className="h-10 object-contain" />
              <span className="font-bold text-lg">GRC Importaciones</span>
            </div>
            <p className="text-gray-400 text-sm">Productos innovadores para tu hogar</p>
            <p className="text-gray-500 text-xs mt-2">📍 Bogotá, Colombia</p>
            <p className="text-gray-500 text-xs">📲 +57 322 642 1110</p>
            <button
              onClick={openGenericWA}
              className="mt-4 bg-[#25D366] hover:bg-[#1fbe59] text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
            >
              Escríbenos ahora
            </button>
            <div className="border-t border-white/10 mt-6 pt-4">
              <p className="text-gray-600 text-xs">
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
          <span className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Comprar por WhatsApp
          </span>
          <div
            className="w-[60px] h-[60px] rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.5)]"
            style={{ animation: "bounceSubtle 4s infinite" }}
          >
            <svg viewBox="0 0 32 32" className="w-8 h-8 fill-white">
              <path d="M16.004 3.2C9.158 3.2 3.6 8.758 3.6 15.604c0 2.186.57 4.322 1.654 6.21L3.2 28.8l7.19-2.016a12.36 12.36 0 005.614 1.352c6.846 0 12.396-5.558 12.396-12.404S22.85 3.2 16.004 3.2zm0 22.654a10.2 10.2 0 01-5.21-1.428l-.374-.222-3.876 1.086 1.04-3.81-.242-.386A10.16 10.16 0 015.754 15.6c0-5.65 4.6-10.248 10.25-10.248 5.65 0 10.244 4.598 10.244 10.248 0 5.652-4.594 10.254-10.244 10.254zm5.616-7.674c-.308-.154-1.822-.9-2.104-.998-.282-.1-.488-.154-.694.154-.206.308-.796.998-.976 1.204-.18.206-.36.23-.668.076-.308-.154-1.3-.48-2.476-1.528-.916-.816-1.534-1.824-1.714-2.132-.18-.308-.02-.474.134-.628.14-.138.308-.36.462-.54.154-.18.206-.308.308-.514.102-.206.052-.386-.026-.54-.076-.154-.694-1.672-.95-2.29-.25-.6-.506-.52-.694-.528-.18-.01-.386-.01-.592-.01a1.136 1.136 0 00-.822.386c-.282.308-1.078 1.054-1.078 2.57 0 1.516 1.104 2.98 1.258 3.186.154.206 2.172 3.316 5.264 4.65.736.318 1.31.508 1.758.65.738.236 1.41.202 1.942.122.592-.088 1.822-.746 2.08-1.466.256-.72.256-1.336.18-1.466-.078-.128-.284-.206-.592-.36z" />
            </svg>
          </div>
        </a>

        {/* MODAL */}
        {selectedProduct && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="bg-white w-full sm:max-w-[480px] sm:rounded-2xl max-h-[90vh] overflow-y-auto relative"
              style={{ animation: "modalSlideUp 0.3s ease-out" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/40 backdrop-blur text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <img
                src={selectedProduct.image_url || "/placeholder.svg"}
                alt={selectedProduct.name ?? ""}
                className="w-full h-[240px] object-cover"
              />

              <div className="p-5">
                {selectedProduct.category && (
                  <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {selectedProduct.category}
                  </span>
                )}

                <h3 className="font-bold text-xl text-gray-900 mt-2">
                  {selectedProduct.name}
                </h3>

                <p className="text-[#C1272D] font-bold text-3xl mt-2">
                  {formatPrice(selectedProduct.retail_price)}
                </p>

                {selectedProduct.description && (
                  <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                )}

                <div className="border-t border-gray-100 my-4" />

                <p className="font-semibold text-gray-900 text-sm mb-2">¿Por qué este producto?</p>
                <div className="space-y-1.5 text-sm text-gray-600">
                  <p>✅ Envío a todo Colombia</p>
                  <p>✅ Pago contra entrega</p>
                  <p>✅ Garantía del producto</p>
                  <p>✅ Soporte por WhatsApp</p>
                </div>

                <div className="border-t border-gray-100 my-4" />

                {/* Quantity */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => setQty(selectedProduct.id, getQty(selectedProduct.id) - 1)}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-xl w-8 text-center">
                    {getQty(selectedProduct.id)}
                  </span>
                  <button
                    onClick={() => setQty(selectedProduct.id, getQty(selectedProduct.id) + 1)}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => openWhatsApp(selectedProduct.name ?? "", getQty(selectedProduct.id))}
                  className="w-full bg-[#25D366] hover:bg-[#1fbe59] text-white font-bold py-3.5 rounded-xl text-base transition-colors"
                >
                  Comprar por WhatsApp →
                </button>

                <p className="text-center text-gray-400 text-xs mt-3">
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
