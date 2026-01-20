import { SmartTask } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Image, 
  TrendingUp, 
  RefreshCw,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const impactColors = {
  cobro: 'bg-[hsl(var(--grc-red-light))] border-[hsl(var(--grc-red))] text-[hsl(var(--grc-red))]',
  ventas: 'bg-[hsl(var(--grc-gold-light))] border-[hsl(var(--grc-gold))] text-[hsl(var(--grc-gold))]',
  crecimiento: 'bg-[hsl(var(--status-done-bg))] border-[hsl(var(--status-done))] text-[hsl(var(--status-done))]',
};

const impactLabels = {
  cobro: '💰 Cobro',
  ventas: '📈 Ventas',
  crecimiento: '🚀 Crecimiento',
};

const priorityStyles = {
  alta: 'border-l-[hsl(var(--priority-high))]',
  media: 'border-l-[hsl(var(--priority-medium))]',
  baja: 'border-l-[hsl(var(--priority-low))]',
};

export function PriorityTaskCard({ task, onAction }: PriorityTaskCardProps) {
  const navigate = useNavigate();
  const Icon = typeIcons[task.type];

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (task.actionPath) {
      navigate(task.actionPath);
    }
  };

  return (
    <div 
      className={`
        grc-card p-4 border-l-4 ${priorityStyles[task.priority]}
        flex items-center justify-between gap-4
        hover:shadow-lg transition-all duration-200
      `}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`
          p-2.5 rounded-xl 
          ${task.impact === 'cobro' ? 'bg-[hsl(var(--grc-red-light))]' : ''}
          ${task.impact === 'ventas' ? 'bg-[hsl(var(--grc-gold-light))]' : ''}
          ${task.impact === 'crecimiento' ? 'bg-[hsl(var(--status-done-bg))]' : ''}
        `}>
          <Icon className={`
            w-5 h-5
            ${task.impact === 'cobro' ? 'text-[hsl(var(--grc-red))]' : ''}
            ${task.impact === 'ventas' ? 'text-[hsl(var(--grc-gold))]' : ''}
            ${task.impact === 'crecimiento' ? 'text-[hsl(var(--status-done))]' : ''}
          `} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {task.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {task.description}
          </p>
        </div>

        <Badge 
          variant="outline" 
          className={`hidden sm:flex shrink-0 ${impactColors[task.impact]}`}
        >
          {impactLabels[task.impact]}
        </Badge>
      </div>

      <Button 
        onClick={handleAction}
        size="sm"
        className="shrink-0 gap-1.5"
      >
        {task.actionLabel}
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
