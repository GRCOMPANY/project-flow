import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  ArrowRight, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  PartyPopper,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type InsightType = 'money' | 'growth' | 'warning' | 'celebration';

export interface DailyInsight {
  message: string;
  type: InsightType;
  causality?: string;
  estimatedImpact?: number;
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
  glowClass: string;
}> = {
  money: {
    icon: DollarSign,
    gradient: 'from-success/8 via-success/4 to-transparent',
    borderGradient: 'from-success/50 via-success/25 to-transparent',
    iconBg: 'bg-success/12 text-success',
    glowClass: 'hover:glow-success',
  },
  growth: {
    icon: TrendingUp,
    gradient: 'from-primary/8 via-primary/4 to-transparent',
    borderGradient: 'from-primary/50 via-primary/25 to-transparent',
    iconBg: 'bg-primary/12 text-primary',
    glowClass: '',
  },
  warning: {
    icon: AlertCircle,
    gradient: 'from-warning/8 via-warning/4 to-transparent',
    borderGradient: 'from-warning/50 via-warning/25 to-transparent',
    iconBg: 'bg-warning/12 text-warning',
    glowClass: 'hover:glow-warning',
  },
  celebration: {
    icon: PartyPopper,
    gradient: 'from-accent/8 via-accent/4 to-transparent',
    borderGradient: 'from-accent/50 via-accent/25 to-transparent',
    iconBg: 'bg-accent/15 text-accent-foreground',
    glowClass: '',
  },
};

export function AIInsightBanner({ insight, className }: AIInsightBannerProps) {
  const navigate = useNavigate();
  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <div className={cn("space-y-5", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 flex items-center justify-center animate-glow-ai">
          <Brain className="w-4.5 h-4.5 text-indigo-500" />
        </div>
        <div>
          <span className="text-sm font-bold text-foreground uppercase tracking-wide">
            GRC AI Sugiere
          </span>
          <p className="text-xs text-muted-foreground">
            Insight inteligente del día
          </p>
        </div>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Insight Card */}
      <div className={cn(
        "ai-insight-banner gradient-border-ai relative overflow-hidden rounded-2xl",
        "transition-all duration-300",
        config.glowClass
      )}>
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none",
          config.gradient
        )} />

        <div className="relative p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Icon */}
            <div className={cn(
              "w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-2xl flex items-center justify-center shrink-0",
              config.iconBg,
              "shadow-sm ring-1 ring-white/10"
            )}>
              <Icon className="w-8 h-8 md:w-9 md:h-9" />
            </div>

            {/* Message + Causality */}
            <div className="flex-1 min-w-0 space-y-2.5">
              <p className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed">
                "{insight.message}"
              </p>
              
              {insight.causality && (
                <p className="narrative-causality text-sm">
                  {insight.causality}
                </p>
              )}

              {insight.estimatedImpact && insight.estimatedImpact > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-sm font-bold text-foreground">
                    → Impacto estimado: <span className="text-success">${insight.estimatedImpact.toLocaleString()}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Action */}
            {insight.action && (
              <Button
                onClick={() => navigate(insight.action!.path)}
                className="gap-2 shadow-lg shrink-0 btn-gradient-primary text-white"
                size="lg"
              >
                {insight.action.label}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  if (salesData.pendingAmount > 100000) {
    return {
      type: 'money',
      message: `Hoy puedes recuperar $${salesData.pendingAmount.toLocaleString()} si cobras ${salesData.pendingCount} pedido${salesData.pendingCount > 1 ? 's' : ''}.`,
      causality: `Porque ${salesData.pendingCount > 1 ? 'estas ventas ya están' : 'esta venta ya está'} lista${salesData.pendingCount > 1 ? 's' : ''} para cobrar`,
      estimatedImpact: salesData.pendingAmount,
      action: { label: 'Cobrar ahora', path: '/sales' },
    };
  }

  if (salesData.unconfirmedOld > 0) {
    return {
      type: 'warning',
      message: `Tienes ${salesData.unconfirmedOld} pedido${salesData.unconfirmedOld > 1 ? 's' : ''} sin confirmar hace más de 2 días. Llama ahora antes de que se cancelen.`,
      causality: 'Porque el cliente puede perder interés después de tanto tiempo',
      action: { label: 'Llamar', path: '/sales' },
    };
  }

  if (salesData.atRisk > 0) {
    return {
      type: 'warning',
      message: `${salesData.atRisk} venta${salesData.atRisk > 1 ? 's' : ''} en riesgo de devolución. Actúa ahora para no perder dinero.`,
      causality: 'Porque el cliente ha mostrado señales de insatisfacción',
      action: { label: 'Revisar', path: '/sales' },
    };
  }

  if (productData.hotProducts > 0) {
    return {
      type: 'growth',
      message: `Tienes ${productData.hotProducts} producto${productData.hotProducts > 1 ? 's' : ''} vendiendo bien esta semana. Es momento de escalar.`,
      causality: 'Porque la demanda está alta y puedes aprovechar el momentum',
      action: { label: 'Escalar', path: '/products' },
    };
  }

  if (productData.coldWithPotential > 0) {
    return {
      type: 'growth',
      message: `${productData.coldWithPotential} producto${productData.coldWithPotential > 1 ? 's' : ''} con buen margen ${productData.coldWithPotential > 1 ? 'llevan' : 'lleva'} 30 días sin venderse. Un buen creativo podría activarlos.`,
      causality: 'Porque tienen potencial de ganancia pero necesitan visibilidad',
      action: { label: 'Crear creativo', path: '/creatives' },
    };
  }

  if (salesData.revenueToday > 0) {
    return {
      type: 'celebration',
      message: `¡Ya generaste $${salesData.revenueToday.toLocaleString()} hoy con ${salesData.paidToday} venta${salesData.paidToday > 1 ? 's' : ''}! Sigue así.`,
      estimatedImpact: salesData.revenueToday,
    };
  }

  return {
    type: 'celebration',
    message: 'Tu negocio está estable. Enfócate en crear contenido para atraer más clientes.',
    causality: 'Porque el contenido nuevo mantiene el interés de tu audiencia',
    action: { label: 'Crear creativo', path: '/creatives' },
  };
}
