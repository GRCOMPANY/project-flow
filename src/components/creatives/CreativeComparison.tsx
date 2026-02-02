import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreativeIntelligence } from '@/types';
import { COMPARISON_CONFIG, HOOK_TYPE_LABELS } from '@/hooks/useCreativeIntelligence';
import { ArrowRight, MessageSquare, DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CreativeComparisonProps {
  current: CreativeIntelligence;
  previous: CreativeIntelligence | undefined;
}

export function CreativeComparison({ current, previous }: CreativeComparisonProps) {
  if (!previous) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-6 text-center text-muted-foreground">
          <p className="text-sm">
            Este es el primer creativo para este producto y canal.
            <br />
            No hay comparación disponible.
          </p>
        </CardContent>
      </Card>
    );
  }

  const comparison = current.vsPrevious ? COMPARISON_CONFIG[current.vsPrevious] : null;
  
  const messagesDelta = (current.metricMessages || 0) - (previous.metricMessages || 0);
  const salesDelta = (current.metricSales || 0) - (previous.metricSales || 0);
  
  const messagesPercent = previous.metricMessages 
    ? Math.round((messagesDelta / previous.metricMessages) * 100) 
    : 0;
  const salesPercent = previous.metricSales 
    ? Math.round((salesDelta / previous.metricSales) * 100) 
    : 0;

  // Detect what changed
  const changes: string[] = [];
  if (current.hookType !== previous.hookType) {
    changes.push(`Hook: ${previous.hookType ? HOOK_TYPE_LABELS[previous.hookType] : 'ninguno'} → ${current.hookType ? HOOK_TYPE_LABELS[current.hookType] : 'ninguno'}`);
  }
  if (current.type !== previous.type) {
    changes.push(`Formato: ${previous.type} → ${current.type}`);
  }
  if (current.targetAudience !== previous.targetAudience) {
    changes.push(`Público: ${previous.targetAudience || 'ninguno'} → ${current.targetAudience || 'ninguno'}`);
  }
  if (current.messageApproach !== previous.messageApproach) {
    changes.push(`Enfoque: ${previous.messageApproach || 'ninguno'} → ${current.messageApproach || 'ninguno'}`);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          🔍 Comparación con anterior
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side by side comparison */}
        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
          {/* Current */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Este creativo</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="font-medium">{current.metricMessages || 0}</span>
                <span className="text-muted-foreground">msgs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="font-medium">{current.metricSales || 0}</span>
                <span className="text-muted-foreground">ventas</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="text-muted-foreground">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Previous */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Anterior</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="font-medium">{previous.metricMessages || 0}</span>
                <span className="text-muted-foreground">msgs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="font-medium">{previous.metricSales || 0}</span>
                <span className="text-muted-foreground">ventas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Result Badge */}
        {comparison && (
          <div className={`
            p-3 rounded-lg text-center
            ${current.vsPrevious === 'mejor' 
              ? 'bg-green-500/10 border border-green-500/20' 
              : current.vsPrevious === 'peor'
              ? 'bg-red-500/10 border border-red-500/20'
              : 'bg-muted/50 border border-border'
            }
          `}>
            <div className="flex items-center justify-center gap-2">
              {current.vsPrevious === 'mejor' && <TrendingUp className="w-5 h-5 text-green-500" />}
              {current.vsPrevious === 'peor' && <TrendingDown className="w-5 h-5 text-red-500" />}
              {current.vsPrevious === 'igual' && <Minus className="w-5 h-5 text-muted-foreground" />}
              <span className="font-semibold text-lg">
                {comparison.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {messagesPercent !== 0 && (
                <span className={messagesDelta > 0 ? 'text-green-500' : 'text-red-500'}>
                  {messagesDelta > 0 ? '+' : ''}{messagesPercent}% msgs
                </span>
              )}
              {messagesPercent !== 0 && salesPercent !== 0 && ', '}
              {salesPercent !== 0 && (
                <span className={salesDelta > 0 ? 'text-green-500' : 'text-red-500'}>
                  {salesDelta > 0 ? '+' : ''}{salesPercent}% ventas
                </span>
              )}
            </p>
          </div>
        )}

        {/* What changed */}
        {changes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Qué cambió:
            </p>
            <div className="space-y-1">
              {changes.map((change, i) => (
                <Badge key={i} variant="outline" className="mr-1 mb-1">
                  {change}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
