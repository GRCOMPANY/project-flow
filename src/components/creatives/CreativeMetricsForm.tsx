import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  KnownPeople, 
  EngagementLevel,
  CreativeChannel 
} from '@/types';
import { Heart, MessageCircle, MessageSquare, DollarSign, Eye, MousePointer } from 'lucide-react';

interface MetricsData {
  metricLikes: number;
  metricComments: number;
  metricMessages: number;
  metricSales: number;
  metricImpressions: number;
  metricClicks: number;
  metricCost: number;
  metricKnownPeople: KnownPeople | undefined;
  engagementLevel: EngagementLevel | undefined;
}

interface CreativeMetricsFormProps {
  channel: CreativeChannel;
  data: MetricsData;
  onChange: (data: MetricsData) => void;
}

export function CreativeMetricsForm({ channel, data, onChange }: CreativeMetricsFormProps) {
  const isOrganic = ['instagram', 'tiktok', 'whatsapp'].includes(channel);
  const isAds = channel === 'facebook';

  const updateField = <K extends keyof MetricsData>(field: K, value: MetricsData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm font-medium text-muted-foreground px-2">
          Métricas de Performance
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Organic Metrics */}
      {isOrganic && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <Heart className="w-4 h-4 text-red-400" />
              Likes
            </Label>
            <Input
              type="number"
              min="0"
              value={data.metricLikes}
              onChange={(e) => updateField('metricLikes', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              Comentarios
            </Label>
            <Input
              type="number"
              min="0"
              value={data.metricComments}
              onChange={(e) => updateField('metricComments', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <MessageSquare className="w-4 h-4 text-green-400" />
              Mensajes recibidos
            </Label>
            <Input
              type="number"
              min="0"
              value={data.metricMessages}
              onChange={(e) => updateField('metricMessages', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              Ventas generadas
            </Label>
            <Input
              type="number"
              min="0"
              value={data.metricSales}
              onChange={(e) => updateField('metricSales', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      )}

      {/* Meta Ads Metrics */}
      {isAds && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <Eye className="w-4 h-4 text-purple-400" />
              Impresiones
            </Label>
            <Input
              type="number"
              min="0"
              value={data.metricImpressions}
              onChange={(e) => updateField('metricImpressions', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <MousePointer className="w-4 h-4 text-blue-400" />
              Clicks
            </Label>
            <Input
              type="number"
              min="0"
              value={data.metricClicks}
              onChange={(e) => updateField('metricClicks', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <MessageSquare className="w-4 h-4 text-green-400" />
              Mensajes
            </Label>
            <Input
              type="number"
              min="0"
              value={data.metricMessages}
              onChange={(e) => updateField('metricMessages', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              Ventas atribuidas
            </Label>
            <Input
              type="number"
              min="0"
              value={data.metricSales}
              onChange={(e) => updateField('metricSales', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="col-span-2">
            <Label className="mb-2 block">Costo (opcional)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="$ 0.00"
              value={data.metricCost || ''}
              onChange={(e) => updateField('metricCost', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      )}

      {/* Known People Toggle */}
      <div>
        <Label className="mb-2 block">¿Personas conocidas?</Label>
        <ToggleGroup
          type="single"
          value={data.metricKnownPeople || ''}
          onValueChange={(v) => updateField('metricKnownPeople', v as KnownPeople || undefined)}
          className="justify-start"
        >
          <ToggleGroupItem value="si" className="px-4">
            ✅ Sí
          </ToggleGroupItem>
          <ToggleGroupItem value="no" className="px-4">
            ❌ No
          </ToggleGroupItem>
          <ToggleGroupItem value="mixto" className="px-4">
            🔀 Mixto
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Engagement Level */}
      <div>
        <Label className="mb-2 block">Engagement percibido</Label>
        <ToggleGroup
          type="single"
          value={data.engagementLevel || ''}
          onValueChange={(v) => updateField('engagementLevel', v as EngagementLevel || undefined)}
          className="justify-start"
        >
          <ToggleGroupItem value="bajo" className="px-4">
            📉 Bajo
          </ToggleGroupItem>
          <ToggleGroupItem value="medio" className="px-4">
            📊 Medio
          </ToggleGroupItem>
          <ToggleGroupItem value="alto" className="px-4">
            📈 Alto
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
