import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useCreatives } from '@/hooks/useCreatives';
import { useSmartTasks } from '@/hooks/useSmartTasks';
import { useBusinessSummary } from '@/hooks/useBusinessSummary';
import { useSmartCatalog } from '@/hooks/useSmartCatalog';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { PriorityTaskCard } from '@/components/command-center/PriorityTaskCard';
import { BusinessMetricCard } from '@/components/command-center/BusinessMetricCard';
import { DailyInsight } from '@/components/command-center/DailyInsight';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Image as ImageIcon,
  Plus,
  TrendingUp,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function CommandCenter() {
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { sales, loading: salesLoading, updateSale } = useSales();
  const { creatives, loading: creativesLoading } = useCreatives();

  const loading = productsLoading || salesLoading || creativesLoading;

  const smartTasks = useSmartTasks({ sales, products, creatives });
  const summary = useBusinessSummary({ sales, products, creatives });
  const smartProducts = useSmartCatalog({ products, sales, creatives });

  const handleMarkPaid = async (saleId: string) => {
    await updateSale(saleId, { paymentStatus: 'pagado' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CommandCenterNav />
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Cargando centro de control...</p>
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
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-1">
                {getGreeting()}, {profile?.fullName?.split(' ')[0]} 👋
              </h1>
              <p className="text-lg text-muted-foreground">
                {smartTasks.length > 0 
                  ? `Tienes ${smartTasks.length} acciones prioritarias hoy`
                  : '¡Todo en orden! No hay acciones pendientes'}
              </p>
            </div>
            
            {isAdmin && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/sales')}
                  className="gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nueva venta</span>
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/creatives')}
                  className="gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Crear creativo</span>
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Daily Insight (AI Command Center MVP) */}
        {isAdmin && (
          <section className="mb-8">
            <DailyInsight 
              summary={summary}
              smartProducts={smartProducts}
              tasks={smartTasks}
            />
          </section>
        )}

        {/* NIVEL 1: Priority Actions */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 rounded-full grc-gradient" />
            <h2 className="text-xl font-semibold text-foreground">
              Acciones Prioritarias
            </h2>
          </div>

          {smartTasks.length > 0 ? (
            <div className="space-y-3">
              {smartTasks.map((task) => (
                <PriorityTaskCard 
                  key={task.id} 
                  task={task}
                  onAction={
                    task.type === 'cobro' && task.relatedSaleId
                      ? () => handleMarkPaid(task.relatedSaleId!)
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="grc-card p-8 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                ¡Excelente trabajo!
              </h3>
              <p className="text-muted-foreground">
                No hay acciones pendientes. El negocio está al día.
              </p>
            </div>
          )}
        </section>

        {/* NIVEL 2: Business Status */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 rounded-full grc-gold-gradient" />
            <h2 className="text-xl font-semibold text-foreground">
              Estado del Negocio
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <BusinessMetricCard
              icon={<ShoppingCart className="w-5 h-5" />}
              label="Ventas del mes"
              value={summary.salesThisMonth}
              sublabel={`$${summary.revenueThisMonth.toLocaleString()}`}
              variant="success"
            />
            
            <BusinessMetricCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Pagos pendientes"
              value={summary.pendingCollections}
              sublabel={`$${summary.pendingCollectionAmount.toLocaleString()}`}
              variant={summary.pendingCollections > 0 ? 'danger' : 'default'}
            />
            
            <BusinessMetricCard
              icon={<Package className="w-5 h-5" />}
              label="Productos activos"
              value={summary.activeProducts}
              sublabel={`${summary.featuredProducts} destacados`}
              variant="default"
            />
            
            <BusinessMetricCard
              icon={<ImageIcon className="w-5 h-5" />}
              label="Creativos"
              value={summary.creativesPublished}
              sublabel={`${summary.creativesPending} pendientes`}
              variant={summary.creativesPending > 0 ? 'warning' : 'default'}
            />
          </div>
        </section>

        {/* Quick Actions */}
        {isAdmin && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-6 rounded-full bg-secondary" />
              <h2 className="text-xl font-semibold text-foreground">
                Acceso Rápido
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/products')}
              >
                <Package className="w-5 h-5" />
                <span className="text-sm">Productos</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/creatives')}
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm">Creativos</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/sales')}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm">Ventas</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/ai')}
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-sm">IA</span>
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
