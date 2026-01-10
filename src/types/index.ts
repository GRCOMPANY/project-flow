export type Priority = 'alta' | 'media' | 'baja';
export type Status = 'pendiente' | 'en_progreso' | 'terminada';

export interface Project {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  createdAt: string;
}
