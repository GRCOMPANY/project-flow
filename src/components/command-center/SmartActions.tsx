import { useNavigate } from 'react-router-dom';
import { LucideIcon, DollarSign, Palette, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SmartAction {
  id: string;
  label: string;
  icon: LucideIcon;
  variant: 'primary' | 'secondary' | 'outline';
  path: string;
  badge?: number;
}

interface SmartActionsProps {
  actions: SmartAction[];
  className?: string;
}

export function SmartActions({ actions, className }: SmartActionsProps) {
  const navigate = useNavigate();

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className={cn("smart-actions", className)}>
      {actions.slice(0, 4).map((action, index) => {
        const Icon = action.icon;
        const isPrimary = action.variant === 'primary';
        
        return (
          <Button
            key={action.id}
            variant={isPrimary ? 'default' : action.variant === 'secondary' ? 'secondary' : 'outline'}
            size="lg"
            className={cn(
              "gap-2 relative",
              isPrimary && "smart-action-primary"
            )}
            onClick={() => navigate(action.path)}
          >
            <Icon className="w-4 h-4" />
            <span>{action.label}</span>
            {action.badge !== undefined && action.badge > 0 && (
              <span className={cn(
                "ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full",
                isPrimary ? "bg-background/20 text-primary-foreground" : "bg-primary text-primary-foreground"
              )}>
                {action.badge}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

// Helper to generate smart actions based on business context
export function generateSmartActions(
  salesData: {
    pendingCount: number;
    pendingAmount: number;
  },
  productData: {
    needsCreatives: number;
    hotProducts: number;
    coldProducts: number;
  }
): SmartAction[] {
  const actions: SmartAction[] = [];

  // Primary: Collect money (if there's pending)
  if (salesData.pendingCount > 0) {
    actions.push({
      id: 'collect',
      label: 'Cobrar ahora',
      icon: DollarSign,
      variant: 'primary',
      path: '/sales',
      badge: salesData.pendingCount,
    });
  }

  // Secondary: Create content (if products need it)
  if (productData.needsCreatives > 0) {
    actions.push({
      id: 'create-content',
      label: 'Crear creativo',
      icon: Palette,
      variant: 'secondary',
      path: '/creatives',
    });
  }

  // Outline: Scale products (if there are hot ones)
  if (productData.hotProducts > 0) {
    actions.push({
      id: 'scale',
      label: 'Escalar producto',
      icon: TrendingUp,
      variant: 'outline',
      path: '/products',
    });
  }

  // Outline: Reactivate cold products
  if (productData.coldProducts > 0 && actions.length < 3) {
    actions.push({
      id: 'reactivate',
      label: 'Reactivar producto',
      icon: Zap,
      variant: 'outline',
      path: '/products',
    });
  }

  return actions;
}
