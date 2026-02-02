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
  Zap,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RadarAlert {
  id: string;
  severity: 'critical' | 'warning' | 'opportunity';
  icon: LucideIcon;
  message: string;
  subtext?: string;
  estimatedImpact?: number;
  causality?: string;
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
          card: 'radar-alert-critical hover:shadow-lg hover:shadow-destructive/10',
          icon: 'bg-destructive/12 text-destructive',
          dot: 'bg-destructive',
          impact: 'text-destructive',
        };
      case 'warning':
        return {
          card: 'radar-alert-warning hover:shadow-lg hover:shadow-warning/10',
          icon: 'bg-warning/12 text-warning',
          dot: 'bg-warning',
          impact: 'text-warning',
        };
      case 'opportunity':
        return {
          card: 'radar-alert-opportunity hover:shadow-lg hover:shadow-success/10',
          icon: 'bg-success/12 text-success',
          dot: 'bg-success',
          impact: 'text-success',
        };
      default:
        return {
          card: '',
          icon: 'bg-muted text-muted-foreground',
          dot: 'bg-muted-foreground',
          impact: 'text-muted-foreground',
        };
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 flex items-center justify-center animate-glow-ai">
            <Zap className="w-4.5 h-4.5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
              Radar IA
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Alertas detectadas automáticamente
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
          {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
        </span>
      </div>
      
      {/* Alerts Grid */}
      <div className="space-y-2.5">
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
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              {/* Severity Dot */}
              <div className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0 animate-pulse",
                styles.dot
              )} />
              
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                styles.icon
              )}>
                <alert.icon className="w-5 h-5" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-semibold text-foreground line-clamp-1">
                  {alert.message}
                </p>
                
                {/* Impact + Causality */}
                <div className="flex flex-wrap items-center gap-2">
                  {alert.estimatedImpact && alert.estimatedImpact > 0 && (
                    <span className={cn("text-xs font-bold", styles.impact)}>
                      → ${alert.estimatedImpact.toLocaleString()} {alert.severity === 'opportunity' ? 'posible' : 'en riesgo'}
                    </span>
                  )}
                  {alert.causality && (
                    <span className="text-xs text-muted-foreground italic">
                      {alert.causality}
                    </span>
                  )}
                  {!alert.estimatedImpact && alert.subtext && (
                    <span className="text-xs text-muted-foreground">
                      {alert.subtext}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                <span className="hidden sm:inline">{alert.action.label}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
    avgSaleAmount?: number;
  },
  productData: {
    hotProducts: number;
    coldProducts: number;
    needsCreatives: number;
  },
  creativesData?: {
    hotCreatives: number;
    coldCreatives: number;
    creativesWithHighMessagesLowSales: number;
  }
): RadarAlert[] {
  const alerts: RadarAlert[] = [];
  const avgSale = salesData.avgSaleAmount || 150000;

  // Critical: Old unconfirmed sales
  if (salesData.unconfirmedOld > 0) {
    alerts.push({
      id: 'unconfirmed-old',
      severity: 'critical',
      icon: PhoneCall,
      message: `${salesData.unconfirmedOld} venta${salesData.unconfirmedOld > 1 ? 's' : ''} sin confirmar hace más de 2 días`,
      estimatedImpact: Math.round(salesData.unconfirmedOld * avgSale),
      causality: 'Porque llevan mucho tiempo sin contacto',
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
      estimatedImpact: Math.round(salesData.atRisk * avgSale),
      causality: 'Requiere atención urgente',
      action: { label: 'Revisar', path: '/sales' }
    });
  }

  // Opportunity: Hot creatives to scale
  if (creativesData && creativesData.hotCreatives > 0) {
    alerts.push({
      id: 'hot-creatives',
      severity: 'opportunity',
      icon: TrendingUp,
      message: `${creativesData.hotCreatives} creativo${creativesData.hotCreatives > 1 ? 's' : ''} 🔥 listo${creativesData.hotCreatives > 1 ? 's' : ''} para escalar`,
      estimatedImpact: Math.round(creativesData.hotCreatives * avgSale * 2),
      causality: 'Contenido que funciona sin maximizar',
      action: { label: 'Escalar', path: '/creatives?performance=caliente' }
    });
  }

  // Opportunity: Pending collections
  if (salesData.pendingAmount > 50000) {
    alerts.push({
      id: 'pending-money',
      severity: 'opportunity',
      icon: DollarSign,
      message: `Puedes recuperar $${salesData.pendingAmount.toLocaleString()} si cobras hoy`,
      estimatedImpact: salesData.pendingAmount,
      causality: `${salesData.pendingCount} venta${salesData.pendingCount > 1 ? 's' : ''} lista${salesData.pendingCount > 1 ? 's' : ''} para cobrar`,
      action: { label: 'Cobrar', path: '/sales' }
    });
  }

  // Warning: Creatives with high messages but low sales
  if (creativesData && creativesData.creativesWithHighMessagesLowSales > 0) {
    alerts.push({
      id: 'low-conversion-creatives',
      severity: 'warning',
      icon: ImageIcon,
      message: `${creativesData.creativesWithHighMessagesLowSales} creativo${creativesData.creativesWithHighMessagesLowSales > 1 ? 's' : ''} con mensajes pero sin ventas`,
      causality: 'El mensaje atrae pero no convierte',
      action: { label: 'Optimizar', path: '/creatives?performance=interesante' }
    });
  }

  // Warning: Products needing creatives
  if (productData.needsCreatives > 0) {
    alerts.push({
      id: 'needs-creatives',
      severity: 'warning',
      icon: ImageIcon,
      message: `${productData.needsCreatives} producto${productData.needsCreatives > 1 ? 's' : ''} rentable${productData.needsCreatives > 1 ? 's' : ''} sin contenido activo`,
      causality: 'Oportunidad de venta perdida',
      action: { label: 'Crear', path: '/creatives' }
    });
  }

  // Warning: Cold creatives
  if (creativesData && creativesData.coldCreatives >= 3) {
    alerts.push({
      id: 'cold-creatives',
      severity: 'warning',
      icon: Package,
      message: `${creativesData.coldCreatives} creativos sin resultados`,
      causality: 'Contenido que no genera retorno',
      action: { label: 'Revisar', path: '/creatives?performance=frio' }
    });
  }

  // Opportunity: Hot products
  if (productData.hotProducts > 0) {
    alerts.push({
      id: 'hot-products',
      severity: 'opportunity',
      icon: TrendingUp,
      message: `${productData.hotProducts} producto${productData.hotProducts > 1 ? 's' : ''} listo${productData.hotProducts > 1 ? 's' : ''} para escalar`,
      causality: 'Están vendiendo bien esta semana',
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
      causality: 'Con margen alto - potencial dormido',
      action: { label: 'Activar', path: '/products' }
    });
  }

  return alerts;
}