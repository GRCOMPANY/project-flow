import { useState, useMemo } from 'react';
import { useSales, OPERATIONAL_STATUS_LABELS } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useSellers } from '@/hooks/useSellers';
import { useCreatives } from '@/hooks/useCreatives';
import { useAuth } from '@/contexts/AuthContext';
import { Sale, SalesChannel, OrderStatus, PaymentStatus, OperationalStatus } from '@/types';
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
  const { sales, loading, addSale, updateSale, deleteSale, updateOperationalStatus } = useSales();
  const { products } = useProducts();
  const { sellers } = useSellers();
  const { creatives } = useCreatives();
  const { isAdmin } = useAuth();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);

  // Form fields - Reseller Model
  const [productId, setProductId] = useState('');
  const [resellerId, setResellerId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [resellerPrice, setResellerPrice] = useState(0);  // Price to reseller
  const [finalPrice, setFinalPrice] = useState(0);        // Optional: retail price
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [salesChannel, setSalesChannel] = useState<SalesChannel>('whatsapp');
  const [paymentMethod, setPaymentMethod] = useState('contra_entrega');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pendiente');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('pendiente');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [relatedCreativeId, setRelatedCreativeId] = useState<string>('');

  // Selected product for calculations
  const selectedProduct = products.find(p => p.id === productId);
  const productCost = selectedProduct?.costPrice || 0;
  
  // Calculated values - Reseller Model
  const totalAmount = quantity * resellerPrice;          // Your revenue
  const myProfit = resellerPrice - productCost;          // Your profit per unit
  const myMarginPercent = productCost > 0 ? ((myProfit / productCost) * 100) : 0;
  const resellerProfitCalc = finalPrice > 0 ? finalPrice - resellerPrice : 0;

  // Dashboard stats
  const stats = useMemo(() => {
    const totalSold = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const pending = sales.filter(s => s.paymentStatus === 'pendiente');
    const paid = sales.filter(s => s.paymentStatus === 'pagado');
    const pendingAmount = pending.reduce((sum, s) => sum + s.totalAmount, 0);
    const paidAmount = paid.reduce((sum, s) => sum + s.totalAmount, 0);

    // KPIs de rentabilidad (usando campos congelados)
    const totalCost = sales.reduce((sum, s) => 
      sum + ((s.costAtSale || 0) * s.quantity), 0
    );
    const netProfit = sales.reduce((sum, s) => 
      sum + ((s.marginAtSale || 0) * s.quantity), 0
    );
    const salesWithMargin = sales.filter(s => s.marginPercentAtSale !== undefined && s.marginPercentAtSale !== null);
    const avgMargin = salesWithMargin.length > 0
      ? salesWithMargin.reduce((sum, s) => sum + (s.marginPercentAtSale || 0), 0) / salesWithMargin.length
      : 0;
    const salesWithLoss = sales.filter(s => (s.marginAtSale || 0) < 0).length;

    // KPIs de seguimiento operativo
    const sinConfirmar = sales.filter(s => s.operationalStatus === 'nuevo').length;
    const enRiesgo = sales.filter(s => 
      s.operationalStatus === 'riesgo_devolucion' || s.operationalStatus === 'sin_respuesta'
    ).length;
    const pendienteAccion = sales.filter(s => 
      s.operationalStatus !== 'entregado' && 
      !(s.orderStatus === 'entregado' && s.paymentStatus === 'pagado')
    ).length;

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
      // Seguimiento
      sinConfirmar,
      enRiesgo,
      pendienteAccion,
    };
  }, [sales]);

  const resetForm = () => {
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
    setEditingSale(null);
  };

  const openNewForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (sale: Sale) => {
    setEditingSale(sale);
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
    setShowForm(true);
  };

  const handleProductChange = (id: string) => {
    setProductId(id);
    const product = products.find(p => p.id === id);
    if (product) {
      // Auto-fill with wholesale price for reseller
      setResellerPrice(product.wholesalePrice || product.price);
      setFinalPrice(product.retailPrice || product.suggestedPrice || 0);
    }
  };

  const handleSubmit = async () => {
    if (!productId) {
      return;
    }

    const saleData = {
      productId,
      quantity,
      unitPrice,
      totalAmount,
      clientName: clientName || undefined,
      clientPhone: clientPhone || undefined,
      salesChannel,
      paymentMethod,
      paymentStatus,
      orderStatus,
      saleDate: new Date(saleDate).toISOString(),
      notes: notes || undefined,
      relatedCreativeId: relatedCreativeId || undefined,
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
            <Button onClick={openNewForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva venta
            </Button>
          )}
        </div>

        {/* Dashboard Stats - Row 1: Ingresos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  <p className="text-sm text-muted-foreground">Pendiente por cobrar</p>
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
        </div>

        {/* Dashboard Stats - Row 2: Rentabilidad (solo admin) */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Costo total</p>
                    <p className="text-2xl font-bold">${stats.totalCost.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Percent className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Margen promedio</p>
                    <p className="text-2xl font-bold">{stats.avgMargin.toFixed(1)}%</p>
                  </div>
                  {stats.salesWithLoss > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {stats.salesWithLoss} con pérdida
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dashboard Stats - Row 3: Seguimiento (solo admin) */}
        {isAdmin && (stats.sinConfirmar > 0 || stats.enRiesgo > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

            <Card className={stats.enRiesgo > 0 ? 'border-destructive/50' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stats.enRiesgo > 0 ? 'bg-destructive/10' : 'bg-muted'}`}>
                    <ShieldAlert className={`w-5 h-5 ${stats.enRiesgo > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">En riesgo</p>
                    <p className={`text-2xl font-bold ${stats.enRiesgo > 0 ? 'text-destructive' : ''}`}>
                      {stats.enRiesgo}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <PhoneCall className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendiente acción</p>
                    <p className="text-2xl font-bold">{stats.pendienteAccion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            {/* Product Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Producto
              </h4>
              
              <div>
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
                        {product.name} - ${product.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Cantidad</label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Precio unit.</label>
                  <Input
                    type="number"
                    min={0}
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Total</label>
                  <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center font-medium">
                    ${totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Cliente
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
                  <label className="text-sm font-medium mb-1 block">Teléfono (WhatsApp)</label>
                  <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+52 123 456 7890"
                  />
                </div>
              </div>
            </div>

            {/* Commercial Section */}
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

            {/* Status Section */}
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

            {/* Other Section */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Fecha de venta</label>
                <Input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                />
              </div>

              {/* Creative Attribution */}
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Atribuir ventas a creativos mejora la inteligencia del sistema
                  </p>
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
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!productId}>
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

  // Cálculos de margen (usando campos congelados)
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

            {/* Margin Info (Admin only) */}
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
            {/* Payment Status - Clickable */}
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

            {/* Order Status - Dropdown */}
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

            {/* Operational Status - Dropdown */}
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

        {/* Notes */}
        {sale.notes && (
          <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
            {sale.notes}
          </p>
        )}

        {/* Actions */}
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
