import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, TrendingUp, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { BusinessSummary, SmartTask } from '@/types';
import { SmartProduct } from '@/hooks/useSmartCatalog';
import { Button } from '@/components/ui/button';

interface DailyInsightProps {
  summary: BusinessSummary;
  smartProducts: SmartProduct[];
  tasks: SmartTask[];
}

export function DailyInsight({ summary, smartProducts, tasks }: DailyInsightProps) {
  const navigate = useNavigate();

  const insight = useMemo(() => {
    // Priority 1: Pending collections
    if (summary.pendingCollections > 0) {
      return {
        type: 'warning' as const,
        icon: AlertCircle,
        title: `Tienes $${summary.pendingCollectionAmount.toLocaleString()} pendientes por cobrar`,
        description: `${summary.pendingCollections} ventas sin pagar. Recupera tu dinero hoy.`,
        action: 'Ver cobros pendientes',
        path: '/sales',
      };
    }

    // Priority 2: Featured products without creatives
    const featuredNoCreative = smartProducts.find(p => p.isFeatured && p.creativesCount === 0);
    if (featuredNoCreative) {
      return {
        type: 'info' as const,
        icon: Sparkles,
        title: `"${featuredNoCreative.name}" necesita contenido`,
        description: 'Es un producto destacado sin creativos publicitarios.',
        action: 'Crear creativo',
        path: '/creatives',
      };
    }

    // Priority 3: High priority products
    const highPriorityProducts = smartProducts.filter(p => p.priorityScore === 'alta');
    if (highPriorityProducts.length > 0) {
      return {
        type: 'warning' as const,
        icon: AlertCircle,
        title: `${highPriorityProducts.length} productos necesitan atención`,
        description: 'Revisa los productos con prioridad alta en tu catálogo.',
        action: 'Ver productos',
        path: '/products',
      };
    }

    // Priority 4: Sales performance
    if (summary.salesThisMonth > 0) {
      return {
        type: 'success' as const,
        icon: TrendingUp,
        title: `¡${summary.salesThisMonth} ventas este mes!`,
        description: `Has generado $${summary.revenueThisMonth.toLocaleString()} en ingresos. ¡Sigue así!`,
        action: 'Ver ventas',
        path: '/sales',
      };
    }

    // Default
    return {
      type: 'neutral' as const,
      icon: Lightbulb,
      title: 'Tu negocio está listo para vender',
      description: `Tienes ${summary.activeProducts} productos activos esperando clientes.`,
      action: 'Ver catálogo',
      path: '/products',
    };
  }, [summary, smartProducts]);

  const bgStyles = {
    warning: 'from-warning/10 via-warning/5 to-transparent border-warning/20',
    info: 'from-primary/10 via-primary/5 to-transparent border-primary/20',
    success: 'from-success/10 via-success/5 to-transparent border-success/20',
    neutral: 'from-secondary via-secondary/50 to-transparent border-border/50',
  };

  const iconStyles = {
    warning: 'bg-warning/15 text-warning',
    info: 'bg-primary/15 text-primary',
    success: 'bg-success/15 text-success',
    neutral: 'bg-secondary text-muted-foreground',
  };

  const IconComponent = insight.icon;

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border p-6
      bg-gradient-to-br ${bgStyles[insight.type]}
      animate-fade-up
    `}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03] pointer-events-none">
        <Lightbulb className="w-full h-full" />
      </div>

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <div className={`p-3 rounded-xl ${iconStyles[insight.type]} shrink-0 self-start`}>
          <IconComponent className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {insight.title}
          </h3>
          <p className="text-muted-foreground text-sm">
            {insight.description}
          </p>
        </div>

        <Button 
          onClick={() => navigate(insight.path)}
          className="shrink-0 gap-2 self-start sm:self-center shadow-lg"
        >
          {insight.action}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
