import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, Task, Status, Priority, Profile } from '@/types';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentCompany } = useCompany();

  // Fetch projects from Supabase
  const fetchProjects = useCallback(async () => {
    if (!currentCompany) return;
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', currentCompany.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar proyectos');
      console.error('Error fetching projects:', error);
      return;
    }

    const mappedProjects: Project[] = data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      dueDate: p.due_date || '',
      createdAt: p.created_at,
    }));

    setProjects(mappedProjects);
  }, []);

  // Fetch tasks from Supabase with assigned user profile
  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:profiles!tasks_assigned_to_fkey(
          id,
          full_name,
          email,
          avatar_url,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar tareas');
      console.error('Error fetching tasks:', error);
      return;
    }

    const mappedTasks: Task[] = data.map(t => ({
      id: t.id,
      projectId: t.project_id,
      name: t.name,
      description: t.description || '',
      status: t.status as Status,
      priority: t.priority as Priority,
      dueDate: t.due_date || '',
      createdAt: t.created_at,
      assignedTo: t.assigned_to || undefined,
      assignedUser: t.assigned_user ? {
        id: t.assigned_user.id,
        fullName: t.assigned_user.full_name,
        email: t.assigned_user.email,
        avatarUrl: t.assigned_user.avatar_url || undefined,
        createdAt: t.assigned_user.created_at,
      } : undefined,
    }));

    setTasks(mappedTasks);
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProjects(), fetchTasks()]);
      setLoading(false);
    };
    loadData();
  }, [fetchProjects, fetchTasks]);

  const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: project.name,
        description: project.description,
        due_date: project.dueDate || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Error al crear proyecto');
      console.error('Error creating project:', error);
      return null;
    }

    const newProject: Project = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      dueDate: data.due_date || '',
      createdAt: data.created_at,
    };

    setProjects(prev => [newProject, ...prev]);
    toast.success('Proyecto creado');
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;

    const { error } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      toast.error('Error al actualizar proyecto');
      console.error('Error updating project:', error);
      return;
    }

    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
    toast.success('Proyecto actualizado');
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.message.includes('row-level security')) {
        toast.error('Solo los administradores pueden eliminar proyectos');
      } else {
        toast.error('Error al eliminar proyecto');
      }
      console.error('Error deleting project:', error);
      return;
    }

    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    toast.success('Proyecto eliminado');
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'assignedUser'>) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: task.projectId,
        name: task.name,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.dueDate || null,
        assigned_to: task.assignedTo || null,
      })
      .select(`
        *,
        assigned_user:profiles!tasks_assigned_to_fkey(
          id,
          full_name,
          email,
          avatar_url,
          created_at
        )
      `)
      .single();

    if (error) {
      if (error.message.includes('row-level security')) {
        toast.error('Solo los administradores pueden crear tareas');
      } else {
        toast.error('Error al crear tarea');
      }
      console.error('Error creating task:', error);
      return null;
    }

    const newTask: Task = {
      id: data.id,
      projectId: data.project_id,
      name: data.name,
      description: data.description || '',
      status: data.status as Status,
      priority: data.priority as Priority,
      dueDate: data.due_date || '',
      createdAt: data.created_at,
      assignedTo: data.assigned_to || undefined,
      assignedUser: data.assigned_user ? {
        id: data.assigned_user.id,
        fullName: data.assigned_user.full_name,
        email: data.assigned_user.email,
        avatarUrl: data.assigned_user.avatar_url || undefined,
        createdAt: data.assigned_user.created_at,
      } : undefined,
    };

    setTasks(prev => [newTask, ...prev]);
    toast.success('Tarea creada');
    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo || null;

    const { error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      if (error.message.includes('row-level security')) {
        toast.error('No tienes permiso para actualizar esta tarea');
      } else {
        toast.error('Error al actualizar tarea');
      }
      console.error('Error updating task:', error);
      return;
    }

    // Refetch to get updated assigned_user
    if (updates.assignedTo !== undefined) {
      await fetchTasks();
    } else {
      setTasks(prev =>
        prev.map(t => (t.id === id ? { ...t, ...updates } : t))
      );
    }
    toast.success('Tarea actualizada');
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.message.includes('row-level security')) {
        toast.error('Solo los administradores pueden eliminar tareas');
      } else {
        toast.error('Error al eliminar tarea');
      }
      console.error('Error deleting task:', error);
      return;
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success('Tarea eliminada');
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(t => t.projectId === projectId);
  };

  const getProject = (id: string) => {
    return projects.find(p => p.id === id);
  };

  return {
    projects,
    tasks,
    loading,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    getProjectTasks,
    getProject,
    refetch: () => Promise.all([fetchProjects(), fetchTasks()]),
  };
}
