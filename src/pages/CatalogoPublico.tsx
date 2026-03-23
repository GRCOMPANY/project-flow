import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package, Search, MessageCircle, Plus, Minus, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const GRC_WHATSAPP = '573226421110';

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

  const IntermediateBanner = () => (
    <div className="col-span-full rounded-2xl bg-[#C1272D] p-6 sm:p-8 text-center">
      <p className="text-white text-lg sm:text-xl font-bold">
        ⚡ Trabajamos bajo pedido — tú vendes primero, nosotros conseguimos
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* ━━━ HEADER ━━━ */}
      <header className="sticky top-0 z-30 bg-[#111111]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#C1272D] flex items-center justify-center">
                <span className="text-white font-bold text-base">GRC</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Catálogo Mayorista GRC</h1>
            </div>
            <a
              href={`https://wa.me/${GRC_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 bg-[#C1272D] hover:bg-[#a01f25] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
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
          {/* Mobile CTA */}
          <a
            href={`https://wa.me/${GRC_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:hidden mt-4 flex items-center justify-center gap-2 bg-[#C1272D] hover:bg-[#a01f25] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors w-full"
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
                  <>
                    {index === 3 && <IntermediateBanner key="banner" />}
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-200"
                    >
                      {/* Image */}
                      <div className="relative h-[260px] bg-gray-100 overflow-hidden">
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
                        <span className="absolute top-3 right-3 bg-[#C1272D] text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          🔥 Popular
                        </span>
                      </div>

                      {/* Info */}
                      <div className="p-4 flex flex-col flex-1 gap-2">
                        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                          {p.name}
                        </h3>

                        {/* Prices */}
                        <div className="mt-1">
                          <p className="text-[10px] uppercase text-gray-400 tracking-wide">Tu precio</p>
                          <p className="text-xl font-bold text-[#C1272D]">{formatPrice(p.wholesale_price)}</p>
                        </div>
                        <p className="text-sm text-gray-400 line-through">{formatPrice(p.retail_price)} precio público</p>

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
                          className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white gap-2 mt-1 font-semibold"
                          size="sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Pedir {qty} {qty === 1 ? 'unidad' : 'unidades'} por WhatsApp
                        </Button>
                      </div>
                    </div>
                  </>
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
    </div>
  );
}
