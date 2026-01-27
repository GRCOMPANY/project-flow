import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useCreatives } from '@/hooks/useCreatives';
import { useTasks } from '@/hooks/useTasks';
import { useBusinessSummary } from '@/hooks/useBusinessSummary';
import { useSmartCatalog } from '@/hooks/useSmartCatalog';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskCloseModal } from '@/components/tasks/TaskCloseModal';
import { BusinessMetricCard } from '@/components/command-center/BusinessMetricCard';
import { DailyInsight } from '@/components/command-center/DailyInsight';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OperationalTask } from '@/types';
import { 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Image as ImageIcon,
  Plus,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ListTodo,
  Trophy
} from 'lucide-react';

export default function CommandCenter() {
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { sales, loading: salesLoading, updateSale } = useSales();
  const { creatives, loading: creativesLoading } = useCreatives();
  const { 
    todayTasks, 
    tasks,
    outcomeStats,
    loading: tasksLoading, 
    resolveTask, 
    dismissTask, 
    updateTaskStatus,
    completeWithOutcome
  } = useTasks();

  const loading = productsLoading || salesLoading || creativesLoading || tasksLoading;

  const summary = useBusinessSummary({ sales, products, creatives });
  const smartProducts = useSmartCatalog({ products, sales, creatives });

  // State for close modal
  const [closeModalTask, setCloseModalTask] = useState<OperationalTask | null>(null);

  const handleMarkPaid = async (saleId: string) => {
    await updateSale(saleId, { paymentStatus: 'pagado' });
  };

  // Open modal instead of resolving directly
  const handleResolveTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setCloseModalTask(task);
    }
  };

  const handleDismissTask = async (id: string, reason: string) => {
    await dismissTask(id, reason);
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
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Header skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-12 w-80" />
              <Skeleton className="h-6 w-48" />
            </div>
            {/* Insight skeleton */}
            <Skeleton className="h-32 w-full rounded-2xl" />
            {/* Tasks skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
            {/* Metrics skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
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
        <header className="mb-8 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-foreground mb-2">
                {getGreeting()}, {profile?.fullName?.split(' ')[0]} 👋
              </h1>
              <p className="text-lg text-muted-foreground">
                {todayTasks.length > 0 
                  ? `Tienes ${todayTasks.length} acciones prioritarias hoy`
                  : '¡Todo en orden! No hay acciones pendientes'}
              </p>
            </div>
            
            {isAdmin && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/sales')}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nueva venta</span>
                </Button>
                <Button 
                  onClick={() => navigate('/creatives')}
                  className="gap-2 shadow-lg shadow-primary/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Crear creativo</span>
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Daily Insight */}
        {isAdmin && (
          <section className="mb-8">
            <DailyInsight 
              summary={summary}
              smartProducts={smartProducts}
              tasks={todayTasks}
            />
          </section>
        )}

        {/* Priority Actions */}
        <section className="mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="section-header">
            <div className="section-indicator grc-gradient" />
            <h2 className="text-xl font-semibold text-foreground">
              Acciones Prioritarias
            </h2>
          </div>

          {todayTasks.length > 0 ? (
            <div className="space-y-3">
              {todayTasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className="animate-fade-up"
                  style={{ animationDelay: `${0.05 * (index + 1)}s` }}
                >
                  <TaskCard 
                    task={task}
                    onResolve={handleResolveTask}
                    onDismiss={handleDismissTask}
                    onStatusChange={updateTaskStatus}
                  />
                </div>
              ))}
              
              {/* Link to see all tasks */}
              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/tasks')}
              >
                <ListTodo className="w-4 h-4" />
                Ver todas las tareas
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="grc-card p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                ¡Excelente trabajo!
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                No hay acciones pendientes. El negocio está al día.
              </p>
            </div>
          )}
        </section>

        {/* Business Status */}
        <section className="mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="section-header">
            <div className="section-indicator grc-gold-gradient" />
            <h2 className="text-xl font-semibold text-foreground">
              Estado del Negocio
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <BusinessMetricCard
              icon={<ShoppingCart className="w-5 h-5" />}
              label="Ventas del mes"
              value={summary.salesThisMonth}
              sublabel={`$${summary.revenueThisMonth.toLocaleString()}`}
              variant="success"
              onClick={() => navigate('/sales')}
            />
            
            <BusinessMetricCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Pendiente de cobro"
              value={summary.pendingCollections}
              sublabel={`$${summary.pendingCollectionAmount.toLocaleString()}`}
              variant={summary.pendingCollections > 0 ? 'danger' : 'default'}
              onClick={() => navigate('/sales')}
            />
            
            <BusinessMetricCard
              icon={<Package className="w-5 h-5" />}
              label="Productos activos"
              value={summary.activeProducts}
              sublabel={`${summary.featuredProducts} destacados`}
              variant="default"
              onClick={() => navigate('/products')}
            />
            
            <BusinessMetricCard
              icon={<ImageIcon className="w-5 h-5" />}
              label="Creativos"
              value={summary.creativesPublished}
              sublabel={`${summary.creativesPending} pendientes`}
              variant={summary.creativesPending > 0 ? 'warning' : 'default'}
              onClick={() => navigate('/creatives')}
            />
          </div>
        </section>

        {/* Today's Results - Only show if there are completed tasks today */}
        {outcomeStats.completedToday > 0 && (
          <section className="mb-8 animate-fade-up" style={{ animationDelay: '0.25s' }}>
            <div className="section-header">
              <div className="section-indicator bg-success" />
              <h2 className="text-xl font-semibold text-foreground">
                Resultados de Hoy
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grc-card p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/10">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{outcomeStats.completedToday}</p>
                  <p className="text-xs text-muted-foreground">Cerradas</p>
                </div>
              </div>
              
              <div className="grc-card p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{outcomeStats.withIncome}</p>
                  <p className="text-xs text-muted-foreground">Con ingreso</p>
                </div>
              </div>
              
              <div className="grc-card p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/10">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">${outcomeStats.totalRecovered.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Recuperado hoy</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Quick Actions */}
        {isAdmin && (
          <section className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="section-header">
              <div className="section-indicator bg-secondary" />
              <h2 className="text-xl font-semibold text-foreground">
                Acceso Rápido
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto py-5 flex-col gap-2.5 grc-card hover:bg-secondary/50 border-border/50"
                onClick={() => navigate('/products')}
              >
                <Package className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium">Productos</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-5 flex-col gap-2.5 grc-card hover:bg-secondary/50 border-border/50"
                onClick={() => navigate('/creatives')}
              >
                <ImageIcon className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium">Creativos</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-5 flex-col gap-2.5 grc-card hover:bg-secondary/50 border-border/50"
                onClick={() => navigate('/sales')}
              >
                <TrendingUp className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium">Ventas</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-5 flex-col gap-2.5 grc-card hover:bg-secondary/50 border-border/50"
                onClick={() => navigate('/ai')}
              >
                <Sparkles className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium">Inteligencia IA</span>
              </Button>
            </div>
          </section>
        )}
      </div>

      {/* Task Close Modal */}
      <TaskCloseModal
        task={closeModalTask}
        open={!!closeModalTask}
        onOpenChange={(open) => !open && setCloseModalTask(null)}
        onSubmit={completeWithOutcome}
      />
    </div>
  );
}
