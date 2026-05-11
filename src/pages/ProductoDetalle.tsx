import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { ArrowLeft, Package, Instagram, Star } from "lucide-react";

const fmt = (v: number | null) => (v != null ? `$${v.toLocaleString("es-CO")}` : "");
const db = supabase as any;

/* ─── Types ──────────────────────────────────────────────────── */
interface ProductData {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  images: string[] | null;
  retail_price: number | null;
  is_featured: boolean | null;
  wholesale_price: number | null;
  sku: string | null;
  delivery_type: string | null;
  company_id: string | null;
}

interface RelatedProduct {
  id: string;
  name: string;
  image_url: string | null;
  retail_price: number | null;
  category: string | null;
}

interface ProductVideo {
  id: string;
  video_url: string;
  titulo: string | null;
  activo: boolean;
  orden: number;
}

interface Testimonio {
  id: string;
  nombre: string;
  texto: string;
  calificacion: number | null;
  ciudad: string | null;
}

/* ─── WA SVG ─────────────────────────────────────────────────── */
const WASvg = ({ cls = "w-5 h-5" }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={`${cls} fill-current flex-shrink-0`}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ─── Stars ──────────────────────────────────────────────────── */
const Stars = ({ n }: { n: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i < n ? "fill-[#C1272D] text-[#C1272D]" : "text-gray-200"}`}
      />
    ))}
  </div>
);

/* ─── Gallery ────────────────────────────────────────────────── */
const Gallery = ({
  images,
  videoUrl,
  productName,
}: {
  images: string[];
  videoUrl: string | null;
  productName: string;
}) => {
  const [activeImg, setActiveImg] = useState(images[0] ?? "/placeholder.svg");
  const [tab, setTab] = useState<"photo" | "video">("photo");
  const [fading, setFading] = useState(false);

  const changeImg = (src: string) => {
    if (src === activeImg) return;
    setFading(true);
    setTimeout(() => { setActiveImg(src); setFading(false); }, 160);
  };

  return (
    <div className="space-y-3">
      {videoUrl && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {(["photo", "video"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? "bg-white text-[#C1272D] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "photo" ? "📷 Fotos" : "▶ Video"}
            </button>
          ))}
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden aspect-square flex items-center justify-center"
        style={{ background: "#F5F5F5" }}
      >
        {tab === "video" && videoUrl ? (
          <video src={videoUrl} className="w-full h-full object-cover" controls autoPlay playsInline />
        ) : (
          <img
            src={activeImg}
            alt={productName}
            className={`w-full h-full object-contain transition-opacity duration-150 ${fading ? "opacity-0" : "opacity-100"}`}
          />
        )}
      </div>

      {images.length > 1 && tab === "photo" && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => changeImg(img)}
              className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all"
              style={{
                borderColor: activeImg === img ? "#C1272D" : "transparent",
                background: "#F5F5F5",
              }}
            >
              <img src={img} alt="" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Loading skeleton ───────────────────────────────────────── */
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-white">
    <div className="h-9 bg-[#C1272D]" />
    <div className="h-14 bg-white border-b border-gray-100" />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid lg:grid-cols-[55%_45%] gap-14 items-start">
        <div className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
        <div className="space-y-5 pt-2">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-7 w-24 bg-gray-100 rounded-full animate-pulse" />)}
          </div>
          <div className="h-10 w-3/4 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-14 w-2/5 bg-gray-100 rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-px bg-gray-100" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />)}
          </div>
          <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

/* ─── Order Modal ────────────────────────────────────────────── */
interface OrderModalProps {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  companyId: string | null;
  waNumber: string;
  storeName: string;
  onClose: () => void;
}

function OrderModal({ productId, productName, unitPrice, quantity, companyId, waNumber, storeName, onClose }: OrderModalProps) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const total = unitPrice * quantity;
  const fmtCOP = (v: number) => `$${v.toLocaleString("es-CO")}`;
  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C1272D] transition-colors bg-white";

  const handleConfirm = async () => {
    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) return;
    setLoading(true);

    const notesFull = [`Dirección: ${direccion.trim()}`, notas.trim()].filter(Boolean).join("\n");

    try {
      if (companyId) {
        await db.from("sales").insert({
          company_id: companyId,
          product_id: productId,
          client_name: nombre.trim(),
          client_phone: telefono.trim(),
          quantity,
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

    const msg = `🛍 Nuevo pedido\nProducto: ${productName}\nCantidad: ${quantity}\nTotal: ${fmtCOP(total)}\nCliente: ${nombre.trim()}\nTeléfono: ${telefono.trim()}\nDirección: ${direccion.trim()}${notas.trim() ? `\nNotas: ${notas.trim()}` : ""}`;
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
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{productName}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0 ml-3"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center justify-between">
              <span className="text-sm text-gray-600">{quantity}× {productName}</span>
              <span className="font-bold text-[#C1272D]">{fmtCOP(total)}</span>
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

/* ─── Main ───────────────────────────────────────────────────── */
export default function ProductoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { storeName, storeSlogan, logoUrl, instagram, waGenericUrl, waUrl, get } =
    useStoreConfig();

  const [qty, setQty] = useState(1);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  /* ── Queries ── */
  const { data: product, isLoading } = useQuery({
    queryKey: ["producto-detalle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_seller_view")
        .select("id, name, description, category, image_url, images, retail_price, is_featured, wholesale_price, sku, delivery_type, company_id")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as ProductData;
    },
    enabled: !!id,
  });

  const { data: galleryVideoUrl = null } = useQuery({
    queryKey: ["producto-gallery-video", id],
    queryFn: async () => {
      const { data: creative } = await supabase
        .from("creatives")
        .select("video_url")
        .eq("product_id", id!)
        .not("video_url", "is", null)
        .eq("status", "publicado")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (creative?.video_url) return creative.video_url as string;
      const { data: pv } = await db
        .from("product_videos")
        .select("video_url")
        .eq("product_id", id!)
        .eq("activo", true)
        .order("orden", { ascending: true })
        .limit(1)
        .maybeSingle();
      return (pv?.video_url as string) ?? null;
    },
    enabled: !!id,
  });

  const { data: productVideos = [] } = useQuery({
    queryKey: ["producto-videos", id],
    queryFn: async () => {
      const { data } = await db
        .from("product_videos")
        .select("id, video_url, titulo, activo, orden")
        .eq("product_id", id!)
        .eq("activo", true)
        .order("orden", { ascending: true })
        .limit(3);
      return (data ?? []) as ProductVideo[];
    },
    enabled: !!id,
  });

  const { data: testimonios = [] } = useQuery({
    queryKey: ["producto-testimonios", id],
    queryFn: async () => {
      const { data } = await db
        .from("testimonios")
        .select("id, nombre, texto, calificacion, ciudad")
        .eq("product_id", id!)
        .eq("activo", true)
        .order("created_at", { ascending: false })
        .limit(6);
      return (data ?? []) as Testimonio[];
    },
    enabled: !!id,
  });

  const { data: orderCompany } = useQuery({
    queryKey: ["producto-order-company", product?.company_id],
    queryFn: async () => {
      const { data } = await db.from("companies").select("id, wa_number").eq("id", product!.company_id!).maybeSingle();
      return (data as { id: string; wa_number: string | null } | null) ?? null;
    },
    enabled: !!product?.company_id,
    staleTime: 10 * 60 * 1000,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["producto-related", id, product?.category],
    queryFn: async () => {
      const base = db
        .from("products_seller_view")
        .select("id, name, image_url, retail_price, category")
        .neq("id", id!);
      const { data } = await (
        product?.category ? base.eq("category", product.category) : base
      ).limit(4);
      return (data ?? []) as RelatedProduct[];
    },
    enabled: !!id && !!product,
  });

  /* ── Derived ── */
  const allImages = (() => {
    if (!product) return ["/placeholder.svg"];
    const imgs: string[] = [];
    if (product.image_url) imgs.push(product.image_url);
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => { if (img && !imgs.includes(img)) imgs.push(img); });
    }
    return imgs.length > 0 ? imgs : ["/placeholder.svg"];
  })();

  const unitPrice = product?.retail_price ?? null;
  const totalPrice = unitPrice !== null ? unitPrice * qty : null;

  /* Store-config driven content — always has values from BRAND_DEFAULTS */
  const topbarTexto    = get("topbar_texto");
  const garantias      = [get("garantia_1"), get("garantia_2"), get("garantia_3")];
  const badges         = [get("badge_1"), get("badge_2"), get("badge_3")].filter(Boolean);
  const caracteristicas = [1, 2, 3, 4, 5, 6].map((i) => {
    const raw = get(`caracteristica_${i}` as any);
    const [titulo, sub] = raw.split("||");
    return { titulo: titulo?.trim() || "", sub: sub?.trim() || "" };
  });
  const storyTitulo    = get("story_titulo");
  const storyTexto     = get("story_texto");

  const openWA = () => {
    if (!product) return;
    window.open(waUrl(`Hola, quiero ${qty}x ${product.name} a ${fmt(unitPrice)}`), "_blank");
  };

  const openQuestion = () => {
    if (!product) return;
    window.open(waUrl(`Hola, tengo una pregunta sobre el producto "${product.name}"`), "_blank");
  };

  const orderWaNumber = orderCompany?.wa_number ?? waNumber;

  /* ── Guards ── */
  if (isLoading) return <LoadingSkeleton />;

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Package className="w-16 h-16 text-gray-200" />
        <p className="font-bold text-xl text-gray-900">Producto no encontrado</p>
        <button
          onClick={() => navigate("/tienda")}
          className="text-sm font-semibold text-[#C1272D] hover:underline"
        >
          ← Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">

      {/* ── Top bar ── */}
      <div className="bg-[#C1272D] text-white text-xs font-semibold text-center py-2 px-4 tracking-wide">
        {topbarTexto}
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <a href="/tienda" className="flex items-center gap-2.5">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#C1272D] flex items-center justify-center text-white font-black text-xs">
                  {storeName.charAt(0)}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="font-black text-gray-900 text-sm leading-none">{storeName}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#C1272D]">{storeSlogan}</p>
              </div>
            </a>
          </div>
          <a
            href={waGenericUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-bold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            <WASvg cls="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECCIÓN 1 — HERO (55/45)                             */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
        <div className="grid lg:grid-cols-[55%_45%] gap-10 lg:gap-16 items-start">

          {/* Galería */}
          <Gallery images={allImages} videoUrl={galleryVideoUrl} productName={product.name} />

          {/* Info */}
          <div className="space-y-5">

            {/* Badge pills */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {badges.map((b, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700"
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}

            {/* Categoría */}
            {product.category && (
              <p className="text-xs font-bold uppercase tracking-widest text-[#C1272D]">
                {product.category}
              </p>
            )}

            {/* Nombre */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Precio */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black" style={{ color: "#C1272D" }}>
                {fmt(unitPrice)}
              </span>
              {qty > 1 && (
                <span className="text-base font-semibold text-gray-500">
                  Total: {fmt(totalPrice)}
                </span>
              )}
            </div>

            {/* Descripción */}
            {product.description && (
              <p className="text-gray-600 leading-relaxed text-[15px]">{product.description}</p>
            )}

            <div className="h-px bg-gray-100" />

            {/* Garantías — siempre visibles desde store_config */}
            <ul className="space-y-2.5">
              {garantias.map((g, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="font-black text-[#C1272D] flex-shrink-0">✓</span>
                  {g}
                </li>
              ))}
            </ul>

            {/* Cantidad */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600">Cantidad:</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold transition-colors"
                >
                  −
                </button>
                <span className="w-10 text-center font-bold text-gray-900 text-sm">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 pt-1">
              <button
                onClick={() => setOrderModalOpen(true)}
                className="w-full flex items-center justify-center gap-2.5 text-white font-bold text-base py-4 rounded-2xl hover:opacity-90 transition-opacity"
                style={{ background: "#C1272D" }}
              >
                Hacer pedido
              </button>
              <button
                onClick={openQuestion}
                className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold text-sm py-3.5 rounded-2xl hover:border-gray-400 transition-colors"
              >
                Hacer una pregunta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECCIÓN 2 — STORYTELLING (siempre visible)           */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="bg-[#0a0a0a] py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-snug">
            {storyTitulo}
          </p>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            {storyTexto}
          </p>
          <div className="inline-block w-12 h-0.5 bg-[#C1272D]" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECCIÓN 3 — CARACTERÍSTICAS (siempre visible)        */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Por qué elegir este producto
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {caracteristicas.map((c, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-gray-100 hover:border-[#C1272D]/20 hover:shadow-sm transition-all"
              >
                <p className="font-bold text-gray-900 text-sm leading-snug mb-1">{c.titulo}</p>
                {c.sub && <p className="text-xs text-gray-500 leading-relaxed">{c.sub}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECCIÓN 4 — VIDEOS (solo si hay datos)               */}
      {/* ══════════════════════════════════════════════════════ */}
      {productVideos.length > 0 && (
        <section className="bg-[#f5f5f5] py-16 px-4">
          <div className="max-w-5xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Ve el producto en acción
            </h2>
            <div
              className={`grid gap-4 mx-auto ${
                productVideos.length === 1
                  ? "grid-cols-1 max-w-[200px]"
                  : productVideos.length === 2
                  ? "grid-cols-2 max-w-sm"
                  : "grid-cols-3 max-w-lg"
              }`}
            >
              {productVideos.map((vid) => (
                <div
                  key={vid.id}
                  className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-lg"
                >
                  <video
                    src={vid.video_url}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                    loop
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECCIÓN 5 — TESTIMONIOS (solo si hay datos)          */}
      {/* ══════════════════════════════════════════════════════ */}
      {testimonios.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
              Lo que dicen nuestros clientes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonios.map((t) => (
                <div key={t.id} className="p-5 rounded-2xl border border-gray-100 space-y-3">
                  {t.calificacion != null && <Stars n={t.calificacion} />}
                  <p className="text-gray-700 text-sm leading-relaxed">"{t.texto}"</p>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.nombre}</p>
                    {t.ciudad && <p className="text-xs text-gray-400">{t.ciudad}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECCIÓN 6 — RELACIONADOS                             */}
      {/* ══════════════════════════════════════════════════════ */}
      {related.length > 0 && (
        <section className="bg-[#f5f5f5] py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              También te puede gustar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform shadow-sm"
                >
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{p.name}</p>
                    <p className="font-bold text-[#C1272D]">{fmt(p.retail_price)}</p>
                    <button
                      onClick={() => { navigate(`/producto/${p.id}`); window.scrollTo(0, 0); }}
                      className="w-full text-xs font-bold text-[#C1272D] border border-[#C1272D]/30 hover:bg-[#C1272D] hover:text-white py-1.5 rounded-lg transition-colors"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="bg-gray-900 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#C1272D] flex items-center justify-center text-white font-black text-xs">
                {storeName.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-black text-white text-sm leading-none">{storeName}</p>
              <p className="text-gray-500 text-xs">{storeSlogan}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {instagram && (
              <a
                href={`https://instagram.com/${instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            <a
              href={waGenericUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <WASvg cls="w-4 h-4" />
            </a>
          </div>
          <p className="text-gray-500 text-xs">© 2026 {storeName}</p>
        </div>
      </footer>

      {/* ── Mobile sticky CTA ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3"
        style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 text-sm leading-none truncate">
            {fmt(totalPrice ?? unitPrice)}
          </p>
          {qty > 1 && <p className="text-xs text-gray-400 mt-0.5">{qty} unidades</p>}
        </div>
        <button
          onClick={() => setOrderModalOpen(true)}
          className="flex items-center gap-2 text-white font-bold text-sm px-5 py-3 rounded-xl hover:opacity-90 transition-opacity flex-shrink-0"
          style={{ background: "#C1272D" }}
        >
          Hacer pedido
        </button>
      </div>

      {/* ── Floating WA desktop ── */}
      <a
        href={waGenericUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 hidden lg:flex w-14 h-14 rounded-full items-center justify-center text-white shadow-xl hover:scale-110 transition-transform"
        style={{ background: "#25D366" }}
        title="WhatsApp"
      >
        <WASvg cls="w-6 h-6" />
      </a>

      {orderModalOpen && product && (
        <OrderModal
          productId={product.id}
          productName={product.name}
          unitPrice={product.retail_price ?? 0}
          quantity={qty}
          companyId={product.company_id ?? null}
          waNumber={orderWaNumber}
          storeName={storeName}
          onClose={() => setOrderModalOpen(false)}
        />
      )}
    </div>
  );
}
