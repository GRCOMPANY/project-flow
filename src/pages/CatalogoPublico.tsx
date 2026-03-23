import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package, Search, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const GRC_WHATSAPP = '573001234567'; // TODO: Replace with real number

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

  const filtered = products?.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const formatPrice = (n: number | null) =>
    n != null ? `$${n.toLocaleString('es-CO')}` : '—';

  const profit = (p: CatalogProduct) =>
    p.retail_price != null && p.wholesale_price != null
      ? p.retail_price - p.wholesale_price
      : null;

  const openWhatsApp = (name: string) => {
    const msg = encodeURIComponent(`Hola GRC, quiero pedir: ${name}`);
    window.open(`https://wa.me/${GRC_WHATSAPP}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C1272D] flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">GRC Importaciones</h1>
              <p className="text-xs text-gray-500">Catálogo Mayorista</p>
            </div>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-gray-50 border-gray-200"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-[360px] animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No se encontraron productos</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">{filtered.length} productos disponibles</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(p => {
                const ganancia = profit(p);
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-200"
                  >
                    {/* Image */}
                    <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-16 h-16 text-gray-200" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1 gap-3">
                      {p.category && (
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                          {p.category}
                        </span>
                      )}
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                        {p.name}
                      </h3>

                      {/* Prices */}
                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 tracking-wide">Tu precio</p>
                          <p className="text-lg font-bold text-[#C1272D]">{formatPrice(p.wholesale_price)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 tracking-wide">Precio público</p>
                          <p className="text-lg font-semibold text-gray-700">{formatPrice(p.retail_price)}</p>
                        </div>
                      </div>

                      {ganancia != null && ganancia > 0 && (
                        <div className="bg-green-50 rounded-lg px-3 py-1.5 text-center">
                          <span className="text-xs text-green-700 font-medium">
                            Ganancia estimada: {formatPrice(ganancia)}
                          </span>
                        </div>
                      )}

                      <Button
                        onClick={() => openWhatsApp(p.name)}
                        className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white gap-2 mt-1"
                        size="sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Quiero este producto
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} GRC Importaciones · Catálogo exclusivo para revendedores
      </footer>
    </div>
  );
}
