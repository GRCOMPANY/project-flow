import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OperationalTask, TaskStatus, TaskOutcomeResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  DollarSign, 
  Image, 
  TrendingUp, 
  Settings,
  Target,
  ArrowRight,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: OperationalTask;
  onResolve?: (id: string) => void;
  onDismiss?: (id: string, reason: string) => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
  compact?: boolean;
}

const typeIcons = {
  cobro: DollarSign,
  seguimiento_venta: TrendingUp,
  creativo: Image,
  operacion: Settings,
  estrategia: Target,
};

const typeLabels = {
  cobro: 'COBRO PENDIENTE',
  seguimiento_venta: 'SEGUIMIENTO',
  creativo: 'CREAR CONTENIDO',
  operacion: 'OPERACIÓN',
  estrategia: 'ESTRATEGIA',
};

const typeConfig = {
  cobro: {
    bgClass: 'bg-destructive/5 border-l-destructive',
    iconClass: 'bg-destructive/10 text-destructive',
    labelClass: 'text-destructive',
  },
  seguimiento_venta: {
    bgClass: 'bg-warning/5 border-l-warning',
    iconClass: 'bg-warning/10 text-warning',
    labelClass: 'text-warning',
  },
  creativo: {
    bgClass: 'bg-primary/5 border-l-primary',
    iconClass: 'bg-primary/10 text-primary',
    labelClass: 'text-primary',
  },
  operacion: {
    bgClass: 'bg-secondary border-l-muted-foreground',
    iconClass: 'bg-secondary text-muted-foreground',
    labelClass: 'text-muted-foreground',
  },
  estrategia: {
    bgClass: 'bg-accent/10 border-l-accent',
    iconClass: 'bg-accent/20 text-accent-foreground',
    labelClass: 'text-accent-foreground',
  },
};

const impactConfig = {
  dinero: { label: '💰 Dinero', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  crecimiento: { label: '🚀 Crecimiento', className: 'bg-success/10 text-success border-success/30' },
  operacion: { label: '⚙️ Operación', className: 'bg-secondary text-muted-foreground border-border' },
};

const priorityConfig = {
  alta: 'border-l-4',
  media: 'border-l-4',
  baja: 'border-l-4',
};

// Outcome display config
const outcomeConfig: Record<TaskOutcomeResult, { label: string; icon: React.ReactNode; className: string }> = {
  exitoso: { 
    label: 'Exitoso', 
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: 'bg-success/10 text-success border-success/30'
  },
  fallido: { 
    label: 'Fallido', 
    icon: <XCircle className="w-3 h-3" />,
    className: 'bg-destructive/10 text-destructive border-destructive/30'
  },
  reprogramado: { 
    label: 'Reprogramado', 
    icon: <RefreshCw className="w-3 h-3" />,
    className: 'bg-warning/10 text-warning border-warning/30'
  },
  cancelado: { 
    label: 'Cancelado', 
    icon: <Ban className="w-3 h-3" />,
    className: 'bg-muted text-muted-foreground border-border'
  },
};

export function TaskCard({ 
  task, 
  onResolve, 
  onDismiss, 
  onStatusChange,
  compact = false 
}: TaskCardProps) {
  const navigate = useNavigate();
  // Context collapsed by default for audit view
  const [expanded, setExpanded] = useState(false);
  
  const Icon = typeIcons[task.type] || Settings;
  const config = typeConfig[task.type] || typeConfig.operacion;
  const impact = impactConfig[task.impact] || impactConfig.operacion;

  const handleAction = () => {
    if (task.actionPath) {
      navigate(task.actionPath);
    }
  };

  const handleResolve = () => {
    if (onResolve) {
      onResolve(task.id);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(task.id, 'Descartada por el usuario');
    }
  };

  if (compact) {
    return (
      <div 
        className={cn(
          "grc-card p-4 transition-all duration-200 hover:shadow-premium-hover cursor-pointer",
          config.bgClass,
          priorityConfig[task.priority]
        )}
        onClick={handleAction}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg shrink-0", config.iconClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
            <p className="text-xs text-muted-foreground truncate">{task.description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "grc-card p-4 transition-all duration-200",
        config.bgClass,
        priorityConfig[task.priority]
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn("p-2.5 rounded-xl shrink-0", config.iconClass)}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn("text-xs font-bold tracking-wide", config.labelClass)}>
              {typeLabels[task.type]}
            </span>
            <Badge variant="outline" className={cn("text-[10px] h-5", impact.className)}>
              {impact.label}
            </Badge>
            {task.source === 'automatic' && (
              <Badge variant="secondary" className="text-[10px] h-5">
                ⚡ Auto
              </Badge>
            )}
            {/* Outcome badges */}
            {task.outcome && (
              <>
                <Badge variant="outline" className={cn("text-[10px] h-5 gap-1", outcomeConfig[task.outcome.result].className)}>
                  {outcomeConfig[task.outcome.result].icon}
                  {outcomeConfig[task.outcome.result].label}
                </Badge>
                {task.outcome.generatedIncome && task.outcome.incomeAmount > 0 && (
                  <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-success/10 text-success border-success/30">
                    💰 ${task.outcome.incomeAmount.toLocaleString()}
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-foreground mb-0.5">
            {task.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>

          {/* Expandable Context - Collapsed by default */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Ocultar detalles' : 'Ver detalles'}
          </button>

          {expanded && (
            <div className="space-y-2 mb-3">
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
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <Button 
              onClick={handleAction}
              size="sm"
              className="gap-1.5 shadow-sm"
            >
              {task.actionLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>

            {onResolve && (
              <Button
                onClick={handleResolve}
                size="sm"
                variant="outline"
                className="gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completar
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onStatusChange && (
                  <>
                    <DropdownMenuItem onClick={() => onStatusChange(task.id, 'en_progreso')}>
                      <Clock className="w-4 h-4 mr-2" />
                      Marcar en progreso
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(task.id, 'esperando_respuesta')}>
                      <Clock className="w-4 h-4 mr-2" />
                      Esperando respuesta
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {onDismiss && (
                  <DropdownMenuItem 
                    onClick={handleDismiss}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Descartar tarea
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
