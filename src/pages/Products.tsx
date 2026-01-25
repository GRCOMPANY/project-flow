import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Filter, TrendingUp, Pause, AlertTriangle } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useCreatives } from '@/hooks/useCreatives';
import { useSmartCatalog, ProductPriority } from '@/hooks/useSmartCatalog';
import { useAuth } from '@/contexts/AuthContext';
import { SmartProductCardNew } from '@/components/products/SmartProductCardNew';
import { ProductFormNew } from '@/components/products/ProductFormNew';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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

  const loading = productsLoading || salesLoading || creativesLoading;

  // Filter products
  const filteredProducts = smartProducts.filter(p => {
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
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Catálogo Inteligente</h1>
              <p className="text-muted-foreground">{stats.total} productos</p>
            </div>
            
            {isAdmin && (
              <Button onClick={() => setFormOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo producto
              </Button>
            )}
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilter('all')}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.activos}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" /> Activos
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilter('destacados')}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.destacados}</div>
              <div className="text-xs text-muted-foreground">⭐ Destacados</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-warning transition-colors" onClick={() => setFilter('sin_creativos')}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{stats.sinCreativos}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Sin creativos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{stats.pausados + stats.agotados}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Pause className="w-3 h-3" /> Inactivos
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {[
            { key: 'all', label: 'Todos' },
            { key: 'alta', label: 'Prioridad Alta' },
            { key: 'media', label: 'Media' },
            { key: 'baja', label: 'Normal' },
            { key: 'sin_creativos', label: 'Sin creativos' },
            { key: 'destacados', label: 'Destacados' },
          ].map(({ key, label }) => (
            <Badge 
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter(key as FilterType)}
            >
              {label}
            </Badge>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <SmartProductCardNew
                key={product.id}
                product={product}
                onClick={() => navigate(`/products/${product.id}`)}
                onCreateCreative={handleCreateCreative}
                onRegisterSale={handleRegisterSale}
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
              {filter !== 'all' ? 'Sin productos en este filtro' : 'Sin productos aún'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {filter !== 'all' 
                ? 'Cambia el filtro para ver otros productos'
                : 'Agrega tu primer producto para empezar'
              }
            </p>
            {isAdmin && filter === 'all' && (
              <Button onClick={() => setFormOpen(true)}>
                + Agregar primer producto
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Form */}
      <ProductFormNew
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
