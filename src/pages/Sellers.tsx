import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { useSellers, RESELLER_TYPE_LABELS } from '@/hooks/useSellers';
import { useAuth } from '@/contexts/AuthContext';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Seller, SellerStatus, ResellerType } from '@/types';
import { ResellerCard } from '@/components/resellers/ResellerCard';
import { ResellerDetailSheet } from '@/components/resellers/ResellerDetailSheet';
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
  const [detailSeller, setDetailSeller] = useState<Seller | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [type, setType] = useState<ResellerType>('revendedor');
  const [status, setStatus] = useState<SellerStatus>('activo');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setContact('');
    setType('revendedor');
    setStatus('activo');
    setNotes('');
  };

  const openEditForm = (seller: Seller) => {
    setName(seller.name);
    setContact(seller.contact || '');
    setType(seller.type || 'revendedor');
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
        type,
        status,
        notes: notes.trim() || undefined,
      });
    } else {
      await addSeller({
        name: name.trim(),
        contact: contact.trim() || undefined,
        type,
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
  
  // Calculate totals
  const totalPending = sellers.reduce((sum, s) => sum + (s.pendingBalance || 0), 0);
  const totalPurchased = sellers.reduce((sum, s) => sum + (s.totalPurchased || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CommandCenterNav />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />

      <div className="container max-w-5xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Revendedores</h1>
          <p className="text-muted-foreground">
            Gestiona tus canales de reventa y mayoreo
          </p>
        </header>

        {/* Summary Stats */}
        {sellers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total revendedores</p>
              <p className="text-2xl font-bold">{sellers.length}</p>
              <p className="text-xs text-muted-foreground">
                {activeSellers.length} activos
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total vendido</p>
              <p className="text-2xl font-bold">${totalPurchased.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">A todos los revendedores</p>
            </div>
            <div className={`bg-card border rounded-lg p-4 ${totalPending > 0 ? 'border-amber-500/50' : ''}`}>
              <p className="text-sm text-muted-foreground">Pendiente por cobrar</p>
              <p className={`text-2xl font-bold ${totalPending > 0 ? 'text-amber-600' : ''}`}>
                ${totalPending.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">De todos los revendedores</p>
            </div>
          </div>
        )}

        {sellers.length > 0 ? (
          <>
            {isAdmin && (
              <div className="flex justify-end mb-6">
                <Button onClick={() => { resetForm(); setFormOpen(true); }} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo revendedor
                </Button>
              </div>
            )}

            {/* Active Sellers */}
            {activeSellers.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-foreground mb-4">
                  Activos ({activeSellers.length})
                </h2>
                <div className="grid gap-4">
                  {activeSellers.map((seller) => (
                    <ResellerCard 
                      key={seller.id} 
                      seller={seller} 
                      isAdmin={isAdmin}
                      onEdit={() => openEditForm(seller)}
                      onDelete={() => setDeleteId(seller.id)}
                      onViewDetail={() => setDetailSeller(seller)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Sellers */}
            {inactiveSellers.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-muted-foreground mb-4">
                  Inactivos ({inactiveSellers.length})
                </h2>
                <div className="grid gap-4 opacity-60">
                  {inactiveSellers.map((seller) => (
                    <ResellerCard 
                      key={seller.id} 
                      seller={seller} 
                      isAdmin={isAdmin}
                      onEdit={() => openEditForm(seller)}
                      onDelete={() => setDeleteId(seller.id)}
                      onViewDetail={() => setDetailSeller(seller)}
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
            <h3 className="text-2xl text-foreground mb-2">Sin revendedores aún</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Agrega tus canales de reventa para hacer seguimiento de ventas
            </p>
            {isAdmin && (
              <Button onClick={() => { resetForm(); setFormOpen(true); }}>
                + Agregar primer revendedor
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { resetForm(); setEditingSeller(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSeller ? 'Editar revendedor' : 'Nuevo revendedor'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del revendedor"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contacto</Label>
              <Input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Teléfono, WhatsApp o email"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as ResellerType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revendedor">Revendedor</SelectItem>
                    <SelectItem value="mayorista">Mayorista</SelectItem>
                    <SelectItem value="interno">Interno</SelectItem>
                  </SelectContent>
                </Select>
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
              <Label htmlFor="notes">Notas estratégicas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones sobre este revendedor..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                {editingSeller ? 'Guardar cambios' : 'Crear revendedor'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <ResellerDetailSheet
        seller={detailSeller}
        open={!!detailSeller}
        onOpenChange={(open) => !open && setDetailSeller(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar revendedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las ventas asociadas no se eliminarán.
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

export default Sellers;
