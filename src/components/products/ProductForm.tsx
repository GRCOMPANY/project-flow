import { useState, useEffect } from 'react';
import { Product, ProductChannel, DeliveryType, ProductStatus } from '@/types';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
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
import { Upload, X, Check, AlertCircle, DollarSign, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'supplier' | 'marginAmount' | 'marginPercent' | 'marginLevel'>) => Promise<unknown>;
  onUploadImage: (file: File) => Promise<string | null>;
  checkSkuAvailable?: (sku: string, excludeId?: string) => Promise<boolean>;
  initialData?: Product;
}

const CATEGORIES = [
  'Electrónica',
  'Accesorios',
  'Hogar',
  'Moda',
  'Belleza',
  'Deportes',
  'Tecnología',
  'Otro',
];

const CHANNELS: { value: ProductChannel; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'otro', label: 'Otro' },
];

const DELIVERY_TYPES: { value: DeliveryType; label: string }[] = [
  { value: 'contra_entrega', label: 'Contra entrega' },
  { value: 'anticipado', label: 'Pago anticipado' },
];

const STATUS_OPTIONS: { value: ProductStatus; label: string; color: string }[] = [
  { value: 'activo', label: 'Activo', color: 'bg-success text-success-foreground' },
  { value: 'pausado', label: 'Pausado', color: 'bg-warning text-warning-foreground' },
  { value: 'agotado', label: 'Agotado', color: 'bg-destructive text-destructive-foreground' },
];

export function ProductForm({
  open,
  onOpenChange,
  onSubmit,
  onUploadImage,
  checkSkuAvailable,
  initialData,
}: ProductFormProps) {
  const { isAdmin } = useAuth();
  const { suppliers } = useSuppliers();
  
  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [skuValid, setSkuValid] = useState<boolean | null>(null);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<ProductStatus>('activo');
  
  // Prices
  const [costPrice, setCostPrice] = useState(0);
  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [retailPrice, setRetailPrice] = useState(0);
  
  // Automation
  const [mainChannel, setMainChannel] = useState<ProductChannel>('whatsapp');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('contra_entrega');
  const [isFeatured, setIsFeatured] = useState(false);
  const [autoPromote, setAutoPromote] = useState(false);
  
  // Content
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [supplierId, setSupplierId] = useState<string | undefined>();
  
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Calculate margins
  const marginAmount = retailPrice - costPrice;
  const marginPercent = costPrice > 0 ? ((marginAmount / costPrice) * 100) : 0;
  const marginLevel = marginPercent >= 40 ? 'alto' : marginPercent >= 20 ? 'medio' : 'bajo';

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSku(initialData.sku || '');
      setCategory(initialData.category || '');
      setStatus(initialData.status);
      setCostPrice(initialData.costPrice || initialData.supplierPrice || 0);
      setWholesalePrice(initialData.wholesalePrice || 0);
      setRetailPrice(initialData.retailPrice || initialData.suggestedPrice || 0);
      setMainChannel(initialData.mainChannel || 'whatsapp');
      setDeliveryType(initialData.deliveryType || 'contra_entrega');
      setIsFeatured(initialData.isFeatured);
      setAutoPromote(initialData.autoPromote || false);
      setImageUrl(initialData.imageUrl || '');
      setDescription(initialData.description || '');
      setInternalNotes(initialData.internalNotes || '');
      setSupplierId(initialData.supplierId);
      setSkuValid(null);
    } else {
      resetForm();
    }
  }, [initialData, open]);

  const resetForm = () => {
    setName('');
    setSku('');
    setSkuValid(null);
    setCategory('');
    setStatus('activo');
    setCostPrice(0);
    setWholesalePrice(0);
    setRetailPrice(0);
    setMainChannel('whatsapp');
    setDeliveryType('contra_entrega');
    setIsFeatured(false);
    setAutoPromote(false);
    setImageUrl('');
    setDescription('');
    setInternalNotes('');
    setSupplierId(undefined);
  };

  // Validate SKU
  const validateSku = async (value: string) => {
    if (!value || !checkSkuAvailable) {
      setSkuValid(null);
      return;
    }
    const isAvailable = await checkSkuAvailable(value, initialData?.id);
    setSkuValid(isAvailable);
  };

  useEffect(() => {
    const timer = setTimeout(() => validateSku(sku), 500);
    return () => clearTimeout(timer);
  }, [sku]);

  // Auto-calculate wholesale price (cost + 30%)
  const suggestWholesalePrice = () => {
    if (costPrice > 0 && wholesalePrice === 0) {
      setWholesalePrice(Math.round(costPrice * 1.3));
    }
  };

  // Auto-calculate retail price (cost + 50%)
  const suggestRetailPrice = () => {
    if (costPrice > 0 && retailPrice === 0) {
      setRetailPrice(Math.round(costPrice * 1.5));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await onUploadImage(file);
    if (url) {
      setImageUrl(url);
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    const result = await onSubmit({
      name: name.trim(),
      sku: sku.trim() || undefined,
      category: category || undefined,
      status,
      costPrice,
      wholesalePrice,
      retailPrice,
      mainChannel,
      deliveryType,
      isFeatured,
      autoPromote,
      imageUrl: imageUrl || undefined,
      description: description.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined,
      supplierId,
      // Legacy fields
      price: retailPrice,
      supplierPrice: costPrice,
      suggestedPrice: retailPrice,
    });

    setSubmitting(false);
    if (result) {
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <div className={cn(
                "w-32 h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-colors",
                "hover:border-primary bg-secondary"
              )}>
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setImageUrl(''); }}
                      className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">
                      {uploading ? 'Subiendo...' : 'Subir imagen'}
                    </span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Información Básica
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Audífonos Pro Max"
                  required
                />
              </div>
              
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="sku">SKU</Label>
                <div className="relative">
                  <Input
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="GRC-001"
                    className={cn(
                      skuValid === false && "border-destructive",
                      skuValid === true && "border-success"
                    )}
                  />
                  {skuValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {skuValid ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                {skuValid === false && (
                  <p className="text-xs text-destructive mt-1">Este SKU ya existe</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", opt.color)} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Prices (Admin only) */}
          {isAdmin && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Precios y Márgenes
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="costPrice" className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Costo
                  </Label>
                  <Input
                    id="costPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    onBlur={() => { suggestWholesalePrice(); suggestRetailPrice(); }}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="wholesalePrice">Mayorista</Label>
                  <Input
                    id="wholesalePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={wholesalePrice || ''}
                    onChange={(e) => setWholesalePrice(Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="retailPrice">Precio Final</Label>
                  <Input
                    id="retailPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={retailPrice || ''}
                    onChange={(e) => setRetailPrice(Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Margin display */}
              {costPrice > 0 && retailPrice > 0 && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Margen:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 min-w-[100px] bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all",
                          marginLevel === 'alto' ? 'bg-success' : 
                          marginLevel === 'medio' ? 'bg-warning' : 'bg-destructive'
                        )}
                        style={{ width: `${Math.min(marginPercent, 100)}%` }}
                      />
                    </div>
                    <span className={cn(
                      "font-bold",
                      marginLevel === 'alto' ? 'text-success' : 
                      marginLevel === 'medio' ? 'text-warning' : 'text-destructive'
                    )}>
                      {marginPercent.toFixed(0)}%
                    </span>
                    <Badge variant="outline" className={cn(
                      marginLevel === 'alto' ? 'border-success text-success' : 
                      marginLevel === 'medio' ? 'border-warning text-warning' : 'border-destructive text-destructive'
                    )}>
                      {marginLevel.charAt(0).toUpperCase() + marginLevel.slice(1)}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground ml-auto">
                    Ganancia: <span className="font-semibold text-foreground">${marginAmount.toFixed(0)}</span>
                  </span>
                </div>
              )}
              
              {/* Supplier select */}
              <div>
                <Label>Proveedor</Label>
                <Select 
                  value={supplierId || '__none__'} 
                  onValueChange={(v) => setSupplierId(v === '__none__' ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin proveedor</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Section 3: Sales Config */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Configuración de Venta
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Canal principal</Label>
                <Select value={mainChannel} onValueChange={(v) => setMainChannel(v as ProductChannel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((ch) => (
                      <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Tipo de entrega</Label>
                <Select value={deliveryType} onValueChange={(v) => setDeliveryType(v as DeliveryType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
                <Label htmlFor="featured" className="cursor-pointer">Producto destacado</Label>
              </div>
              
              <div className="flex items-center gap-2 opacity-50">
                <Switch
                  id="autoPromote"
                  checked={autoPromote}
                  onCheckedChange={setAutoPromote}
                  disabled
                />
                <Label htmlFor="autoPromote" className="cursor-pointer">
                  Auto-promoción <Badge variant="outline" className="ml-1 text-xs">Próximamente</Badge>
                </Label>
              </div>
            </div>
          </div>

          {/* Section 4: Description */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Descripción
            </h3>
            
            <div>
              <Label htmlFor="description">Descripción pública</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el producto para tus clientes..."
                rows={3}
              />
            </div>
            
            {isAdmin && (
              <div>
                <Label htmlFor="notes">Notas internas (solo admin)</Label>
                <Textarea
                  id="notes"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notas privadas sobre este producto..."
                  rows={2}
                  className="bg-secondary"
                />
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !name.trim() || skuValid === false}>
              {submitting ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
