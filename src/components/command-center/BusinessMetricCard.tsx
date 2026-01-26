import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BusinessMetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-card border-border/50',
  success: 'bg-success/5 border-success/20',
  warning: 'bg-warning/5 border-warning/20',
  danger: 'bg-destructive/5 border-destructive/20',
};

const iconStyles = {
  default: 'bg-secondary text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
};

const valueStyles = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
};

export const BusinessMetricCard = forwardRef<HTMLDivElement, BusinessMetricCardProps>(
  function BusinessMetricCard({ 
    icon, 
    label, 
    value, 
    sublabel,
    variant = 'default',
    onClick
  }, ref) {
    return (
      <div
        ref={ref}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={cn(
          "grc-card p-5 flex items-center gap-4 w-full text-left",
          variantStyles[variant],
          onClick && "cursor-pointer hover:shadow-premium-hover"
        )}
      >
        <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-3xl font-bold leading-none mb-1 tracking-tight",
            valueStyles[variant]
          )}>
            {value}
          </p>
          <p className="text-sm text-muted-foreground truncate font-medium">
            {label}
          </p>
          {sublabel && (
            <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
              {sublabel}
            </p>
          )}
        </div>
      </div>
    );
  }
);
