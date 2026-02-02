import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreativeIntelligence, AutomationIntent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  RotateCcw, 
  Users, 
  Send, 
  Globe,
  Sparkles,
  Info,
} from 'lucide-react';

interface CreativeActionsProps {
  creative: CreativeIntelligence;
  onIntentRegistered?: (intent: AutomationIntent) => void;
}

export function CreativeActions({ creative, onIntentRegistered }: CreativeActionsProps) {
  const { toast } = useToast();

  const handleAction = (intent: AutomationIntent, label: string) => {
    // Register the intent for n8n automation
    toast({
      title: '⚡ Acción registrada',
      description: `"${label}" quedó registrada para automatización`,
    });
    
    onIntentRegistered?.(intent);
  };

  const actions = [
    {
      intent: 'generate_new' as AutomationIntent,
      label: 'Generar nuevo basado en este',
      icon: RefreshCw,
      description: 'Crear variación con IA',
      variant: 'outline' as const,
    },
    {
      intent: 'repeat' as AutomationIntent,
      label: 'Repetir creativo exitoso',
      icon: RotateCcw,
      description: 'Reutilizar lo que funcionó',
      variant: 'outline' as const,
      show: creative.calculatedPerformance === 'caliente',
    },
    {
      intent: 'new_audience' as AutomationIntent,
      label: 'Probar nuevo público',
      icon: Users,
      description: 'Mismo mensaje, diferente audiencia',
      variant: 'outline' as const,
    },
    {
      intent: 'send_sellers' as AutomationIntent,
      label: 'Enviar a vendedores',
      icon: Send,
      description: 'Compartir con equipo de ventas',
      variant: 'outline' as const,
    },
    {
      intent: 'landing' as AutomationIntent,
      label: 'Preparar landing page',
      icon: Globe,
      description: 'Crear página de aterrizaje',
      variant: 'outline' as const,
    },
  ];

  const visibleActions = actions.filter(a => a.show !== false);

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Acciones Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.intent}
              variant={action.variant}
              className="w-full justify-start h-auto py-3"
              onClick={() => handleAction(action.intent, action.label)}
            >
              <Icon className="w-4 h-4 mr-3 shrink-0" />
              <div className="text-left">
                <p className="font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground font-normal">
                  {action.description}
                </p>
              </div>
            </Button>
          );
        })}
        
        <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Estas acciones quedan registradas para automatización con n8n
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
