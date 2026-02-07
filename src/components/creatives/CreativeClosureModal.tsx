import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Brain, CheckCircle2 } from 'lucide-react';

interface CreativeClosureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creativeName: string;
  existingLearning?: string;
  onConfirm: (learning: string) => Promise<void>;
}

export function CreativeClosureModal({
  open,
  onOpenChange,
  creativeName,
  existingLearning = '',
  onConfirm,
}: CreativeClosureModalProps) {
  const [whatWorked, setWhatWorked] = useState('');
  const [whatDidntWork, setWhatDidntWork] = useState('');
  const [whatToRepeat, setWhatToRepeat] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = whatWorked.trim().length >= 10 || whatDidntWork.trim().length >= 10 || whatToRepeat.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isValid) return;
    
    setIsSubmitting(true);
    try {
      // Combinar todos los campos en un solo aprendizaje
      const parts: string[] = [];
      if (whatWorked.trim()) parts.push(`✅ Funcionó: ${whatWorked.trim()}`);
      if (whatDidntWork.trim()) parts.push(`❌ No funcionó: ${whatDidntWork.trim()}`);
      if (whatToRepeat.trim()) parts.push(`🔄 Repetiría: ${whatToRepeat.trim()}`);
      
      const combinedLearning = parts.join('\n\n');
      await onConfirm(existingLearning ? `${existingLearning}\n\n---\n\n${combinedLearning}` : combinedLearning);
      
      // Reset form
      setWhatWorked('');
      setWhatDidntWork('');
      setWhatToRepeat('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Cierre de Experimento
          </DialogTitle>
          <DialogDescription>
            Antes de cerrar "<strong>{creativeName}</strong>", documenta lo aprendido. 
            Esta información es valiosa para futuros experimentos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium text-emerald-700">
              ¿Qué funcionó bien?
            </Label>
            <Textarea
              value={whatWorked}
              onChange={(e) => setWhatWorked(e.target.value)}
              placeholder="Ej: El hook de precio atrajo muchos mensajes, el video corto tuvo mejor retención..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-rose-700">
              ¿Qué no funcionó?
            </Label>
            <Textarea
              value={whatDidntWork}
              onChange={(e) => setWhatDidntWork(e.target.value)}
              placeholder="Ej: El copy era muy largo, la imagen no mostraba bien el producto..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-amber-700">
              ¿Qué repetirías en el futuro?
            </Label>
            <Textarea
              value={whatToRepeat}
              onChange={(e) => setWhatToRepeat(e.target.value)}
              placeholder="Ej: Usar el mismo formato de video, probar con otro público, cambiar el CTA..."
              rows={2}
              className="mt-1"
            />
          </div>

          {!isValid && (
            <p className="text-xs text-muted-foreground">
              * Completa al menos uno de los campos con 10+ caracteres para continuar.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Guardando...' : 'Cerrar experimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
