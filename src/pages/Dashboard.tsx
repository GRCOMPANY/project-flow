import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { Navbar } from '@/components/Navbar';
import { TaskItem } from '@/components/TaskItem';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Status, Priority } from '@/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  const { tasks, projects, updateTask, deleteTask, loading } = useProjects();
  
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  // Get tasks assigned to current user
  const myTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter((t) => t.assignedTo === user.id);
  }, [tasks, user]);

  const filteredTasks = useMemo(() => {
    let result = [...myTasks];

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    return result;
  }, [myTasks, statusFilter, priorityFilter]);

  // Stats
  const stats = useMemo(() => {
    const pending = myTasks.filter((t) => t.status === 'pendiente').length;
    const inProgress = myTasks.filter((t) => t.status === 'en_progreso').length;
    const completed = myTasks.filter((t) => t.status === 'terminada').length;
    return { pending, inProgress, completed, total: myTasks.length };
  }, [myTasks]);

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || 'Proyecto desconocido';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-5xl font-bold text-foreground mb-2">
            Hola, {profile?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Panel de administrador' : 'Tus tareas asignadas'}
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="sketch-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </div>
          <div className="sketch-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--status-progress-bg))]">
              <Clock className="w-5 h-5 text-[hsl(var(--status-progress))]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">En progreso</p>
            </div>
          </div>
          <div className="sketch-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--status-done-bg))]">
              <CheckCircle className="w-5 h-5 text-[hsl(var(--status-done))]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </div>
          </div>
          <div className="sketch-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        {myTasks.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as Status | 'all')}
              >
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

              <Select
                value={priorityFilter}
                onValueChange={(v) => setPriorityFilter(v as Priority | 'all')}
              >
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
          </div>
        )}

        {/* Tasks List */}
        {filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id}>
                <Badge variant="outline" className="mb-2 text-xs">
                  📁 {getProjectName(task.projectId)}
                </Badge>
                <TaskItem
                  task={task}
                  onUpdate={(updates) => updateTask(task.id, updates)}
                  onEdit={() => navigate(`/project/${task.projectId}`)}
                  onDelete={() => deleteTask(task.id)}
                  showAssignee={false}
                />
              </div>
            ))}
          </div>
        ) : myTasks.length > 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay tareas que coincidan con los filtros seleccionados
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">📭</p>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No tienes tareas asignadas
            </h3>
            <p className="text-muted-foreground">
              {isAdmin
                ? 'Crea un proyecto y asígnate algunas tareas'
                : 'Un administrador debe asignarte tareas para que aparezcan aquí'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
