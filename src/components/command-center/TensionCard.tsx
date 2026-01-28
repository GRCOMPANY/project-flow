import { useNavigate } from 'react-router-dom';
import { AlertTriangle, DollarSign, PhoneOff, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TensionCardProps {
  montoEnRiesgo: number;
  ventasSinConfirmar: number;
  ventasEnRiesgo: number;
  pendienteCobro: number;
  className?: string;
}

export function TensionCard({
  montoEnRiesgo,
  ventasSinConfirmar,
  ventasEnRiesgo,
  pendienteCobro,
  className,
}: TensionCardProps) {
  const navigate = useNavigate();
  
  const hasUrgency = montoEnRiesgo > 0 || ventasSinConfirmar > 0 || ventasEnRiesgo > 0;
  
  if (!hasUrgency) {
    return (
      <div className={cn(
        "tension-card-success rounded-2xl p-6 text-center",
        className
      )}>
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-success" />
          </div>
        </div>
        <p className="text-lg font-medium text-foreground">Todo en orden</p>
        <p className="text-sm text-muted-foreground mt-1">No hay dinero en riesgo hoy</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "tension-card rounded-2xl p-6 relative overflow-hidden",
      className
    )}>
      {/* Subtle animated pulse for urgency */}
      <div className="absolute inset-0 bg-gradient-to-r from-warning/5 to-transparent animate-pulse opacity-50" />
      
      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Hoy tienes
            </p>
            <p className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              ${montoEnRiesgo.toLocaleString()}
            </p>
            <p className="text-sm font-medium text-warning mt-1">
              en riesgo
            </p>
          </div>
        </div>

        {/* Indicator chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {ventasSinConfirmar > 0 && (
            <button 
              onClick={() => navigate('/sales')}
              className="tension-chip tension-chip-warning"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>{ventasSinConfirmar} sin confirmar</span>
            </button>
          )}
          
          {ventasEnRiesgo > 0 && (
            <button 
              onClick={() => navigate('/sales')}
              className="tension-chip tension-chip-danger"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{ventasEnRiesgo} en riesgo</span>
            </button>
          )}
          
          {pendienteCobro > 0 && (
            <button 
              onClick={() => navigate('/sales')}
              className="tension-chip tension-chip-primary"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>${pendienteCobro.toLocaleString()} por cobrar</span>
            </button>
          )}
        </div>

        {/* CTA */}
        <Button 
          onClick={() => navigate('/sales')}
          className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
          size="lg"
        >
          Ver cobros pendientes
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
