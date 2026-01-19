import { useState, useRef, useEffect } from 'react';
import { Product, Supplier, ProductStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Upload, X, Loader2, Star } from 'lucide-react';

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'supplier'>) => Promise<Product | null>;
  onUploadImage: (file: File) => Promise<string | null>;
  initialData?: Product;
  suppliers?: Supplier[];
}

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'activo', label: '🟢 Activo' },
  { value: 'pausado', label: '🟡 Pausado' },
  { value: 'agotado', label: '🔴 Agotado' },
];

export function ProductForm({ open, onOpenChange, onSubmit, onUploadImage, initialData, suppliers = [] }: ProductFormProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierPrice, setSupplierPrice] = useState('');
  const [suggestedPrice, setSuggestedPrice] = useState('');
  const [status, setStatus] = useState<ProductStatus>('activo');
  const [isFeatured, setIsFeatured] = useState(false);
  const [category, setCategory] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [sku, setSku] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name || '');
      setPrice(initialData.price?.toString() || '');
      setStoreName(initialData.storeName || '');
      setDescription(initialData.description || '');
      setImageUrl(initialData.imageUrl || '');
      setSupplierId(initialData.supplierId || '');
      setSupplierPrice(initialData.supplierPrice?.toString() || '0');
      setSuggestedPrice(initialData.suggestedPrice?.toString() || '0');
      setStatus(initialData.status || 'activo');
      setIsFeatured(initialData.isFeatured || false);
      setCategory(initialData.category || '');
      setInternalNotes(initialData.internalNotes || '');
      setSku(initialData.sku || '');
    } else if (open && !initialData) {
      resetForm();
    }
  }, [open, initialData]);

  const resetForm = () => {
    setName('');
    setPrice('');
    setStoreName('');
    setDescription('');
    setImageUrl('');
    setSupplierId('');
    setSupplierPrice('0');
    setSuggestedPrice('0');
    setStatus('activo');
    setIsFeatured(false);
    setCategory('');
    setInternalNotes('');
    setSku('');
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

  // Calculate margin
  const margin = (() => {
    const sp = parseFloat(supplierPrice) || 0;
    const p = parseFloat(price) || 0;
    if (sp === 0) return 0;
    return ((p - sp) / sp) * 100;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    setSubmitting(true);
    const result = await onSubmit({
      name: name.trim(),
      price: parseFloat(price),
      storeName: storeName.trim() || undefined,
      description: description.trim() || undefined,
      imageUrl: imageUrl || undefined,
      supplierId: supplierId || undefined,
      supplierPrice: parseFloat(supplierPrice) || 0,
      suggestedPrice: parseFloat(suggestedPrice) || 0,
      status,
      isFeatured,
      category: category.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined,
      sku: sku.trim() || undefined,
    });

    if (result) {
      resetForm();
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {initialData ? 'Editar producto' : 'Nuevo producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image upload */}
          <div className="space-y-2">
            <Label>Imagen</Label>
            <div 
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {imageUrl ? (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageUrl('');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : uploading ? (
                <div className="flex flex-col items-center gap-2 py-6">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Subiendo...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clic para subir imagen
                  </span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del producto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Código</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej: GRC-001"
              />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="p-4 bg-secondary/50 rounded-lg space-y-4">
            <h3 className="font-medium text-foreground">Precios y Márgenes</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierPrice">Precio Proveedor</Label>
                <Input
                  id="supplierPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={supplierPrice}
                  onChange={(e) => setSupplierPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio Venta *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Margen Estimado</Label>
                <div className={`h-10 flex items-center px-3 rounded-md border ${
                  margin > 30 ? 'bg-status-done-bg text-status-done' : 
                  margin > 15 ? 'bg-status-pending-bg text-status-pending' : 
                  'bg-priority-high-bg text-priority-high'
                }`}>
                  {margin.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestedPrice">Precio Sugerido</Label>
              <Input
                id="suggestedPrice"
                type="number"
                step="0.01"
                min="0"
                value={suggestedPrice}
                onChange={(e) => setSuggestedPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Supplier & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin proveedor</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: Electrónica, Ropa..."
              />
            </div>
          </div>

          {/* Status & Featured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Producto Destacado</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  {isFeatured && <Star className="w-4 h-4 text-grc-gold fill-grc-gold" />}
                  {isFeatured ? 'Destacado' : 'Normal'}
                </span>
              </div>
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="storeName">Referencia / Local</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Donde lo viste o compraste"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (visible para clientes)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del producto..."
              rows={3}
            />
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="internalNotes">Notas Internas (solo admin)</Label>
            <Textarea
              id="internalNotes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Notas internas, no visibles para clientes..."
              rows={2}
              className="bg-secondary/30"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || !price || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                initialData ? 'Guardar cambios' : 'Crear producto'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
