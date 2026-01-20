import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatives } from '@/hooks/useCreatives';
import { useProducts } from '@/hooks/useProducts';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Creative, CreativeType, CreativeChannel, CreativeObjective, CreativeStatus, CreativeResult } from '@/types';
import { 
  Plus, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Instagram, 
  MessageCircle,
  Globe,
  Facebook,
  Trash2,
  Edit,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const typeIcons = {
  imagen: ImageIcon,
  video: Video,
  copy: FileText,
};

const channelIcons = {
  instagram: Instagram,
  whatsapp: MessageCircle,
  tiktok: Video,
  facebook: Facebook,
  web: Globe,
};

const statusColors = {
  pendiente: 'bg-[hsl(var(--status-pending-bg))] text-[hsl(var(--status-pending))]',
  generando: 'bg-[hsl(var(--status-progress-bg))] text-[hsl(var(--status-progress))]',
  generado: 'bg-[hsl(var(--grc-gold-light))] text-[hsl(var(--grc-gold))]',
  publicado: 'bg-[hsl(var(--status-done-bg))] text-[hsl(var(--status-done))]',
  descartado: 'bg-secondary text-muted-foreground',
};

const resultIcons = {
  sin_evaluar: Clock,
  funciono: CheckCircle,
  no_funciono: XCircle,
};

export default function Creatives() {
  const { isAdmin } = useAuth();
  const { creatives, loading, addCreative, updateCreative, deleteCreative } = useCreatives();
  const { products } = useProducts();
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCreative, setEditingCreative] = useState<Creative | null>(null);
  
  const [formData, setFormData] = useState({
    productId: '',
    type: 'imagen' as CreativeType,
    channel: 'instagram' as CreativeChannel,
    objective: 'vender' as CreativeObjective,
    status: 'pendiente' as CreativeStatus,
    result: 'sin_evaluar' as CreativeResult,
    title: '',
    copy: '',
    learning: '',
  });

  const resetForm = () => {
    setFormData({
      productId: '',
      type: 'imagen',
      channel: 'instagram',
      objective: 'vender',
      status: 'pendiente',
      result: 'sin_evaluar',
      title: '',
      copy: '',
      learning: '',
    });
    setEditingCreative(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCreative) {
      await updateCreative(editingCreative.id, {
        productId: formData.productId || undefined,
        type: formData.type,
        channel: formData.channel,
        objective: formData.objective,
        status: formData.status,
        result: formData.result,
        title: formData.title || undefined,
        copy: formData.copy || undefined,
        learning: formData.learning || undefined,
      });
    } else {
      await addCreative({
        productId: formData.productId || undefined,
        type: formData.type,
        channel: formData.channel,
        objective: formData.objective,
        status: formData.status,
        result: formData.result,
        title: formData.title || undefined,
        copy: formData.copy || undefined,
        learning: formData.learning || undefined,
      });
    }
    
    resetForm();
    setFormOpen(false);
  };

  const handleEdit = (creative: Creative) => {
    setEditingCreative(creative);
    setFormData({
      productId: creative.productId || '',
      type: creative.type,
      channel: creative.channel,
      objective: creative.objective,
      status: creative.status,
      result: creative.result,
      title: creative.title || '',
      copy: creative.copy || '',
      learning: creative.learning || '',
    });
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCreative(deleteId);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CommandCenterNav />
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Cargando creativos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />
      
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-1">Creativos</h1>
            <p className="text-muted-foreground">
              Contenido publicitario para tus productos
            </p>
          </div>
          
          {isAdmin && (
            <Dialog open={formOpen} onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Creativo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingCreative ? 'Editar Creativo' : 'Nuevo Creativo'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Producto (opcional)</Label>
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
                          <SelectItem value="facebook">👤 Facebook</SelectItem>
                          <SelectItem value="web">🌐 Web</SelectItem>
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
                          <SelectItem value="vender">💰 Vender</SelectItem>
                          <SelectItem value="atraer">🧲 Atraer</SelectItem>
                          <SelectItem value="probar">🧪 Probar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Estado</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v) => setFormData({ ...formData, status: v as CreativeStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">⏳ Pendiente</SelectItem>
                          <SelectItem value="generando">⚙️ Generando</SelectItem>
                          <SelectItem value="generado">✅ Generado</SelectItem>
                          <SelectItem value="publicado">🚀 Publicado</SelectItem>
                          <SelectItem value="descartado">🗑️ Descartado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Título</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nombre del creativo"
                    />
                  </div>

                  <div>
                    <Label>Copy / Texto</Label>
                    <Textarea
                      value={formData.copy}
                      onChange={(e) => setFormData({ ...formData, copy: e.target.value })}
                      placeholder="Texto del creativo..."
                      rows={3}
                    />
                  </div>

                  {editingCreative && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Resultado</Label>
                        <Select
                          value={formData.result}
                          onValueChange={(v) => setFormData({ ...formData, result: v as CreativeResult })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sin_evaluar">⏳ Sin evaluar</SelectItem>
                            <SelectItem value="funciono">✅ Funcionó</SelectItem>
                            <SelectItem value="no_funciono">❌ No funcionó</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Aprendizaje</Label>
                        <Input
                          value={formData.learning}
                          onChange={(e) => setFormData({ ...formData, learning: e.target.value })}
                          placeholder="¿Qué aprendiste?"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1">
                      {editingCreative ? 'Guardar cambios' : 'Crear creativo'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </header>

        {/* Creatives Grid */}
        {creatives.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creatives.map((creative) => {
              const TypeIcon = typeIcons[creative.type];
              const ChannelIcon = channelIcons[creative.channel];
              const ResultIcon = resultIcons[creative.result];
              
              return (
                <div key={creative.id} className="grc-card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-secondary">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="p-2 rounded-lg bg-secondary">
                        <ChannelIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <Badge className={statusColors[creative.status]}>
                      {creative.status}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-1 truncate">
                    {creative.title || creative.product?.name || 'Sin título'}
                  </h3>
                  
                  {creative.product && (
                    <p className="text-sm text-muted-foreground mb-2 truncate">
                      📦 {creative.product.name}
                    </p>
                  )}
                  
                  {creative.copy && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {creative.copy}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <ResultIcon className={`w-4 h-4 ${
                        creative.result === 'funciono' ? 'text-[hsl(var(--status-done))]' : 
                        creative.result === 'no_funciono' ? 'text-[hsl(var(--grc-red))]' : ''
                      }`} />
                      <span className="capitalize">{creative.result.replace('_', ' ')}</span>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(creative)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(creative.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grc-card p-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Sin creativos aún
            </h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer creativo para promocionar tus productos
            </p>
            {isAdmin && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primer creativo
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar creativo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
