import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatives } from '@/hooks/useCreatives';
import { useProducts } from '@/hooks/useProducts';
import { useCreativeIntelligence } from '@/hooks/useCreativeIntelligence';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { CreativeCard } from '@/components/creatives/CreativeCard';
import { CreativeFilters, CreativeFiltersState } from '@/components/creatives/CreativeFilters';
import { CreativeInsightsPanel } from '@/components/creatives/CreativeInsights';
import { CreativeForm } from '@/components/creatives/CreativeForm';
import { CreativeComparison } from '@/components/creatives/CreativeComparison';
import { CreativeActions } from '@/components/creatives/CreativeActions';
import { Creative, CreativeIntelligence } from '@/types';
import { 
  Plus, 
  Sparkles,
  LayoutGrid,
  Package,
  Brain,
} from 'lucide-react';

export default function Creatives() {
  const { isAdmin } = useAuth();
  const { creatives, loading, addCreative, updateCreative, deleteCreative } = useCreatives();
  const { products } = useProducts();
  const { enrichedCreatives, insights, byProduct } = useCreativeIntelligence(creatives);
  
  const [viewMode, setViewMode] = useState<'global' | 'product'>('global');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCreative, setEditingCreative] = useState<Creative | null>(null);
  const [selectedCreative, setSelectedCreative] = useState<CreativeIntelligence | null>(null);
  const [filters, setFilters] = useState<CreativeFiltersState>({
    channel: null,
    performance: null,
    hookType: null,
    audience: null,
  });

  // Filter creatives
  const filteredCreatives = useMemo(() => {
    return enrichedCreatives.filter(c => {
      if (filters.channel && c.channel !== filters.channel) return false;
      if (filters.performance && c.calculatedPerformance !== filters.performance) return false;
      if (filters.hookType && c.hookType !== filters.hookType) return false;
      if (filters.audience && c.targetAudience !== filters.audience) return false;
      return true;
    });
  }, [enrichedCreatives, filters]);

  const handleFormSubmit = async (formData: {
    productId: string;
    type: Creative['type'];
    channel: Creative['channel'];
    objective: Creative['objective'];
    targetAudience?: Creative['targetAudience'];
    audienceNotes?: string;
    hookType?: Creative['hookType'];
    hookText?: string;
    variation?: string;
    messageApproach?: Creative['messageApproach'];
    title?: string;
    copy?: string;
    learning?: string;
    metricLikes?: number;
    metricComments?: number;
    metricMessages?: number;
    metricSales?: number;
    metricImpressions?: number;
    metricClicks?: number;
    metricCost?: number;
    metricKnownPeople?: Creative['metricKnownPeople'];
    engagementLevel?: Creative['engagementLevel'];
  }) => {
    const creativeData = {
      ...formData,
      productId: formData.productId || undefined,
      status: 'pendiente' as const,
      result: 'sin_evaluar' as const,
      targetAudience: formData.targetAudience || undefined,
      hookType: formData.hookType || undefined,
      messageApproach: formData.messageApproach || undefined,
    };
    
    if (editingCreative) {
      await updateCreative(editingCreative.id, creativeData);
    } else {
      await addCreative(creativeData);
    }
    setFormOpen(false);
    setEditingCreative(null);
  };

  const handleEdit = (creative: Creative) => {
    setEditingCreative(creative);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCreative(deleteId);
      setDeleteId(null);
    }
  };

  const handleView = (creative: CreativeIntelligence) => {
    setSelectedCreative(creative);
  };

  const handleRepeat = (creative: CreativeIntelligence) => {
    // Register repeat intent
    updateCreative(creative.id, { automationIntent: 'repeat' });
  };

  const handleScale = (creative: CreativeIntelligence) => {
    // Register scale intent
    updateCreative(creative.id, { automationIntent: 'generate_new' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CommandCenterNav />
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Cargando creativos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />
      
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                  Creative Intelligence
                </h1>
              </div>
              <p className="text-muted-foreground">
                El cerebro de tu contenido de venta • Experimenta, mide, aprende
              </p>
            </div>
            
            {isAdmin && (
              <Button 
                size="lg"
                className="gap-2"
                onClick={() => {
                  setEditingCreative(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Nuevo Experimento
              </Button>
            )}
          </div>

          {/* View Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'global' | 'product')}>
            <TabsList>
              <TabsTrigger value="global" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Vista Global
              </TabsTrigger>
              <TabsTrigger value="product" className="gap-2">
                <Package className="w-4 h-4" />
                Por Producto
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        {/* Insights Panel */}
        <CreativeInsightsPanel insights={insights} />

        {/* Main Content */}
        <div className="grid lg:grid-cols-[280px,1fr] gap-6">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block">
            <CreativeFilters filters={filters} onChange={setFilters} />
          </aside>

          {/* Creatives Grid */}
          <main>
            {viewMode === 'global' ? (
              filteredCreatives.length > 0 ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredCreatives.map((creative) => (
                    <CreativeCard
                      key={creative.id}
                      creative={creative}
                      onView={handleView}
                      onRepeat={handleRepeat}
                      onScale={handleScale}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState onCreateClick={() => setFormOpen(true)} isAdmin={isAdmin} />
              )
            ) : (
              <ProductView 
                byProduct={byProduct} 
                products={products}
                onView={handleView}
                onRepeat={handleRepeat}
                onScale={handleScale}
                isAdmin={isAdmin}
              />
            )}
          </main>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={formOpen} 
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCreative(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {editingCreative ? 'Editar Experimento' : 'Nuevo Experimento Creativo'}
            </DialogTitle>
          </DialogHeader>
          <CreativeForm
            products={products}
            initialData={editingCreative || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditingCreative(null);
            }}
            isEditing={!!editingCreative}
          />
        </DialogContent>
      </Dialog>

      {/* Creative Detail Sheet */}
      <Sheet 
        open={!!selectedCreative} 
        onOpenChange={(open) => !open && setSelectedCreative(null)}
      >
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalle del Creativo</SheetTitle>
          </SheetHeader>
          {selectedCreative && (
            <div className="space-y-6 mt-6">
              {/* Basic info */}
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedCreative.title || selectedCreative.product?.name || 'Sin título'}
                </h3>
                {selectedCreative.product && (
                  <p className="text-sm text-muted-foreground">
                    📦 {selectedCreative.product.name}
                  </p>
                )}
              </div>

              {/* Copy */}
              {selectedCreative.copy && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Copy</h4>
                  <p className="text-foreground">{selectedCreative.copy}</p>
                </div>
              )}

              {/* Learning */}
              {selectedCreative.learning && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="text-sm font-medium mb-1">🧠 Aprendizaje</h4>
                  <p className="text-sm">{selectedCreative.learning}</p>
                </div>
              )}

              {/* Comparison */}
              <CreativeComparison
                current={selectedCreative}
                previous={selectedCreative.previousCreative as CreativeIntelligence | undefined}
              />

              {/* Actions */}
              {isAdmin && (
                <CreativeActions
                  creative={selectedCreative}
                  onIntentRegistered={(intent) => {
                    updateCreative(selectedCreative.id, { automationIntent: intent });
                  }}
                />
              )}

              {/* Edit/Delete buttons */}
              {isAdmin && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedCreative(null);
                      handleEdit(selectedCreative);
                    }}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedCreative(null);
                      setDeleteId(selectedCreative.id);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar creativo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se perderán todas las métricas y aprendizajes asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Empty State Component
function EmptyState({ onCreateClick, isAdmin }: { onCreateClick: () => void; isAdmin: boolean }) {
  return (
    <div className="grc-card p-12 text-center">
      <Brain className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Sin experimentos creativos aún
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Crea tu primer experimento para empezar a medir qué mensajes venden más y aprender de cada pieza de contenido.
      </p>
      {isAdmin && (
        <Button size="lg" onClick={onCreateClick}>
          <Plus className="w-4 h-4 mr-2" />
          Crear primer experimento
        </Button>
      )}
    </div>
  );
}

// Product View Component
function ProductView({ 
  byProduct, 
  products,
  onView,
  onRepeat,
  onScale,
  isAdmin,
}: {
  byProduct: Map<string, CreativeIntelligence[]>;
  products: { id: string; name: string; imageUrl?: string }[];
  onView: (c: CreativeIntelligence) => void;
  onRepeat: (c: CreativeIntelligence) => void;
  onScale: (c: CreativeIntelligence) => void;
  isAdmin: boolean;
}) {
  if (byProduct.size === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p>No hay creativos asociados a productos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Array.from(byProduct.entries()).map(([productId, creatives]) => {
        const product = products.find(p => p.id === productId);
        const hotCount = creatives.filter(c => c.calculatedPerformance === 'caliente').length;
        
        return (
          <div key={productId} className="space-y-4">
            {/* Product Header */}
            <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
              {product?.imageUrl && (
                <img 
                  src={product.imageUrl} 
                  alt={product?.name} 
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{product?.name || 'Producto'}</h3>
                <p className="text-sm text-muted-foreground">
                  {creatives.length} creativos • {hotCount} 🔥 calientes
                </p>
              </div>
            </div>

            {/* Creatives Grid */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 pl-4 border-l-2 border-border ml-8">
              {creatives.map((creative) => (
                <CreativeCard
                  key={creative.id}
                  creative={creative}
                  onView={onView}
                  onRepeat={onRepeat}
                  onScale={onScale}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
