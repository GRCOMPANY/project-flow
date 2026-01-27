import { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskCloseModal } from '@/components/tasks/TaskCloseModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  RefreshCw, 
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ListTodo
} from 'lucide-react';
import { TaskType, Priority, TaskSource, TaskStatus, OperationalTask } from '@/types';
import { cn } from '@/lib/utils';

export default function Tasks() {
  const { 
    tasks, 
    activeTasks, 
    todayTasks, 
    stats, 
    loading, 
    syncing,
    createTask,
    resolveTask,
    dismissTask,
    updateTaskStatus,
    completeWithOutcome,
    syncNow,
  } = useTasks();

  const [showForm, setShowForm] = useState(false);
  const [closeModalTask, setCloseModalTask] = useState<OperationalTask | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<TaskSource | 'all'>('all');
  const [activeTab, setActiveTab] = useState('hoy');

  // Filtrar tareas
  const filteredTasks = useMemo(() => {
    let result = activeTab === 'hoy' ? todayTasks : activeTasks;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.triggerReason.toLowerCase().includes(searchLower)
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    if (sourceFilter !== 'all') {
      result = result.filter(t => t.source === sourceFilter);
    }

    return result;
  }, [activeTasks, todayTasks, activeTab, search, typeFilter, priorityFilter, sourceFilter]);

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setPriorityFilter('all');
    setSourceFilter('all');
  };

  // Open the close modal instead of resolving directly
  const handleResolve = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setCloseModalTask(task);
    }
  };

  const handleDismiss = async (id: string, reason: string) => {
    await dismissTask(id, reason);
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await updateTaskStatus(id, status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CommandCenterNav />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-48" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-12 w-full" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />
      
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-foreground mb-2">Tareas</h1>
              <p className="text-lg text-muted-foreground">
                Tu lista de acciones prioritarias para el negocio
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={syncNow}
                disabled={syncing}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
                <span className="hidden sm:inline">Sincronizar</span>
              </Button>
              <Button 
                onClick={() => setShowForm(true)}
                className="gap-2 shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva tarea</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="mb-8 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="grc-card p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
            
            <div className="grc-card p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">En progreso</p>
              </div>
            </div>
            
            <div className="grc-card p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success/10">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
            </div>
            
            <div className="grc-card p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <ListTodo className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.highPriority}</p>
                <p className="text-xs text-muted-foreground">Alta prioridad</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="hoy" className="gap-2">
                Hoy
                {todayTasks.length > 0 && (
                  <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                    {todayTasks.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="todas" className="gap-2">
                Todas
                <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {activeTasks.length}
                </span>
              </TabsTrigger>
            </TabsList>

            {activeTab === 'todas' && (
              <TaskFilters
                search={search}
                onSearchChange={setSearch}
                type={typeFilter}
                onTypeChange={setTypeFilter}
                priority={priorityFilter}
                onPriorityChange={setPriorityFilter}
                source={sourceFilter}
                onSourceChange={setSourceFilter}
                onClear={clearFilters}
              />
            )}
          </div>

          <TabsContent value="hoy" className="mt-0">
            <div className="section-header">
              <div className="section-indicator grc-gradient" />
              <h2 className="text-xl font-semibold text-foreground">
                Acciones de Hoy
              </h2>
              <span className="text-sm text-muted-foreground">(máximo 5)</span>
            </div>

            {filteredTasks.length > 0 ? (
              <div className="space-y-3">
                {filteredTasks.map((task, index) => (
                  <div 
                    key={task.id} 
                    className="animate-fade-up"
                    style={{ animationDelay: `${0.05 * (index + 1)}s` }}
                  >
                    <TaskCard 
                      task={task}
                      onResolve={handleResolve}
                      onDismiss={handleDismiss}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grc-card p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  ¡Todo al día!
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  No hay tareas pendientes para hoy. El sistema generará nuevas tareas automáticamente cuando sea necesario.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="todas" className="mt-0">
            <div className="section-header">
              <div className="section-indicator grc-gold-gradient" />
              <h2 className="text-xl font-semibold text-foreground">
                Todas las Tareas
              </h2>
            </div>

            {filteredTasks.length > 0 ? (
              <div className="space-y-3">
                {filteredTasks.map((task, index) => (
                  <div 
                    key={task.id} 
                    className="animate-fade-up"
                    style={{ animationDelay: `${0.03 * (index + 1)}s` }}
                  >
                    <TaskCard 
                      task={task}
                      onResolve={handleResolve}
                      onDismiss={handleDismiss}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grc-card p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <ListTodo className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No hay tareas
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                  {search || typeFilter !== 'all' || priorityFilter !== 'all' || sourceFilter !== 'all'
                    ? 'No se encontraron tareas con los filtros seleccionados.'
                    : 'Crea tu primera tarea o espera a que el sistema genere tareas automáticas.'}
                </p>
                {(search || typeFilter !== 'all' || priorityFilter !== 'all' || sourceFilter !== 'all') && (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Form Modal */}
      <TaskForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={createTask}
      />

      {/* Task Close Modal */}
      <TaskCloseModal
        task={closeModalTask}
        open={!!closeModalTask}
        onOpenChange={(open) => !open && setCloseModalTask(null)}
        onSubmit={completeWithOutcome}
      />
    </div>
  );
}
