import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
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
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        price: product.price,
        store_name: product.storeName || null,
        image_url: product.imageUrl || null,
        description: product.description || null,
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
    };

    setProducts((prev) => [newProduct, ...prev]);
    toast({ title: 'Producto creado', description: product.name });
    return newProduct;
  };

  const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const { error } = await supabase
      .from('products')
      .update({
        name: updates.name,
        price: updates.price,
        store_name: updates.storeName,
        image_url: updates.imageUrl,
        description: updates.description,
      })
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
