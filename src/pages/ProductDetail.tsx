import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useCreatives } from '@/hooks/useCreatives';
import { useAuth } from '@/contexts/AuthContext';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductCreativesTab } from '@/components/products/ProductCreativesTab';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Edit2, Trash2, Package, TrendingUp, DollarSign,
  Clock, Image as ImageIcon, Sparkles, ShoppingCart, Send,
  ListTodo, Percent, Star, AlertTriangle, Wallet,
  Loader2, Globe, Video, MessageSquare, Shield, ToggleLeft, ToggleRight,
  CheckCircle, X, Plus, Trash
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const db = supabase as any;

/* ─── Página Pública Tab ─────────────────────────────────── */
const STORE_KEYS = [
  "garantia_1","garantia_2","garantia_3",
  "badge_1","badge_2","badge_3",
  "caracteristica_1","caracteristica_2","caracteristica_3",
  "caracteristica_4","caracteristica_5","caracteristica_6",
];

const PaginaPublicaTab = ({ productId }: { productId: string }) => {
  const qc = useQueryClient();
  type SubTab = "garantias" | "badges" | "caracteristicas" | "videos" | "testimonios";
  const [subTab, setSubTab] = useState<SubTab>("garantias");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  /* store_config values */
  const [garantias, setGarantias] = useState(["","",""]);
  const [badges, setBadges] = useState(["","",""]);
  const [chars, setChars] = useState(
    Array.from({length:6}, () => ({ titulo: "", sub: "" }))
  );

  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["admin-store-config-pagina"],
    queryFn: async () => {
      const { data } = await db.from("store_config").select("clave,valor").in("clave", STORE_KEYS);
      const map: Record<string,string> = {};
      (data ?? []).forEach((r: any) => { map[r.clave] = r.valor; });
      return map;
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (!configData) return;
    setGarantias([
      configData["garantia_1"] ?? "",
      configData["garantia_2"] ?? "",
      configData["garantia_3"] ?? "",
    ]);
    setBadges([
      configData["badge_1"] ?? "",
      configData["badge_2"] ?? "",
      configData["badge_3"] ?? "",
    ]);
    setChars(Array.from({length:6}, (_,i) => {
      const raw = configData[`caracteristica_${i+1}`] ?? "";
      const [titulo, sub] = raw.split("||");
      return { titulo: titulo?.trim() ?? "", sub: sub?.trim() ?? "" };
    }));
  }, [configData]);

  const upsertConfig = (clave: string, valor: string) =>
    db.from("store_config").upsert({ clave, valor }, { onConflict: "clave" });

  const flash = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 2500); };

  const saveGarantias = async () => {
    setSaving(true);
    await Promise.all(garantias.map((v, i) => upsertConfig(`garantia_${i+1}`, v)));
    qc.invalidateQueries({ queryKey: ["store-brand-config"] });
    setSaving(false); flash("Garantías guardadas");
  };

  const saveBadges = async () => {
    setSaving(true);
    await Promise.all(badges.map((v, i) => upsertConfig(`badge_${i+1}`, v)));
    qc.invalidateQueries({ queryKey: ["store-brand-config"] });
    setSaving(false); flash("Badges guardados");
  };

  const saveChars = async () => {
    setSaving(true);
    await Promise.all(chars.map((c, i) => upsertConfig(`caracteristica_${i+1}`, `${c.titulo}||${c.sub}`)));
    qc.invalidateQueries({ queryKey: ["store-brand-config"] });
    setSaving(false); flash("Características guardadas");
  };

  /* Videos */
  const [videoSlots, setVideoSlots] = useState([
    { id: null as string | null, video_url: "", activo: true },
    { id: null as string | null, video_url: "", activo: true },
    { id: null as string | null, video_url: "", activo: true },
  ]);
  const [videoInit, setVideoInit] = useState(false);

  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ["admin-product-videos", productId],
    queryFn: async () => {
      const { data } = await db.from("product_videos")
        .select("id, video_url, activo, orden")
        .eq("product_id", productId)
        .order("orden", { ascending: true });
      return (data ?? []) as { id: string; video_url: string; activo: boolean; orden: number }[];
    },
  });

  useEffect(() => {
    if (videosData && !videoInit) {
      setVideoSlots(Array.from({length:3}, (_,i) => ({
        id: videosData[i]?.id ?? null,
        video_url: videosData[i]?.video_url ?? "",
        activo: videosData[i]?.activo ?? true,
      })));
      setVideoInit(true);
    }
  }, [videosData, videoInit]);

  const saveVideos = async () => {
    setSaving(true);
    await db.from("product_videos").delete().eq("product_id", productId);
    const toInsert = videoSlots
      .filter(s => s.video_url.trim())
      .map((s, i) => ({ product_id: productId, video_url: s.video_url.trim(), activo: s.activo, orden: i }));
    if (toInsert.length > 0) await db.from("product_videos").insert(toInsert);
    qc.invalidateQueries({ queryKey: ["producto-videos", productId] });
    qc.invalidateQueries({ queryKey: ["producto-gallery-video", productId] });
    setVideoInit(false);
    setSaving(false); flash("Videos guardados");
  };

  /* Testimonios */
  const [tForm, setTForm] = useState({ nombre: "", texto: "", calificacion: 5, ciudad: "" });
  const [addingT, setAddingT] = useState(false);

  const { data: testimoniosData = [], isLoading: tLoading } = useQuery({
    queryKey: ["admin-product-testimonios", productId],
    queryFn: async () => {
      const { data } = await db.from("testimonios")
        .select("id, nombre, texto, calificacion, ciudad, activo, created_at")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      return (data ?? []) as { id: string; nombre: string; texto: string; calificacion: number | null; ciudad: string | null; activo: boolean; created_at: string }[];
    },
  });

  const addTestimonio = async () => {
    if (!tForm.nombre.trim() || !tForm.texto.trim()) return;
    setAddingT(true);
    await db.from("testimonios").insert({
      product_id: productId,
      nombre: tForm.nombre.trim(),
      texto: tForm.texto.trim(),
      calificacion: tForm.calificacion,
      ciudad: tForm.ciudad.trim() || null,
      activo: true,
    });
    qc.invalidateQueries({ queryKey: ["admin-product-testimonios", productId] });
    qc.invalidateQueries({ queryKey: ["producto-testimonios", productId] });
    setTForm({ nombre: "", texto: "", calificacion: 5, ciudad: "" });
    setAddingT(false); flash("Testimonio agregado");
  };

  const deleteTestimonio = async (tid: string) => {
    await db.from("testimonios").delete().eq("id", tid);
    qc.invalidateQueries({ queryKey: ["admin-product-testimonios", productId] });
    qc.invalidateQueries({ queryKey: ["producto-testimonios", productId] });
  };

  const toggleTestimonio = async (tid: string, activo: boolean) => {
    await db.from("testimonios").update({ activo }).eq("id", tid);
    qc.invalidateQueries({ queryKey: ["admin-product-testimonios", productId] });
    qc.invalidateQueries({ queryKey: ["producto-testimonios", productId] });
  };

  /* Shared save button */
  const SaveBtn = ({ onClick }: { onClick: () => void }) => (
    <div className="flex items-center gap-3 pt-1">
      <Button onClick={onClick} disabled={saving} className="gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        Guardar
      </Button>
      {msg && <span className="text-sm text-green-600 font-medium">{msg}</span>}
    </div>
  );

  const inputCls = "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary bg-background";

  const subTabs: { key: SubTab; label: string; icon: React.ReactNode }[] = [
    { key: "garantias",      label: "Garantías",      icon: <Shield className="w-3.5 h-3.5" /> },
    { key: "badges",         label: "Badges",          icon: <CheckCircle className="w-3.5 h-3.5" /> },
    { key: "caracteristicas",label: "Características", icon: <Globe className="w-3.5 h-3.5" /> },
    { key: "videos",         label: "Videos",          icon: <Video className="w-3.5 h-3.5" /> },
    { key: "testimonios",    label: "Testimonios",     icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab navigation */}
      <div className="flex flex-wrap gap-2">
        {subTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              subTab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Garantías ── */}
      {subTab === "garantias" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" /> Garantías del producto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {configLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Se muestran en la página pública debajo de la descripción.</p>
                {garantias.map((g, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary w-4">{i+1}</span>
                    <input
                      type="text"
                      value={g}
                      onChange={e => setGarantias(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                      placeholder={`Garantía ${i+1}`}
                      className={inputCls}
                    />
                  </div>
                ))}
                <SaveBtn onClick={saveGarantias} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Badges ── */}
      {subTab === "badges" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Badges / etiquetas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {configLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Pills que aparecen arriba del nombre del producto. Puedes usar emojis.</p>
                {badges.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary w-4">{i+1}</span>
                    <input
                      type="text"
                      value={b}
                      onChange={e => setBadges(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                      placeholder={`Badge ${i+1} (ej: 🚚 Envío gratis)`}
                      className={inputCls}
                    />
                  </div>
                ))}
                <SaveBtn onClick={saveBadges} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Características ── */}
      {subTab === "caracteristicas" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4" /> Características del producto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {configLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Cuadrícula 2×3 en la página pública. Puedes usar emojis en el título.</p>
                {chars.map((c, i) => (
                  <div key={i} className="p-3 bg-secondary rounded-lg space-y-2">
                    <span className="text-xs font-bold text-muted-foreground">Característica {i+1}</span>
                    <input
                      type="text"
                      value={c.titulo}
                      onChange={e => setChars(prev => prev.map((v,j) => j===i ? {...v, titulo: e.target.value} : v))}
                      placeholder="Título (ej: 🎯 Diseño ergonómico)"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={c.sub}
                      onChange={e => setChars(prev => prev.map((v,j) => j===i ? {...v, sub: e.target.value} : v))}
                      placeholder="Subtítulo (ej: Pensado para tu comodidad)"
                      className={inputCls}
                    />
                  </div>
                ))}
                <SaveBtn onClick={saveChars} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Videos ── */}
      {subTab === "videos" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="w-4 h-4" /> Videos del producto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Hasta 3 videos verticales (9:16). Pega la URL directa del video (.mp4, etc.).
            </p>
            {videosLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              videoSlots.map((slot, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-secondary rounded-xl">
                  <span className="text-xs font-bold text-muted-foreground w-5 text-center flex-shrink-0">{i+1}</span>
                  <input
                    type="url"
                    value={slot.video_url}
                    onChange={e => setVideoSlots(prev => prev.map((s,j) => j===i ? {...s, video_url: e.target.value} : s))}
                    placeholder="https://... (URL del video)"
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => setVideoSlots(prev => prev.map((s,j) => j===i ? {...s, activo: !s.activo} : s))}
                    title={slot.activo ? "Activo" : "Inactivo"}
                  >
                    {slot.activo
                      ? <ToggleRight className="w-7 h-7 text-primary" />
                      : <ToggleLeft className="w-7 h-7 text-muted-foreground" />
                    }
                  </button>
                </div>
              ))
            )}
            <SaveBtn onClick={saveVideos} />
          </CardContent>
        </Card>
      )}

      {/* ── Testimonios ── */}
      {subTab === "testimonios" && (
        <div className="space-y-4">
          {/* Add form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4" /> Agregar testimonio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={tForm.nombre}
                    onChange={e => setTForm(f => ({...f, nombre: e.target.value}))}
                    placeholder="María García"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={tForm.ciudad}
                    onChange={e => setTForm(f => ({...f, ciudad: e.target.value}))}
                    placeholder="Bogotá"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Calificación</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setTForm(f => ({...f, calificacion: n}))}
                      className={`text-xl transition-transform hover:scale-110 ${n <= tForm.calificacion ? "opacity-100" : "opacity-30"}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Testimonio *</label>
                <textarea
                  value={tForm.texto}
                  onChange={e => setTForm(f => ({...f, texto: e.target.value}))}
                  rows={3}
                  placeholder="Excelente producto, llegó rápido..."
                  className={`${inputCls} resize-none`}
                />
              </div>
              <Button
                onClick={addTestimonio}
                disabled={addingT || !tForm.nombre.trim() || !tForm.texto.trim()}
                size="sm"
                className="gap-2"
              >
                {addingT && <Loader2 className="w-3 h-3 animate-spin" />}
                Agregar
              </Button>
              {msg && <span className="text-sm text-green-600 font-medium">{msg}</span>}
            </CardContent>
          </Card>

          {/* List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Testimonios ({testimoniosData.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : testimoniosData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin testimonios aún.</p>
              ) : (
                testimoniosData.map(t => (
                  <div key={t.id} className="p-3 bg-secondary rounded-xl space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{t.nombre}</span>
                          {t.ciudad && <span className="text-xs text-muted-foreground">{t.ciudad}</span>}
                          {t.calificacion != null && (
                            <span className="text-xs">{"⭐".repeat(t.calificacion)}</span>
                          )}
                          <Badge variant={t.activo ? "default" : "secondary"} className="text-xs">
                            {t.activo ? "Visible" : "Oculto"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">"{t.texto}"</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleTestimonio(t.id, !t.activo)}
                          title={t.activo ? "Ocultar" : "Mostrar"}
                          className="p-1 rounded hover:bg-background transition-colors"
                        >
                          {t.activo
                            ? <ToggleRight className="w-5 h-5 text-primary" />
                            : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                          }
                        </button>
                        <button
                          onClick={() => deleteTestimonio(t.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
                          title="Eliminar"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { products, loading: productsLoading, updateProduct, deleteProduct, uploadProductImage, checkSkuAvailable } = useProducts();
  const { sales } = useSales();
  const { creatives } = useCreatives();
  
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const product = products.find(p => p.id === id);

  // Calculate metrics
  const productSales = sales.filter(s => s.productId === id);
  const productCreatives = creatives.filter(c => c.productId === id);
  
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  
  const salesLast7Days = productSales
    .filter(s => new Date(s.saleDate).getTime() > sevenDaysAgo)
    .reduce((sum, s) => sum + s.quantity, 0);
  
  const salesLast30Days = productSales
    .filter(s => new Date(s.saleDate).getTime() > thirtyDaysAgo)
    .reduce((sum, s) => sum + s.quantity, 0);

  const revenueGenerated = productSales
    .filter(s => s.paymentStatus === 'pagado')
    .reduce((sum, s) => sum + s.totalAmount, 0);
  
  const pendingToCollect = productSales
    .filter(s => s.paymentStatus === 'pendiente')
    .reduce((sum, s) => sum + s.totalAmount, 0);

  // Rentabilidad Real (usando campos congelados de ventas pagadas)
  const paidSales = productSales.filter(s => s.paymentStatus === 'pagado');
  const realProfitability = {
    totalRevenue: paidSales.reduce((sum, s) => sum + s.totalAmount, 0),
    totalCost: paidSales.reduce((sum, s) => sum + ((s.costAtSale || 0) * s.quantity), 0),
    netProfit: paidSales.reduce((sum, s) => sum + ((s.marginAtSale || 0) * s.quantity), 0),
    avgMargin: paidSales.length > 0 
      ? paidSales.filter(s => s.marginPercentAtSale != null).reduce((sum, s) => sum + (s.marginPercentAtSale || 0), 0) / 
        paidSales.filter(s => s.marginPercentAtSale != null).length 
      : 0,
    salesWithLoss: paidSales.filter(s => (s.marginAtSale || 0) < 0).length,
    hasData: paidSales.some(s => s.costAtSale !== undefined && s.costAtSale !== null),
  };

  const handleDelete = async () => {
    if (id) {
      await deleteProduct(id);
      navigate('/products');
    }
  };

  const handleEdit = async (data: any) => {
    if (id) {
      const success = await updateProduct(id, data);
      if (success) {
        setEditOpen(false);
        return { ...product, ...data };
      }
    }
    return null;
  };

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <CommandCenterNav />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <CommandCenterNav />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate('/products')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a productos
          </Button>
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Producto no encontrado</h2>
          </div>
        </div>
      </div>
    );
  }

  const marginLevel = product.marginLevel || 
    ((product.marginPercent ?? 0) >= 40 ? 'alto' : (product.marginPercent ?? 0) >= 20 ? 'medio' : 'bajo');

  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {product.sku && (
                <span className="text-sm text-muted-foreground font-mono">{product.sku}</span>
              )}
              <Badge variant={product.status === 'activo' ? 'default' : 'secondary'}>
                {product.status}
              </Badge>
              {product.isFeatured && (
                <Badge variant="outline" className="gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Destacado
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button variant="destructive" size="icon" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Image */}
            <div className="space-y-3">
              <div className="aspect-video rounded-xl border-2 border-border overflow-hidden bg-secondary flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-20 h-20 text-muted-foreground" />
                )}
              </div>
              {product.images && product.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {[product.imageUrl, ...product.images].filter(Boolean).map((img, i) => (
                    <div key={i} className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <img src={img!} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="detalles" className="w-full">
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="detalles">Detalles</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="creativos">Creativos</TabsTrigger>
                <TabsTrigger value="ventas">Ventas</TabsTrigger>
                <TabsTrigger value="pagina-publica" className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span className="hidden sm:inline">Pública</span>
                  <span className="sm:hidden">Web</span>
                </TabsTrigger>
              </TabsList>

              {/* Detalles Tab */}
              <TabsContent value="detalles" className="space-y-6 mt-6">
                {/* Prices Card (Admin) */}
                {isAdmin && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Precios y Márgenes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-4 bg-secondary rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Costo</div>
                          <div className="text-xl font-bold text-foreground">
                            ${product.costPrice.toLocaleString('es-MX')}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-secondary rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Mayorista</div>
                          <div className="text-xl font-bold text-foreground">
                            ${product.wholesalePrice.toLocaleString('es-MX')}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                          <div className="text-sm text-primary mb-1">Precio Final</div>
                          <div className="text-xl font-bold text-primary">
                            ${product.retailPrice.toLocaleString('es-MX')}
                          </div>
                        </div>
                      </div>
                      
                      {/* Margin bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Percent className="w-4 h-4" />
                            Margen
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn(
                              marginLevel === 'alto' ? 'border-success text-success' : 
                              marginLevel === 'medio' ? 'border-warning text-warning' : 'border-destructive text-destructive'
                            )}>
                              {marginLevel.charAt(0).toUpperCase() + marginLevel.slice(1)}
                            </Badge>
                            <span className="font-bold">
                              {(product.marginPercent ?? 0).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all rounded-full",
                              marginLevel === 'alto' ? 'bg-success' : 
                              marginLevel === 'medio' ? 'bg-warning' : 'bg-destructive'
                            )}
                            style={{ width: `${Math.min((product.marginPercent ?? 0), 100)}%` }}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Ganancia por unidad: <span className="font-semibold text-foreground">${(product.marginAmount ?? 0).toFixed(0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Description */}
                {product.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Descripción</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Internal Notes (Admin only) */}
                {isAdmin && product.internalNotes && (
                  <Card className="bg-secondary">
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">Notas Internas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{product.internalNotes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-secondary rounded-lg">
                        <div className="text-2xl font-bold text-foreground">{salesLast7Days}</div>
                        <div className="text-xs text-muted-foreground">Ventas 7 días</div>
                      </div>
                      <div className="text-center p-4 bg-secondary rounded-lg">
                        <div className="text-2xl font-bold text-foreground">{salesLast30Days}</div>
                        <div className="text-xs text-muted-foreground">Ventas 30 días</div>
                      </div>
                      <div className="text-center p-4 bg-secondary rounded-lg">
                        <div className="text-2xl font-bold text-success">${revenueGenerated.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Revenue</div>
                      </div>
                      <div className="text-center p-4 bg-secondary rounded-lg">
                        <div className={cn(
                          "text-2xl font-bold",
                          pendingToCollect > 0 ? "text-warning" : "text-muted-foreground"
                        )}>
                          ${pendingToCollect.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Por cobrar</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rentabilidad Real Card (Admin only) */}
                {isAdmin && realProfitability.hasData && (
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-primary" />
                        Rentabilidad Real
                        <span className="text-xs font-normal text-muted-foreground ml-auto">
                          (basado en ventas pagadas)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-4 bg-secondary rounded-lg">
                          <div className="text-2xl font-bold text-foreground">
                            ${realProfitability.totalRevenue.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Ingresos</div>
                        </div>
                        <div className="text-center p-4 bg-secondary rounded-lg">
                          <div className="text-2xl font-bold text-foreground">
                            ${realProfitability.totalCost.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Costos reales</div>
                        </div>
                        <div className={cn(
                          "text-center p-4 rounded-lg",
                          realProfitability.netProfit >= 0 ? "bg-success/10" : "bg-destructive/10"
                        )}>
                          <div className={cn(
                            "text-2xl font-bold",
                            realProfitability.netProfit >= 0 ? "text-success" : "text-destructive"
                          )}>
                            {realProfitability.netProfit >= 0 ? '+' : ''}${realProfitability.netProfit.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Ganancia neta</div>
                        </div>
                        <div className="text-center p-4 bg-secondary rounded-lg">
                          <div className="text-2xl font-bold text-foreground">
                            {realProfitability.avgMargin.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Margen prom.</div>
                        </div>
                      </div>
                      
                      {realProfitability.salesWithLoss > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {realProfitability.salesWithLoss} venta{realProfitability.salesWithLoss > 1 ? 's' : ''} con pérdida
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Creativos Tab */}
              <TabsContent value="creativos" className="mt-6">
                <ProductCreativesTab 
                  product={product} 
                  onCreateClick={() => navigate(`/creatives?productId=${id}`)}
                />
              </TabsContent>

              {/* Página Pública Tab */}
              <TabsContent value="pagina-publica" className="mt-6">
                <PaginaPublicaTab productId={id!} />
              </TabsContent>

              {/* Ventas Tab */}
              <TabsContent value="ventas" className="mt-6">
                {productSales.length > 0 ? (
                  <div className="space-y-3">
                    {productSales.map((sale) => (
                      <Card key={sale.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{sale.clientName || 'Sin nombre'}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(sale.saleDate).toLocaleDateString('es-MX')}
                                <span className="mx-1">•</span>
                                {sale.quantity} unidad{sale.quantity > 1 ? 'es' : ''}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">${sale.totalAmount.toLocaleString()}</div>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  sale.paymentStatus === 'pagado' ? 'border-success text-success' : 'border-warning text-warning'
                                )}
                              >
                                {sale.paymentStatus}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">Sin ventas aún</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        No hay ventas registradas para este producto
                      </p>
                      <Button onClick={() => navigate('/sales')} variant="outline">
                        Ir a ventas
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate(`/creatives?productId=${id}`)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Crear creativo
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate(`/sales?productId=${id}`)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Registrar venta
                </Button>
                <Button className="w-full justify-start opacity-50" variant="outline" disabled>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar a vendedores
                  <Badge variant="outline" className="ml-auto text-xs">Próximamente</Badge>
                </Button>
                <Button className="w-full justify-start opacity-50" variant="outline" disabled>
                  <ListTodo className="w-4 h-4 mr-2" />
                  Crear tarea
                  <Badge variant="outline" className="ml-auto text-xs">Próximamente</Badge>
                </Button>
              </CardContent>
            </Card>

            {/* AI Section Placeholder */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🧠 Inteligencia Artificial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-secondary/50 border border-dashed border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    🖼️ Generar imagen con IA
                  </div>
                  <Badge variant="outline" className="text-xs">Próximamente</Badge>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-dashed border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    ✍️ Generar copy con IA
                  </div>
                  <Badge variant="outline" className="text-xs">Próximamente</Badge>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-dashed border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    🎬 Generar video con IA
                  </div>
                  <Badge variant="outline" className="text-xs">Próximamente</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sales */}
            {productSales.length > 0 && (
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-lg">Ventas Recientes</CardTitle>
                  <Button variant="link" size="sm" onClick={() => navigate('/sales')}>
                    Ver todas
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {productSales.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <div className="text-sm font-medium">{sale.clientName || 'Sin nombre'}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sale.saleDate).toLocaleDateString('es-MX')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${sale.totalAmount.toLocaleString()}</div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            sale.paymentStatus === 'pagado' ? 'border-success text-success' : 'border-warning text-warning'
                          )}
                        >
                          {sale.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Internal Notes (Admin only) */}
            {isAdmin && product.internalNotes && (
              <Card className="bg-secondary">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Notas Internas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{product.internalNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <ProductForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
        onUploadImage={uploadProductImage}
        checkSkuAvailable={checkSkuAvailable}
        initialData={product}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará "{product.name}" permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductDetail;
