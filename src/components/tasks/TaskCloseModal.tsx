import { useState } from 'react';
import { OperationalTask, TaskOutcomeResult, CreateTaskOutcomeInput } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Ban,
  DollarSign,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCloseModalProps {
  task: OperationalTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateTaskOutcomeInput) => Promise<boolean>;
}

const resultOptions: { value: TaskOutcomeResult; label: string; icon: React.ReactNode; className: string }[] = [
  { 
    value: 'exitoso', 
    label: 'Exitoso', 
    icon: <CheckCircle2 className="w-4 h-4" />,
    className: 'data-[state=checked]:border-success data-[state=checked]:bg-success/10 data-[state=checked]:text-success'
  },
  { 
    value: 'fallido', 
    label: 'Fallido', 
    icon: <XCircle className="w-4 h-4" />,
    className: 'data-[state=checked]:border-destructive data-[state=checked]:bg-destructive/10 data-[state=checked]:text-destructive'
  },
  { 
    value: 'reprogramado', 
    label: 'Reprogramado', 
    icon: <RefreshCw className="w-4 h-4" />,
    className: 'data-[state=checked]:border-warning data-[state=checked]:bg-warning/10 data-[state=checked]:text-warning'
  },
  { 
    value: 'cancelado', 
    label: 'Cancelado', 
    icon: <Ban className="w-4 h-4" />,
    className: 'data-[state=checked]:border-muted-foreground data-[state=checked]:bg-muted data-[state=checked]:text-muted-foreground'
  },
];

export function TaskCloseModal({ task, open, onOpenChange, onSubmit }: TaskCloseModalProps) {
  const [result, setResult] = useState<TaskOutcomeResult | null>(null);
  const [generatedIncome, setGeneratedIncome] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setResult(null);
    setGeneratedIncome(false);
    setIncomeAmount('');
    setNotes('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async () => {
    if (!task || !result) return;

    setSubmitting(true);
    try {
      const success = await onSubmit({
        taskId: task.id,
        result,
        generatedIncome,
        incomeAmount: generatedIncome ? parseFloat(incomeAmount) || 0 : 0,
        notes: notes.trim() || undefined,
      });

      if (success) {
        handleOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = result !== null;
  const notesLength = notes.length;
  const notesRemaining = 200 - notesLength;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            Cerrar Tarea
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-foreground">
            {task?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Result Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              ¿Cuál fue el resultado? <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={result || ''}
              onValueChange={(value) => setResult(value as TaskOutcomeResult)}
              className="grid grid-cols-2 gap-3"
            >
              {resultOptions.map((option) => (
                <div key={option.value}>
                  <RadioGroupItem
                    value={option.value}
                    id={`result-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`result-${option.value}`}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border-2 border-border cursor-pointer transition-all",
                      "hover:bg-secondary/50 peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                      result === option.value && option.className.replace('data-[state=checked]:', '')
                    )}
                  >
                    {option.icon}
                    <span className="font-medium">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Income Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success" />
              <Label htmlFor="generated-income" className="font-medium cursor-pointer">
                ¿Generó ingreso?
              </Label>
            </div>
            <Switch
              id="generated-income"
              checked={generatedIncome}
              onCheckedChange={setGeneratedIncome}
            />
          </div>

          {/* Income Amount - Only show if generated income */}
          {generatedIncome && (
            <div className="space-y-2 animate-fade-up">
              <Label htmlFor="income-amount" className="text-sm font-medium">
                Monto generado
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="income-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes" className="text-sm font-medium">
                Nota (opcional)
              </Label>
              <span className={cn(
                "text-xs",
                notesRemaining < 20 ? "text-warning" : "text-muted-foreground"
              )}>
                {notesRemaining} caracteres
              </span>
            </div>
            <Textarea
              id="notes"
              placeholder="Breve resumen del resultado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              maxLength={200}
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
