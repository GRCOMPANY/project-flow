import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sale, Product, Seller, OrderStatus, SalesChannel, OperationalStatus, ResellerType } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Labels para estados operativos
export const OPERATIONAL_STATUS_LABELS: Record<OperationalStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  confirmado: 'Confirmado',
  sin_respuesta: 'Sin respuesta',
  en_ruta: 'En ruta',
  entregado: 'Entregado',
  riesgo_devolucion: 'En riesgo',
};

// Tipo para input de venta con campos de reseller model
interface SaleInput extends Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'product' | 'seller' | 'operationalStatus' | 'statusUpdatedAt'> {
  relatedCreativeId?: string;
  operationalStatus?: OperationalStatus;
  // Reseller pricing fields
  resellerPrice?: number;
  finalPrice?: number;
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        product:products(*),
        seller:sellers(*)
      `)
      .order('sale_date', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las ventas',
        variant: 'destructive',
      });
    } else {
      setSales(
        (data || []).map((s) => ({
          id: s.id,
          productId: s.product_id || '',
          product: s.product ? {
            id: s.product.id,
            name: s.product.name,
            price: Number(s.product.price),
            storeName: s.product.store_name || undefined,
            imageUrl: s.product.image_url || undefined,
            description: s.product.description || undefined,
            createdAt: s.product.created_at,
            updatedAt: s.product.updated_at,
            // New pricing fields
            costPrice: Number(s.product.supplier_price) || 0,
            wholesalePrice: Number(s.product.wholesale_price) || 0,
            retailPrice: Number(s.product.suggested_price) || 0,
            // Legacy fields
            supplierPrice: Number(s.product.supplier_price) || 0,
            suggestedPrice: Number(s.product.suggested_price) || 0,
            status: s.product.status as Product['status'],
            isFeatured: s.product.is_featured || false,
            autoPromote: s.product.auto_promote || false,
            mainChannel: (s.product.main_channel as Product['mainChannel']) || 'whatsapp',
            deliveryType: (s.product.delivery_type as Product['deliveryType']) || 'contra_entrega',
            category: s.product.category || undefined,
          } as Product : undefined,
          sellerId: s.seller_id || undefined,
          seller: s.seller ? {
            id: s.seller.id,
            name: s.seller.name,
            contact: s.seller.contact || undefined,
            commission: Number(s.seller.commission) || 0,
            status: s.seller.status as Seller['status'],
            notes: s.seller.notes || undefined,
            createdAt: s.seller.created_at,
            updatedAt: s.seller.updated_at,
          } : undefined,
          clientName: s.client_name || undefined,
          clientPhone: s.client_phone || undefined,
          salesChannel: (s.sales_channel as SalesChannel) || undefined,
          quantity: s.quantity,
          unitPrice: Number(s.unit_price),
          totalAmount: Number(s.total_amount),
          paymentMethod: s.payment_method || undefined,
          paymentStatus: s.payment_status as Sale['paymentStatus'],
          orderStatus: (s.order_status as OrderStatus) || 'pendiente',
          saleDate: s.sale_date,
          notes: s.notes || undefined,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
          // Financial freeze fields
          costAtSale: Number(s.cost_at_sale) || 0,
          marginAtSale: Number(s.margin_at_sale) || 0,
          marginPercentAtSale: Number(s.margin_percent_at_sale) || 0,
          relatedCreativeId: s.related_creative_id || undefined,
          // Operational tracking fields
          operationalStatus: (s.operational_status as OperationalStatus) || 'nuevo',
          statusUpdatedAt: s.status_updated_at || undefined,
        }))
      );
    }
    setLoading(false);
  };

  // Helper: Obtener producto para congelado financiero
  const getProductForFreeze = async (productId: string): Promise<Product | null> => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();
    
    if (!data) return null;
    
    return {
      id: data.id,
      name: data.name,
      costPrice: Number(data.supplier_price) || 0,
      wholesalePrice: Number(data.wholesale_price) || 0,
      retailPrice: Number(data.suggested_price) || 0,
      price: Number(data.price),
      supplierPrice: Number(data.supplier_price) || 0,
      suggestedPrice: Number(data.suggested_price) || 0,
      status: data.status,
      isFeatured: data.is_featured || false,
      autoPromote: data.auto_promote || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Product;
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const addSale = async (sale: SaleInput) => {
    // CONGELADO FINANCIERO: Capturar costo del producto al momento de la venta
    let costAtSale = 0;
    let marginAtSale = 0;
    let marginPercentAtSale = 0;

    if (sale.productId) {
      const product = await getProductForFreeze(sale.productId);
      if (product) {
        costAtSale = product.costPrice || 0;
        // Calcular margen usando el precio unitario de la venta
        marginAtSale = sale.unitPrice - costAtSale;
        // Calcular porcentaje (evitar división por cero)
        marginPercentAtSale = costAtSale > 0 
          ? Math.round(((sale.unitPrice - costAtSale) / costAtSale) * 100 * 100) / 100
          : 0;
      }
    }

    const { data, error } = await supabase
      .from('sales')
      .insert({
        product_id: sale.productId,
        seller_id: sale.sellerId || null,
        client_name: sale.clientName || null,
        client_phone: sale.clientPhone || null,
        sales_channel: sale.salesChannel || 'whatsapp',
        quantity: sale.quantity,
        unit_price: sale.unitPrice,
        total_amount: sale.totalAmount,
        payment_method: sale.paymentMethod || null,
        payment_status: sale.paymentStatus || 'pendiente',
        order_status: sale.orderStatus || 'pendiente',
        sale_date: sale.saleDate,
        notes: sale.notes || null,
        // Campos de congelado financiero
        cost_at_sale: costAtSale,
        margin_at_sale: marginAtSale,
        margin_percent_at_sale: marginPercentAtSale,
        related_creative_id: sale.relatedCreativeId || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo registrar la venta',
        variant: 'destructive',
      });
      return null;
    }

    // Mostrar alerta si la venta tiene margen negativo
    if (marginAtSale < 0) {
      toast({
        title: '⚠️ Venta con pérdida',
        description: `Margen negativo: $${marginAtSale.toLocaleString()}`,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Venta registrada' });
    }

    fetchSales();
    return data;
  };

  const updateSale = async (id: string, updates: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'product' | 'seller'>>) => {
    const updateData: Record<string, unknown> = {};
    
    if (updates.productId !== undefined) updateData.product_id = updates.productId;
    if (updates.sellerId !== undefined) updateData.seller_id = updates.sellerId;
    if (updates.clientName !== undefined) updateData.client_name = updates.clientName;
    if (updates.clientPhone !== undefined) updateData.client_phone = updates.clientPhone;
    if (updates.salesChannel !== undefined) updateData.sales_channel = updates.salesChannel;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.unitPrice !== undefined) updateData.unit_price = updates.unitPrice;
    if (updates.totalAmount !== undefined) updateData.total_amount = updates.totalAmount;
    if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
    if (updates.paymentStatus !== undefined) updateData.payment_status = updates.paymentStatus;
    if (updates.orderStatus !== undefined) updateData.order_status = updates.orderStatus;
    if (updates.saleDate !== undefined) updateData.sale_date = updates.saleDate;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la venta',
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'Venta actualizada' });
    fetchSales();
    return true;
  };

  const deleteSale = async (id: string) => {
    const { error } = await supabase.from('sales').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la venta',
        variant: 'destructive',
      });
      return false;
    }

    setSales((prev) => prev.filter((s) => s.id !== id));
    toast({ title: 'Venta eliminada' });
    return true;
  };

  const updateOperationalStatus = async (
    id: string, 
    newStatus: OperationalStatus
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('sales')
      .update({
        operational_status: newStatus,
        status_updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: `Estado: ${OPERATIONAL_STATUS_LABELS[newStatus]}` });
    fetchSales();
    return true;
  };

  return {
    sales,
    loading,
    addSale,
    updateSale,
    deleteSale,
    updateOperationalStatus,
    refetch: fetchSales,
  };
}
