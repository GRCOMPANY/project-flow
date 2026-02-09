import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, MarginLevel } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';

// Helper para calcular nivel de margen
function getMarginLevel(marginPercent: number): MarginLevel {
  if (marginPercent >= 40) return 'alto';
  if (marginPercent >= 20) return 'medio';
  return 'bajo';
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { currentCompany, isCompanyAdmin } = useCompany();

  const fetchProducts = async () => {
    if (!currentCompany) return;
    setLoading(true);
    let query = supabase
      .from('products')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .order('created_at', { ascending: false });

    // Filter by company_id (RLS also enforces this, but explicit is better)
    query = query.eq('company_id', currentCompany.id);

    const { data, error } = await query;

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      });
    } else {
      const mappedProducts = (data || []).map((p) => {
        // Mapear campos de BD a modelo
        const costPrice = Number(p.supplier_price) || 0;
        const wholesalePrice = Number(p.wholesale_price) || 0;
        const retailPrice = Number(p.suggested_price) || 0;
        
        // Calcular márgenes
        const marginAmount = retailPrice - costPrice;
        const marginPercent = costPrice > 0 
          ? ((marginAmount / costPrice) * 100) 
          : (retailPrice > 0 ? 100 : 0);
        const marginLevel = getMarginLevel(marginPercent);

        const product: Product = {
          id: p.id,
          name: p.name,
          sku: p.sku || undefined,
          category: p.category || undefined,
          status: p.status as Product['status'],
          
          // Precios nuevos
          costPrice: isAdmin ? costPrice : 0, // Ocultar a vendedores
          wholesalePrice,
          retailPrice,
          
          // Márgenes (solo admin)
          marginAmount: isAdmin ? marginAmount : undefined,
          marginPercent: isAdmin ? marginPercent : undefined,
          marginLevel: isAdmin ? marginLevel : undefined,
          
          // Automatización
          mainChannel: (p.main_channel as Product['mainChannel']) || 'whatsapp',
          deliveryType: (p.delivery_type as Product['deliveryType']) || 'contra_entrega',
          isFeatured: p.is_featured || false,
          autoPromote: p.auto_promote || false,
          
          // Contenido
          imageUrl: p.image_url || undefined,
          description: p.description || undefined,
          internalNotes: isAdmin ? (p.internal_notes || undefined) : undefined,
          
          // Relaciones
          supplierId: p.supplier_id || undefined,
          supplier: p.supplier ? {
            id: p.supplier.id,
            name: p.supplier.name,
            contact: p.supplier.contact || undefined,
            conditions: p.supplier.conditions || undefined,
            notes: p.supplier.notes || undefined,
            createdAt: p.supplier.created_at,
            updatedAt: p.supplier.updated_at,
          } : undefined,
          
          // Legacy
          price: Number(p.price),
          storeName: p.store_name || undefined,
          supplierPrice: costPrice,
          suggestedPrice: retailPrice,
          
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        };
        
        return product;
      });
      
      setProducts(mappedProducts);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentCompany) fetchProducts();
  }, [isAdmin, currentCompany?.id]);

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'supplier' | 'marginAmount' | 'marginPercent' | 'marginLevel'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        sku: product.sku || null,
        category: product.category || null,
        status: product.status || 'activo',
        
        // Precios
        supplier_price: product.costPrice || product.supplierPrice || 0,
        wholesale_price: product.wholesalePrice || 0,
        suggested_price: product.retailPrice || product.suggestedPrice || 0,
        price: product.retailPrice || product.suggestedPrice || 0,
        
        // Automatización
        main_channel: product.mainChannel || 'whatsapp',
        delivery_type: product.deliveryType || 'contra_entrega',
        is_featured: product.isFeatured || false,
        auto_promote: product.autoPromote || false,
        
        // Contenido
        image_url: product.imageUrl || null,
        description: product.description || null,
        internal_notes: product.internalNotes || null,
        store_name: product.storeName || null,
        
        // Relaciones
        supplier_id: product.supplierId || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: error.code === '23505' 
          ? 'El SKU ya existe, usa otro diferente' 
          : 'No se pudo crear el producto',
        variant: 'destructive',
      });
      return null;
    }

    toast({ title: 'Producto creado', description: product.name });
    await fetchProducts(); // Recargar para obtener datos calculados
    return data;
  };

  const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'supplier' | 'marginAmount' | 'marginPercent' | 'marginLevel'>>) => {
    const updateData: Record<string, unknown> = {};
    
    // Mapear campos del modelo a DB
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.sku !== undefined) updateData.sku = updates.sku;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.status !== undefined) updateData.status = updates.status;
    
    // Precios
    if (updates.costPrice !== undefined) updateData.supplier_price = updates.costPrice;
    if (updates.supplierPrice !== undefined) updateData.supplier_price = updates.supplierPrice;
    if (updates.wholesalePrice !== undefined) updateData.wholesale_price = updates.wholesalePrice;
    if (updates.retailPrice !== undefined) {
      updateData.suggested_price = updates.retailPrice;
      updateData.price = updates.retailPrice;
    }
    if (updates.suggestedPrice !== undefined) {
      updateData.suggested_price = updates.suggestedPrice;
      updateData.price = updates.suggestedPrice;
    }
    
    // Automatización
    if (updates.mainChannel !== undefined) updateData.main_channel = updates.mainChannel;
    if (updates.deliveryType !== undefined) updateData.delivery_type = updates.deliveryType;
    if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;
    if (updates.autoPromote !== undefined) updateData.auto_promote = updates.autoPromote;
    
    // Contenido
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.internalNotes !== undefined) updateData.internal_notes = updates.internalNotes;
    if (updates.storeName !== undefined) updateData.store_name = updates.storeName;
    
    // Relaciones
    if (updates.supplierId !== undefined) updateData.supplier_id = updates.supplierId;

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.code === '23505' 
          ? 'El SKU ya existe, usa otro diferente' 
          : 'No se pudo actualizar el producto',
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'Producto actualizado' });
    await fetchProducts(); // Recargar para obtener datos calculados
    return true;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el producto',
        variant: 'destructive',
      });
      return false;
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: 'Producto eliminado' });
    return true;
  };

  const uploadProductImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen',
        variant: 'destructive',
      });
      return null;
    }

    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Verificar si SKU es único
  const checkSkuAvailable = async (sku: string, excludeId?: string): Promise<boolean> => {
    if (!sku) return true;
    
    let query = supabase
      .from('products')
      .select('id')
      .eq('sku', sku);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data } = await query.maybeSingle();
    return !data;
  };

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
    checkSkuAvailable,
    refetch: fetchProducts,
  };
}
