import { FolderOpen, ListTodo } from 'lucide-react';

interface EmptyStateProps {
  type: 'projects' | 'tasks';
  onAction: () => void;
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const isProjects = type === 'projects';
  
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 border-2 border-border">
        {isProjects ? (
          <FolderOpen className="w-10 h-10 text-muted-foreground" />
        ) : (
          <ListTodo className="w-10 h-10 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-2xl text-foreground mb-2">
        {isProjects ? 'Sin proyectos aún' : 'Sin tareas aún'}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {isProjects
          ? 'Crea tu primer proyecto para empezar a organizar tus tareas'
          : 'Añade tu primera tarea para empezar a trabajar'
        }
      </p>
      <button
        onClick={onAction}
        className="sketch-card px-6 py-3 text-foreground font-medium hover:bg-secondary transition-colors"
      >
        + {isProjects ? 'Crear proyecto' : 'Nueva tarea'}
      </button>
    </div>
  );
}
