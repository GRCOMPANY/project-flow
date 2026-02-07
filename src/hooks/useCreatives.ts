import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Creative, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useCreatives() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCreatives = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('creatives')
      .select(`
        *,
        product:products(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los creativos',
        variant: 'destructive',
      });
    } else {
      setCreatives(
        (data || []).map((c) => ({
          id: c.id,
          productId: c.product_id || undefined,
          product: c.product ? {
            id: c.product.id,
            name: c.product.name,
            price: Number(c.product.price),
            storeName: c.product.store_name || undefined,
            imageUrl: c.product.image_url || undefined,
            description: c.product.description || undefined,
            createdAt: c.product.created_at,
            updatedAt: c.product.updated_at,
            costPrice: Number(c.product.supplier_price) || 0,
            wholesalePrice: Number(c.product.wholesale_price) || 0,
            retailPrice: Number(c.product.suggested_price) || 0,
            supplierPrice: Number(c.product.supplier_price) || 0,
            suggestedPrice: Number(c.product.suggested_price) || 0,
            status: c.product.status as Product['status'],
            isFeatured: c.product.is_featured || false,
            autoPromote: c.product.auto_promote || false,
            mainChannel: (c.product.main_channel as Product['mainChannel']) || 'whatsapp',
            deliveryType: (c.product.delivery_type as Product['deliveryType']) || 'contra_entrega',
            category: c.product.category || undefined,
          } as Product : undefined,
          type: c.type as Creative['type'],
          channel: c.channel as Creative['channel'],
          objective: c.objective as Creative['objective'],
          status: c.status as Creative['status'],
          result: c.result as Creative['result'],
          title: c.title || undefined,
          copy: c.copy || undefined,
          imageUrl: c.image_url || undefined,
          videoUrl: c.video_url || undefined,
          script: c.script || undefined,
          learning: c.learning || undefined,
          aiPrompt: c.ai_prompt || undefined,
          publishedAt: c.published_at || undefined,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          // New Creative Intelligence fields
          targetAudience: (c as Record<string, unknown>).target_audience as Creative['targetAudience'] || undefined,
          audienceNotes: (c as Record<string, unknown>).audience_notes as string || undefined,
          hookType: (c as Record<string, unknown>).hook_type as Creative['hookType'] || undefined,
          hookText: (c as Record<string, unknown>).hook_text as string || undefined,
          variation: (c as Record<string, unknown>).variation as string || 'A',
          messageApproach: (c as Record<string, unknown>).message_approach as Creative['messageApproach'] || undefined,
          metricLikes: Number((c as Record<string, unknown>).metric_likes) || 0,
          metricComments: Number((c as Record<string, unknown>).metric_comments) || 0,
          metricMessages: Number((c as Record<string, unknown>).metric_messages) || 0,
          metricKnownPeople: (c as Record<string, unknown>).metric_known_people as Creative['metricKnownPeople'] || undefined,
          metricSales: Number((c as Record<string, unknown>).metric_sales) || 0,
          metricImpressions: Number((c as Record<string, unknown>).metric_impressions) || 0,
          metricClicks: Number((c as Record<string, unknown>).metric_clicks) || 0,
          metricCost: Number((c as Record<string, unknown>).metric_cost) || 0,
          engagementLevel: (c as Record<string, unknown>).engagement_level as Creative['engagementLevel'] || undefined,
          vsPrevious: (c as Record<string, unknown>).vs_previous as Creative['vsPrevious'] || undefined,
          vsPreviousId: (c as Record<string, unknown>).vs_previous_id as string || undefined,
          whatChanged: (c as Record<string, unknown>).what_changed as string || undefined,
          automationIntent: (c as Record<string, unknown>).automation_intent as Creative['automationIntent'] || undefined,
          automationStatus: (c as Record<string, unknown>).automation_status as Creative['automationStatus'] || undefined,
          // New fields
          ctaText: (c as Record<string, unknown>).cta_text as string || undefined,
          publicationReference: (c as Record<string, unknown>).publication_reference as string || undefined,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCreatives();
  }, []);

  const addCreative = async (creative: Omit<Creative, 'id' | 'createdAt' | 'updatedAt' | 'product'>) => {
    const insertData: Record<string, unknown> = {
      product_id: creative.productId || null,
      type: creative.type,
      channel: creative.channel,
      objective: creative.objective,
      status: creative.status || 'pendiente',
      result: creative.result || 'sin_evaluar',
      title: creative.title || null,
      copy: creative.copy || null,
      image_url: creative.imageUrl || null,
      video_url: creative.videoUrl || null,
      script: creative.script || null,
      learning: creative.learning || null,
      ai_prompt: creative.aiPrompt || null,
      published_at: creative.publishedAt || null,
      // New Creative Intelligence fields
      target_audience: creative.targetAudience || null,
      audience_notes: creative.audienceNotes || null,
      hook_type: creative.hookType || null,
      hook_text: creative.hookText || null,
      variation: creative.variation || 'A',
      message_approach: creative.messageApproach || null,
      metric_likes: creative.metricLikes || 0,
      metric_comments: creative.metricComments || 0,
      metric_messages: creative.metricMessages || 0,
      metric_known_people: creative.metricKnownPeople || null,
      metric_sales: creative.metricSales || 0,
      metric_impressions: creative.metricImpressions || 0,
      metric_clicks: creative.metricClicks || 0,
      metric_cost: creative.metricCost || 0,
      engagement_level: creative.engagementLevel || null,
      vs_previous: creative.vsPrevious || null,
      vs_previous_id: creative.vsPreviousId || null,
      what_changed: creative.whatChanged || null,
      automation_intent: creative.automationIntent || null,
      automation_status: creative.automationStatus || null,
      // New fields
      cta_text: creative.ctaText || null,
      publication_reference: creative.publicationReference || null,
    };

    const { data, error } = await supabase
      .from('creatives')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el creativo',
        variant: 'destructive',
      });
      return null;
    }

    toast({ title: 'Creativo creado' });
    fetchCreatives();
    return data;
  };

  const updateCreative = async (id: string, updates: Partial<Omit<Creative, 'id' | 'createdAt' | 'updatedAt' | 'product'>>) => {
    const updateData: Record<string, unknown> = {};
    
    if (updates.productId !== undefined) updateData.product_id = updates.productId;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.channel !== undefined) updateData.channel = updates.channel;
    if (updates.objective !== undefined) updateData.objective = updates.objective;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.result !== undefined) updateData.result = updates.result;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.copy !== undefined) updateData.copy = updates.copy;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.videoUrl !== undefined) updateData.video_url = updates.videoUrl;
    if (updates.script !== undefined) updateData.script = updates.script;
    if (updates.learning !== undefined) updateData.learning = updates.learning;
    if (updates.aiPrompt !== undefined) updateData.ai_prompt = updates.aiPrompt;
    if (updates.publishedAt !== undefined) updateData.published_at = updates.publishedAt;
    // New Creative Intelligence fields
    if (updates.targetAudience !== undefined) updateData.target_audience = updates.targetAudience;
    if (updates.audienceNotes !== undefined) updateData.audience_notes = updates.audienceNotes;
    if (updates.hookType !== undefined) updateData.hook_type = updates.hookType;
    if (updates.hookText !== undefined) updateData.hook_text = updates.hookText;
    if (updates.variation !== undefined) updateData.variation = updates.variation;
    if (updates.messageApproach !== undefined) updateData.message_approach = updates.messageApproach;
    if (updates.metricLikes !== undefined) updateData.metric_likes = updates.metricLikes;
    if (updates.metricComments !== undefined) updateData.metric_comments = updates.metricComments;
    if (updates.metricMessages !== undefined) updateData.metric_messages = updates.metricMessages;
    if (updates.metricKnownPeople !== undefined) updateData.metric_known_people = updates.metricKnownPeople;
    if (updates.metricSales !== undefined) updateData.metric_sales = updates.metricSales;
    if (updates.metricImpressions !== undefined) updateData.metric_impressions = updates.metricImpressions;
    if (updates.metricClicks !== undefined) updateData.metric_clicks = updates.metricClicks;
    if (updates.metricCost !== undefined) updateData.metric_cost = updates.metricCost;
    if (updates.engagementLevel !== undefined) updateData.engagement_level = updates.engagementLevel;
    if (updates.vsPrevious !== undefined) updateData.vs_previous = updates.vsPrevious;
    if (updates.vsPreviousId !== undefined) updateData.vs_previous_id = updates.vsPreviousId;
    if (updates.whatChanged !== undefined) updateData.what_changed = updates.whatChanged;
    if (updates.automationIntent !== undefined) updateData.automation_intent = updates.automationIntent;
    if (updates.automationStatus !== undefined) updateData.automation_status = updates.automationStatus;
    // New fields
    if (updates.ctaText !== undefined) updateData.cta_text = updates.ctaText;
    if (updates.publicationReference !== undefined) updateData.publication_reference = updates.publicationReference;

    const { error } = await supabase
      .from('creatives')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el creativo',
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'Creativo actualizado' });
    fetchCreatives();
    return true;
  };

  const deleteCreative = async (id: string) => {
    const { error } = await supabase.from('creatives').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el creativo',
        variant: 'destructive',
      });
      return false;
    }

    setCreatives((prev) => prev.filter((c) => c.id !== id));
    toast({ title: 'Creativo eliminado' });
    return true;
  };

  return {
    creatives,
    loading,
    addCreative,
    updateCreative,
    deleteCreative,
    refetch: fetchCreatives,
  };
}
