import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Seller, ResellerType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';

// Labels for reseller types
export const RESELLER_TYPE_LABELS: Record<ResellerType, string> = {
  revendedor: 'Revendedor',
  mayorista: 'Mayorista',
  interno: 'Interno',
};

export function useSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentCompany } = useCompany();

  // Fetch reseller stats from sales
  const getResellerStats = useCallback(async (resellerId: string) => {
    const { data: salesData } = await supabase
      .from('sales')
      .select('total_amount, payment_status, sale_date')
      .eq('seller_id', resellerId);

    if (!salesData || salesData.length === 0) {
      return {
        totalPurchased: 0,
        totalPaid: 0,
        pendingBalance: 0,
        lastSaleDate: undefined,
        salesCount: 0,
      };
    }

    const totalPurchased = salesData.reduce((sum, s) => sum + Number(s.total_amount), 0);
    const totalPaid = salesData
      .filter(s => s.payment_status === 'pagado')
      .reduce((sum, s) => sum + Number(s.total_amount), 0);
    const pendingBalance = totalPurchased - totalPaid;
    const lastSaleDate = salesData
      .map(s => s.sale_date)
      .sort()
      .reverse()[0];

    return {
      totalPurchased,
      totalPaid,
      pendingBalance,
      lastSaleDate,
      salesCount: salesData.length,
    };
  }, []);

  const fetchSellers = async () => {
    if (!currentCompany) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('company_id', currentCompany.id)
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los revendedores',
        variant: 'destructive',
      });
    } else {
      // Fetch stats for each seller
      const sellersWithStats = await Promise.all(
        (data || []).map(async (s) => {
          const stats = await getResellerStats(s.id);
          return {
            id: s.id,
            name: s.name,
            contact: s.contact || undefined,
            type: (s.type as ResellerType) || 'revendedor',
            status: s.status as Seller['status'],
            notes: s.notes || undefined,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            // Stats from sales
            ...stats,
          };
        })
      );
      setSellers(sellersWithStats);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentCompany) fetchSellers();
  }, [currentCompany?.id]);

  const addSeller = async (seller: Omit<Seller, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchased' | 'totalPaid' | 'pendingBalance' | 'lastSaleDate' | 'salesCount'>) => {
    const { data, error } = await supabase
      .from('sellers')
      .insert({
        company_id: currentCompany?.id,
        name: seller.name,
        contact: seller.contact || null,
        type: seller.type || 'revendedor',
        status: seller.status || 'activo',
        notes: seller.notes || null,
        // Don't send commission - deprecated
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el revendedor',
        variant: 'destructive',
      });
      return null;
    }

    const newSeller: Seller = {
      id: data.id,
      name: data.name,
      contact: data.contact || undefined,
      type: (data.type as ResellerType) || 'revendedor',
      status: data.status as Seller['status'],
      notes: data.notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      totalPurchased: 0,
      totalPaid: 0,
      pendingBalance: 0,
      salesCount: 0,
    };

    setSellers((prev) => [...prev, newSeller].sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: 'Revendedor creado', description: seller.name });
    return newSeller;
  };

  const updateSeller = async (id: string, updates: Partial<Omit<Seller, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchased' | 'totalPaid' | 'pendingBalance' | 'lastSaleDate' | 'salesCount'>>) => {
    const { error } = await supabase
      .from('sellers')
      .update({
        name: updates.name,
        contact: updates.contact,
        type: updates.type,
        status: updates.status,
        notes: updates.notes,
        // Don't update commission - deprecated
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el revendedor',
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
    toast({ title: 'Revendedor actualizado' });
    return true;
  };

  const deleteSeller = async (id: string) => {
    const { error } = await supabase.from('sellers').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el revendedor',
        variant: 'destructive',
      });
      return false;
    }

    setSellers((prev) => prev.filter((s) => s.id !== id));
    toast({ title: 'Revendedor eliminado' });
    return true;
  };

  return {
    sellers,
    loading,
    addSeller,
    updateSeller,
    deleteSeller,
    getResellerStats,
    refetch: fetchSellers,
  };
}
