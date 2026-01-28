import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Alert {
  id: string;
  icon: LucideIcon;
  value: string | number;
  label: string;
  variant: 'danger' | 'warning' | 'info';
  path: string;
}

interface AlertStripProps {
  alerts: Alert[];
  className?: string;
}

const variantStyles = {
  danger: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20',
  warning: 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/20',
  info: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20',
};

export function AlertStrip({ alerts, className }: AlertStripProps) {
  const navigate = useNavigate();

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {alerts.map((alert) => {
        const Icon = alert.icon;
        return (
          <button
            key={alert.id}
            onClick={() => navigate(alert.path)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium',
              'cursor-pointer transition-all duration-200 border',
              variantStyles[alert.variant]
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="font-bold">{alert.value}</span>
            <span className="opacity-80">{alert.label}</span>
          </button>
        );
      })}
    </div>
  );
}
