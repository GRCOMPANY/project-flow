import { useState } from 'react';
import { Plus, Trash2, Edit2, Package } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/contexts/AuthContext';
import { ProductCard } from '@/components/ProductCard';
import { ProductForm } from '@/components/ProductForm';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
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

const Products = () => {
  const { isAdmin } = useAuth();
  const { products, loading, addProduct, updateProduct, deleteProduct, uploadProductImage } = useProducts();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
          <h1 className="text-5xl font-bold text-foreground mb-2">Productos</h1>
          <p className="text-muted-foreground">
            Catálogo de productos, precios y referencias
          </p>
        </header>

        {products.length > 0 ? (
          <>
            {isAdmin && (
              <div className="flex justify-end mb-6">
                <Button onClick={() => setFormOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo producto
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setViewingProduct(product)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 border-2 border-border">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl text-foreground mb-2">Sin productos aún</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Agrega tu primer producto para empezar a construir tu catálogo
            </p>
            {isAdmin && (
              <button
                onClick={() => setFormOpen(true)}
                className="sketch-card px-6 py-3 text-foreground font-medium hover:bg-secondary transition-colors"
              >
                + Agregar primer producto
              </button>
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

              <div className="text-3xl font-bold text-primary">
                ${viewingProduct.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>

              {viewingProduct.storeName && (
                <div>
                  <span className="text-sm text-muted-foreground">Referencia:</span>
                  <p className="text-foreground">{viewingProduct.storeName}</p>
                </div>
              )}

              {viewingProduct.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Descripción:</span>
                  <p className="text-foreground">{viewingProduct.description}</p>
                </div>
              )}

              {isAdmin && (
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingProduct(viewingProduct);
                      setViewingProduct(null);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteId(viewingProduct.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
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
