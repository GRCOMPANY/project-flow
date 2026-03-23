import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Clock, 
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroFinancialCardProps {
  montoEnRiesgo: number;
  ventasSinConfirmar: number;
  ventasEnRiesgo: number;
  pendienteCobro: number;
  percentOfWeeklySales?: number;
  changeVsYesterday?: number;
  actionsToStability?: number;
  totalWeeklySales?: number;
}

type BusinessState = 'healthy' | 'warning' | 'critical';

export function HeroFinancialCard({
  montoEnRiesgo,
  ventasSinConfirmar,
  ventasEnRiesgo,
  pendienteCobro,
  percentOfWeeklySales = 0,
  changeVsYesterday = 0,
  actionsToStability = 0,
  totalWeeklySales = 0,
}: HeroFinancialCardProps) {
  const navigate = useNavigate();

  const getBusinessState = (): BusinessState => {
    if (ventasEnRiesgo > 0 || ventasSinConfirmar > 2) return 'critical';
    if (pendienteCobro > 100000 || ventasSinConfirmar > 0) return 'warning';
    return 'healthy';
  };

  const businessState = getBusinessState();
  const hasUrgency = montoEnRiesgo > 0 || ventasSinConfirmar > 0 || ventasEnRiesgo > 0;
  const totalActions = ventasSinConfirmar + ventasEnRiesgo;

  const stateConfig = {
    healthy: {
      label: 'Negocio Estable',
      description: 'Todo bajo control',
      icon: CheckCircle2,
      bgGradient: 'from-success/8 via-success/4 to-transparent',
      borderClass: 'border-success/20',
      badgeClass: 'bg-success/10 text-success border-success/20',
      iconBg: 'bg-success/12 text-success',
      glowClass: '',
    },
    warning: {
      label: 'Requiere Atención',
      description: `${totalActions || 'Acciones'} pendientes`,
      icon: AlertTriangle,
      bgGradient: 'from-warning/10 via-warning/5 to-transparent',
      borderClass: 'border-warning/25',
      badgeClass: 'bg-warning/12 text-warning border-warning/25',
      iconBg: 'bg-warning/12 text-warning',
      glowClass: 'hover:glow-warning',
    },
    critical: {
      label: 'Atención Urgente',
      description: 'Actúa ahora',
      icon: ShieldAlert,
      bgGradient: 'from-destructive/10 via-destructive/5 to-transparent',
      borderClass: 'border-destructive/25',
      badgeClass: 'bg-destructive/12 text-destructive border-destructive/25',
      iconBg: 'bg-destructive/12 text-destructive',
      glowClass: 'hover:glow-danger',
    },
  };

  const config = stateConfig[businessState];
  const StateIcon = config.icon;

  const TrendIcon = changeVsYesterday > 0 ? TrendingUp : changeVsYesterday < 0 ? TrendingDown : Minus;
  const trendColor = changeVsYesterday > 0 ? 'text-destructive' : changeVsYesterday < 0 ? 'text-success' : 'text-muted-foreground';
  const trendBg = changeVsYesterday > 0 ? 'bg-destructive/10' : changeVsYesterday < 0 ? 'bg-success/10' : 'bg-muted/50';

  return (
    <div
      className={cn(
        'hero-financial-card hero-glass relative overflow-hidden rounded-2xl border p-8 md:p-10',
        'bg-gradient-to-br transition-all duration-300',
        config.bgGradient,
        config.borderClass,
        config.glowClass
      )}
    >
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-72 h-72 opacity-[0.03] pointer-events-none">
        <DollarSign className="w-full h-full" strokeWidth={0.5} />
      </div>

      {/* Two column layout */}
      <div className="relative grid md:grid-cols-[1fr,320px] gap-8 md:gap-12">
        {/* Left: Financial Data */}
        <div className="space-y-8">
          {/* Label */}
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-xl', config.iconBg)}>
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">
                Balance Crítico del Día
              </span>
            </div>
          </div>

          {/* Hero Number */}
          <div className="space-y-3">
            <h2 className="hero-financial-number text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
              ${montoEnRiesgo.toLocaleString()}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-muted-foreground text-base">
                {hasUrgency ? 'en riesgo hoy' : 'pendiente de gestión'}
              </p>
              
              {changeVsYesterday !== 0 && (
                <div className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
                  trendBg,
                  trendColor
                )}>
                  <TrendIcon className="w-3.5 h-3.5" />
                  <span>{changeVsYesterday > 0 ? '+' : ''}{changeVsYesterday}% vs ayer</span>
                </div>
              )}
            </div>
            
            {percentOfWeeklySales > 0 && (
              <p className="narrative-context text-sm">
                Representa el <span className="font-semibold text-foreground">{percentOfWeeklySales}%</span> de tus ventas semanales
              </p>
            )}
          </div>

          {/* Status Chips */}
          <div className="flex flex-wrap gap-2">
            {ventasSinConfirmar > 0 && (
              <button
                onClick={() => navigate('/sales')}
                className="tension-chip tension-chip-warning group"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{ventasSinConfirmar} sin confirmar</span>
                <ArrowRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </button>
            )}

            {ventasEnRiesgo > 0 && (
              <button
                onClick={() => navigate('/sales')}
                className="tension-chip tension-chip-danger group"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{ventasEnRiesgo} en riesgo</span>
                <ArrowRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </button>
            )}

            {pendienteCobro > 0 && (
              <button
                onClick={() => navigate('/sales')}
                className="tension-chip tension-chip-primary group"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>${(pendienteCobro / 1000).toFixed(0)}K por cobrar</span>
                <ArrowRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </button>
            )}

            {!hasUrgency && (
              <div className="tension-chip bg-success/10 text-success border border-success/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sin alertas pendientes</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Business State + CTA */}
        <div className="flex flex-col justify-between gap-6 md:border-l md:border-border/40 md:pl-10">
          {/* State Indicator */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">
              Estado del Negocio
            </span>
            
            <div className={cn(
              'flex items-center gap-4 px-5 py-4 rounded-2xl border',
              config.badgeClass
            )}>
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                config.iconBg
              )}>
                <StateIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-base">{config.label}</p>
                <p className="text-sm opacity-80">{config.description}</p>
              </div>
            </div>

            {actionsToStability > 0 && businessState !== 'healthy' && (
              <p className="narrative-causality pl-1">
                {actionsToStability} {actionsToStability === 1 ? 'acción te separa' : 'acciones te separan'} de estabilidad
              </p>
            )}
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/sales')}
              size="lg"
              className={cn(
                'w-full gap-2 font-bold shadow-lg text-base h-12',
                businessState === 'critical' && 'btn-gradient-primary',
                businessState === 'warning' && 'bg-warning hover:bg-warning/90 text-warning-foreground',
                businessState === 'healthy' && 'btn-gradient-success text-white'
              )}
            >
              <DollarSign className="w-5 h-5" />
              {pendienteCobro > 0 ? `Cobrar $${(pendienteCobro / 1000).toFixed(0)}K Ahora` : 'Ver Ventas'}
              <ArrowRight className="w-5 h-5" />
            </Button>
            
            {hasUrgency && (
              <Button
                onClick={() => navigate('/tasks')}
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Ver todas las acciones pendientes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
