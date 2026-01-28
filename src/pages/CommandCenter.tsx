import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useCreatives } from '@/hooks/useCreatives';
import { useTasks } from '@/hooks/useTasks';
import { useBusinessSummary } from '@/hooks/useBusinessSummary';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { AlertStrip, Alert } from '@/components/command-center/AlertStrip';
import { ActionCard } from '@/components/command-center/ActionCard';
import { TaskCloseModal } from '@/components/tasks/TaskCloseModal';
import { BusinessMetricCard } from '@/components/command-center/BusinessMetricCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OperationalTask, OperationalStatus } from '@/types';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  ListTodo,
  Trophy,
  AlertTriangle,
  PhoneCall,
  Clock,
} from 'lucide-react';

// Helper to calculate days since a date
function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

// Helper to determine next operational status
function getNextOperationalStatus(current: OperationalStatus): OperationalStatus {
  const flow: Record<OperationalStatus, OperationalStatus> = {
    nuevo: 'contactado',
    contactado: 'confirmado',
    confirmado: 'en_ruta',
    en_ruta: 'entregado',
    sin_respuesta: 'contactado',
    riesgo_devolucion: 'contactado',
    entregado: 'entregado',
  };
  return flow[current] || current;
}

const statusLabels: Record<OperationalStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  confirmado: 'Confirmado',
  sin_respuesta: 'Sin respuesta',
  en_ruta: 'En ruta',
  entregado: 'Entregado',
  riesgo_devolucion: 'En riesgo',
};

export default function CommandCenter() {
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { sales, loading: salesLoading, updateSale, updateOperationalStatus } = useSales();
  const { creatives, loading: creativesLoading } = useCreatives();
  const { 
    todayTasks, 
    tasks,
    outcomeStats,
    loading: tasksLoading, 
    resolveTask,
    completeWithOutcome
  } = useTasks();

  const loading = productsLoading || salesLoading || creativesLoading || tasksLoading;

  const summary = useBusinessSummary({ sales, products, creatives });

  // State for close modal
  const [closeModalTask, setCloseModalTask] = useState<OperationalTask | null>(null);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);

  // Calculate diagnostic alerts
  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];
    
    // 1. Pending collection (MONEY - RED)
    const pendingAmount = sales
      .filter(s => s.paymentStatus === 'pendiente')
      .reduce((sum, s) => sum + s.totalAmount, 0);
    if (pendingAmount > 0) {
      result.push({
        id: 'pending-payment',
        icon: DollarSign,
        value: `$${pendingAmount.toLocaleString()}`,
        label: 'por cobrar',
        variant: 'danger',
        path: '/sales'
      });
    }
    
    // 2. Unconfirmed > 2 days (WARNING)
    const sinConfirmarViejo = sales.filter(s => {
      if (s.operationalStatus !== 'nuevo') return false;
      const days = daysSince(s.statusUpdatedAt || s.saleDate);
      return days > 2;
    }).length;
    if (sinConfirmarViejo > 0) {
      result.push({
        id: 'unconfirmed',
        icon: PhoneCall,
        value: sinConfirmarViejo,
        label: 'sin confirmar',
        variant: 'warning',
        path: '/sales'
      });
    }
    
    // 3. At risk (CRITICAL - RED)
    const enRiesgo = sales.filter(s => 
      s.operationalStatus === 'riesgo_devolucion' || 
      s.operationalStatus === 'sin_respuesta'
    ).length;
    if (enRiesgo > 0) {
      result.push({
        id: 'at-risk',
        icon: AlertTriangle,
        value: enRiesgo,
        label: 'en riesgo',
        variant: 'danger',
        path: '/sales'
      });
    }

    // 4. Pending actions (INFO)
    const pendingAction = sales.filter(s => 
      s.operationalStatus !== 'entregado' && 
      !(s.orderStatus === 'entregado' && s.paymentStatus === 'pagado')
    ).length;
    if (pendingAction > 0 && pendingAction !== sinConfirmarViejo && pendingAction !== enRiesgo) {
      result.push({
        id: 'pending-action',
        icon: Clock,
        value: pendingAction,
        label: 'en seguimiento',
        variant: 'info',
        path: '/sales'
      });
    }
    
    return result;
  }, [sales]);

  // Execute action directly based on task type
  const executeDirectAction = async (task: OperationalTask) => {
    setExecutingTaskId(task.id);
    
    try {
      const sale = sales.find(s => s.id === task.relatedSaleId);
      
      switch (task.type) {
        case 'seguimiento_venta':
          if (!sale) {
            navigate(task.actionPath || '/sales');
            return;
          }
          // Advance to next logical status
          const nextStatus = getNextOperationalStatus(sale.operationalStatus);
          await updateOperationalStatus(sale.id, nextStatus);
          toast.success(`Estado actualizado: ${statusLabels[nextStatus]}`);
          break;
          
        case 'cobro':
          if (!sale) {
            navigate(task.actionPath || '/sales');
            return;
          }
          // Open modal to complete with outcome (money recovered)
          setCloseModalTask(task);
          return; // Don't clear executing state yet
          
        case 'creativo':
          navigate('/creatives');
          break;
          
        default:
          // Fallback: navigate to action path
          if (task.actionPath) {
            navigate(task.actionPath);
          }
      }
    } catch (error) {
      toast.error('Error al ejecutar la acción');
    } finally {
      setExecutingTaskId(null);
    }
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
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32 rounded-full" />
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
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
      
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header - Compact */}
        <header className="mb-6 animate-fade-up">
          <h1 className="text-2xl font-semibold text-foreground">
            {getGreeting()}, {profile?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {todayTasks.length > 0 
              ? `${todayTasks.length} acciones prioritarias`
              : 'Todo en orden'}
          </p>
        </header>

        {/* 1. ALERTS - Diagnostic Strip */}
        {alerts.length > 0 && (
          <section className="mb-8 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <AlertStrip alerts={alerts} />
          </section>
        )}

        {/* 2. PRIORITY ACTIONS - Max 5 */}
        <section className="mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Acciones de Hoy
          </h2>

          {todayTasks.length > 0 ? (
            <div className="space-y-3">
              {todayTasks.slice(0, 5).map((task, index) => (
                <div 
                  key={task.id} 
                  className="animate-fade-up"
                  style={{ animationDelay: `${0.05 * (index + 1)}s` }}
                >
                  <ActionCard 
                    task={task}
                    onExecute={() => executeDirectAction(task)}
                    executing={executingTaskId === task.id}
                  />
                </div>
              ))}
              
              {/* Link to audit view */}
              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground hover:text-foreground mt-2"
                onClick={() => navigate('/tasks')}
              >
                <ListTodo className="w-4 h-4" />
                Ver historial completo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="grc-card p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                ¡Todo al día!
              </h3>
              <p className="text-sm text-muted-foreground">
                No hay acciones pendientes
              </p>
            </div>
          )}
        </section>

        {/* 3. BUSINESS STATUS - Metrics */}
        <section className="mb-8 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Estado del Negocio
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              label="Por cobrar"
              value={summary.pendingCollections}
              sublabel={`$${summary.pendingCollectionAmount.toLocaleString()}`}
              variant={summary.pendingCollections > 0 ? 'danger' : 'default'}
              onClick={() => navigate('/sales')}
            />
            
            <BusinessMetricCard
              icon={<Package className="w-5 h-5" />}
              label="Productos"
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

        {/* 4. TODAY'S RESULTS - Only if completed tasks */}
        {outcomeStats.completedToday > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Resultados de Hoy
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="grc-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-success/10">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{outcomeStats.completedToday}</p>
                  <p className="text-xs text-muted-foreground">Cerradas</p>
                </div>
              </div>
              
              <div className="grc-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{outcomeStats.withIncome}</p>
                  <p className="text-xs text-muted-foreground">Con ingreso</p>
                </div>
              </div>
              
              <div className="grc-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-success/10">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xl font-bold text-success">${outcomeStats.totalRecovered.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Recuperado</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Task Close Modal */}
      <TaskCloseModal
        task={closeModalTask}
        open={!!closeModalTask}
        onOpenChange={(open) => {
          if (!open) {
            setCloseModalTask(null);
            setExecutingTaskId(null);
          }
        }}
        onSubmit={completeWithOutcome}
      />
    </div>
  );
}
