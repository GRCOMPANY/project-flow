import { useState, useMemo } from 'react';
import { useSales, OPERATIONAL_STATUS_LABELS } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useSellers } from '@/hooks/useSellers';
import { useCreatives } from '@/hooks/useCreatives';
import { useAuth } from '@/contexts/AuthContext';
import { Sale, SalesChannel, OrderStatus, PaymentStatus, OperationalStatus, SaleType, SaleSource } from '@/types';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Phone,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  ChevronDown,
  User,
  MessageSquare,
  Truck,
  AlertTriangle,
  Percent,
  Wallet,
  CircleDot,
  PhoneCall,
  ThumbsUp,
  PhoneOff,
  ShieldAlert,
  Users,
  Store,
  Globe,
  Handshake,
  RefreshCw,
} from 'lucide-react';

const SALES_CHANNELS: { value: SalesChannel; label: string }[] = [
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'otro', label: 'Otro' },
];

const PAYMENT_METHODS = [
  { value: 'contra_entrega', label: 'Contra entrega' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
];

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string; icon: typeof Package }[] = [
  { value: 'pendiente', label: 'Pendiente', icon: Clock },
  { value: 'en_progreso', label: 'En proceso', icon: Truck },
  { value: 'entregado', label: 'Entregado', icon: CheckCircle },
];

const OPERATIONAL_STATUS_OPTIONS: { value: OperationalStatus; label: string; icon: typeof CircleDot; color: string }[] = [
  { value: 'nuevo', label: 'Nuevo', icon: CircleDot, color: 'text-muted-foreground border-muted-foreground/50' },
  { value: 'contactado', label: 'Contactado', icon: PhoneCall, color: 'text-sky-600 border-sky-600' },
  { value: 'confirmado', label: 'Confirmado', icon: ThumbsUp, color: 'text-emerald-600 border-emerald-600' },
  { value: 'sin_respuesta', label: 'Sin respuesta', icon: PhoneOff, color: 'text-amber-600 border-amber-600' },
  { value: 'en_ruta', label: 'En ruta', icon: Truck, color: 'text-violet-600 border-violet-600' },
  { value: 'entregado', label: 'Entregado', icon: CheckCircle, color: 'text-emerald-600 border-emerald-600' },
  { value: 'riesgo_devolucion', label: 'En riesgo', icon: ShieldAlert, color: 'text-destructive border-destructive' },
];

export default function Sales() {
  const { sales, loading, addSale, updateSale, deleteSale, updateOperationalStatus, recalculateAllSales } = useSales();
  const { products } = useProducts();
  const { sellers } = useSellers();
  const { creatives } = useCreatives();
  const { isAdmin } = useAuth();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [showRecalcConfirm, setShowRecalcConfirm] = useState(false);

  // Form fields - Sale Type First (OBLIGATORIO)
  const [saleType, setSaleType] = useState<SaleType | null>(null);
  const [productId, setProductId] = useState('');
  const [resellerId, setResellerId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [resellerPrice, setResellerPrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [salesChannel, setSalesChannel] = useState<SalesChannel>('whatsapp');
  const [paymentMethod, setPaymentMethod] = useState('contra_entrega');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pendiente');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('pendiente');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [relatedCreativeId, setRelatedCreativeId] = useState<string>('');
  const [saleSource, setSaleSource] = useState<SaleSource>('digital');
  const [myPercentage, setMyPercentage] = useState(100);
  const [partnerPercentage, setPartnerPercentage] = useState(0);
  // Selected product for calculations
  const selectedProduct = products.find(p => p.id === productId);
  const productCost = selectedProduct?.costPrice || 0;
  
  // Calculated values - dependen del tipo de venta
  const effectivePrice = saleType === 'directa' ? finalPrice : resellerPrice;
  const totalAmount = quantity * effectivePrice;
  const myProfit = effectivePrice - productCost;
  const myMarginPercent = productCost > 0 ? ((myProfit / productCost) * 100) : 0;
  const resellerProfitCalc = saleType === 'revendedor' && finalPrice > 0 ? finalPrice - resellerPrice : 0;

  // Dashboard stats - separadas por tipo
  const stats = useMemo(() => {
    const directSales = sales.filter(s => s.saleType === 'directa');
    const resellerSales = sales.filter(s => s.saleType === 'revendedor');
    
    const totalSold = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const pending = sales.filter(s => s.paymentStatus === 'pendiente');
    const paid = sales.filter(s => s.paymentStatus === 'pagado');
    const pendingAmount = pending.reduce((sum, s) => sum + s.totalAmount, 0);
    const paidAmount = paid.reduce((sum, s) => sum + s.totalAmount, 0);

    const totalCost = sales.reduce((sum, s) => sum + ((s.costAtSale || 0) * s.quantity), 0);
    const netProfit = sales.reduce((sum, s) => sum + ((s.marginAtSale || 0) * s.quantity), 0);
    const salesWithMargin = sales.filter(s => s.marginPercentAtSale !== undefined && s.marginPercentAtSale !== null);
    const avgMargin = salesWithMargin.length > 0
      ? salesWithMargin.reduce((sum, s) => sum + (s.marginPercentAtSale || 0), 0) / salesWithMargin.length
      : 0;
    const salesWithLoss = sales.filter(s => (s.marginAtSale || 0) < 0).length;

    const sinConfirmar = sales.filter(s => s.operationalStatus === 'nuevo').length;
    const enRiesgo = sales.filter(s => 
      s.operationalStatus === 'riesgo_devolucion' || s.operationalStatus === 'sin_respuesta'
    ).length;

    // Stats por tipo
    const directTotal = directSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const directPending = directSales.filter(s => s.paymentStatus === 'pendiente').reduce((sum, s) => sum + s.totalAmount, 0);
    const directMarginAvg = directSales.length > 0 
      ? directSales.reduce((sum, s) => sum + (s.marginPercentAtSale || 0), 0) / directSales.length 
      : 0;

    const resellerTotal = resellerSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const resellerPending = resellerSales.filter(s => s.paymentStatus === 'pendiente').reduce((sum, s) => sum + s.totalAmount, 0);
    const resellerMarginAvg = resellerSales.length > 0 
      ? resellerSales.reduce((sum, s) => sum + (s.marginPercentAtSale || 0), 0) / resellerSales.length 
      : 0;

    // Stats por origen (sale source)
    const digitalSales = sales.filter(s => s.saleSource === 'presencial' ? false : true);
    const presencialSales = sales.filter(s => s.saleSource === 'presencial');
    const digitalTotal = digitalSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const presencialTotal = presencialSales.reduce((sum, s) => sum + s.totalAmount, 0);

    // Distribución de ganancia
    const myTotalProfit = sales.reduce((sum, s) => sum + (s.myProfitAmount || 0), 0);
    const partnerTotalProfit = sales.reduce((sum, s) => sum + (s.partnerProfitAmount || 0), 0);

    return {
      totalSold,
      totalSales: sales.length,
      pendingAmount,
      pendingCount: pending.length,
      paidAmount,
      paidCount: paid.length,
      totalCost,
      netProfit,
      avgMargin,
      salesWithLoss,
      sinConfirmar,
      enRiesgo,
      directTotal,
      directCount: directSales.length,
      directPending,
      directMarginAvg,
      resellerTotal,
      resellerCount: resellerSales.length,
      resellerPending,
      resellerMarginAvg,
      // Sale source stats
      digitalTotal,
      digitalCount: digitalSales.length,
      presencialTotal,
      presencialCount: presencialSales.length,
      myTotalProfit,
      partnerTotalProfit,
    };
  }, [sales]);

  const resetForm = () => {
    setSaleType(null);
    setProductId('');
    setResellerId('');
    setQuantity(1);
    setResellerPrice(0);
    setFinalPrice(0);
    setClientName('');
    setClientPhone('');
    setSalesChannel('whatsapp');
    setPaymentMethod('contra_entrega');
    setPaymentStatus('pendiente');
    setOrderStatus('pendiente');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setRelatedCreativeId('');
    setSaleSource('digital');
    setMyPercentage(100);
    setPartnerPercentage(0);
    setEditingSale(null);
  };

  const openNewForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (sale: Sale) => {
    setEditingSale(sale);
    setSaleType(sale.saleType || (sale.sellerId ? 'revendedor' : 'directa'));
    setProductId(sale.productId);
    setResellerId(sale.sellerId || '');
    setQuantity(sale.quantity);
    setResellerPrice(sale.resellerPrice || sale.unitPrice);
    setFinalPrice(sale.finalPrice || 0);
    setClientName(sale.clientName || '');
    setClientPhone(sale.clientPhone || '');
    setSalesChannel(sale.salesChannel || 'whatsapp');
    setPaymentMethod(sale.paymentMethod || 'contra_entrega');
    setPaymentStatus(sale.paymentStatus);
    setOrderStatus(sale.orderStatus);
    setSaleDate(sale.saleDate.split('T')[0]);
    setNotes(sale.notes || '');
    setRelatedCreativeId(sale.relatedCreativeId || '');
    setSaleSource(sale.saleSource || 'digital');
    setMyPercentage(sale.myPercentage ?? 100);
    setPartnerPercentage(sale.partnerPercentage ?? 0);
    setShowForm(true);
  };

  const handleProductChange = (id: string) => {
    setProductId(id);
    const product = products.find(p => p.id === id);
    if (product) {
      if (saleType === 'directa') {
        setFinalPrice(product.retailPrice || product.suggestedPrice || product.price);
      } else {
        setResellerPrice(product.wholesalePrice || product.price);
        setFinalPrice(product.retailPrice || product.suggestedPrice || 0);
      }
    }
  };

  const handleSaleTypeChange = (type: SaleType) => {
    setSaleType(type);
    if (type === 'directa') {
      setResellerId('');
    }
    if (selectedProduct) {
      if (type === 'directa') {
        setFinalPrice(selectedProduct.retailPrice || selectedProduct.suggestedPrice || selectedProduct.price);
      } else {
        setResellerPrice(selectedProduct.wholesalePrice || selectedProduct.price);
      }
    }
  };

  const handleSubmit = async () => {
    if (!productId || !saleType) {
      return;
    }

    const saleData = {
      saleType,
      productId,
      sellerId: saleType === 'revendedor' ? (resellerId || undefined) : undefined,
      quantity,
      unitPrice: saleType === 'directa' ? finalPrice : resellerPrice,
      totalAmount,
      resellerPrice: saleType === 'revendedor' ? resellerPrice : undefined,
      finalPrice: finalPrice || undefined,
      clientName: clientName || undefined,
      clientPhone: clientPhone || undefined,
      salesChannel,
      paymentMethod,
      paymentStatus,
      orderStatus,
      saleDate: new Date(saleDate).toISOString(),
      notes: notes || undefined,
      relatedCreativeId: relatedCreativeId || undefined,
      saleSource,
      myPercentage: saleSource === 'digital' ? 100 : myPercentage,
      partnerPercentage: saleSource === 'digital' ? 0 : partnerPercentage,
    };

    if (editingSale) {
      await updateSale(editingSale.id, saleData);
    } else {
      await addSale(saleData);
    }

    setShowForm(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deletingSale) {
      await deleteSale(deletingSale.id);
      setDeletingSale(null);
    }
  };

  const handleQuickPaymentToggle = async (sale: Sale) => {
    const newStatus: PaymentStatus = sale.paymentStatus === 'pendiente' ? 'pagado' : 'pendiente';
    await updateSale(sale.id, { paymentStatus: newStatus });
  };

  const handleOrderStatusChange = async (sale: Sale, newStatus: OrderStatus) => {
    await updateSale(sale.id, { orderStatus: newStatus });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CommandCenterNav />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />
      
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Ventas</h1>
            <p className="text-muted-foreground">Control de ventas y cobros</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRecalcConfirm(true)} disabled={recalculating}>
                <RefreshCw className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
                {recalculating ? 'Recalculando...' : 'Recalcular'}
              </Button>
              <Button onClick={openNewForm}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva venta
              </Button>
            </div>
          )}
        </div>

        {/* Dashboard Stats - Global */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total vendido</p>
                  <p className="text-2xl font-bold">${stats.totalSold.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{stats.totalSales} ventas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendiente</p>
                  <p className="text-2xl font-bold text-amber-600">${stats.pendingAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{stats.pendingCount} ventas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cobrado</p>
                  <p className="text-2xl font-bold text-emerald-600">${stats.paidAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{stats.paidCount} ventas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stats.netProfit >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                    <DollarSign className={`w-5 h-5 ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ganancia neta</p>
                    <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                      {stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{stats.avgMargin.toFixed(0)}% margen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats por tipo */}
        {isAdmin && (stats.directCount > 0 || stats.resellerCount > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Store className="w-4 h-4 text-primary" />
                  <span className="font-medium">Ventas Directas</span>
                  <Badge variant="secondary">{stats.directCount}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-bold">${stats.directTotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pendiente</p>
                    <p className="font-bold text-amber-600">${stats.directPending.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Margen</p>
                    <p className="font-bold">{stats.directMarginAvg.toFixed(0)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Ventas a Revendedores</span>
                  <Badge variant="secondary">{stats.resellerCount}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-bold">${stats.resellerTotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pendiente</p>
                    <p className="font-bold text-amber-600">${stats.resellerPending.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Margen</p>
                    <p className="font-bold">{stats.resellerMarginAvg.toFixed(0)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats por origen de venta */}
        {isAdmin && sales.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card className="border-l-4 border-l-sky-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-sky-600" />
                  <span className="font-medium">Ventas Digital</span>
                  <Badge variant="secondary">{stats.digitalCount}</Badge>
                </div>
                <p className="text-2xl font-bold">${stats.digitalTotal.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-violet-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Handshake className="w-4 h-4 text-violet-600" />
                  <span className="font-medium">Ventas Presencial</span>
                  <Badge variant="secondary">{stats.presencialCount}</Badge>
                </div>
                <p className="text-2xl font-bold">${stats.presencialTotal.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Distribución de ganancia */}
        {isAdmin && sales.length > 0 && (stats.myTotalProfit > 0 || stats.partnerTotalProfit > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/10 rounded-lg">
                    <Globe className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mi ganancia</p>
                    <p className="text-2xl font-bold text-sky-600">${stats.myTotalProfit.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/10 rounded-lg">
                    <Handshake className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ganancia socio</p>
                    <p className="text-2xl font-bold text-violet-600">${stats.partnerTotalProfit.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isAdmin && (stats.sinConfirmar > 0 || stats.enRiesgo > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {stats.sinConfirmar > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <CircleDot className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sin confirmar</p>
                      <p className="text-2xl font-bold">{stats.sinConfirmar}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {stats.enRiesgo > 0 && (
              <Card className="border-destructive/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <ShieldAlert className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">En riesgo</p>
                      <p className="text-2xl font-bold text-destructive">{stats.enRiesgo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Sales List */}
        {sales.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin ventas registradas</h3>
              <p className="text-muted-foreground mb-4">
                Comienza registrando tu primera venta
              </p>
              {isAdmin && (
                <Button onClick={openNewForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva venta
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => (
              <SaleCard
                key={sale.id}
                sale={sale}
                isAdmin={isAdmin}
                onEdit={() => openEditForm(sale)}
                onDelete={() => setDeletingSale(sale)}
                onPaymentToggle={() => handleQuickPaymentToggle(sale)}
                onOrderStatusChange={(status) => handleOrderStatusChange(sale, status)}
                onOperationalStatusChange={(status) => updateOperationalStatus(sale.id, status)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Sale Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSale ? 'Editar venta' : 'Nueva venta'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* TIPO DE VENTA - OBLIGATORIO */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                🎯 Tipo de venta <span className="text-destructive">*</span>
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSaleTypeChange('directa')}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    saleType === 'directa'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Store className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Venta directa</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Cliente final • Ingreso directo</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSaleTypeChange('revendedor')}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    saleType === 'revendedor'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Venta a revendedor</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Mayorista • Venta por volumen</p>
                </button>
              </div>

              {saleType && (
                <div className={`p-3 rounded-lg text-sm ${
                  saleType === 'directa' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {saleType === 'directa' 
                    ? '💵 Esta venta genera ingreso directo para GRC'
                    : '🤝 GRC vende el producto al revendedor, no al cliente final'
                  }
                </div>
              )}
            </div>

            {/* ORIGEN DE VENTA */}
            {saleType && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  📍 Origen de venta
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSaleSource('digital');
                      setMyPercentage(100);
                      setPartnerPercentage(0);
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      saleSource === 'digital'
                        ? 'border-sky-500 bg-sky-500/10'
                        : 'border-border hover:border-sky-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-sky-600" />
                      <span className="font-semibold text-sm">Digital (yo)</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setSaleSource('presencial');
                      setMyPercentage(50);
                      setPartnerPercentage(50);
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      saleSource === 'presencial'
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-border hover:border-violet-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Handshake className="w-4 h-4 text-violet-600" />
                      <span className="font-semibold text-sm">Presencial (socio)</span>
                    </div>
                  </button>
                </div>

                {saleSource === 'presencial' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Mi % <span className="text-sky-600">({myPercentage}%)</span></label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={myPercentage}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, Number(e.target.value)));
                            setMyPercentage(val);
                            setPartnerPercentage(100 - val);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Socio % <span className="text-violet-600">({partnerPercentage}%)</span></label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={partnerPercentage}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, Number(e.target.value)));
                            setPartnerPercentage(val);
                            setMyPercentage(100 - val);
                          }}
                        />
                      </div>
                    </div>

                    {productId && isAdmin && (
                      <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3 space-y-1 text-sm">
                        <p className="text-muted-foreground">Ganancia bruta: <span className="font-bold text-foreground">${(myProfit * quantity).toLocaleString()}</span></p>
                        <div className="flex justify-between">
                          <span className="text-sky-600">Mi parte ({myPercentage}%): <span className="font-bold">${((myProfit * quantity * myPercentage) / 100).toLocaleString()}</span></span>
                          <span className="text-violet-600">Socio ({partnerPercentage}%): <span className="font-bold">${((myProfit * quantity * partnerPercentage) / 100).toLocaleString()}</span></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Product Section */}
            {saleType && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  📦 Producto
                </h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1 block">
                      Producto <span className="text-destructive">*</span>
                    </label>
                    <Select value={productId} onValueChange={handleProductChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.filter(p => p.status === 'activo').map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ${(saleType === 'directa' ? product.retailPrice : product.wholesalePrice) || product.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Cantidad</label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN CONDICIONAL: VENTA DIRECTA */}
            {saleType === 'directa' && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  📞 Cliente
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nombre</label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Teléfono</label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+52 123 456 7890"
                    />
                  </div>
                </div>

                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide pt-2">
                  💰 Precio de venta
                </h4>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Precio final <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(Number(e.target.value))}
                  />
                </div>

                {productId && isAdmin && (
                  <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tu costo:</span>
                      <span>${productCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Precio de venta:</span>
                      <span>${finalPrice.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className={`flex justify-between font-bold ${myProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        <span>TU GANANCIA:</span>
                        <span>
                          {myProfit >= 0 ? '+' : ''}${myProfit.toLocaleString()} ({myMarginPercent.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECCIÓN CONDICIONAL: VENTA A REVENDEDOR */}
            {saleType === 'revendedor' && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  👤 Revendedor <span className="text-destructive">*</span>
                </h4>
                
                <Select value={resellerId || 'none'} onValueChange={(v) => setResellerId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar revendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Seleccionar...</SelectItem>
                    {sellers.filter(s => s.status === 'activo').map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide pt-2">
                  💰 Precios
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Precio revendedor <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={resellerPrice}
                      onChange={(e) => setResellerPrice(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Tu ingreso</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Precio final (opc.)</label>
                    <Input
                      type="number"
                      min={0}
                      value={finalPrice}
                      onChange={(e) => setFinalPrice(Number(e.target.value))}
                      placeholder="Precio retail"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Informativo</p>
                  </div>
                </div>

                {productId && isAdmin && (
                  <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tu costo:</span>
                      <span>${productCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Precio revendedor:</span>
                      <span>${resellerPrice.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className={`flex justify-between font-bold ${myProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        <span>TU GANANCIA:</span>
                        <span>
                          {myProfit >= 0 ? '+' : ''}${myProfit.toLocaleString()} ({myMarginPercent.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    {finalPrice > 0 && (
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>Ganancia revendedor:</span>
                        <span>${resellerProfitCalc.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide pt-2">
                  📞 Cliente final (opcional)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nombre</label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Solo referencia"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Teléfono</label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Solo referencia"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Total */}
            {saleType && productId && (
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total de la venta:</span>
                <span className="text-2xl font-bold">${totalAmount.toLocaleString()}</span>
              </div>
            )}

            {/* Commercial Section */}
            {saleType && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Datos comerciales
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Canal de venta</label>
                    <Select value={salesChannel} onValueChange={(v) => setSalesChannel(v as SalesChannel)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SALES_CHANNELS.map((channel) => (
                          <SelectItem key={channel.value} value={channel.value}>
                            {channel.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Método de pago</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Status Section */}
            {saleType && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Estados
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Estado de pago</label>
                    <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">🟡 Pendiente</SelectItem>
                        <SelectItem value="pagado">🟢 Pagado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Estado del pedido</label>
                    <Select value={orderStatus} onValueChange={(v) => setOrderStatus(v as OrderStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.value === 'pendiente' && '🟡 '}
                            {status.value === 'en_progreso' && '🔵 '}
                            {status.value === 'entregado' && '🟢 '}
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Other Section */}
            {saleType && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Fecha de venta</label>
                  <Input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                  />
                </div>

                {productId && creatives.filter(c => c.productId === productId).length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Creativo origen (opcional)</label>
                    <Select value={relatedCreativeId} onValueChange={setRelatedCreativeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="¿De qué creativo vino esta venta?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin asignar</SelectItem>
                        {creatives
                          .filter(c => c.productId === productId)
                          .map((creative) => (
                            <SelectItem key={creative.id} value={creative.id}>
                              {creative.title || `${creative.type} - ${creative.channel}`}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1 block">Notas</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales..."
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!productId || !saleType}>
              {editingSale ? 'Guardar cambios' : 'Registrar venta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSale} onOpenChange={() => setDeletingSale(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente esta venta.
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
}

// Sale Card Component
interface SaleCardProps {
  sale: Sale;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPaymentToggle: () => void;
  onOrderStatusChange: (status: OrderStatus) => void;
  onOperationalStatusChange: (status: OperationalStatus) => void;
}

function SaleCard({ sale, isAdmin, onEdit, onDelete, onPaymentToggle, onOrderStatusChange, onOperationalStatusChange }: SaleCardProps) {
  const getChannelLabel = (channel?: SalesChannel) => {
    return SALES_CHANNELS.find(c => c.value === channel)?.label || channel || '-';
  };

  const getPaymentMethodLabel = (method?: string) => {
    return PAYMENT_METHODS.find(m => m.value === method)?.label || method || '-';
  };

  const getOrderStatusOption = (status: OrderStatus) => {
    return ORDER_STATUS_OPTIONS.find(s => s.value === status) || ORDER_STATUS_OPTIONS[0];
  };

  const getOperationalStatusOption = (status: OperationalStatus) => {
    return OPERATIONAL_STATUS_OPTIONS.find(s => s.value === status) || OPERATIONAL_STATUS_OPTIONS[0];
  };

  const orderStatusOption = getOrderStatusOption(sale.orderStatus);
  const operationalStatusOption = getOperationalStatusOption(sale.operationalStatus);

  const totalCost = (sale.costAtSale || 0) * sale.quantity;
  const totalMargin = (sale.marginAtSale || 0) * sale.quantity;
  const hasLoss = (sale.marginAtSale || 0) < 0;
  const hasMarginData = sale.costAtSale !== undefined && sale.costAtSale !== null;

  return (
    <Card className={`hover:shadow-md transition-shadow ${hasLoss ? 'border-destructive/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {/* Sale Type Badge */}
              <Badge 
                variant={sale.saleType === 'directa' ? 'default' : 'secondary'}
                className="gap-1"
              >
                {sale.saleType === 'directa' ? (
                  <>
                    <Store className="w-3 h-3" />
                    Directa
                  </>
                ) : (
                  <>
                    <Users className="w-3 h-3" />
                    Revendedor
                  </>
                )}
              </Badge>

              {/* Sale Source Badge */}
              <Badge 
                variant="outline"
                className={`gap-1 ${sale.saleSource === 'presencial' ? 'border-violet-500 text-violet-600' : 'border-sky-500 text-sky-600'}`}
              >
                {sale.saleSource === 'presencial' ? (
                  <>
                    <Handshake className="w-3 h-3" />
                    Presencial
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3" />
                    Digital
                  </>
                )}
              </Badge>
              {sale.saleSource === 'presencial' && (
                <Badge variant="outline" className="text-xs border-violet-500/50 text-violet-600">
                  {sale.myPercentage}/{sale.partnerPercentage}
                </Badge>
              )}
              
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium truncate">
                {sale.product?.name || 'Producto eliminado'}
              </span>
              <span className="text-muted-foreground">×{sale.quantity}</span>
              {hasLoss && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  PÉRDIDA
                </Badge>
              )}
              <span className="font-bold text-lg ml-auto">
                ${sale.totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {/* Mostrar revendedor si aplica */}
              {sale.saleType === 'revendedor' && sale.seller && (
                <span className="flex items-center gap-1 text-foreground font-medium">
                  <Users className="w-3 h-3" />
                  {sale.seller.name}
                </span>
              )}
              {sale.clientName && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {sale.clientName}
                </span>
              )}
              {sale.clientPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {sale.clientPhone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(sale.saleDate), 'dd MMM yyyy', { locale: es })}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {getChannelLabel(sale.salesChannel)}
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                {getPaymentMethodLabel(sale.paymentMethod)}
              </span>
            </div>

            {isAdmin && hasMarginData && (
              <div className="flex items-center gap-3 text-xs mt-2 pt-2 border-t border-dashed">
                <span className="text-muted-foreground">
                  Costo: ${totalCost.toLocaleString()}
                </span>
                <span className="text-muted-foreground">|</span>
                <span className={hasLoss ? 'text-destructive font-medium' : 'text-emerald-600 font-medium'}>
                  Margen: {totalMargin >= 0 ? '+' : ''}${totalMargin.toLocaleString()} 
                  ({(sale.marginPercentAtSale || 0).toFixed(0)}%)
                </span>
              </div>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={sale.paymentStatus === 'pagado' ? 'default' : 'secondary'}
              className={`cursor-pointer transition-colors ${
                sale.paymentStatus === 'pagado'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
              onClick={isAdmin ? onPaymentToggle : undefined}
            >
              <DollarSign className="w-3 h-3 mr-1" />
              {sale.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge
                  variant="outline"
                  className={`cursor-pointer gap-1 ${
                    sale.orderStatus === 'entregado'
                      ? 'border-emerald-600 text-emerald-600'
                      : sale.orderStatus === 'en_progreso'
                      ? 'border-sky-600 text-sky-600'
                      : 'border-amber-500 text-amber-600'
                  }`}
                >
                  <orderStatusOption.icon className="w-3 h-3" />
                  {orderStatusOption.label}
                  <ChevronDown className="w-3 h-3" />
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => onOrderStatusChange(status.value)}
                    disabled={!isAdmin}
                  >
                    <status.icon className="w-4 h-4 mr-2" />
                    {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge
                  variant="outline"
                  className={`cursor-pointer gap-1 ${operationalStatusOption.color}`}
                >
                  <operationalStatusOption.icon className="w-3 h-3" />
                  {operationalStatusOption.label}
                  <ChevronDown className="w-3 h-3" />
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {OPERATIONAL_STATUS_OPTIONS.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => onOperationalStatusChange(status.value)}
                    disabled={!isAdmin}
                  >
                    <status.icon className={`w-4 h-4 mr-2 ${status.color.split(' ')[0]}`} />
                    {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {sale.notes && (
          <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
            {sale.notes}
          </p>
        )}

        {isAdmin && (
          <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit2 className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
