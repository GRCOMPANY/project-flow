import { useNavigate } from 'react-router-dom';
import { 
  LucideIcon, 
  ArrowRight, 
  PhoneCall, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp,
  ImageIcon,
  Package,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RadarAlert {
  id: string;
  severity: 'critical' | 'warning' | 'opportunity';
  icon: LucideIcon;
  message: string;
  subtext?: string;
  action: {
    label: string;
    path: string;
  };
}

interface AIRadarPanelProps {
  alerts: RadarAlert[];
  className?: string;
}

export function AIRadarPanel({ alerts, className }: AIRadarPanelProps) {
  const navigate = useNavigate();
  
  if (alerts.length === 0) {
    return null;
  }

  const getSeverityStyles = (severity: RadarAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          card: 'radar-alert-critical hover:shadow-md hover:shadow-destructive/5',
          icon: 'bg-destructive/15 text-destructive',
          dot: 'bg-destructive',
        };
      case 'warning':
        return {
          card: 'radar-alert-warning hover:shadow-md hover:shadow-warning/5',
          icon: 'bg-warning/15 text-warning',
          dot: 'bg-warning',
        };
      case 'opportunity':
        return {
          card: 'radar-alert-opportunity hover:shadow-md hover:shadow-success/5',
          icon: 'bg-success/15 text-success',
          dot: 'bg-success',
        };
      default:
        return {
          card: '',
          icon: 'bg-muted text-muted-foreground',
          dot: 'bg-muted-foreground',
        };
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Radar IA
            </h3>
            <p className="text-xs text-muted-foreground">
              Alertas detectadas automáticamente
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
          {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
        </span>
      </div>
      
      {/* Alerts Grid */}
      <div className="space-y-2">
        {alerts.slice(0, 5).map((alert, index) => {
          const styles = getSeverityStyles(alert.severity);
          
          return (
            <button
              key={alert.id}
              onClick={() => navigate(alert.action.path)}
              className={cn(
                "radar-alert w-full text-left group",
                styles.card,
                "animate-fade-up"
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Severity Dot */}
              <div className={cn(
                "w-2 h-2 rounded-full shrink-0 animate-pulse",
                styles.dot
              )} />
              
              {/* Icon */}
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                styles.icon
              )}>
                <alert.icon className="w-4 h-4" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {alert.message}
                </p>
                {alert.subtext && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {alert.subtext}
                  </p>
                )}
              </div>
              
              {/* Action */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                <span className="hidden sm:inline">{alert.action.label}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to generate alerts from business data
export function generateRadarAlerts(
  salesData: {
    unconfirmedOld: number;
    atRisk: number;
    pendingAmount: number;
    pendingCount: number;
  },
  productData: {
    hotProducts: number;
    coldProducts: number;
    needsCreatives: number;
  }
): RadarAlert[] {
  const alerts: RadarAlert[] = [];

  // Critical: Old unconfirmed sales
  if (salesData.unconfirmedOld > 0) {
    alerts.push({
      id: 'unconfirmed-old',
      severity: 'critical',
      icon: PhoneCall,
      message: `${salesData.unconfirmedOld} venta${salesData.unconfirmedOld > 1 ? 's' : ''} sin confirmar hace más de 2 días`,
      subtext: 'Riesgo de cancelación alto',
      action: { label: 'Llamar', path: '/sales' }
    });
  }

  // Critical: At risk sales
  if (salesData.atRisk > 0) {
    alerts.push({
      id: 'at-risk',
      severity: 'critical',
      icon: AlertTriangle,
      message: `${salesData.atRisk} venta${salesData.atRisk > 1 ? 's' : ''} en riesgo de devolución`,
      subtext: 'Requiere atención urgente',
      action: { label: 'Revisar', path: '/sales' }
    });
  }

  // Opportunity: Pending collections
  if (salesData.pendingAmount > 50000) {
    alerts.push({
      id: 'pending-money',
      severity: 'opportunity',
      icon: DollarSign,
      message: `Puedes recuperar $${salesData.pendingAmount.toLocaleString()} si cobras hoy`,
      subtext: `${salesData.pendingCount} venta${salesData.pendingCount > 1 ? 's' : ''} pendiente${salesData.pendingCount > 1 ? 's' : ''} de pago`,
      action: { label: 'Cobrar', path: '/sales' }
    });
  }

  // Warning: Products needing creatives
  if (productData.needsCreatives > 0) {
    alerts.push({
      id: 'needs-creatives',
      severity: 'warning',
      icon: ImageIcon,
      message: `${productData.needsCreatives} producto${productData.needsCreatives > 1 ? 's' : ''} rentable${productData.needsCreatives > 1 ? 's' : ''} sin contenido activo`,
      subtext: 'Oportunidad de venta perdida',
      action: { label: 'Crear', path: '/creatives' }
    });
  }

  // Opportunity: Hot products
  if (productData.hotProducts > 0) {
    alerts.push({
      id: 'hot-products',
      severity: 'opportunity',
      icon: TrendingUp,
      message: `${productData.hotProducts} producto${productData.hotProducts > 1 ? 's' : ''} listo${productData.hotProducts > 1 ? 's' : ''} para escalar`,
      subtext: 'Están vendiendo bien esta semana',
      action: { label: 'Escalar', path: '/products' }
    });
  }

  // Warning: Cold products
  if (productData.coldProducts > 0) {
    alerts.push({
      id: 'cold-products',
      severity: 'warning',
      icon: Package,
      message: `${productData.coldProducts} producto${productData.coldProducts > 1 ? 's' : ''} sin movimiento en 30 días`,
      subtext: 'Con margen alto - potencial dormido',
      action: { label: 'Activar', path: '/products' }
    });
  }

  return alerts;
}
