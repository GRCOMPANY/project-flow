import { useState } from 'react';
import { Plus, Trash2, Edit2, Users, Phone, Percent } from 'lucide-react';
import { useSellers } from '@/hooks/useSellers';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Seller, SellerStatus } from '@/types';
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

const Sellers = () => {
  const { isAdmin } = useAuth();
  const { sellers, loading, addSeller, updateSeller, deleteSeller } = useSellers();
  const [formOpen, setFormOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [commission, setCommission] = useState('0');
  const [status, setStatus] = useState<SellerStatus>('activo');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setContact('');
    setCommission('0');
    setStatus('activo');
    setNotes('');
  };

  const openEditForm = (seller: Seller) => {
    setName(seller.name);
    setContact(seller.contact || '');
    setCommission(seller.commission?.toString() || '0');
    setStatus(seller.status);
    setNotes(seller.notes || '');
    setEditingSeller(seller);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSeller) {
      await updateSeller(editingSeller.id, {
        name: name.trim(),
        contact: contact.trim() || undefined,
        commission: parseFloat(commission) || 0,
        status,
        notes: notes.trim() || undefined,
      });
    } else {
      await addSeller({
        name: name.trim(),
        contact: contact.trim() || undefined,
        commission: parseFloat(commission) || 0,
        status,
        notes: notes.trim() || undefined,
      });
    }

    resetForm();
    setEditingSeller(null);
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSeller(deleteId);
      setDeleteId(null);
    }
  };

  const activeSellers = sellers.filter(s => s.status === 'activo');
  const inactiveSellers = sellers.filter(s => s.status === 'inactivo');

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-5xl mx-auto px-4 py-8">
        <header className="mb-10">
          <h1 className="text-5xl font-bold text-foreground mb-2">Vendedores</h1>
          <p className="text-muted-foreground">
            Gestiona tu equipo de ventas y comisiones
          </p>
        </header>

        {sellers.length > 0 ? (
          <>
            {isAdmin && (
              <div className="flex justify-end mb-6">
                <Button onClick={() => { resetForm(); setFormOpen(true); }} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo vendedor
                </Button>
              </div>
            )}

            {/* Active Sellers */}
            {activeSellers.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-foreground mb-4">Activos ({activeSellers.length})</h2>
                <div className="grid gap-4">
                  {activeSellers.map((seller) => (
                    <SellerCard 
                      key={seller.id} 
                      seller={seller} 
                      isAdmin={isAdmin}
                      onEdit={() => openEditForm(seller)}
                      onDelete={() => setDeleteId(seller.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Sellers */}
            {inactiveSellers.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-muted-foreground mb-4">Inactivos ({inactiveSellers.length})</h2>
                <div className="grid gap-4 opacity-60">
                  {inactiveSellers.map((seller) => (
                    <SellerCard 
                      key={seller.id} 
                      seller={seller} 
                      isAdmin={isAdmin}
                      onEdit={() => openEditForm(seller)}
                      onDelete={() => setDeleteId(seller.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 border-2 border-border">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl text-foreground mb-2">Sin vendedores aún</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Agrega tu equipo de ventas para hacer seguimiento
            </p>
            {isAdmin && (
              <Button onClick={() => { resetForm(); setFormOpen(true); }}>
                + Agregar primer vendedor
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { resetForm(); setEditingSeller(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSeller ? 'Editar vendedor' : 'Nuevo vendedor'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del vendedor"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contacto</Label>
              <Input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Teléfono, email, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commission">Comisión (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as SellerStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">🟢 Activo</SelectItem>
                    <SelectItem value="inactivo">🔴 Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                {editingSeller ? 'Guardar cambios' : 'Crear vendedor'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar vendedor?</AlertDialogTitle>
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
};

function SellerCard({ seller, isAdmin, onEdit, onDelete }: { 
  seller: Seller; 
  isAdmin: boolean; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  return (
    <div className="grc-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{seller.name}</h3>
              <Badge variant={seller.status === 'activo' ? 'default' : 'secondary'}>
                {seller.status}
              </Badge>
            </div>
            {seller.contact && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3" /> {seller.contact}
              </p>
            )}
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Percent className="w-3 h-3" /> Comisión: {seller.commission}%
            </p>
            {seller.notes && (
              <p className="text-sm text-muted-foreground mt-2 italic">{seller.notes}</p>
            )}
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sellers;
