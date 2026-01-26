import { useState } from 'react';
import { Plus, Trash2, Edit2, Truck, Phone, FileText } from 'lucide-react';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAuth } from '@/contexts/AuthContext';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Supplier } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

const Suppliers = () => {
  const { isAdmin } = useAuth();
  const { suppliers, loading, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [conditions, setConditions] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setContact('');
    setConditions('');
    setNotes('');
  };

  const openEditForm = (supplier: Supplier) => {
    setName(supplier.name);
    setContact(supplier.contact || '');
    setConditions(supplier.conditions || '');
    setNotes(supplier.notes || '');
    setEditingSupplier(supplier);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, {
        name: name.trim(),
        contact: contact.trim() || undefined,
        conditions: conditions.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      await addSupplier({
        name: name.trim(),
        contact: contact.trim() || undefined,
        conditions: conditions.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    resetForm();
    setEditingSupplier(null);
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSupplier(deleteId);
      setDeleteId(null);
    }
  };

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
        <header className="mb-10">
          <h1 className="text-5xl font-bold text-foreground mb-2">Proveedores</h1>
          <p className="text-muted-foreground">
            Gestiona tus proveedores y sus condiciones comerciales
          </p>
        </header>

        {suppliers.length > 0 ? (
          <>
            {isAdmin && (
              <div className="flex justify-end mb-6">
                <Button onClick={() => { resetForm(); setFormOpen(true); }} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo proveedor
                </Button>
              </div>
            )}

            <div className="grid gap-4">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="grc-card p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-grc-gold-light flex items-center justify-center">
                        <Truck className="w-6 h-6 text-grc-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{supplier.name}</h3>
                        {supplier.contact && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {supplier.contact}
                          </p>
                        )}
                        {supplier.conditions && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <FileText className="w-3 h-3" /> {supplier.conditions}
                          </p>
                        )}
                        {supplier.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">{supplier.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditForm(supplier)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(supplier.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 border-2 border-border">
              <Truck className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl text-foreground mb-2">Sin proveedores aún</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Agrega tu primer proveedor para organizar tus costos
            </p>
            {isAdmin && (
              <Button onClick={() => { resetForm(); setFormOpen(true); }}>
                + Agregar primer proveedor
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { resetForm(); setEditingSupplier(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del proveedor"
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

            <div className="space-y-2">
              <Label htmlFor="conditions">Condiciones comerciales</Label>
              <Textarea
                id="conditions"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="Tiempos de entrega, mínimos, descuentos..."
                rows={2}
              />
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
                {editingSupplier ? 'Guardar cambios' : 'Crear proveedor'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
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

export default Suppliers;
