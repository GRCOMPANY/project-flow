import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
const fmt = (v: number | null) =>
  v != null ? `$${v.toLocaleString("es-CO")}` : "";

const isNewProduct = (created_at: string | null): boolean => {
  if (!created_at) return false;
  return new Date(created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
};


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
  onOrder,
}: {
  p: Product;
  onDetail: () => void;
  onOrder: () => void;
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
        <button
          onClick={(e) => { e.stopPropagation(); onOrder(); }}
          className="flex items-center justify-center w-full py-2 bg-[#C1272D] hover:bg-[#A01E22] text-white font-bold text-sm rounded-lg transition-colors opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto duration-200"
        >
          Hacer pedido
        </button>
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
  onOrder,
}: {
  products: Product[];
  onDetail: (id: string) => void;
  onOrder: (p: Product) => void;
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
              onOrder={() => onOrder(p)}
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
   ORDER MODAL
══════════════════════════════════════ */
interface TiendaOrderModalProps {
  product: Product;
  companyId: string | null;
  waNumber: string;
  storeName: string;
  onClose: () => void;
}

function TiendaOrderModal({ product, companyId, waNumber, storeName, onClose }: TiendaOrderModalProps) {
  const dbModal = supabase as any;
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const unitPrice = product.retail_price ?? 0;
  const total = unitPrice * qty;
  const fmtCOP = (v: number) => `$${v.toLocaleString("es-CO")}`;
  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C1272D] transition-colors bg-white";

  const handleConfirm = async () => {
    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) return;
    setLoading(true);

    const notesFull = [`Dirección: ${direccion.trim()}`, notas.trim()].filter(Boolean).join("\n");

    try {
      if (companyId) {
        await dbModal.from("sales").insert({
          company_id: companyId,
          product_id: product.id,
          client_name: nombre.trim(),
          client_phone: telefono.trim(),
          quantity: qty,
          unit_price: unitPrice,
          total_amount: total,
          sales_channel: "tienda_publica",
          operational_status: "nuevo",
          payment_status: "pendiente",
          order_status: "pendiente",
          sale_type: "directa",
          sale_source: "digital",
          sale_date: new Date().toISOString().split("T")[0],
          notes: notesFull,
          cost_at_sale: 0,
          margin_at_sale: 0,
          margin_percent_at_sale: 0,
          my_percentage: 100,
          partner_percentage: 0,
          my_profit_amount: 0,
          partner_profit_amount: 0,
        });
      }
    } catch (_) { /* INSERT falló — WA abre igual */ }

    const msg = `🛍 Nuevo pedido\nProducto: ${product.name ?? ""}\nCantidad: ${qty}\nTotal: ${fmtCOP(total)}\nCliente: ${nombre.trim()}\nTeléfono: ${telefono.trim()}\nDirección: ${direccion.trim()}${notas.trim() ? `\nNotas: ${notas.trim()}` : ""}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, "_blank");

    setLoading(false);
    setDone(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Handle mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Pedido recibido!</h3>
            <p className="text-gray-500 text-sm mb-6">Te contactaremos pronto para confirmar tu entrega.</p>
            <button onClick={onClose} className="w-full py-3 bg-[#C1272D] text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
              Cerrar
            </button>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hacer pedido</h3>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{product.name}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0 ml-3"
              >
                ✕
              </button>
            </div>

            {/* Resumen + cantidad */}
            <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center justify-between gap-3">
              <span className="text-sm text-gray-600 flex-1 line-clamp-1">{product.name}</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-lg font-bold transition-colors">−</button>
                <span className="w-8 text-center text-sm font-bold text-gray-900">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-lg font-bold transition-colors">+</button>
              </div>
              <span className="font-bold text-[#C1272D] flex-shrink-0">{fmtCOP(total)}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre completo *</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre completo" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Teléfono *</label>
                <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="3XX XXX XXXX" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dirección de entrega *</label>
                <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle, número, barrio, ciudad" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notas (opcional)</label>
                <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Instrucciones, color, talla..." rows={2} className={`${inputCls} resize-none`} />
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading || !nombre.trim() || !telefono.trim() || !direccion.trim()}
              className="mt-6 w-full flex items-center justify-center gap-2.5 py-4 bg-[#C1272D] text-white font-bold text-base rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                : <><WASvg /> Confirmar pedido</>
              }
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              Se abrirá WhatsApp para confirmar con {storeName}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function TiendaPublica() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    storeName,
    storeSlogan,
    logoUrl,
    instagram,
    waNumber,
  } = useStoreConfig();

  // ── Slug company lookup ──
  const { data: slugCompany, isLoading: slugLoading } = useQuery({
    queryKey: ["tienda-slug-company", slug],
    queryFn: async () => {
      const { data } = await db
        .from("companies")
        .select("id, name, wa_number, logo_url, color_primario")
        .eq("slug", slug)
        .eq("activo", true)
        .maybeSingle();
      return (data as { id: string; name: string; wa_number: string | null; logo_url: string | null; color_primario: string | null } | null) ?? null;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  // Default company cuando no hay slug (tienda principal GRC)
  const { data: defaultCompany } = useQuery({
    queryKey: ["tienda-default-company"],
    queryFn: async () => {
      const { data } = await db.from("companies").select("id, wa_number").eq("is_grc", true).maybeSingle();
      return (data as { id: string; wa_number: string | null } | null) ?? null;
    },
    enabled: !slug,
    staleTime: 10 * 60 * 1000,
  });

  // Effective brand: slug company overrides GRC defaults when present
  const effectiveName  = slug && slugCompany ? slugCompany.name : storeName;
  const effectiveWaNum = slug && slugCompany?.wa_number ? slugCompany.wa_number : waNumber;
  const effectiveLogo  = slug && slugCompany?.logo_url  ? slugCompany.logo_url  : logoUrl;

  const effectiveWaUrl = (msg: string) =>
    `https://wa.me/${effectiveWaNum}?text=${encodeURIComponent(msg)}`;

  const effectiveWaGenericUrl = effectiveWaUrl(
    `Hola ${effectiveName} 👋 Quiero ver los productos disponibles`
  );

  const effectiveCompanyId = slugCompany?.id ?? defaultCompany?.id ?? null;

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Todos");
  const [scrolled, setScrolled] = useState(false);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const catalogRef = useRef<HTMLElement>(null);

  /* Sticky header shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Queries ── */

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["tienda-products", slug ?? "default", slugCompany?.id ?? null],
    enabled: !slug || !slugLoading,
    queryFn: async () => {
      if (slug && !slugCompany) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from("products_seller_view")
        .select(
          "id, name, description, category, image_url, retail_price, wholesale_price, is_featured, status, created_at"
        )
        .eq("status", "activo")
        .order("created_at", { ascending: false });
      if (slug && slugCompany) query = query.eq("company_id", slugCompany.id);
      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as Product[]).filter((p) => p.id != null);
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: banners = [] } = useQuery({
    queryKey: ["tienda-banners", slug ?? "default", slugCompany?.id ?? null],
    enabled: !slug || !slugLoading,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = db
        .from("banners")
        .select("id, imagen_url, imagen_posicion, titulo, subtitulo, texto_boton, boton_link, activo, orden")
        .eq("activo", true)
        .order("orden", { ascending: true });
      if (slug && slugCompany) query = query.eq("company_id", slugCompany.id);
      const { data } = await query;
      return (data ?? []) as Banner[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Derive categories dynamically from loaded products
  const cats = useMemo(() => {
    const unique = [...new Set(
      products.map(p => p.category).filter((c): c is string => !!c)
    )].sort();
    return ["Todos", ...unique];
  }, [products]);

  /* ── Derived ── */

  // Hero slides: DB banners or single default slide using brand config
  const slides: Slide[] =
    banners.length > 0
      ? banners
      : [
          {
            id: "default",
            imagen_url: null,
            titulo: effectiveName,
            subtitulo: storeSlogan || null,
            texto_boton: "Ver productos",
          },
        ];

  // Build a WA href per product
  const makeWaHref = (p: Product): string =>
    effectiveWaUrl(
      `Hola ${effectiveName} 👋 Quiero el producto "${p.name ?? ""}". ¿Está disponible?\n\nDirección de entrega: ___\nPago: Contra entrega`
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

  // 404 for unknown slugs
  if (slug && !slugLoading && slugCompany === null) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center px-4 text-center">
        <Package className="w-16 h-16 text-gray-200 mb-4" />
        <h1 className="text-2xl font-black text-[#111] mb-2">Tienda no encontrada</h1>
        <p className="text-gray-400 text-sm mb-6">
          La tienda <strong>{slug}</strong> no existe o no está disponible.
        </p>
        <a
          href="/tienda"
          className="bg-[#C1272D] text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-[#A01E22] transition-colors"
        >
          Ver tienda principal
        </a>
      </div>
    );
  }

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
              href={slug ? `/tienda/${slug}` : "/tienda"}
              className="flex items-center gap-2.5 shrink-0 group"
            >
              {effectiveLogo ? (
                <img
                  src={effectiveLogo}
                  alt={effectiveName}
                  className="h-8 object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm bg-[#C1272D]">
                  {effectiveName.charAt(0)}
                </div>
              )}
              <span className="font-black text-[#111] text-sm hidden sm:block tracking-tight group-hover:text-[#C1272D] transition-colors">
                {effectiveName}
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
              href={effectiveWaGenericUrl}
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
        <HeroCarousel slides={slides} waGenericUrl={effectiveWaGenericUrl} navigate={navigate} />

        {/* ══ CATEGORY BAR ══ */}
        <nav className="bg-white border-b border-gray-100 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex gap-1 overflow-x-auto hide-scroll py-3">
              {cats.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCat(cat);
                    scrollToCatalog();
                  }}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeCat === cat
                      ? "bg-[#C1272D] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {cat}
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
                onOrder={(p) => setOrderProduct(p)}
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
                    onOrder={() => setOrderProduct(p)}
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
                {effectiveLogo ? (
                  <img src={effectiveLogo} alt={effectiveName} className="h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm bg-[#C1272D]">
                    {effectiveName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-black text-sm">{effectiveName}</p>
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
                  href={effectiveWaGenericUrl}
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
                © {new Date().getFullYear()} {effectiveName} · Todos los derechos reservados
              </p>
            </div>
          </div>
        </footer>

        {/* ══ FLOATING WA BUTTON ══ */}
        <a
          href={effectiveWaGenericUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chatear por WhatsApp"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-xl hover:bg-[#1fba59] hover:scale-110 transition-all duration-200"
        >
          <WASvg cls="w-6 h-6" />
        </a>

      </div>

      {orderProduct && (
        <TiendaOrderModal
          product={orderProduct}
          companyId={effectiveCompanyId}
          waNumber={effectiveWaNum}
          storeName={effectiveName}
          onClose={() => setOrderProduct(null)}
        />
      )}
    </>
  );
}
