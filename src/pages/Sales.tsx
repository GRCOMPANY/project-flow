import { useState } from 'react';
import { Plus, Trash2, Edit2, ShoppingCart, Calendar, DollarSign, User, Package } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useSellers } from '@/hooks/useSellers';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sale, PaymentStatus } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Tarjeta', 'Nequi', 'Daviplata', 'Otro'];

const Sales = () => {
  const { isAdmin } = useAuth();
  const { sales, loading, addSale, updateSale, deleteSale } = useSales();
  const { products } = useProducts();
  const { sellers } = useSellers();
  const [formOpen, setFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [productId, setProductId] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [clientName, setClientName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pendiente');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setProductId('');
    setSellerId('');
    setClientName('');
    setQuantity('1');
    setUnitPrice('');
    setPaymentMethod('');
    setPaymentStatus('pendiente');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const openEditForm = (sale: Sale) => {
    setProductId(sale.productId || '');
    setSellerId(sale.sellerId || '');
    setClientName(sale.clientName || '');
    setQuantity(sale.quantity.toString());
    setUnitPrice(sale.unitPrice.toString());
    setPaymentMethod(sale.paymentMethod || '');
    setPaymentStatus(sale.paymentStatus);
    setSaleDate(sale.saleDate.split('T')[0]);
    setNotes(sale.notes || '');
    setEditingSale(sale);
    setFormOpen(true);
  };

  // When product changes, update unit price
  const handleProductChange = (pid: string) => {
    setProductId(pid);
    const product = products.find(p => p.id === pid);
    if (product) {
      setUnitPrice(product.price.toString());
    }
  };

  const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitPrice || !quantity) return;

    const saleData = {
      productId: productId || undefined,
      sellerId: sellerId || undefined,
      clientName: clientName.trim() || undefined,
      quantity: parseInt(quantity),
      unitPrice: parseFloat(unitPrice),
      totalAmount,
      paymentMethod: paymentMethod || undefined,
      paymentStatus,
      saleDate: new Date(saleDate).toISOString(),
      notes: notes.trim() || undefined,
    };

    if (editingSale) {
      await updateSale(editingSale.id, saleData);
    } else {
      await addSale(saleData);
    }

    resetForm();
    setEditingSale(null);
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSale(deleteId);
      setDeleteId(null);
    }
  };

  const handleQuickStatusChange = async (sale: Sale, newStatus: PaymentStatus) => {
    await updateSale(sale.id, { paymentStatus: newStatus });
  };

  const pendingSales = sales.filter(s => s.paymentStatus === 'pendiente');
  const paidSales = sales.filter(s => s.paymentStatus === 'pagado');

  const totalPending = pendingSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPaid = paidSales.reduce((sum, s) => sum + s.totalAmount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-5xl mx-auto px-4 py-8">
        <header className="mb-10">
          <h1 className="text-5xl font-bold text-foreground mb-2">Ventas</h1>
          <p className="text-muted-foreground">
            Registro de ventas y seguimiento de pagos
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="grc-stat-card">
            <p className="text-sm text-muted-foreground">Total Ventas</p>
            <p className="text-2xl font-bold text-foreground">{sales.length}</p>
          </div>
          <div className="grc-stat-card bg-status-pending-bg">
            <p className="text-sm text-status-pending">Pendiente</p>
            <p className="text-2xl font-bold text-status-pending">
              ${totalPending.toLocaleString('es-MX')}
            </p>
          </div>
          <div className="grc-stat-card bg-status-done-bg">
            <p className="text-sm text-status-done">Cobrado</p>
            <p className="text-2xl font-bold text-status-done">
              ${totalPaid.toLocaleString('es-MX')}
            </p>
          </div>
        </div>

        {sales.length > 0 || isAdmin ? (
          <>
            {isAdmin && (
              <div className="flex justify-end mb-6">
                <Button onClick={() => { resetForm(); setFormOpen(true); }} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva venta
                </Button>
              </div>
            )}

            {/* Pending Sales */}
            {pendingSales.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-status-pending mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-pending"></span>
                  Pendientes de cobro ({pendingSales.length})
                </h2>
                <div className="grid gap-3">
                  {pendingSales.map((sale) => (
                    <SaleCard 
                      key={sale.id} 
                      sale={sale} 
                      isAdmin={isAdmin}
                      onEdit={() => openEditForm(sale)}
                      onDelete={() => setDeleteId(sale.id)}
                      onStatusChange={handleQuickStatusChange}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Paid Sales */}
            {paidSales.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-status-done mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-done"></span>
                  Cobradas ({paidSales.length})
                </h2>
                <div className="grid gap-3">
                  {paidSales.map((sale) => (
                    <SaleCard 
                      key={sale.id} 
                      sale={sale} 
                      isAdmin={isAdmin}
                      onEdit={() => openEditForm(sale)}
                      onDelete={() => setDeleteId(sale.id)}
                      onStatusChange={handleQuickStatusChange}
                    />
                  ))}
                </div>
              </div>
            )}

            {sales.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 border-2 border-border">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl text-foreground mb-2">Sin ventas aún</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Registra tu primera venta
                </p>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { resetForm(); setEditingSale(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSale ? 'Editar venta' : 'Nueva venta'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Producto</Label>
                <Select value={productId} onValueChange={handleProductChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin producto</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vendedor</Label>
                <Select value={sellerId} onValueChange={setSellerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin vendedor</SelectItem>
                    {sellers.filter(s => s.status === 'activo').map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Cliente</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">Precio Unidad *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Total</Label>
                <div className="h-10 flex items-center px-3 rounded-md border bg-secondary font-semibold">
                  ${totalAmount.toLocaleString('es-MX')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado de pago</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="saleDate">Fecha de venta</Label>
              <Input
                id="saleDate"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!unitPrice || !quantity}>
                {editingSale ? 'Guardar cambios' : 'Registrar venta'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
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

function SaleCard({ sale, isAdmin, onEdit, onDelete, onStatusChange }: { 
  sale: Sale; 
  isAdmin: boolean; 
  onEdit: () => void; 
  onDelete: () => void;
  onStatusChange: (sale: Sale, status: PaymentStatus) => void;
}) {
  return (
    <div className={`grc-card p-4 ${sale.paymentStatus === 'pagado' ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {sale.product && (
                <span className="flex items-center gap-1 text-sm font-medium">
                  <Package className="w-3 h-3" /> {sale.product.name}
                </span>
              )}
              {sale.clientName && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="w-3 h-3" /> {sale.clientName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> 
                {format(new Date(sale.saleDate), "d MMM yyyy", { locale: es })}
              </span>
              {sale.seller && <span>Vendedor: {sale.seller.name}</span>}
              {sale.paymentMethod && <span>{sale.paymentMethod}</span>}
              {sale.quantity > 1 && <span>{sale.quantity} uds</span>}
            </div>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-foreground">
              ${sale.totalAmount.toLocaleString('es-MX')}
            </p>
            <Badge 
              variant={sale.paymentStatus === 'pagado' ? 'default' : 'secondary'}
              className={`cursor-pointer ${sale.paymentStatus === 'pagado' ? 'bg-status-done' : 'bg-status-pending text-status-pending'}`}
              onClick={() => onStatusChange(sale, sale.paymentStatus === 'pagado' ? 'pendiente' : 'pagado')}
            >
              {sale.paymentStatus === 'pagado' ? '✓ Pagado' : 'Pendiente'}
            </Badge>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex gap-1 ml-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sales;
