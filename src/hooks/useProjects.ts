import { useState, useEffect } from 'react';
import { Project, Task } from '@/types';

const PROJECTS_KEY = 'task-manager-projects';
const TASKS_KEY = 'task-manager-tasks';

const DEMO_PROJECT_ID = 'demo-project-1';

const defaultProjects: Project[] = [
  {
    id: DEMO_PROJECT_ID,
    name: 'Rediseño Web',
    description: 'Actualizar el sitio web corporativo con nuevo diseño responsive y mejor UX',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-project-2',
    name: 'App Móvil',
    description: 'Desarrollo de aplicación móvil para clientes con funciones de seguimiento',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-project-3',
    name: 'Marketing Q1',
    description: 'Campaña de marketing digital para el primer trimestre del año',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const defaultTasks: Task[] = [
  {
    id: 'demo-task-1',
    projectId: DEMO_PROJECT_ID,
    name: 'Diseñar mockups',
    description: 'Crear wireframes y mockups de alta fidelidad para las páginas principales',
    status: 'terminada',
    priority: 'alta',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-task-2',
    projectId: DEMO_PROJECT_ID,
    name: 'Desarrollar homepage',
    description: 'Implementar el diseño de la página principal con animaciones',
    status: 'en_progreso',
    priority: 'alta',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-task-3',
    projectId: DEMO_PROJECT_ID,
    name: 'Optimizar imágenes',
    description: 'Comprimir y optimizar todas las imágenes del sitio',
    status: 'pendiente',
    priority: 'media',
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-task-4',
    projectId: DEMO_PROJECT_ID,
    name: 'Testing cross-browser',
    description: 'Probar compatibilidad en Chrome, Firefox, Safari y Edge',
    status: 'pendiente',
    priority: 'baja',
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-task-5',
    projectId: 'demo-project-2',
    name: 'Configurar proyecto React Native',
    description: 'Inicializar el proyecto y configurar dependencias principales',
    status: 'en_progreso',
    priority: 'alta',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-task-6',
    projectId: 'demo-project-3',
    name: 'Planificar contenido redes',
    description: 'Crear calendario de publicaciones para Instagram y LinkedIn',
    status: 'pendiente',
    priority: 'media',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(PROJECTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.length > 0 ? parsed : defaultProjects;
    }
    return defaultProjects;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(TASKS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.length > 0 ? parsed : defaultTasks;
    }
    return defaultTasks;
  });

  useEffect(() => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
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
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    getProjectTasks,
    getProject,
  };
}
