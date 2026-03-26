import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Minus, Plus, Check, Truck, Shield, CreditCard, Star, MessageCircle } from "lucide-react";

const GRC_WHATSAPP = "573226421110";

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
}

/* ── Sub-components ── */

const ProductGallery = ({
  images,
  activeImage,
  onSelect,
}: {
  images: string[];
  activeImage: string;
  onSelect: (img: string) => void;
}) => (
  <div>
    <div className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-square">
      <img
        src={activeImage || "/placeholder.svg"}
        alt=""
        className="w-full h-full object-cover transition-opacity duration-300"
        loading="lazy"
      />
    </div>
    {images.length > 1 && (
      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => onSelect(img)}
            className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
              activeImage === img
                ? "border-[#C1272D] ring-1 ring-[#C1272D]"
                : "border-gray-200 opacity-60 hover:opacity-100"
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    )}
  </div>
);

const BenefitsList = () => (
  <div className="space-y-2.5">
    {[
      "Fácil de usar — sin instrucciones complicadas",
      "Resultados inmediatos desde el primer uso",
      "Alta durabilidad — materiales premium",
      "Envío seguro a todo Colombia",
    ].map((b) => (
      <div key={b} className="flex items-start gap-2.5 text-sm text-gray-700">
        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
          <Check className="w-3 h-3" />
        </span>
        {b}
      </div>
    ))}
  </div>
);

const TrustBadges = () => (
  <div className="grid grid-cols-3 gap-3 text-center">
    {[
      { icon: <Truck className="w-5 h-5" />, label: "Envío rápido" },
      { icon: <Shield className="w-5 h-5" />, label: "Garantía" },
      { icon: <CreditCard className="w-5 h-5" />, label: "Contra entrega" },
    ].map((b) => (
      <div key={b.label} className="bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-1.5">
        <span className="text-gray-500">{b.icon}</span>
        <span className="text-xs font-medium text-gray-600">{b.label}</span>
      </div>
    ))}
  </div>
);

const StarRow = () => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
    ))}
    <span className="text-sm text-gray-500 ml-1">(127 reseñas)</span>
  </div>
);

const ComparisonTable = ({ name }: { name: string }) => {
  const rows = [
    ["Difícil de limpiar", "Limpieza rápida y fácil"],
    ["Se daña rápido", "Materiales de alta durabilidad"],
    ["Resultados lentos", "Resultados desde el primer uso"],
    ["Precio alto, baja calidad", "Mejor relación precio-calidad"],
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <div className="grid grid-cols-2">
        <div className="bg-gray-100 px-4 py-3 text-sm font-bold text-gray-500 text-center">
          Método tradicional
        </div>
        <div className="bg-[#C1272D] px-4 py-3 text-sm font-bold text-white text-center">
          {name}
        </div>
      </div>
      {rows.map(([bad, good], i) => (
        <div key={i} className="grid grid-cols-2 border-t border-gray-100">
          <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
            <span className="text-red-400">✗</span> {bad}
          </div>
          <div className="px-4 py-3 text-sm text-gray-800 bg-red-50/40 flex items-center gap-2 font-medium">
            <span className="text-emerald-500">✓</span> {good}
          </div>
        </div>
      ))}
    </div>
  );
};

const TestimonialCard = ({ name, text }: { name: string; text: string }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
    <p className="text-sm text-gray-700 leading-relaxed mb-3">"{text}"</p>
    <p className="text-xs font-semibold text-gray-900">{name}</p>
    <p className="text-[10px] text-gray-400">Cliente verificado</p>
  </div>
);

const TESTIMONIALS = [
  { name: "María Rodríguez · Bogotá", text: "Llegó super rápido y funciona increíble. Ya pedí otro para mi mamá." },
  { name: "Carlos Gómez · Medellín", text: "Lo vi en TikTok y lo compré. Mejor inversión que he hecho para mi hogar." },
  { name: "Laura Martínez · Cali", text: "La calidad es impresionante por el precio. 100% recomendado, ya van 3 que compro." },
];

/* ── Main Page ── */

const ProductoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState("");
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["producto-detalle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_seller_view")
        .select("id, name, description, category, image_url, images, retail_price, is_featured, wholesale_price")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as ProductData;
    },
    enabled: !!id,
  });

  // Set initial active image once loaded
  const getAllImages = (p: ProductData) => {
    const imgs: string[] = [];
    if (p.image_url) imgs.push(p.image_url);
    if (p.images && Array.isArray(p.images)) {
      p.images.forEach((img) => {
        if (img && !imgs.includes(img)) imgs.push(img);
      });
    }
    return imgs.length > 0 ? imgs : ["/placeholder.svg"];
  };

  const allImages = product ? getAllImages(product) : [];
  const currentImage = activeImage || allImages[0] || "/placeholder.svg";

  const formatPrice = (v: number | null) =>
    v != null ? `$${v.toLocaleString("es-CO")}` : "";

  const openWhatsApp = () => {
    if (!product) return;
    const msg = encodeURIComponent(
      `Hola GRC! Quiero comprar ${quantity} unidad(es) de ${product.name}. ¿Está disponible?`
    );
    window.open(`https://wa.me/${GRC_WHATSAPP}?text=${msg}`, "_blank");
  };

  const openGenericWA = () => {
    const msg = encodeURIComponent("Hola GRC, quiero más info sobre sus productos");
    window.open(`https://wa.me/${GRC_WHATSAPP}?text=${msg}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C1272D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-lg">Producto no encontrado</p>
        <button onClick={() => navigate("/tienda")} className="text-[#C1272D] font-semibold text-sm hover:underline">
          ← Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceSubtle { 0%,88%,100%{transform:translateY(0)} 92%{transform:translateY(-8px)} 96%{transform:translateY(0)} 98%{transform:translateY(-3px)} }
        .fade-section { opacity: 0; animation: fadeIn 0.6s ease-out forwards; }
      `}</style>

      <div className="min-h-screen bg-[#F8F8F8]">
        {/* TOP BAR */}
        <div className="sticky top-0 z-50 h-8 bg-[#C1272D] flex items-center justify-center">
          <p className="text-white text-xs font-medium tracking-wide">
            🚚 Envío gratis a todo Colombia — Pago contra entrega disponible
          </p>
        </div>

        {/* HEADER */}
        <header className="sticky top-8 z-40 bg-[#111111] shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img src="/logo-grc.png" alt="GRC" className="h-10 object-contain" />
              <span className="hidden sm:block text-white font-bold text-lg">GRC Importaciones</span>
            </div>
            <button
              onClick={openGenericWA}
              className="bg-[#C1272D] hover:bg-[#a01f25] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Comprar por WhatsApp →
            </button>
          </div>
        </header>

        {/* ── SECTION 1: HERO ── */}
        <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12 fade-section" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: Gallery */}
            <ProductGallery images={allImages} activeImage={currentImage} onSelect={setActiveImage} />

            {/* Right: Info */}
            <div className="flex flex-col gap-4">
              {product.is_featured && (
                <span className="self-start bg-[#C1272D] text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  🔥 Más vendido en Colombia
                </span>
              )}

              {product.category && (
                <span className="self-start text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                  {product.category}
                </span>
              )}

              <h1 className="text-3xl sm:text-4xl font-bold text-[#111111] leading-tight">
                {product.name}
              </h1>

              <StarRow />

              <p className="text-4xl sm:text-5xl font-extrabold text-[#C1272D]">
                {formatPrice(product.retail_price)}
              </p>

              <p className="text-emerald-600 text-sm font-medium">
                ✓ Disponible · Entrega hoy en Bogotá
              </p>

              {product.description && (
                <p className="text-gray-500 text-sm leading-relaxed">{product.description}</p>
              )}

              <BenefitsList />

              {/* Quantity */}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm font-semibold text-gray-700">Cantidad:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="font-bold text-xl w-8 text-center text-[#111111]">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* CTAs */}
              <button
                onClick={openWhatsApp}
                className="w-full bg-[#C1272D] hover:bg-[#a01f25] text-white font-bold text-lg py-4 rounded-xl transition-colors shadow-lg shadow-red-200/40"
              >
                COMPRAR AHORA
              </button>

              <button
                onClick={openWhatsApp}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-base py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Comprar por WhatsApp
              </button>

              <TrustBadges />
            </div>
          </div>
        </section>

        {/* ── SECTION 2: EL PROBLEMA ── */}
        <section className="bg-white py-14 px-4 fade-section" style={{ animationDelay: "0.2s" }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] mb-4">
              ¿Buscas una solución práctica para tu hogar?
            </h2>
            <p className="text-gray-500 leading-relaxed text-sm sm:text-base mb-3">
              Sabemos lo frustrante que es gastar dinero en productos que no cumplen lo que prometen.
              Productos que se dañan rápido, que no funcionan como en las fotos, o que simplemente no valen lo que cuestan.
            </p>
            <p className="text-gray-500 leading-relaxed text-sm sm:text-base">
              Mereces productos que funcionen desde el primer día, que duren, y que te hagan la vida más fácil.
              Por eso seleccionamos solo lo mejor.
            </p>
          </div>
        </section>

        {/* ── SECTION 3: LA SOLUCIÓN ── */}
        <section className="py-14 px-4 fade-section" style={{ animationDelay: "0.3s" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] text-center mb-10">
              La solución que estabas buscando
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { emoji: "⚡", title: "Funciona al instante", desc: "Sin configuraciones complicadas. Lo sacas de la caja y listo." },
                { emoji: "🛡️", title: "Calidad garantizada", desc: "Materiales premium con garantía incluida. Si no funciona, lo resolvemos." },
                { emoji: "🚀", title: "Entrega rápida", desc: "Recibe tu pedido el mismo día en Bogotá o en 1-3 días a nivel nacional." },
              ].map((b) => (
                <div key={b.title} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                  <div className="text-4xl mb-4">{b.emoji}</div>
                  <h3 className="font-bold text-[#111111] text-lg mb-2">{b.title}</h3>
                  <p className="text-gray-500 text-sm">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 4: COMPARACIÓN ── */}
        <section className="bg-white py-14 px-4 fade-section" style={{ animationDelay: "0.4s" }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] text-center mb-8">
              ¿Por qué elegir {product.name}?
            </h2>
            <ComparisonTable name={product.name ?? "Producto GRC"} />
          </div>
        </section>

        {/* ── SECTION 5: GALERÍA / DEMO ── */}
        {allImages.length > 1 && (
          <section className="py-14 px-4 fade-section" style={{ animationDelay: "0.5s" }}>
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] text-center mb-8">
                Míralo en acción
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {allImages.slice(0, 6).map((img, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden aspect-square bg-gray-100">
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION 6: TESTIMONIOS ── */}
        <section className="bg-white py-14 px-4 fade-section" style={{ animationDelay: "0.6s" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] text-center mb-8">
              Miles de hogares ya lo están usando
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <TestimonialCard key={t.name} {...t} />
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 7: CTA FINAL ── */}
        <section className="bg-[#C1272D] py-14 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-white font-bold text-2xl sm:text-3xl mb-3">
              Oferta especial por tiempo limitado
            </h2>
            <p className="text-5xl sm:text-6xl font-extrabold text-white mb-2">
              {formatPrice(product.retail_price)}
            </p>
            <p className="text-white/70 text-sm mb-6">
              ⏳ Últimas unidades disponibles · Envío gratis
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                onClick={openWhatsApp}
                className="flex-1 bg-[#8B1A22] hover:bg-[#6e1419] text-white font-bold py-4 rounded-xl transition-colors text-base"
              >
                Comprar ahora
              </button>
              <button
                onClick={openWhatsApp}
                className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#111111] py-10">
          <div className="max-w-5xl mx-auto px-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-3">
              <img src="/logo-grc.png" alt="GRC" className="h-10 object-contain" />
              <span className="text-white font-bold text-lg">GRC Importaciones</span>
            </div>
            <p className="text-gray-400 text-sm">📍 Bogotá, Colombia · 📲 +57 322 642 1110</p>
            <p className="text-gray-500 text-xs mt-2">© 2026 GRC Importaciones · Todos los derechos reservados</p>
          </div>
        </footer>

        {/* FLOATING WHATSAPP */}
        <a
          href={`https://wa.me/${GRC_WHATSAPP}?text=${encodeURIComponent("Hola GRC, quiero más info sobre sus productos")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed z-[999] group"
          style={{ bottom: 24, right: 24 }}
        >
          <span className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Comprar por WhatsApp
          </span>
          <div
            className="w-[60px] h-[60px] rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.5)]"
            style={{ animation: "bounceSubtle 4s infinite" }}
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
        </a>

        {/* STICKY CTA MOBILE */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 flex items-center gap-3 sm:hidden">
          <div className="flex-1">
            <p className="font-bold text-[#C1272D] text-lg">{formatPrice(product.retail_price)}</p>
            <p className="text-[10px] text-gray-400">Envío gratis</p>
          </div>
          <button
            onClick={openWhatsApp}
            className="bg-[#C1272D] hover:bg-[#a01f25] text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            Comprar ahora
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductoDetalle;
