import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Sparkles, 
  TrendingUp, 
  Zap,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SmartAction {
  id: string;
  label: string;
  icon: LucideIcon;
  variant: 'default' | 'secondary' | 'outline';
  path: string;
  badge?: number;
  priority: number;
  gradient?: string;
}

interface QuickActionsBarProps {
  actions: SmartAction[];
  className?: string;
}

export function QuickActionsBar({ actions, className }: QuickActionsBarProps) {
  const navigate = useNavigate();

  if (actions.length === 0) {
    return null;
  }

  // Sort by priority and take top 4
  const sortedActions = [...actions]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center">
          <Zap className="w-4.5 h-4.5 text-muted-foreground" />
        </div>
        <div>
          <span className="text-sm font-bold text-foreground uppercase tracking-wide">
            Acciones Rápidas
          </span>
          <p className="text-xs text-muted-foreground">
            Lo más importante ahora
          </p>
        </div>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Actions Grid */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {sortedActions.map((action, index) => (
          <Button
            key={action.id}
            variant={action.variant}
            size="lg"
            onClick={() => navigate(action.path)}
            className={cn(
              "gap-2.5 relative min-w-[140px] h-12 text-base font-semibold",
              action.variant === 'default' && !action.gradient && "btn-gradient-primary text-white",
              action.gradient,
              "animate-fade-up transition-all duration-300"
            )}
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            <action.icon className="w-5 h-5" />
            <span>{action.label}</span>
            {action.badge !== undefined && action.badge > 0 && (
              <span className={cn(
                "absolute -top-2 -right-2 min-w-6 h-6 rounded-full flex items-center justify-center",
                "text-xs font-bold shadow-lg",
                action.variant === 'default' 
                  ? "bg-white text-primary" 
                  : "bg-primary text-primary-foreground"
              )}>
                {action.badge > 9 ? '9+' : action.badge}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Helper function to generate smart actions based on data
export function generateSmartActions(
  salesData: {
    pendingCount: number;
    pendingAmount: number;
  },
  productData: {
    hotProducts: number;
    coldProducts: number;
    needsCreatives: number;
  }
): SmartAction[] {
  const actions: SmartAction[] = [];

  // 1. Cobrar (highest priority if there's money pending)
  if (salesData.pendingCount > 0) {
    actions.push({
      id: 'collect',
      label: 'Cobrar Ahora',
      icon: DollarSign,
      variant: 'default',
      path: '/sales',
      badge: salesData.pendingCount,
      priority: 1,
    });
  }

  // 2. Create creative
  if (productData.needsCreatives > 0) {
    actions.push({
      id: 'creative',
      label: 'Crear Creativo',
      icon: Sparkles,
      variant: productData.needsCreatives > 0 ? 'secondary' : 'outline',
      path: '/creatives',
      badge: productData.needsCreatives,
      priority: 2,
    });
  }

  // 3. Scale hot products
  if (productData.hotProducts > 0) {
    actions.push({
      id: 'scale',
      label: 'Escalar Producto',
      icon: TrendingUp,
      variant: 'outline',
      path: '/products',
      badge: productData.hotProducts,
      priority: 3,
    });
  }

  // 4. Activate cold products
  if (productData.coldProducts > 0) {
    actions.push({
      id: 'activate',
      label: 'Reactivar',
      icon: Zap,
      variant: 'outline',
      path: '/products',
      badge: productData.coldProducts,
      priority: 4,
    });
  }

  // Fallback: Always show create creative
  if (actions.length === 0) {
    actions.push({
      id: 'creative-default',
      label: 'Crear Creativo',
      icon: Sparkles,
      variant: 'default',
      path: '/creatives',
      priority: 1,
    });
  }

  return actions;
}