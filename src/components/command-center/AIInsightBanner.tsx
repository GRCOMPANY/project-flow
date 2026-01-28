import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Lightbulb, 
  ArrowRight, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  PartyPopper
} from 'lucide-react';
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

interface AIInsightBannerProps {
  insight: DailyInsight;
  className?: string;
}

const typeConfig: Record<InsightType, {
  icon: React.ElementType;
  gradient: string;
  borderGradient: string;
  iconBg: string;
  glowColor: string;
}> = {
  money: {
    icon: DollarSign,
    gradient: 'from-success/10 via-success/5 to-transparent',
    borderGradient: 'from-success/40 via-success/20 to-transparent',
    iconBg: 'bg-success/15 text-success',
    glowColor: 'shadow-success/20',
  },
  growth: {
    icon: TrendingUp,
    gradient: 'from-primary/10 via-primary/5 to-transparent',
    borderGradient: 'from-primary/40 via-primary/20 to-transparent',
    iconBg: 'bg-primary/15 text-primary',
    glowColor: 'shadow-primary/20',
  },
  warning: {
    icon: AlertCircle,
    gradient: 'from-warning/10 via-warning/5 to-transparent',
    borderGradient: 'from-warning/40 via-warning/20 to-transparent',
    iconBg: 'bg-warning/15 text-warning',
    glowColor: 'shadow-warning/20',
  },
  celebration: {
    icon: PartyPopper,
    gradient: 'from-accent/10 via-accent/5 to-transparent',
    borderGradient: 'from-accent/40 via-accent/20 to-transparent',
    iconBg: 'bg-accent/15 text-accent-foreground',
    glowColor: 'shadow-accent/20',
  },
};

export function AIInsightBanner({ insight, className }: AIInsightBannerProps) {
  const navigate = useNavigate();
  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
          <Brain className="w-4 h-4 text-indigo-500" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          GRC AI Sugiere
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Insight Card */}
      <div className={cn(
        "ai-insight-banner relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br",
        config.gradient,
        `hover:shadow-lg hover:${config.glowColor}`,
        "transition-all duration-300"
      )}>
        {/* Gradient Border Effect */}
        <div className={cn(
          "absolute inset-0 rounded-2xl p-px bg-gradient-to-br pointer-events-none",
          config.borderGradient
        )}>
          <div className="w-full h-full rounded-2xl bg-card" />
        </div>

        {/* Content */}
        <div className="relative p-6 flex items-center gap-5">
          {/* Icon */}
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
            config.iconBg,
            "shadow-sm"
          )}>
            <Icon className="w-7 h-7" />
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-medium text-foreground leading-relaxed">
              "{insight.message}"
            </p>
          </div>

          {/* Action */}
          {insight.action && (
            <Button
              onClick={() => navigate(insight.action!.path)}
              className="gap-2 shadow-lg shrink-0"
            >
              {insight.action.label}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to generate daily insight
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
  // Priority 1: Pending collections (money recovery)
  if (salesData.pendingAmount > 100000) {
    return {
      type: 'money',
      message: `Hoy puedes recuperar $${salesData.pendingAmount.toLocaleString()} si cobras ${salesData.pendingCount} pedido${salesData.pendingCount > 1 ? 's' : ''}.`,
      action: { label: 'Cobrar ahora', path: '/sales' },
    };
  }

  // Priority 2: Old unconfirmed sales
  if (salesData.unconfirmedOld > 0) {
    return {
      type: 'warning',
      message: `Tienes ${salesData.unconfirmedOld} pedido${salesData.unconfirmedOld > 1 ? 's' : ''} sin confirmar hace más de 2 días. Llama ahora antes de que se cancelen.`,
      action: { label: 'Llamar', path: '/sales' },
    };
  }

  // Priority 3: At risk sales
  if (salesData.atRisk > 0) {
    return {
      type: 'warning',
      message: `${salesData.atRisk} venta${salesData.atRisk > 1 ? 's' : ''} en riesgo de devolución. Actúa ahora para no perder dinero.`,
      action: { label: 'Revisar', path: '/sales' },
    };
  }

  // Priority 4: Hot products to scale
  if (productData.hotProducts > 0) {
    return {
      type: 'growth',
      message: `Tienes ${productData.hotProducts} producto${productData.hotProducts > 1 ? 's' : ''} vendiendo bien esta semana. Es momento de escalar.`,
      action: { label: 'Escalar', path: '/products' },
    };
  }

  // Priority 5: Cold products with potential
  if (productData.coldWithPotential > 0) {
    return {
      type: 'growth',
      message: `${productData.coldWithPotential} producto${productData.coldWithPotential > 1 ? 's' : ''} con buen margen ${productData.coldWithPotential > 1 ? 'llevan' : 'lleva'} 30 días sin venderse. Un buen creativo podría activarlos.`,
      action: { label: 'Crear creativo', path: '/creatives' },
    };
  }

  // Priority 6: Celebration (if revenue today)
  if (salesData.revenueToday > 0) {
    return {
      type: 'celebration',
      message: `¡Ya generaste $${salesData.revenueToday.toLocaleString()} hoy con ${salesData.paidToday} venta${salesData.paidToday > 1 ? 's' : ''}! Sigue así.`,
    };
  }

  // Default: Healthy business
  return {
    type: 'celebration',
    message: 'Tu negocio está estable. Enfócate en crear contenido para atraer más clientes.',
    action: { label: 'Crear creativo', path: '/creatives' },
  };
}
