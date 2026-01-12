import { useState, useEffect } from 'react';
import { Task, Priority, Status } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserSelect } from '@/components/UserSelect';
import { useAuth } from '@/contexts/AuthContext';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'assignedUser'>) => void;
  projectId: string;
  initialData?: Task;
}

export function TaskForm({ open, onOpenChange, onSubmit, projectId, initialData }: TaskFormProps) {
  const { isAdmin } = useAuth();
  
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'media');
  const [status, setStatus] = useState<Status>(initialData?.status || 'pendiente');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [assignedTo, setAssignedTo] = useState(initialData?.assignedTo || '');

  // Reset form when initialData changes
  useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
      setPriority(initialData?.priority || 'media');
      setStatus(initialData?.status || 'pendiente');
      setDueDate(initialData?.dueDate || '');
      setAssignedTo(initialData?.assignedTo || '');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      projectId,
      name: name.trim(),
      description: description.trim(),
      priority,
      status,
      dueDate,
      assignedTo: assignedTo === 'unassigned' ? undefined : assignedTo || undefined,
    });
    
    setName('');
    setDescription('');
    setPriority('media');
    setStatus('pendiente');
    setDueDate('');
    setAssignedTo('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sketch-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-3xl">
            {initialData ? 'Editar Tarea' : 'Nueva Tarea'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-name">Nombre</Label>
            <Input
              id="task-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Mi nueva tarea"
              className="sketch-border"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Descripción</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe la tarea..."
              className="sketch-border resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={(v: Priority) => setPriority(v)}>
                <SelectTrigger className="sketch-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">🔴 Alta</SelectItem>
                  <SelectItem value="media">🟡 Media</SelectItem>
                  <SelectItem value="baja">🟢 Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v: Status) => setStatus(v)}>
                <SelectTrigger className="sketch-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_progreso">En progreso</SelectItem>
                  <SelectItem value="terminada">Terminada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isAdmin && (
            <div className="space-y-2">
              <Label>Asignar a</Label>
              <UserSelect
                value={assignedTo}
                onValueChange={setAssignedTo}
                placeholder="Seleccionar usuario"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="task-dueDate">Fecha límite</Label>
            <Input
              id="task-dueDate"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="sketch-border"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {initialData ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
