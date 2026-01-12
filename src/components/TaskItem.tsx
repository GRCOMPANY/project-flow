import { Task, Status, Priority, Profile } from '@/types';
import { Calendar, MoreVertical, Pencil, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TaskItemProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => void;
  onEdit: () => void;
  onDelete: () => void;
  showAssignee?: boolean;
}

const priorityLabels: Record<Priority, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

const statusLabels: Record<Status, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  terminada: 'Terminada',
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function TaskItem({ task, onUpdate, onEdit, onDelete, showAssignee = true }: TaskItemProps) {
  const priorityClass = {
    alta: 'priority-high',
    media: 'priority-medium',
    baja: 'priority-low',
  }[task.priority];

  const statusClass = {
    pendiente: 'status-pending',
    en_progreso: 'status-progress',
    terminada: 'status-done',
  }[task.status];

  return (
    <div className={`sketch-card p-4 ${task.status === 'terminada' ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className={`text-lg font-medium ${task.status === 'terminada' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.name}
            </h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${priorityClass}`}>
              {priorityLabels[task.priority]}
            </span>
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 flex-wrap">
            <Select
              value={task.status}
              onValueChange={(value: Status) => onUpdate({ status: value })}
            >
              <SelectTrigger className={`w-auto h-7 text-xs px-2 border-0 ${statusClass}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_progreso">En progreso</SelectItem>
                <SelectItem value="terminada">Terminada</SelectItem>
              </SelectContent>
            </Select>
            
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(task.dueDate), 'dd MMM yyyy', { locale: es })}
              </span>
            )}

            {showAssignee && (
              <div className="flex items-center gap-1.5">
                {task.assignedUser ? (
                  <>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={task.assignedUser.avatarUrl} />
                      <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                        {getInitials(task.assignedUser.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {task.assignedUser.fullName}
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    Sin asignar
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="p-1 hover:bg-secondary rounded transition-colors">
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
