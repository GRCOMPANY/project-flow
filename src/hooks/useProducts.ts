import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, Supplier } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      });
    } else {
      setProducts(
        (data || []).map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          storeName: p.store_name || undefined,
          imageUrl: p.image_url || undefined,
          description: p.description || undefined,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
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
          supplierPrice: Number(p.supplier_price) || 0,
          suggestedPrice: Number(p.suggested_price) || 0,
          status: p.status as Product['status'],
          isFeatured: p.is_featured || false,
          category: p.category || undefined,
          internalNotes: p.internal_notes || undefined,
          sku: p.sku || undefined,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'supplier'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        price: product.price,
        store_name: product.storeName || null,
        image_url: product.imageUrl || null,
        description: product.description || null,
        supplier_id: product.supplierId || null,
        supplier_price: product.supplierPrice || 0,
        suggested_price: product.suggestedPrice || 0,
        status: product.status || 'activo',
        is_featured: product.isFeatured || false,
        category: product.category || null,
        internal_notes: product.internalNotes || null,
        sku: product.sku || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el producto',
        variant: 'destructive',
      });
      return null;
    }

    const newProduct: Product = {
      id: data.id,
      name: data.name,
      price: Number(data.price),
      storeName: data.store_name || undefined,
      imageUrl: data.image_url || undefined,
      description: data.description || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      supplierId: data.supplier_id || undefined,
      supplierPrice: Number(data.supplier_price) || 0,
      suggestedPrice: Number(data.suggested_price) || 0,
      status: data.status as Product['status'],
      isFeatured: data.is_featured || false,
      category: data.category || undefined,
      internalNotes: data.internal_notes || undefined,
      sku: data.sku || undefined,
    };

    setProducts((prev) => [newProduct, ...prev]);
    toast({ title: 'Producto creado', description: product.name });
    return newProduct;
  };

  const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'supplier'>>) => {
    const updateData: Record<string, unknown> = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.storeName !== undefined) updateData.store_name = updates.storeName;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.supplierId !== undefined) updateData.supplier_id = updates.supplierId;
    if (updates.supplierPrice !== undefined) updateData.supplier_price = updates.supplierPrice;
    if (updates.suggestedPrice !== undefined) updateData.suggested_price = updates.suggestedPrice;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.internalNotes !== undefined) updateData.internal_notes = updates.internalNotes;
    if (updates.sku !== undefined) updateData.sku = updates.sku;

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el producto',
        variant: 'destructive',
      });
      return false;
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
    toast({ title: 'Producto actualizado' });
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

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
    refetch: fetchProducts,
  };
}
