import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sale, Product, Seller, OrderStatus, SalesChannel, OperationalStatus, ResellerType, SaleType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';

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

// Tipo para input de venta - ahora con saleType obligatorio
interface SaleInput extends Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'product' | 'seller' | 'operationalStatus' | 'statusUpdatedAt'> {
  relatedCreativeId?: string;
  operationalStatus?: OperationalStatus;
  // Pricing fields
  resellerPrice?: number;
  finalPrice?: number;
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentCompany } = useCompany();

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
          // Tipo de venta - mapear desde DB
          saleType: (s.sale_type as SaleType) || (s.seller_id ? 'revendedor' : 'directa'),
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
            type: (s.seller.type as ResellerType) || 'revendedor',
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
          // Reseller pricing fields
          resellerPrice: Number(s.reseller_price) || Number(s.unit_price) || 0,
          finalPrice: Number(s.final_price) || 0,
          resellerProfit: Number(s.reseller_profit) || 0,
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
    // Validación obligatoria: tipo de venta
    if (!sale.saleType) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar el tipo de venta',
        variant: 'destructive',
      });
      return null;
    }

    // Validaciones según tipo
    if (sale.saleType === 'revendedor' && !sale.sellerId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un revendedor para ventas a revendedor',
        variant: 'destructive',
      });
      return null;
    }

    if (sale.saleType === 'directa' && !sale.finalPrice) {
      toast({
        title: 'Error',
        description: 'El precio final es obligatorio en ventas directas',
        variant: 'destructive',
      });
      return null;
    }

    // Calcular precios según tipo de venta
    let costAtSale = 0;
    let marginAtSale = 0;
    let marginPercentAtSale = 0;
    let resellerProfit = 0;
    let unitPrice = 0;
    let totalAmount = 0;

    if (sale.productId) {
      const product = await getProductForFreeze(sale.productId);
      if (product) {
        costAtSale = product.costPrice || 0;

        if (sale.saleType === 'directa') {
          // VENTA DIRECTA: unitPrice = finalPrice
          unitPrice = sale.finalPrice || 0;
          marginAtSale = unitPrice - costAtSale;
        } else {
          // VENTA A REVENDEDOR: unitPrice = resellerPrice
          unitPrice = sale.resellerPrice || sale.unitPrice;
          marginAtSale = unitPrice - costAtSale;
          // Ganancia del revendedor (informativa)
          if (sale.finalPrice && sale.finalPrice > 0) {
            resellerProfit = sale.finalPrice - unitPrice;
          }
        }

        totalAmount = unitPrice * sale.quantity;
        marginPercentAtSale = costAtSale > 0 
          ? Math.round(((unitPrice - costAtSale) / costAtSale) * 100 * 100) / 100
          : 0;
      }
    }

    const { data, error } = await supabase
      .from('sales')
      .insert({
        sale_type: sale.saleType,
        product_id: sale.productId,
        seller_id: sale.saleType === 'revendedor' ? (sale.sellerId || null) : null,
        client_name: sale.clientName || null,
        client_phone: sale.clientPhone || null,
        sales_channel: sale.salesChannel || 'whatsapp',
        quantity: sale.quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        payment_method: sale.paymentMethod || null,
        payment_status: sale.paymentStatus || 'pendiente',
        order_status: sale.orderStatus || 'pendiente',
        sale_date: sale.saleDate,
        notes: sale.notes || null,
        // Financial freeze fields
        cost_at_sale: costAtSale,
        margin_at_sale: marginAtSale,
        margin_percent_at_sale: marginPercentAtSale,
        // Pricing fields
        reseller_price: sale.saleType === 'revendedor' ? (sale.resellerPrice || unitPrice) : null,
        final_price: sale.finalPrice || null,
        reseller_profit: resellerProfit,
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
      const typeLabel = sale.saleType === 'directa' ? 'directa' : 'a revendedor';
      toast({ title: `Venta ${typeLabel} registrada` });
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
