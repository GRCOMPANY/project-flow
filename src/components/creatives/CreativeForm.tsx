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
  CreativeStatus,
  HookType,
  TargetAudience,
  MessageApproach,
  Product,
} from '@/types';
import { CreativeMetricsForm } from './CreativeMetricsForm';
import { CreativeFileUploader } from './CreativeFileUploader';
import { 
  HOOK_TYPE_LABELS, 
  TARGET_AUDIENCE_LABELS,
  MESSAGE_APPROACH_LABELS,
} from '@/hooks/useCreativeIntelligence';
import { Upload, Link } from 'lucide-react';

interface CreativeFormData {
  productId: string;
  type: CreativeType;
  channel: CreativeChannel;
  objective: CreativeObjective;
  status: CreativeStatus;
  targetAudience: TargetAudience | undefined;
  audienceNotes: string;
  hookType: HookType | undefined;
  hookText: string;
  ctaText: string;                // NUEVO: CTA
  variation: string;
  messageApproach: MessageApproach | undefined;
  title: string;
  copy: string;
  learning: string;
  imageUrl: string;               // Media
  videoUrl: string;               // Media
  publicationReference: string;   // NUEVO: Referencia de publicación
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
  status: 'pendiente',
  targetAudience: undefined,
  audienceNotes: '',
  hookType: undefined,
  hookText: '',
  ctaText: '',
  variation: 'A',
  messageApproach: undefined,
  title: '',
  copy: '',
  learning: '',
  imageUrl: '',
  videoUrl: '',
  publicationReference: '',
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

const STATUS_OPTIONS: { value: CreativeStatus; label: string; emoji: string }[] = [
  { value: 'pendiente', label: 'Borrador', emoji: '📝' },
  { value: 'publicado', label: 'Publicado', emoji: '🚀' },
  { value: 'generando', label: 'Pausado', emoji: '⏸️' },
  { value: 'descartado', label: 'Cerrado', emoji: '✅' },
];

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
        status: initialData.status || 'pendiente',
        targetAudience: initialData.targetAudience,
        audienceNotes: initialData.audienceNotes || '',
        hookType: initialData.hookType,
        hookText: initialData.hookText || '',
        ctaText: initialData.ctaText || '',
        variation: initialData.variation || 'A',
        messageApproach: initialData.messageApproach,
        title: initialData.title || '',
        copy: initialData.copy || '',
        learning: initialData.learning || '',
        imageUrl: initialData.imageUrl || '',
        videoUrl: initialData.videoUrl || '',
        publicationReference: initialData.publicationReference || '',
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
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    // Validación: Producto es OBLIGATORIO
    if (!formData.productId) {
      setValidationError('Debes seleccionar un producto para este experimento');
      setActiveTab('context');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {validationError && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
          ⚠️ {validationError}
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="context">Contexto</TabsTrigger>
          <TabsTrigger value="message">Mensaje</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="learning">Aprendizaje</TabsTrigger>
        </TabsList>

        {/* BLOQUE A: Contexto */}
        <TabsContent value="context" className="space-y-4 pt-4">
          <div>
            <Label className="text-base font-medium">
              Producto <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Todo creativo es un experimento asociado a un producto específico
            </p>
            <Select
              value={formData.productId || ''}
              onValueChange={(v) => {
                setFormData({ ...formData, productId: v });
                setValidationError(null);
              }}
            >
              <SelectTrigger className={!formData.productId && validationError ? 'border-destructive' : ''}>
                <SelectValue placeholder="Seleccionar producto..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    📦 {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de creativo</Label>
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
                  <SelectItem value="historia">📱 Historia/Story</SelectItem>
                  <SelectItem value="carrusel">🔄 Carrusel</SelectItem>
                  <SelectItem value="copy">✍️ Copy</SelectItem>
                  <SelectItem value="anuncio">📢 Anuncio</SelectItem>
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
            <Label>Título interno del creativo</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nombre para identificar este experimento"
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

          <div>
            <Label className="flex items-center gap-2">
              CTA (Call to Action)
              <span className="text-xs text-muted-foreground">(recomendado)</span>
            </Label>
            <Input
              value={formData.ctaText}
              onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
              placeholder="Ej: Escríbeme ahora • Compra aquí • Ver más..."
            />
          </div>
        </TabsContent>

        {/* BLOQUE C: Media (NUEVO) */}
        <TabsContent value="media" className="space-y-4 pt-4">
          {/* File Uploader - Only show if editing an existing creative */}
          {isEditing && initialData?.id && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  🖼️ Archivos del Creativo
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Sube las imágenes o videos reales de este experimento.
                </p>
                <CreativeFileUploader creativeId={initialData.id} />
              </div>
            </div>
          )}

          {/* Message for new creatives */}
          {!isEditing && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Archivos del creativo
              </h4>
              <p className="text-sm text-muted-foreground">
                ⚠️ Guarda el creativo primero, luego podrás subir archivos desde la edición.
              </p>
            </div>
          )}

          {/* Alternative URLs (fallback) */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              URLs alternativas (opcional)
            </h4>
            
            <div className="space-y-3">
              <div>
                <Label>URL de imagen externa</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://... enlace a imagen"
                  />
                </div>
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>URL de video externa</Label>
                <Input
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://... enlace al video"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Label className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Referencia de publicación
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Identifica dónde y cuándo se publicó este creativo
            </p>
            <Input
              value={formData.publicationReference}
              onChange={(e) => setFormData({ ...formData, publicationReference: e.target.value })}
              placeholder="Ej: Historia IG 06/02, Post FB jueves, Reel #15..."
            />
          </div>

          <div className="pt-4 border-t">
            <Label>Estado del creativo</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as CreativeStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.emoji} {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.status === 'descartado' && (
              <p className="text-xs text-warning mt-2">
                ⚠️ Al cerrar el experimento, el campo de aprendizaje será obligatorio.
              </p>
            )}
          </div>
        </TabsContent>

        {/* BLOQUE D: Métricas */}
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

        {/* BLOQUE E: Aprendizaje */}
        <TabsContent value="learning" className="space-y-4 pt-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
              🧠 Memoria del Negocio
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Este campo es <strong>obligatorio al cerrar</strong> el experimento. Documenta qué aprendiste para mejorar los siguientes.
            </p>
          </div>

          <div>
            <Label className="text-base font-medium">
              ¿Qué aprendiste de este creativo?
              {formData.status === 'descartado' && (
                <span className="text-destructive ml-1">*</span>
              )}
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
            : 'Crear experimento'
          }
        </Button>
      </div>
    </form>
  );
}
