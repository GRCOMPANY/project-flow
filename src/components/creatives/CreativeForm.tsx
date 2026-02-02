import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Creative, 
  CreativeType, 
  CreativeChannel, 
  CreativeObjective,
  HookType,
  TargetAudience,
  MessageApproach,
  Product,
} from '@/types';
import { CreativeMetricsForm } from './CreativeMetricsForm';
import { 
  HOOK_TYPE_LABELS, 
  TARGET_AUDIENCE_LABELS,
  MESSAGE_APPROACH_LABELS,
} from '@/hooks/useCreativeIntelligence';

interface CreativeFormData {
  productId: string;
  type: CreativeType;
  channel: CreativeChannel;
  objective: CreativeObjective;
  targetAudience: TargetAudience | undefined;
  audienceNotes: string;
  hookType: HookType | undefined;
  hookText: string;
  variation: string;
  messageApproach: MessageApproach | undefined;
  title: string;
  copy: string;
  learning: string;
  metricLikes: number;
  metricComments: number;
  metricMessages: number;
  metricSales: number;
  metricImpressions: number;
  metricClicks: number;
  metricCost: number;
  metricKnownPeople: 'si' | 'no' | 'mixto' | undefined;
  engagementLevel: 'bajo' | 'medio' | 'alto' | undefined;
}

export type { CreativeFormData };

interface CreativeFormProps {
  products: Product[];
  initialData?: Partial<Creative>;
  onSubmit: (data: CreativeFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const defaultFormData: CreativeFormData = {
  productId: '',
  type: 'imagen',
  channel: 'instagram',
  objective: 'vender',
  targetAudience: undefined,
  audienceNotes: '',
  hookType: undefined,
  hookText: '',
  variation: 'A',
  messageApproach: undefined,
  title: '',
  copy: '',
  learning: '',
  metricLikes: 0,
  metricComments: 0,
  metricMessages: 0,
  metricSales: 0,
  metricImpressions: 0,
  metricClicks: 0,
  metricCost: 0,
  metricKnownPeople: undefined,
  engagementLevel: undefined,
};

export function CreativeForm({ 
  products, 
  initialData, 
  onSubmit, 
  onCancel,
  isEditing = false,
}: CreativeFormProps) {
  const [formData, setFormData] = useState<CreativeFormData>(() => {
    if (initialData) {
      return {
        ...defaultFormData,
        productId: initialData.productId || '',
        type: initialData.type || 'imagen',
        channel: initialData.channel || 'instagram',
        objective: initialData.objective || 'vender',
        targetAudience: initialData.targetAudience,
        audienceNotes: initialData.audienceNotes || '',
        hookType: initialData.hookType,
        hookText: initialData.hookText || '',
        variation: initialData.variation || 'A',
        messageApproach: initialData.messageApproach,
        title: initialData.title || '',
        copy: initialData.copy || '',
        learning: initialData.learning || '',
        metricLikes: initialData.metricLikes || 0,
        metricComments: initialData.metricComments || 0,
        metricMessages: initialData.metricMessages || 0,
        metricSales: initialData.metricSales || 0,
        metricImpressions: initialData.metricImpressions || 0,
        metricClicks: initialData.metricClicks || 0,
        metricCost: initialData.metricCost || 0,
        metricKnownPeople: initialData.metricKnownPeople,
        engagementLevel: initialData.engagementLevel,
      };
    }
    return defaultFormData;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('context');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="context">A. Contexto</TabsTrigger>
          <TabsTrigger value="message">B. Mensaje</TabsTrigger>
          <TabsTrigger value="metrics">C. Métricas</TabsTrigger>
          <TabsTrigger value="learning">D. Aprendizaje</TabsTrigger>
        </TabsList>

        {/* BLOQUE A: Contexto */}
        <TabsContent value="context" className="space-y-4 pt-4">
          <div>
            <Label>Producto</Label>
            <Select
              value={formData.productId}
              onValueChange={(v) => setFormData({ ...formData, productId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin producto</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as CreativeType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imagen">🖼️ Imagen</SelectItem>
                  <SelectItem value="video">🎬 Video</SelectItem>
                  <SelectItem value="copy">✍️ Copy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Canal</Label>
              <Select
                value={formData.channel}
                onValueChange={(v) => setFormData({ ...formData, channel: v as CreativeChannel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">📸 Instagram</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                  <SelectItem value="facebook">👤 Facebook Ads</SelectItem>
                  <SelectItem value="web">🌐 Marketplace</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Objetivo</Label>
              <Select
                value={formData.objective}
                onValueChange={(v) => setFormData({ ...formData, objective: v as CreativeObjective })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vender">💰 Generar ventas</SelectItem>
                  <SelectItem value="atraer">🧲 Generar mensajes</SelectItem>
                  <SelectItem value="probar">🧪 Testear mercado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Público objetivo</Label>
              <Select
                value={formData.targetAudience || ''}
                onValueChange={(v) => setFormData({ ...formData, targetAudience: v as TargetAudience || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TARGET_AUDIENCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notas sobre el público (opcional)</Label>
            <Input
              value={formData.audienceNotes}
              onChange={(e) => setFormData({ ...formData, audienceNotes: e.target.value })}
              placeholder="Ej: Mujeres 25-35, interesadas en fitness..."
            />
          </div>
        </TabsContent>

        {/* BLOQUE B: Mensaje / Hook */}
        <TabsContent value="message" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Hook</Label>
              <Select
                value={formData.hookType || ''}
                onValueChange={(v) => setFormData({ ...formData, hookType: v as HookType || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(HOOK_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Variación</Label>
              <Select
                value={formData.variation}
                onValueChange={(v) => setFormData({ ...formData, variation: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Variación A</SelectItem>
                  <SelectItem value="B">Variación B</SelectItem>
                  <SelectItem value="C">Variación C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Texto del Hook principal</Label>
            <Input
              value={formData.hookText}
              onChange={(e) => setFormData({ ...formData, hookText: e.target.value })}
              placeholder="Ej: ¿Cansado de...? | Solo hoy 50% OFF | 500+ clientes felices"
            />
          </div>

          <div>
            <Label>Enfoque del mensaje</Label>
            <Select
              value={formData.messageApproach || ''}
              onValueChange={(v) => setFormData({ ...formData, messageApproach: v as MessageApproach || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MESSAGE_APPROACH_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Título del creativo</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nombre interno del creativo"
            />
          </div>

          <div>
            <Label>Copy / Texto completo</Label>
            <Textarea
              value={formData.copy}
              onChange={(e) => setFormData({ ...formData, copy: e.target.value })}
              placeholder="Texto completo del creativo..."
              rows={4}
            />
          </div>
        </TabsContent>

        {/* BLOQUE C: Métricas */}
        <TabsContent value="metrics" className="pt-4">
          <CreativeMetricsForm
            channel={formData.channel}
            data={{
              metricLikes: formData.metricLikes,
              metricComments: formData.metricComments,
              metricMessages: formData.metricMessages,
              metricSales: formData.metricSales,
              metricImpressions: formData.metricImpressions,
              metricClicks: formData.metricClicks,
              metricCost: formData.metricCost,
              metricKnownPeople: formData.metricKnownPeople,
              engagementLevel: formData.engagementLevel,
            }}
            onChange={(metricsData) => setFormData({ ...formData, ...metricsData })}
          />
        </TabsContent>

        {/* BLOQUE D: Aprendizaje */}
        <TabsContent value="learning" className="space-y-4 pt-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
              🧠 Memoria del Negocio
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Este campo es obligatorio. Documenta qué aprendiste de este creativo para mejorar los siguientes.
            </p>
          </div>

          <div>
            <Label className="text-base font-medium">
              ¿Qué aprendiste de este creativo?
            </Label>
            <Textarea
              value={formData.learning}
              onChange={(e) => setFormData({ ...formData, learning: e.target.value })}
              placeholder="Ej: El hook de beneficio generó más mensajes que el de precio. Video corto funcionó mejor que imagen estática. El público de reventa convirtió mejor..."
              rows={5}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Ejemplos: "El precio bajo atrajo curiosos pero no compradores", "Video de 15s superó al de 30s", "Mostrar el producto en uso convirtió mejor"
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? 'Guardando...' 
            : isEditing 
            ? 'Guardar cambios' 
            : 'Crear creativo'
          }
        </Button>
      </div>
    </form>
  );
}
