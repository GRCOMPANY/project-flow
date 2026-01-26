import { useState } from 'react';
import { CreateTaskInput, TaskType, TaskImpact, Priority } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Loader2 } from 'lucide-react';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: CreateTaskInput) => Promise<boolean>;
}

const typeOptions: { value: TaskType; label: string; icon: string }[] = [
  { value: 'cobro', label: 'Cobro', icon: '💰' },
  { value: 'seguimiento_venta', label: 'Seguimiento de venta', icon: '📦' },
  { value: 'creativo', label: 'Creativo', icon: '🎨' },
  { value: 'operacion', label: 'Operación', icon: '⚙️' },
  { value: 'estrategia', label: 'Estrategia', icon: '📊' },
];

const impactOptions: { value: TaskImpact; label: string; icon: string }[] = [
  { value: 'dinero', label: 'Dinero', icon: '💰' },
  { value: 'crecimiento', label: 'Crecimiento', icon: '🚀' },
  { value: 'operacion', label: 'Operación', icon: '⚙️' },
];

const priorityOptions: { value: Priority; label: string; icon: string }[] = [
  { value: 'alta', label: 'Alta', icon: '🔴' },
  { value: 'media', label: 'Media', icon: '🟡' },
  { value: 'baja', label: 'Baja', icon: '🟢' },
];

export function TaskForm({ open, onOpenChange, onSubmit }: TaskFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateTaskInput>>({
    type: 'operacion',
    priority: 'media',
    impact: 'operacion',
    actionLabel: 'Completar',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.triggerReason) {
      return;
    }

    setLoading(true);
    const success = await onSubmit({
      name: formData.name,
      description: formData.description,
      type: formData.type || 'operacion',
      priority: formData.priority || 'media',
      impact: formData.impact || 'operacion',
      triggerReason: formData.triggerReason,
      consequence: formData.consequence,
      actionLabel: formData.actionLabel || 'Completar',
      actionPath: formData.actionPath,
    });

    setLoading(false);
    
    if (success) {
      setFormData({
        type: 'operacion',
        priority: 'media',
        impact: 'operacion',
        actionLabel: 'Completar',
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Tarea</DialogTitle>
          <DialogDescription>
            Crea una tarea manual con contexto claro sobre por qué existe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la tarea *</Label>
            <Input
              id="name"
              placeholder="Ej: Cobrar a Juan García"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              placeholder="Descripción breve"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Grid de selectores */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => setFormData({ ...formData, type: v as TaskType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(v) => setFormData({ ...formData, priority: v as Priority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Impacto</Label>
              <Select 
                value={formData.impact} 
                onValueChange={(v) => setFormData({ ...formData, impact: v as TaskImpact })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {impactOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Motivo (OBLIGATORIO) */}
          <div className="space-y-2">
            <Label htmlFor="reason">¿Por qué existe esta tarea? *</Label>
            <Textarea
              id="reason"
              placeholder="Ej: Cliente prometió pagar hace 5 días pero no lo ha hecho"
              value={formData.triggerReason || ''}
              onChange={(e) => setFormData({ ...formData, triggerReason: e.target.value })}
              required
              rows={2}
            />
          </div>

          {/* Consecuencia */}
          <div className="space-y-2">
            <Label htmlFor="consequence">¿Qué pasa si no actúas?</Label>
            <Textarea
              id="consequence"
              placeholder="Ej: Puede perderse la venta o el cliente"
              value={formData.consequence || ''}
              onChange={(e) => setFormData({ ...formData, consequence: e.target.value })}
              rows={2}
            />
          </div>

          {/* Acción */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="actionLabel">Texto del botón</Label>
              <Input
                id="actionLabel"
                placeholder="Completar"
                value={formData.actionLabel || ''}
                onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actionPath">Ruta (opcional)</Label>
              <Input
                id="actionPath"
                placeholder="/sales"
                value={formData.actionPath || ''}
                onChange={(e) => setFormData({ ...formData, actionPath: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear tarea
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
