import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Filter, SortAsc } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { TaskItem } from '@/components/TaskItem';
import { TaskForm } from '@/components/TaskForm';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Task, Status, Priority } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type SortOption = 'dueDate' | 'priority' | 'createdAt';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, getProjectTasks, addTask, updateTask, deleteTask } = useProjects();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');

  const project = id ? getProject(id) : undefined;
  const allTasks = id ? getProjectTasks(id) : [];

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...allTasks];
    
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    
    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }
    
    const priorityOrder: Record<Priority, number> = { alta: 0, media: 1, baja: 2 };
    
    result.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
    
    return result;
  }, [allTasks, statusFilter, priorityFilter, sortBy]);

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl text-foreground mb-4">Proyecto no encontrado</h2>
          <Button onClick={() => navigate('/')}>Volver a proyectos</Button>
        </div>
      </div>
    );
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleSubmitTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
    setEditingTask(undefined);
  };

  const handleCloseForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingTask(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a proyectos
        </button>

        <header className="sketch-card p-6 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground mb-4">{project.description}</p>
              )}
              {project.dueDate && (
                <p className="text-sm text-muted-foreground">
                  📅 Fecha de entrega: {format(new Date(project.dueDate), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              )}
            </div>
            <Button onClick={() => setFormOpen(true)} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              Nueva tarea
            </Button>
          </div>
        </header>

        {allTasks.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Status | 'all')}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_progreso">En progreso</SelectItem>
                  <SelectItem value="terminada">Terminada</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as Priority | 'all')}>
                <SelectTrigger className="w-[130px] h-9 text-sm">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Fecha límite</SelectItem>
                  <SelectItem value="priority">Prioridad</SelectItem>
                  <SelectItem value="createdAt">Fecha creación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {filteredAndSortedTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredAndSortedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={(updates) => updateTask(task.id, updates)}
                onEdit={() => handleEditTask(task)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        ) : allTasks.length > 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay tareas que coincidan con los filtros seleccionados
          </div>
        ) : (
          <EmptyState type="tasks" onAction={() => setFormOpen(true)} />
        )}
      </div>

      <TaskForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        onSubmit={handleSubmitTask}
        projectId={id!}
        initialData={editingTask}
      />
    </div>
  );
};

export default ProjectDetail;
