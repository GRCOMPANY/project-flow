import { useState } from 'react';
import { OperationalTask } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  Image, 
  Settings,
  Target,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ActionCardProps {
  task: OperationalTask;
  onExecute: () => Promise<void>;
  executing?: boolean;
}

const typeIcons = {
  cobro: DollarSign,
  seguimiento_venta: TrendingUp,
  creativo: Image,
  operacion: Settings,
  estrategia: Target,
};

const typeLabels = {
  cobro: 'COBRO',
  seguimiento_venta: 'SEGUIMIENTO',
  creativo: 'CONTENIDO',
  operacion: 'OPERACIÓN',
  estrategia: 'ESTRATEGIA',
};

const typeStyles = {
  cobro: {
    card: 'border-l-destructive bg-destructive/5',
    icon: 'bg-destructive/10 text-destructive',
    label: 'text-destructive',
  },
  seguimiento_venta: {
    card: 'border-l-warning bg-warning/5',
    icon: 'bg-warning/10 text-warning',
    label: 'text-warning',
  },
  creativo: {
    card: 'border-l-primary bg-primary/5',
    icon: 'bg-primary/10 text-primary',
    label: 'text-primary',
  },
  operacion: {
    card: 'border-l-muted-foreground bg-secondary/50',
    icon: 'bg-secondary text-muted-foreground',
    label: 'text-muted-foreground',
  },
  estrategia: {
    card: 'border-l-accent bg-accent/10',
    icon: 'bg-accent/20 text-accent-foreground',
    label: 'text-accent-foreground',
  },
};

export function ActionCard({ task, onExecute, executing = false }: ActionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const Icon = typeIcons[task.type] || Settings;
  const styles = typeStyles[task.type] || typeStyles.operacion;
  const label = typeLabels[task.type] || 'TAREA';

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await onExecute();
    } finally {
      setIsExecuting(false);
    }
  };

  const showLoader = executing || isExecuting;

  return (
    <div 
      className={cn(
        'grc-card p-4 border-l-4 transition-all duration-200',
        styles.card
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('p-2.5 rounded-xl shrink-0', styles.icon)}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Type Label */}
          <span className={cn('text-xs font-bold tracking-wide', styles.label)}>
            {label}
          </span>

          {/* Title */}
          <h3 className="text-base font-semibold text-foreground mt-0.5 mb-1">
            {task.name}
          </h3>

          {/* Description - One line */}
          <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
            {task.description}
          </p>

          {/* Actions Row */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleExecute}
              size="sm"
              className="flex-1 sm:flex-none shadow-sm"
              disabled={showLoader}
            >
              {showLoader ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                task.actionLabel
              )}
            </Button>

            {/* Expand/Collapse for context */}
            <Collapsible open={expanded} onOpenChange={setExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <MoreHorizontal className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          {/* Expandable Context */}
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleContent className="mt-3 space-y-2">
              {/* Trigger Reason */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border/50">
                <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Existe porque:</p>
                  <p className="text-sm text-foreground">{task.triggerReason}</p>
                </div>
              </div>

              {/* Consequence */}
              {task.consequence && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-destructive mb-0.5">Si no actúas:</p>
                    <p className="text-sm text-foreground">{task.consequence}</p>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
