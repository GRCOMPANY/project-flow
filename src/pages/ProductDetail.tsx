import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useCreatives } from '@/hooks/useCreatives';
import { useAuth } from '@/contexts/AuthContext';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { ProductFormNew } from '@/components/products/ProductFormNew';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, Edit2, Trash2, Package, TrendingUp, DollarSign, 
  Clock, Image as ImageIcon, Sparkles, ShoppingCart, Send, 
  ListTodo, Percent, Star, AlertTriangle
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
            <div className="aspect-video rounded-xl border-2 border-border overflow-hidden bg-secondary flex items-center justify-center">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-20 h-20 text-muted-foreground" />
              )}
            </div>

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

            {/* Performance Card */}
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

            {/* Creatives Card */}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Creativos ({productCreatives.length})
                </CardTitle>
                <Button size="sm" onClick={() => navigate(`/creatives?productId=${id}`)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Crear creativo
                </Button>
              </CardHeader>
              <CardContent>
                {productCreatives.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {productCreatives.slice(0, 6).map((creative) => (
                      <div 
                        key={creative.id}
                        className="aspect-square rounded-lg border border-border bg-secondary overflow-hidden relative group cursor-pointer"
                        onClick={() => navigate('/creatives')}
                      >
                        {creative.imageUrl ? (
                          <img src={creative.imageUrl} alt={creative.title || ''} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <Badge 
                          className="absolute bottom-2 left-2 text-xs"
                          variant={creative.status === 'publicado' ? 'default' : 'secondary'}
                        >
                          {creative.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-warning" />
                    <p className="font-medium">Sin creativos</p>
                    <p className="text-sm">Crea contenido para promocionar este producto</p>
                  </div>
                )}
              </CardContent>
            </Card>

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
      <ProductFormNew
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
