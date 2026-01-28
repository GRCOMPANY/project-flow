import { useNavigate } from 'react-router-dom';
import { Lightbulb, DollarSign, TrendingUp, AlertTriangle, PartyPopper, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type InsightType = 'money' | 'growth' | 'warning' | 'celebration';

export interface DailyInsight {
  message: string;
  type: InsightType;
  action?: {
    label: string;
    path: string;
  };
}

interface DailyInsightCardProps {
  insight: DailyInsight;
  className?: string;
}

const typeConfig: Record<InsightType, { 
  icon: React.ElementType; 
  gradient: string;
  iconBg: string;
}> = {
  money: {
    icon: DollarSign,
    gradient: 'from-success/5 to-transparent',
    iconBg: 'bg-success/10 text-success',
  },
  growth: {
    icon: TrendingUp,
    gradient: 'from-primary/5 to-transparent',
    iconBg: 'bg-primary/10 text-primary',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-warning/5 to-transparent',
    iconBg: 'bg-warning/10 text-warning',
  },
  celebration: {
    icon: PartyPopper,
    gradient: 'from-amber-500/5 to-transparent',
    iconBg: 'bg-amber-500/10 text-amber-500',
  },
};

export function DailyInsightCard({ insight, className }: DailyInsightCardProps) {
  const navigate = useNavigate();
  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "insight-card relative overflow-hidden rounded-2xl border bg-card p-5",
      className
    )}>
      {/* Subtle gradient background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        config.gradient
      )} />

      <div className="relative z-10 flex items-start gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          config.iconBg
        )}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Insight del día
            </span>
          </div>
          
          <p className="text-base md:text-lg font-medium text-foreground leading-relaxed">
            "{insight.message}"
          </p>

          {insight.action && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 -ml-2 gap-1.5 text-primary hover:text-primary"
              onClick={() => navigate(insight.action!.path)}
            >
              {insight.action.label}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to generate the daily insight based on business data
export function generateDailyInsight(
  salesData: {
    pendingAmount: number;
    pendingCount: number;
    unconfirmedOld: number;
    atRisk: number;
    paidToday: number;
    revenueToday: number;
  },
  productData: {
    hotProducts: number;
    coldWithPotential: number;
  }
): DailyInsight {
  // Priority 1: Money to recover
  if (salesData.pendingAmount > 100000) {
    return {
      type: 'money',
      message: `Hoy puedes recuperar $${salesData.pendingAmount.toLocaleString()} si cobras ${salesData.pendingCount} pedido${salesData.pendingCount > 1 ? 's' : ''}.`,
      action: { label: 'Ir a cobrar', path: '/sales' },
    };
  }

  // Priority 2: Urgent confirmations
  if (salesData.unconfirmedOld > 0) {
    return {
      type: 'warning',
      message: `Tienes ${salesData.unconfirmedOld} pedido${salesData.unconfirmedOld > 1 ? 's' : ''} sin confirmar hace más de 2 días. Llama ahora antes de que se cancelen.`,
      action: { label: 'Ver pedidos', path: '/sales' },
    };
  }

  // Priority 3: At risk sales
  if (salesData.atRisk > 0) {
    return {
      type: 'warning',
      message: `${salesData.atRisk} venta${salesData.atRisk > 1 ? 's' : ''} está${salesData.atRisk > 1 ? 'n' : ''} en riesgo. Contacta a los clientes para evitar devoluciones.`,
      action: { label: 'Revisar', path: '/sales' },
    };
  }

  // Priority 4: Hot products to scale
  if (productData.hotProducts > 0) {
    return {
      type: 'growth',
      message: `${productData.hotProducts} producto${productData.hotProducts > 1 ? 's' : ''} está${productData.hotProducts > 1 ? 'n' : ''} vendiendo bien esta semana. Es momento de escalar.`,
      action: { label: 'Ver productos', path: '/products' },
    };
  }

  // Priority 5: Cold products with potential
  if (productData.coldWithPotential > 0) {
    return {
      type: 'growth',
      message: `Tienes ${productData.coldWithPotential} producto${productData.coldWithPotential > 1 ? 's' : ''} con buen margen sin movimiento. Crea contenido para activarlos.`,
      action: { label: 'Crear creativo', path: '/creatives' },
    };
  }

  // Priority 6: Good day celebration
  if (salesData.revenueToday > 0) {
    return {
      type: 'celebration',
      message: `¡Buen día! Hoy ya ingresaron $${salesData.revenueToday.toLocaleString()}. Sigue así.`,
    };
  }

  // Default: Everything is fine
  return {
    type: 'celebration',
    message: 'Tu negocio está sano. Enfócate en crecer y seguir vendiendo.',
  };
}
