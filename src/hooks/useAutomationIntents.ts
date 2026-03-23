/**
 * Hook for Creative Automation Intents (n8n Ready)
 * 
 * Manages automation intents that can be picked up by n8n for:
 * - Generating new creatives
 * - Repeating successful creatives
 * - Testing new audiences
 * - Sending to sellers
 * - Creating landing pages
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AutomationIntent, AutomationStatus, AutomationIntentRecord, Creative } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/hooks/useCompany';
import type { Json } from '@/integrations/supabase/types';

interface RegisterIntentInput {
  creativeId: string;
  productId?: string;
  intentType: AutomationIntent;
  metadata?: Record<string, unknown>;
}

export function useAutomationIntents() {
  const [intents, setIntents] = useState<AutomationIntentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchIntents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('creative_automation_intents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setIntents(
        (data || []).map((i) => ({
          id: i.id,
          creativeId: i.creative_id,
          productId: i.product_id || undefined,
          intentType: i.intent_type as AutomationIntent,
          status: (i.status || 'pending') as AutomationStatus,
          metadata: (i.metadata as Record<string, unknown>) || {},
          triggeredBy: i.triggered_by || undefined,
          triggeredAt: i.triggered_at,
          completedAt: i.completed_at || undefined,
          resultNotes: i.result_notes || undefined,
          createdAt: i.created_at,
        }))
      );
    } catch (error) {
      console.error('Error fetching intents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntents();
  }, [fetchIntents]);

  /**
   * Register a new automation intent
   * This creates a record that n8n can poll for processing
   */
  const registerIntent = async (
    input: RegisterIntentInput,
    creative?: Creative
  ): Promise<AutomationIntentRecord | null> => {
    try {
      // Build metadata with creative context
      const metadata: Record<string, unknown> = {
        ...input.metadata,
        // Include creative context for n8n
        creative: creative ? {
          id: creative.id,
          type: creative.type,
          channel: creative.channel,
          title: creative.title,
          hookType: creative.hookType,
          metricMessages: creative.metricMessages,
          metricSales: creative.metricSales,
          learning: creative.learning,
        } : undefined,
        registeredAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('creative_automation_intents')
        .insert({
          creative_id: input.creativeId,
          product_id: input.productId || null,
          intent_type: input.intentType,
          status: 'pending',
          metadata: metadata as Json,
          company_id: companyId,
        })
        .select()
        .single();

      if (error) throw error;

      // Also update the creative's automation_intent field
      await supabase
        .from('creatives')
        .update({ 
          automation_intent: input.intentType,
          automation_status: 'pending',
        })
        .eq('id', input.creativeId);

      const intentLabels: Record<AutomationIntent, string> = {
        generate_new: 'Generar nuevo',
        repeat: 'Repetir',
        new_audience: 'Nuevo público',
        send_sellers: 'Enviar a vendedores',
        landing: 'Crear landing',
      };

      toast({
        title: '⚡ Intent registrado',
        description: `"${intentLabels[input.intentType]}" listo para automatización`,
      });

      await fetchIntents();
      
      return {
        id: data.id,
        creativeId: data.creative_id,
        productId: data.product_id || undefined,
        intentType: data.intent_type as AutomationIntent,
        status: 'pending',
        metadata: metadata,
        triggeredAt: data.triggered_at,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Error registering intent:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar la acción',
        variant: 'destructive',
      });
      return null;
    }
  };

  /**
   * Get intents by status (useful for n8n polling)
   */
  const getIntentsByStatus = useCallback((status: AutomationStatus): AutomationIntentRecord[] => {
    return intents.filter(i => i.status === status);
  }, [intents]);

  /**
   * Get intents for a specific creative
   */
  const getIntentsByCreative = useCallback((creativeId: string): AutomationIntentRecord[] => {
    return intents.filter(i => i.creativeId === creativeId);
  }, [intents]);

  /**
   * Update intent status (called by n8n or admin)
   */
  const updateIntentStatus = async (
    id: string,
    status: AutomationStatus,
    notes?: string
  ): Promise<boolean> => {
    try {
      const updates: Record<string, unknown> = {
        status,
        result_notes: notes,
      };

      if (status === 'completed' || status === 'failed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('creative_automation_intents')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Also update the creative's automation_status
      const intent = intents.find(i => i.id === id);
      if (intent) {
        await supabase
          .from('creatives')
          .update({ automation_status: status })
          .eq('id', intent.creativeId);
      }

      await fetchIntents();
      return true;
    } catch (error) {
      console.error('Error updating intent status:', error);
      return false;
    }
  };

  /**
   * Cancel a pending intent
   */
  const cancelIntent = async (id: string): Promise<boolean> => {
    return updateIntentStatus(id, 'failed', 'Cancelado por usuario');
  };

  return {
    intents,
    loading,
    pendingIntents: getIntentsByStatus('pending'),
    registerIntent,
    getIntentsByStatus,
    getIntentsByCreative,
    updateIntentStatus,
    cancelIntent,
    refetch: fetchIntents,
  };
}
