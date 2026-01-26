import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Filter, TrendingUp, Pause, AlertTriangle, Search } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useCreatives } from '@/hooks/useCreatives';
import { useSmartCatalog, ProductPriority } from '@/hooks/useSmartCatalog';
import { useAuth } from '@/contexts/AuthContext';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductForm } from '@/components/products/ProductForm';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type FilterType = 'all' | ProductPriority | 'sin_creativos' | 'destacados';

const Products = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { products, loading: productsLoading, addProduct, uploadProductImage, checkSkuAvailable } = useProducts();
  const { sales, loading: salesLoading } = useSales();
  const { creatives, loading: creativesLoading } = useCreatives();
  
  const smartProducts = useSmartCatalog({ products, sales, creatives });
  
  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loading = productsLoading || salesLoading || creativesLoading;

  // Filter products
  const filteredProducts = smartProducts.filter(p => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(query) && 
          !(p.sku?.toLowerCase().includes(query))) {
        return false;
      }
    }
    
    // Category filter
    if (filter === 'all') return true;
    if (filter === 'alta' || filter === 'media' || filter === 'baja') return p.priorityScore === filter;
    if (filter === 'sin_creativos') return p.needsCreatives;
    if (filter === 'destacados') return p.isFeatured;
    return true;
  });

  // Stats
  const stats = {
    total: products.length,
    activos: products.filter(p => p.status === 'activo').length,
    pausados: products.filter(p => p.status === 'pausado').length,
    agotados: products.filter(p => p.status === 'agotado').length,
    destacados: products.filter(p => p.isFeatured).length,
    sinCreativos: smartProducts.filter(p => p.needsCreatives).length,
  };

  const handleCreateCreative = (productId: string) => {
    navigate(`/creatives?productId=${productId}`);
  };

  const handleRegisterSale = (productId: string) => {
    navigate(`/sales?productId=${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CommandCenterNav />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-6 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-foreground mb-1">Catálogo Inteligente</h1>
              <p className="text-muted-foreground">{stats.total} productos en tu inventario</p>
            </div>
            
            {isAdmin && (
              <Button onClick={() => setFormOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" />
                Nuevo producto
              </Button>
            )}
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <Card 
            className={cn(
              "interactive-card",
              filter === 'all' && "ring-2 ring-primary ring-offset-2"
            )}
            onClick={() => setFilter('all')}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{stats.activos}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 font-medium">
                <TrendingUp className="w-3 h-3" /> Activos
              </div>
            </CardContent>
          </Card>
          <Card 
            className={cn(
              "interactive-card",
              filter === 'destacados' && "ring-2 ring-primary ring-offset-2"
            )}
            onClick={() => setFilter('destacados')}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.destacados}</div>
              <div className="text-xs text-muted-foreground font-medium">⭐ Destacados</div>
            </CardContent>
          </Card>
          <Card 
            className={cn(
              "interactive-card",
              filter === 'sin_creativos' && "ring-2 ring-primary ring-offset-2"
            )}
            onClick={() => setFilter('sin_creativos')}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{stats.sinCreativos}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 font-medium">
                <AlertTriangle className="w-3 h-3" /> Sin creativos
              </div>
            </CardContent>
          </Card>
          <Card className="grc-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{stats.pausados + stats.agotados}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 font-medium">
                <Pause className="w-3 h-3" /> Inactivos
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {[
              { key: 'all', label: 'Todos' },
              { key: 'alta', label: 'Prioridad Alta', variant: 'destructive' },
              { key: 'media', label: 'Media', variant: 'warning' },
              { key: 'baja', label: 'Normal', variant: 'success' },
            ].map(({ key, label }) => (
              <Badge 
                key={key}
                variant={filter === key ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer transition-all",
                  filter === key && "shadow-md"
                )}
                onClick={() => setFilter(key as FilterType)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            {filteredProducts.map((product, index) => (
              <div 
                key={product.id}
                className="animate-scale-in"
                style={{ animationDelay: `${0.02 * index}s` }}
              >
                <ProductCard
                  product={product}
                  onClick={() => navigate(`/products/${product.id}`)}
                  onCreateCreative={handleCreateCreative}
                  onRegisterSale={handleRegisterSale}
                  showCosts={isAdmin}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">
              {filter !== 'all' || searchQuery ? 'Sin resultados' : 'Sin productos aún'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {filter !== 'all' || searchQuery
                ? 'Intenta con otro filtro o búsqueda'
                : 'Agrega tu primer producto para empezar'
              }
            </p>
            {isAdmin && filter === 'all' && !searchQuery && (
              <Button onClick={() => setFormOpen(true)} className="shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Agregar primer producto
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
        checkSkuAvailable={checkSkuAvailable}
      />
    </div>
  );
};

export default Products;
