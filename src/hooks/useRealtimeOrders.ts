import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';

export interface RealtimeOrder {
  id: string;
  product_name: string | null;
  client_name: string | null;
  total_amount: number | null;
  quantity: number | null;
  created_at: string;
}

export function useRealtimeOrders(onNewOrder?: (order: RealtimeOrder) => void) {
  const { companyId } = useCompany();
  const [newOrders, setNewOrders] = useState<RealtimeOrder[]>([]);
  const callbackRef = useRef(onNewOrder);
  const channelName = useRef(`realtime-orders-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    callbackRef.current = onNewOrder;
  });

  useEffect(() => {
    if (!companyId) return;

    const channel = (supabase as any)
      .channel(channelName.current)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales',
          filter: `company_id=eq.${companyId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          if (payload.new?.sales_channel !== 'tienda_publica') return;
          const order: RealtimeOrder = {
            id: String(payload.new.id ?? ''),
            product_name: (payload.new.product_name as string) ?? null,
            client_name: (payload.new.client_name as string) ?? null,
            total_amount: (payload.new.total_amount as number) ?? null,
            quantity: (payload.new.quantity as number) ?? null,
            created_at: String(payload.new.created_at ?? new Date().toISOString()),
          };
          setNewOrders(prev => [order, ...prev]);
          callbackRef.current?.(order);
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [companyId]);

  const markAsSeen = useCallback(() => setNewOrders([]), []);

  return { newOrders, newOrderCount: newOrders.length, markAsSeen };
}
