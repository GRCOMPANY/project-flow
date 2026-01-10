import { Project, Task } from '@/types';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  onClick: () => void;
}

export function ProjectCard({ project, tasks, onClick }: ProjectCardProps) {
  const completedTasks = tasks.filter(t => t.status === 'terminada').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className="sketch-card p-6 text-left w-full flex flex-col items-center gap-4 group"
    >
      <div 
        className="w-20 h-20 rounded-full border-2 border-border flex items-center justify-center bg-secondary relative overflow-hidden"
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="4"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="hsl(var(--status-done))"
            strokeWidth="4"
            strokeDasharray={`${progress * 2.26} 226`}
            className="transition-all duration-500"
          />
        </svg>
        <span className="text-2xl font-bold text-foreground z-10 font-sans">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="text-center w-full">
        <h3 className="text-2xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {project.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {project.description}
        </p>
        
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {completedTasks}/{totalTasks}
          </span>
          {project.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(project.dueDate), 'dd MMM', { locale: es })}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
