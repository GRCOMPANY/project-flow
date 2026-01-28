import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  ShieldAlert,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroFinancialCardProps {
  montoEnRiesgo: number;
  ventasSinConfirmar: number;
  ventasEnRiesgo: number;
  pendienteCobro: number;
}

type BusinessState = 'healthy' | 'warning' | 'critical';

export function HeroFinancialCard({
  montoEnRiesgo,
  ventasSinConfirmar,
  ventasEnRiesgo,
  pendienteCobro,
}: HeroFinancialCardProps) {
  const navigate = useNavigate();

  // Determine business state
  const getBusinessState = (): BusinessState => {
    if (ventasEnRiesgo > 0 || ventasSinConfirmar > 2) return 'critical';
    if (pendienteCobro > 100000 || ventasSinConfirmar > 0) return 'warning';
    return 'healthy';
  };

  const businessState = getBusinessState();
  const hasUrgency = montoEnRiesgo > 0 || ventasSinConfirmar > 0 || ventasEnRiesgo > 0;

  const stateConfig = {
    healthy: {
      label: 'Negocio Estable',
      description: 'Todo bajo control',
      icon: CheckCircle2,
      bgClass: 'from-success/10 via-success/5 to-transparent',
      borderClass: 'border-success/20',
      badgeClass: 'bg-success/15 text-success border-success/30',
      iconBg: 'bg-success/15 text-success',
    },
    warning: {
      label: 'Requiere Atención',
      description: 'Hay acciones pendientes',
      icon: AlertTriangle,
      bgClass: 'from-warning/10 via-warning/5 to-transparent',
      borderClass: 'border-warning/25',
      badgeClass: 'bg-warning/15 text-warning border-warning/30',
      iconBg: 'bg-warning/15 text-warning',
    },
    critical: {
      label: 'Atención Urgente',
      description: 'Actúa ahora',
      icon: ShieldAlert,
      bgClass: 'from-destructive/10 via-destructive/5 to-transparent',
      borderClass: 'border-destructive/25',
      badgeClass: 'bg-destructive/15 text-destructive border-destructive/30',
      iconBg: 'bg-destructive/15 text-destructive',
    },
  };

  const config = stateConfig[businessState];
  const StateIcon = config.icon;

  return (
    <div
      className={cn(
        'hero-financial-card relative overflow-hidden rounded-2xl border p-6 md:p-8',
        'bg-gradient-to-br',
        config.bgClass,
        config.borderClass
      )}
    >
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-64 h-64 opacity-[0.03] pointer-events-none">
        <DollarSign className="w-full h-full" />
      </div>

      {/* Two column layout */}
      <div className="relative grid md:grid-cols-[1fr,280px] gap-6 md:gap-8">
        {/* Left: Financial Data */}
        <div className="space-y-6">
          {/* Label */}
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-lg', config.iconBg)}>
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Balance Crítico del Día
            </span>
          </div>

          {/* Hero Number */}
          <div className="space-y-1">
            <h2 className="hero-financial-number text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              ${montoEnRiesgo.toLocaleString()}
            </h2>
            <p className="text-muted-foreground text-base">
              {hasUrgency ? 'en riesgo hoy' : 'pendiente de gestión'}
            </p>
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
              <div className="tension-chip bg-success/10 text-success">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sin alertas pendientes</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Business State + CTA */}
        <div className="flex flex-col justify-between gap-4 md:border-l md:border-border/50 md:pl-8">
          {/* State Indicator */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Estado del Negocio
            </span>
            
            <div className={cn(
              'inline-flex items-center gap-3 px-4 py-3 rounded-xl border',
              config.badgeClass
            )}>
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                config.iconBg
              )}>
                <StateIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{config.label}</p>
                <p className="text-xs opacity-80">{config.description}</p>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <Button
              onClick={() => navigate('/sales')}
              size="lg"
              className={cn(
                'w-full gap-2 font-semibold shadow-lg',
                businessState === 'critical' && 'bg-destructive hover:bg-destructive/90',
                businessState === 'warning' && 'bg-warning hover:bg-warning/90 text-warning-foreground'
              )}
            >
              <DollarSign className="w-4 h-4" />
              {pendienteCobro > 0 ? 'Cobrar Ahora' : 'Ver Ventas'}
              <ArrowRight className="w-4 h-4" />
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
