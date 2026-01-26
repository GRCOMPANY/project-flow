import { TaskType, TaskStatus, Priority, TaskSource } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  type: TaskType | 'all';
  onTypeChange: (value: TaskType | 'all') => void;
  priority: Priority | 'all';
  onPriorityChange: (value: Priority | 'all') => void;
  source: TaskSource | 'all';
  onSourceChange: (value: TaskSource | 'all') => void;
  onClear: () => void;
}

const typeOptions: { value: TaskType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'cobro', label: '💰 Cobros' },
  { value: 'seguimiento_venta', label: '📦 Seguimiento' },
  { value: 'creativo', label: '🎨 Creativos' },
  { value: 'operacion', label: '⚙️ Operación' },
  { value: 'estrategia', label: '📊 Estrategia' },
];

const priorityOptions: { value: Priority | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas las prioridades' },
  { value: 'alta', label: '🔴 Alta' },
  { value: 'media', label: '🟡 Media' },
  { value: 'baja', label: '🟢 Baja' },
];

const sourceOptions: { value: TaskSource | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los orígenes' },
  { value: 'manual', label: '✍️ Manual' },
  { value: 'automatic', label: '⚡ Automática' },
  { value: 'ai_suggested', label: '🤖 IA sugerida' },
];

export function TaskFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  priority,
  onPriorityChange,
  source,
  onSourceChange,
  onClear,
}: TaskFiltersProps) {
  const hasActiveFilters = search || type !== 'all' || priority !== 'all' || source !== 'all';

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tareas..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Type filter */}
      <Select value={type} onValueChange={(v) => onTypeChange(v as TaskType | 'all')}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          {typeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority filter */}
      <Select value={priority} onValueChange={(v) => onPriorityChange(v as Priority | 'all')}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Prioridad" />
        </SelectTrigger>
        <SelectContent>
          {priorityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Source filter */}
      <Select value={source} onValueChange={(v) => onSourceChange(v as TaskSource | 'all')}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Origen" />
        </SelectTrigger>
        <SelectContent>
          {sourceOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
