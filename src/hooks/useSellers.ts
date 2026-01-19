import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Seller } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSellers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los vendedores',
        variant: 'destructive',
      });
    } else {
      setSellers(
        (data || []).map((s) => ({
          id: s.id,
          name: s.name,
          contact: s.contact || undefined,
          commission: Number(s.commission) || 0,
          status: s.status as Seller['status'],
          notes: s.notes || undefined,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const addSeller = async (seller: Omit<Seller, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('sellers')
      .insert({
        name: seller.name,
        contact: seller.contact || null,
        commission: seller.commission || 0,
        status: seller.status || 'activo',
        notes: seller.notes || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el vendedor',
        variant: 'destructive',
      });
      return null;
    }

    const newSeller: Seller = {
      id: data.id,
      name: data.name,
      contact: data.contact || undefined,
      commission: Number(data.commission) || 0,
      status: data.status as Seller['status'],
      notes: data.notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setSellers((prev) => [...prev, newSeller].sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: 'Vendedor creado', description: seller.name });
    return newSeller;
  };

  const updateSeller = async (id: string, updates: Partial<Omit<Seller, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const { error } = await supabase
      .from('sellers')
      .update({
        name: updates.name,
        contact: updates.contact,
        commission: updates.commission,
        status: updates.status,
        notes: updates.notes,
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el vendedor',
        variant: 'destructive',
      });
      return false;
    }

    setSellers((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      )
    );
    toast({ title: 'Vendedor actualizado' });
    return true;
  };

  const deleteSeller = async (id: string) => {
    const { error } = await supabase.from('sellers').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el vendedor',
        variant: 'destructive',
      });
      return false;
    }

    setSellers((prev) => prev.filter((s) => s.id !== id));
    toast({ title: 'Vendedor eliminado' });
    return true;
  };

  return {
    sellers,
    loading,
    addSeller,
    updateSeller,
    deleteSeller,
    refetch: fetchSellers,
  };
}
