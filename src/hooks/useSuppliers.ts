import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Supplier } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentCompany } = useCompany();

  const fetchSuppliers = async () => {
    if (!currentCompany) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', currentCompany.id)
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proveedores',
        variant: 'destructive',
      });
    } else {
      setSuppliers(
        (data || []).map((s) => ({
          id: s.id,
          name: s.name,
          contact: s.contact || undefined,
          conditions: s.conditions || undefined,
          notes: s.notes || undefined,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentCompany) fetchSuppliers();
  }, [currentCompany?.id]);

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name: supplier.name,
        contact: supplier.contact || null,
        conditions: supplier.conditions || null,
        notes: supplier.notes || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el proveedor',
        variant: 'destructive',
      });
      return null;
    }

    const newSupplier: Supplier = {
      id: data.id,
      name: data.name,
      contact: data.contact || undefined,
      conditions: data.conditions || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setSuppliers((prev) => [...prev, newSupplier].sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: 'Proveedor creado', description: supplier.name });
    return newSupplier;
  };

  const updateSupplier = async (id: string, updates: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const { error } = await supabase
      .from('suppliers')
      .update({
        name: updates.name,
        contact: updates.contact,
        conditions: updates.conditions,
        notes: updates.notes,
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el proveedor',
        variant: 'destructive',
      });
      return false;
    }

    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      )
    );
    toast({ title: 'Proveedor actualizado' });
    return true;
  };

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el proveedor',
        variant: 'destructive',
      });
      return false;
    }

    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    toast({ title: 'Proveedor eliminado' });
    return true;
  };

  return {
    suppliers,
    loading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    refetch: fetchSuppliers,
  };
}
