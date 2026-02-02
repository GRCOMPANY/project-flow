import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreativeChannel, 
  CreativePerformance, 
  HookType,
  TargetAudience 
} from '@/types';
import { HOOK_TYPE_LABELS, PERFORMANCE_CONFIG } from '@/hooks/useCreativeIntelligence';
import { X } from 'lucide-react';

const CHANNELS: { value: CreativeChannel; label: string; emoji: string }[] = [
  { value: 'instagram', label: 'Instagram', emoji: '📸' },
  { value: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  { value: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { value: 'facebook', label: 'Facebook', emoji: '👤' },
  { value: 'web', label: 'Web', emoji: '🌐' },
];

const PERFORMANCES: CreativePerformance[] = ['caliente', 'interesante', 'frio'];

const HOOK_TYPES: HookType[] = ['precio', 'problema', 'beneficio', 'urgencia', 'prueba_social', 'comparacion'];

const AUDIENCES: { value: TargetAudience; label: string }[] = [
  { value: 'precio_bajo', label: 'Precio bajo' },
  { value: 'precio_medio', label: 'Precio medio' },
  { value: 'regalo', label: 'Regalo' },
  { value: 'uso_personal', label: 'Uso personal' },
  { value: 'reventa', label: 'Reventa' },
];

export interface CreativeFiltersState {
  channel: CreativeChannel | null;
  performance: CreativePerformance | null;
  hookType: HookType | null;
  audience: TargetAudience | null;
}

interface CreativeFiltersProps {
  filters: CreativeFiltersState;
  onChange: (filters: CreativeFiltersState) => void;
}

export function CreativeFilters({ filters, onChange }: CreativeFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(v => v !== null);

  const clearFilters = () => {
    onChange({
      channel: null,
      performance: null,
      hookType: null,
      audience: null,
    });
  };

  const toggleFilter = <K extends keyof CreativeFiltersState>(
    key: K,
    value: CreativeFiltersState[K]
  ) => {
    onChange({
      ...filters,
      [key]: filters[key] === value ? null : value,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-xl border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Filtros
        </h3>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-7 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Channel Filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Canal
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CHANNELS.map(channel => (
            <Badge
              key={channel.value}
              variant={filters.channel === channel.value ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => toggleFilter('channel', channel.value)}
            >
              {channel.emoji} {channel.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Performance Filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Resultado
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PERFORMANCES.map(perf => {
            const config = PERFORMANCE_CONFIG[perf];
            return (
              <Badge
                key={perf}
                variant={filters.performance === perf ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors ${
                  filters.performance === perf 
                    ? perf === 'caliente' 
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : perf === 'interesante'
                      ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                      : 'bg-blue-500 hover:bg-blue-600'
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => toggleFilter('performance', perf)}
              >
                {config.emoji} {config.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Hook Type Filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Tipo de Hook
        </label>
        <div className="flex flex-wrap gap-1.5">
          {HOOK_TYPES.map(hook => (
            <Badge
              key={hook}
              variant={filters.hookType === hook ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => toggleFilter('hookType', hook)}
            >
              {HOOK_TYPE_LABELS[hook]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Audience Filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Público
        </label>
        <div className="flex flex-wrap gap-1.5">
          {AUDIENCES.map(aud => (
            <Badge
              key={aud.value}
              variant={filters.audience === aud.value ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => toggleFilter('audience', aud.value)}
            >
              {aud.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
