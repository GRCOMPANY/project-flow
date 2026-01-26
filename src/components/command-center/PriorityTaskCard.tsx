import { SmartTask } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Image, 
  TrendingUp, 
  RefreshCw,
  ArrowRight,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PriorityTaskCardProps {
  task: SmartTask;
  onAction?: () => void;
}

const typeIcons = {
  cobro: DollarSign,
  creativo: Image,
  promocion: TrendingUp,
  actualizacion: RefreshCw,
  seguimiento: AlertCircle,
};

const typeConfig = {
  cobro: {
    label: 'COBRO PENDIENTE',
    bgClass: 'bg-destructive/5',
    iconClass: 'bg-destructive/10 text-destructive',
    labelClass: 'text-destructive',
  },
  creativo: {
    label: 'CREAR CONTENIDO',
    bgClass: 'bg-primary/5',
    iconClass: 'bg-primary/10 text-primary',
    labelClass: 'text-primary',
  },
  promocion: {
    label: 'PROMOCIONAR',
    bgClass: 'bg-warning/5',
    iconClass: 'bg-warning/10 text-warning',
    labelClass: 'text-warning',
  },
  actualizacion: {
    label: 'ACTUALIZAR',
    bgClass: 'bg-secondary',
    iconClass: 'bg-secondary text-muted-foreground',
    labelClass: 'text-muted-foreground',
  },
  seguimiento: {
    label: 'SEGUIMIENTO',
    bgClass: 'bg-secondary',
    iconClass: 'bg-secondary text-muted-foreground',
    labelClass: 'text-muted-foreground',
  },
};

const priorityStyles = {
  alta: 'border-l-4 border-l-destructive',
  media: 'border-l-4 border-l-warning',
  baja: 'border-l-4 border-l-success',
};

const impactColors = {
  cobro: 'bg-destructive/10 text-destructive border-destructive/30',
  ventas: 'bg-warning/10 text-warning border-warning/30',
  crecimiento: 'bg-success/10 text-success border-success/30',
};

const impactLabels = {
  cobro: '💰 Cobro',
  ventas: '📈 Ventas',
  crecimiento: '🚀 Crecimiento',
};

export function PriorityTaskCard({ task, onAction }: PriorityTaskCardProps) {
  const navigate = useNavigate();
  const Icon = typeIcons[task.type];
  const config = typeConfig[task.type];

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (task.actionPath) {
      navigate(task.actionPath);
    }
  };

  return (
    <div 
      className={cn(
        "grc-card p-5 transition-all duration-200 hover:shadow-premium-hover",
        config.bgClass,
        priorityStyles[task.priority]
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn("p-3 rounded-xl shrink-0", config.iconClass)}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Type label */}
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-xs font-bold tracking-wide", config.labelClass)}>
              {config.label}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-1">
            {task.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-1">
            {task.description}
          </p>
        </div>

        {/* Impact badge - hidden on mobile */}
        <Badge 
          variant="outline" 
          className={cn("hidden sm:flex shrink-0", impactColors[task.impact])}
        >
          {impactLabels[task.impact]}
        </Badge>

        {/* Action */}
        <Button 
          onClick={handleAction}
          size="sm"
          className="shrink-0 gap-1.5 shadow-sm"
        >
          {task.actionLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
