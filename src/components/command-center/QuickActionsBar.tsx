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
    <div className={cn("space-y-3", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
          <Zap className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Acciones Rápidas
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Actions Grid */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {sortedActions.map((action, index) => (
          <Button
            key={action.id}
            variant={action.variant}
            onClick={() => navigate(action.path)}
            className={cn(
              "gap-2 relative",
              action.variant === 'default' && "shadow-lg",
              "animate-fade-up"
            )}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <action.icon className="w-4 h-4" />
            <span>{action.label}</span>
            {action.badge !== undefined && action.badge > 0 && (
              <span className={cn(
                "absolute -top-1.5 -right-1.5 min-w-5 h-5 rounded-full flex items-center justify-center",
                "text-[10px] font-bold",
                action.variant === 'default' 
                  ? "bg-background text-foreground" 
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
