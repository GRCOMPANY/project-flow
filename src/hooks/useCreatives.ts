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
            // New pricing fields
            costPrice: Number(c.product.supplier_price) || 0,
            wholesalePrice: Number(c.product.wholesale_price) || 0,
            retailPrice: Number(c.product.suggested_price) || 0,
            // Legacy fields
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
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCreatives();
  }, []);

  const addCreative = async (creative: Omit<Creative, 'id' | 'createdAt' | 'updatedAt' | 'product'>) => {
    const { data, error } = await supabase
      .from('creatives')
      .insert({
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
      })
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
