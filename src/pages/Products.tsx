import { useState } from 'react';
import { Plus, Package, Filter } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useCreatives } from '@/hooks/useCreatives';
import { useSmartCatalog, ProductPriority } from '@/hooks/useSmartCatalog';
import { useAuth } from '@/contexts/AuthContext';
import { SmartProductCard } from '@/components/SmartProductCard';
import { ProductCard } from '@/components/ProductCard';
import { ProductForm } from '@/components/ProductForm';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';
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
import { Edit2, Trash2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Products = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct, uploadProductImage } = useProducts();
  const { sales, loading: salesLoading } = useSales();
  const { creatives, loading: creativesLoading } = useCreatives();
  
  const smartProducts = useSmartCatalog({ products, sales, creatives });
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<ProductPriority | 'all'>('all');

  const loading = productsLoading || salesLoading || creativesLoading;

  const handleDeleteProduct = async () => {
    if (deleteId) {
      await deleteProduct(deleteId);
      setDeleteId(null);
      setViewingProduct(null);
    }
  };

  const handleEditSubmit = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingProduct) return null;
    const success = await updateProduct(editingProduct.id, data);
    if (success) {
      setEditingProduct(null);
      setViewingProduct(null);
      return { ...editingProduct, ...data } as Product;
    }
    return null;
  };

  const handleCreateCreative = (productId: string) => {
    navigate(`/creatives?productId=${productId}`);
  };

  // Get the smart product data for viewing
  const getSmartProduct = (id: string) => smartProducts.find(p => p.id === id);

  // Filter products
  const filteredProducts = priorityFilter === 'all' 
    ? smartProducts 
    : smartProducts.filter(p => p.priorityScore === priorityFilter);

  // Count by priority
  const priorityCounts = {
    alta: smartProducts.filter(p => p.priorityScore === 'alta').length,
    media: smartProducts.filter(p => p.priorityScore === 'media').length,
    baja: smartProducts.filter(p => p.priorityScore === 'baja').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CommandCenterNav />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Cargando catálogo...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-1">
                Catálogo Inteligente
              </h1>
              <p className="text-muted-foreground">
                {smartProducts.length} productos • Ordenados por prioridad
              </p>
            </div>
            
            {isAdmin && (
              <Button onClick={() => setFormOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo producto
              </Button>
            )}
          </div>
        </header>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Badge 
            variant={priorityFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setPriorityFilter('all')}
          >
            Todos ({smartProducts.length})
          </Badge>
          <Badge 
            variant={priorityFilter === 'alta' ? 'default' : 'outline'}
            className="cursor-pointer priority-high border"
            onClick={() => setPriorityFilter('alta')}
          >
            Alta ({priorityCounts.alta})
          </Badge>
          <Badge 
            variant={priorityFilter === 'media' ? 'default' : 'outline'}
            className="cursor-pointer priority-medium border"
            onClick={() => setPriorityFilter('media')}
          >
            Media ({priorityCounts.media})
          </Badge>
          <Badge 
            variant={priorityFilter === 'baja' ? 'default' : 'outline'}
            className="cursor-pointer priority-low border"
            onClick={() => setPriorityFilter('baja')}
          >
            Normal ({priorityCounts.baja})
          </Badge>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <SmartProductCard
                key={product.id}
                product={product}
                onClick={() => setViewingProduct(product)}
                showCosts={isAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 border-2 border-border">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl text-foreground mb-2">
              {priorityFilter !== 'all' ? 'Sin productos en esta categoría' : 'Sin productos aún'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {priorityFilter !== 'all' 
                ? 'Cambia el filtro para ver otros productos'
                : 'Agrega tu primer producto para empezar a construir tu catálogo'
              }
            </p>
            {isAdmin && priorityFilter === 'all' && (
              <Button onClick={() => setFormOpen(true)}>
                + Agregar primer producto
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Form */}
      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={addProduct}
        onUploadImage={uploadProductImage}
      />

      {/* Edit Form */}
      {editingProduct && (
        <ProductForm
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onSubmit={handleEditSubmit}
          onUploadImage={uploadProductImage}
          initialData={editingProduct}
        />
      )}

      {/* View Product Dialog */}
      <Dialog open={!!viewingProduct} onOpenChange={(open) => !open && setViewingProduct(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingProduct?.name}</DialogTitle>
          </DialogHeader>

          {viewingProduct && (
            <div className="space-y-4">
              {viewingProduct.imageUrl && (
                <img
                  src={viewingProduct.imageUrl}
                  alt={viewingProduct.name}
                  className="w-full h-64 object-cover rounded-lg border-2 border-border"
                />
              )}

              {/* Smart metrics */}
              {(() => {
                const smart = getSmartProduct(viewingProduct.id);
                return smart && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-secondary rounded-lg">
                      <div className="text-lg font-bold text-foreground">{smart.salesLast30Days}</div>
                      <div className="text-xs text-muted-foreground">Ventas 30d</div>
                    </div>
                    <div className="p-3 bg-secondary rounded-lg">
                      <div className="text-lg font-bold text-foreground">{smart.creativesCount}</div>
                      <div className="text-xs text-muted-foreground">Creativos</div>
                    </div>
                    {isAdmin && (
                      <div className="p-3 bg-secondary rounded-lg">
                        <div className="text-lg font-bold text-success">{smart.marginPercent.toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">Margen</div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="text-3xl font-bold text-primary">
                ${viewingProduct.suggestedPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                <span className="text-sm text-muted-foreground font-normal ml-2">precio sugerido</span>
              </div>

              {isAdmin && (
                <div className="text-sm text-muted-foreground">
                  Costo proveedor: ${viewingProduct.supplierPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              )}

              {viewingProduct.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Descripción:</span>
                  <p className="text-foreground">{viewingProduct.description}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleCreateCreative(viewingProduct.id)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Crear creativo
                </Button>
                
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingProduct(viewingProduct);
                        setViewingProduct(null);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteId(viewingProduct.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Products;
