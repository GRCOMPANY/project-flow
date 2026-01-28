import { useNavigate } from 'react-router-dom';
import { 
  LucideIcon, 
  ArrowRight, 
  PhoneCall, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp,
  ImageIcon,
  Package
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

interface BusinessRadarProps {
  alerts: RadarAlert[];
  className?: string;
}

export function BusinessRadar({ alerts, className }: BusinessRadarProps) {
  const navigate = useNavigate();
  
  if (alerts.length === 0) {
    return null;
  }

  const getSeverityStyles = (severity: RadarAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'radar-alert-critical';
      case 'warning':
        return 'radar-alert-warning';
      case 'opportunity':
        return 'radar-alert-opportunity';
      default:
        return '';
    }
  };

  const getIconBg = (severity: RadarAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive/10 text-destructive';
      case 'warning':
        return 'bg-warning/10 text-warning';
      case 'opportunity':
        return 'bg-success/10 text-success';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Radar
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      
      <div className="space-y-2">
        {alerts.slice(0, 5).map((alert, index) => (
          <button
            key={alert.id}
            onClick={() => navigate(alert.action.path)}
            className={cn(
              "radar-alert w-full text-left group",
              getSeverityStyles(alert.severity),
              "animate-fade-up"
            )}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              getIconBg(alert.severity)
            )}>
              <alert.icon className="w-4 h-4" />
            </div>
            
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
            
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        ))}
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
      subtext: 'Riesgo de cancelación',
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
      subtext: `${salesData.pendingCount} venta${salesData.pendingCount > 1 ? 's' : ''} pendiente${salesData.pendingCount > 1 ? 's' : ''}`,
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
      subtext: 'Con margen alto',
      action: { label: 'Activar', path: '/products' }
    });
  }

  return alerts;
}
