import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package, Search, MessageCircle, Plus, Minus, ArrowRight, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const GRC_WHATSAPP = '573226421110';
const LOGO_URL = '/grc-logo.png';
const CATEGORIES = ['Todos', 'Electrónica', 'Hogar', 'Accesorios', 'Tecnología', 'Otro'];

interface CatalogProduct {
  id: string;
  name: string;
  image_url: string | null;
  wholesale_price: number | null;
  retail_price: number | null;
  category: string | null;
  description: string | null;
}

export default function CatalogoPublico() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['catalogo-publico'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products_seller_view')
        .select('id, name, image_url, wholesale_price, retail_price, category, description')
        .eq('status', 'activo')
        .order('name');
      if (error) throw error;
      return data as CatalogProduct[];
    },
  });

  const filtered = products?.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'Todos' || p.category?.toLowerCase() === category.toLowerCase();
    return matchesSearch && matchesCategory;
  }) ?? [];

  const formatPrice = (n: number | null) =>
    n != null ? `$${n.toLocaleString('es-CO')}` : '—';

  const profit = (p: CatalogProduct) =>
    p.retail_price != null && p.wholesale_price != null
      ? p.retail_price - p.wholesale_price
      : null;

  const getQty = (id: string) => quantities[id] ?? 1;

  const setQty = (id: string, val: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, Math.min(50, val)) }));
  };

  const openWhatsApp = (name: string, qty: number, unitPrice: number | null) => {
    const total = unitPrice != null ? qty * unitPrice : 0;
    const msg = encodeURIComponent(
      `Hola GRC, quiero pedir ${qty} unidades de ${name}. Mi precio total: $${total.toLocaleString('es-CO')}`
    );
    window.open(`https://wa.me/${GRC_WHATSAPP}?text=${msg}`, '_blank');
  };

  const modalQty = selectedProduct ? getQty(selectedProduct.id) : 1;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* ━━━ ANIMATIONS ━━━ */}
      <style>{`
        @keyframes fade-slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes bounce-wa {
          0%, 85%, 100% { transform: translateY(0); }
          92% { transform: translateY(-5px); }
          96% { transform: translateY(0); }
        }
        @keyframes pulse-banner {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.92; }
        }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .catalog-card {
          opacity: 0;
          animation: fade-slide-up 0.5s ease-out forwards;
        }
        .catalog-card:hover {
          transform: scale(1.03);
          box-shadow: 0 8px 30px rgba(193, 39, 45, 0.15);
        }
        .shimmer-btn {
          position: relative;
          overflow: hidden;
        }
        .shimmer-btn::after {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          animation: shimmer 2.5s infinite;
        }
        .bounce-wa {
          animation: bounce-wa 3s infinite;
        }
      `}</style>

      {/* ━━━ HEADER ━━━ */}
      <header className="sticky top-0 z-30 bg-[#111111]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="GRC" className="h-12 object-contain" />
              <h1 className="text-xl sm:text-2xl font-bold text-white">Catálogo Mayorista GRC</h1>
            </div>
            <a
              href={`https://wa.me/${GRC_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shimmer-btn hidden sm:inline-flex items-center gap-2 bg-[#C1272D] hover:bg-[#a01f25] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Hablar con George <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <p className="text-gray-400 text-sm sm:text-base max-w-lg">
            Gana dinero vendiendo productos que la gente ya quiere comprar
          </p>
          <div className="flex items-center gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-3 py-1 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Disponible ahora
            </span>
          </div>
          <a
            href={`https://wa.me/${GRC_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shimmer-btn sm:hidden mt-4 flex items-center justify-center gap-2 bg-[#C1272D] hover:bg-[#a01f25] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors w-full"
          >
            Hablar con George <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* ━━━ BARRA DE CONFIANZA ━━━ */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-sm text-gray-700 font-medium">
            <span>📦 Sin inventario · solo bajo pedido</span>
            <span>🚚 Entrega en Bogotá mismo día</span>
            <span>💰 Ganancias desde $15.000 por unidad</span>
          </div>
        </div>
      </div>

      {/* ━━━ FILTROS ━━━ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm bg-white border-gray-200"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-[#C1272D] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ━━━ CONTENT ━━━ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-[480px] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No se encontraron productos</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{filtered.length} productos disponibles</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p, index) => {
                const ganancia = profit(p);
                const qty = getQty(p.id);
                return (
                  <React.Fragment key={p.id}>
                    {index === 3 && (
                      <div className="col-span-full rounded-2xl bg-[#C1272D] p-6 sm:p-8 text-center" style={{ animation: 'pulse-banner 3s ease-in-out infinite' }}>
                        <p className="text-white text-lg sm:text-xl font-bold mb-2">
                          ⚡ Trabajamos bajo pedido — tú vendes primero, nosotros conseguimos
                        </p>
                        <p className="text-white/80 text-sm mb-3">📲 ¿Dudas? Escríbenos ahora</p>
                        <a
                          href={`https://wa.me/${GRC_WHATSAPP}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-white text-[#C1272D] font-semibold text-sm px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          Escribir <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                    <div
                      className="catalog-card bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-300"
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      {/* Image — clickable */}
                      <div
                        className="relative h-[260px] bg-gray-100 overflow-hidden cursor-pointer"
                        onClick={() => setSelectedProduct(p)}
                      >
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-gray-200" />
                          </div>
                        )}
                        {p.category && (
                          <span className="absolute top-3 left-3 bg-gray-800/80 text-white text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-md">
                            {p.category}
                          </span>
                        )}
                        <span className="absolute top-3 right-3 bg-[#C1272D] text-white text-[10px] font-bold px-2 py-1 rounded-md animate-pulse">
                          🔥 Popular
                        </span>
                      </div>

                      {/* Info */}
                      <div className="p-4 flex flex-col flex-1 gap-2">
                        <h3
                          className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 cursor-pointer hover:text-[#C1272D] transition-colors"
                          onClick={() => setSelectedProduct(p)}
                        >
                          {p.name}
                        </h3>

                        {/* Prices */}
                        <div className="mt-1">
                          <p className="text-[10px] uppercase text-gray-400 tracking-wide">Tu precio</p>
                          <p className="text-xl font-bold text-[#C1272D]">{formatPrice(p.wholesale_price)}</p>
                        </div>
                        <p className="text-sm text-gray-600">{formatPrice(p.retail_price)} <span className="text-xs text-gray-400">Precio sugerido al cliente</span></p>

                        {ganancia != null && ganancia > 0 && (
                          <div className="bg-green-900 rounded-lg px-3 py-2 text-center">
                            <span className="text-sm text-green-100 font-semibold">
                              💰 Ganas {formatPrice(ganancia)} por unidad
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-gray-400">📦 Disponible bajo pedido</p>
                        <p className="text-xs text-green-600">✅ Te enviamos creativos listos para vender</p>

                        {/* Quantity selector */}
                        <div className="flex items-center justify-center gap-3 mt-2">
                          <button
                            onClick={() => setQty(p.id, qty - 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                          <span className="text-lg font-bold text-gray-900 w-8 text-center">{qty}</span>
                          <button
                            onClick={() => setQty(p.id, qty + 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                        </div>

                        {/* WhatsApp CTA */}
                        <Button
                          onClick={() => openWhatsApp(p.name, qty, p.wholesale_price)}
                          className="bounce-wa w-full bg-[#25D366] hover:bg-[#1ebe57] text-white gap-2 mt-1 font-semibold"
                          size="sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Pedir {qty} {qty === 1 ? 'unidad' : 'unidades'} por WhatsApp
                        </Button>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="bg-[#111111] py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <p className="text-white font-bold text-lg">GRC Importaciones · Bogotá, Colombia</p>
          <p className="text-gray-400 text-sm">📲 +57 322 642 1110</p>
          <p className="text-gray-500 text-sm italic">Somos tu proveedor, tú eres el vendedor</p>
          <a
            href={`https://wa.me/${GRC_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors mt-2"
          >
            <MessageCircle className="w-4 h-4" />
            Escríbenos por WhatsApp
          </a>
        </div>
      </footer>

      {/* ━━━ MODAL DE PRODUCTO ━━━ */}
      {selectedProduct && (() => {
        const p = selectedProduct;
        const ganancia = profit(p);
        const qty = getQty(p.id);
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            style={{ animation: 'overlay-in 0.2s ease-out' }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedProduct(null)} />
            {/* Panel */}
            <div
              className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl sm:max-h-[85vh]
                         max-sm:fixed max-sm:inset-0 max-sm:rounded-none max-sm:max-h-full max-sm:max-w-full"
              style={{ animation: 'modal-in 0.3s ease-out' }}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image */}
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                  <Package className="w-20 h-20 text-gray-200" />
                </div>
              )}

              {/* Content */}
              <div className="p-5 sm:p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">{p.name}</h2>

                {p.description && (
                  <p className="text-sm text-gray-500 leading-relaxed">{p.description}</p>
                )}

                {/* Prices row */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-[10px] uppercase text-gray-400 tracking-wide">Tu precio</p>
                    <p className="text-lg font-bold text-[#C1272D]">{formatPrice(p.wholesale_price)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] uppercase text-gray-400 tracking-wide">Sugerido</p>
                    <p className="text-lg font-bold text-gray-700">{formatPrice(p.retail_price)}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-[10px] uppercase text-gray-400 tracking-wide">Ganancia</p>
                    <p className="text-lg font-bold text-green-700">{ganancia != null && ganancia > 0 ? formatPrice(ganancia) : '—'}</p>
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setQty(p.id, qty - 1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-2xl font-bold text-gray-900 w-10 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(p.id, qty + 1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* WhatsApp CTA */}
                <Button
                  onClick={() => openWhatsApp(p.name, qty, p.wholesale_price)}
                  className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white gap-2 font-semibold h-12 text-base"
                >
                  <MessageCircle className="w-5 h-5" />
                  Pedir {qty} {qty === 1 ? 'unidad' : 'unidades'} por WhatsApp
                </Button>

                <p className="text-xs text-green-600 text-center">✅ Te enviamos creativos listos para vender</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
