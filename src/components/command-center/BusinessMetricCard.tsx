import { ReactNode } from 'react';

interface BusinessMetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'bg-card',
  success: 'bg-[hsl(var(--status-done-bg))]',
  warning: 'bg-[hsl(var(--grc-gold-light))]',
  danger: 'bg-[hsl(var(--grc-red-light))]',
};

const iconStyles = {
  default: 'bg-secondary text-muted-foreground',
  success: 'bg-[hsl(var(--status-done)_/_0.15)] text-[hsl(var(--status-done))]',
  warning: 'bg-[hsl(var(--grc-gold)_/_0.15)] text-[hsl(var(--grc-gold))]',
  danger: 'bg-[hsl(var(--grc-red)_/_0.15)] text-[hsl(var(--grc-red))]',
};

export function BusinessMetricCard({ 
  icon, 
  label, 
  value, 
  sublabel,
  variant = 'default' 
}: BusinessMetricCardProps) {
  return (
    <div className={`
      grc-card p-4 ${variantStyles[variant]}
      flex items-center gap-3
    `}>
      <div className={`p-2.5 rounded-xl ${iconStyles[variant]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground leading-none mb-0.5">
          {value}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {label}
        </p>
        {sublabel && (
          <p className="text-xs font-medium text-foreground/70 truncate">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
