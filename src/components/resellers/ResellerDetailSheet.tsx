import { useState, useEffect } from 'react';
import { Seller, Sale } from '@/types';
import { RESELLER_TYPE_LABELS } from '@/hooks/useSellers';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Phone, 
  DollarSign, 
  Clock,
  CheckCircle,
  Package,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ResellerDetailSheetProps {
  seller: Seller | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SaleRecord {
  id: string;
  sale_date: string;
  total_amount: number;
  payment_status: string;
  product_name?: string;
  reseller_price?: number;
}

export function ResellerDetailSheet({ 
  seller, 
  open, 
  onOpenChange 
}: ResellerDetailSheetProps) {
  const [purchases, setPurchases] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (seller && open) {
      fetchPurchaseHistory(seller.id);
    }
  }, [seller, open]);

  const fetchPurchaseHistory = async (resellerId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('sales')
      .select(`
        id,
        sale_date,
        total_amount,
        payment_status,
        reseller_price,
        product:products(name)
      `)
      .eq('seller_id', resellerId)
      .order('sale_date', { ascending: false })
      .limit(50);

    if (data) {
      setPurchases(data.map(s => ({
        id: s.id,
        sale_date: s.sale_date,
        total_amount: Number(s.total_amount),
        payment_status: s.payment_status,
        reseller_price: Number(s.reseller_price) || 0,
        product_name: (s.product as { name: string } | null)?.name || 'Producto eliminado',
      })));
    }
    setLoading(false);
  };

  if (!seller) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">{seller.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={seller.status === 'activo' ? 'default' : 'secondary'}>
                  {seller.status}
                </Badge>
                {seller.type && (
                  <Badge variant="outline">
                    {RESELLER_TYPE_LABELS[seller.type]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {seller.contact && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
              <Phone className="w-4 h-4" /> {seller.contact}
            </p>
          )}
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Financial Summary */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Resumen Financiero
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold">
                    ${(seller.totalPurchased || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total comprado</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                  <p className="text-xl font-bold text-emerald-600">
                    ${(seller.totalPaid || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Pagado</p>
                </CardContent>
              </Card>
              
              <Card className={(seller.pendingBalance || 0) > 0 ? 'border-amber-500/50' : ''}>
                <CardContent className="p-4 text-center">
                  <Clock className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                  <p className={`text-xl font-bold ${(seller.pendingBalance || 0) > 0 ? 'text-amber-600' : ''}`}>
                    ${(seller.pendingBalance || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Pendiente</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Purchase History */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Historial de Compras
            </h3>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando...
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Sin compras registradas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {purchases.map((purchase) => (
                  <div 
                    key={purchase.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{purchase.product_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(purchase.sale_date), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  <div className="text-right">
                      <p className="font-bold">${purchase.total_amount.toLocaleString()}</p>
                      <Badge 
                        variant={purchase.payment_status === 'pagado' ? 'default' : 'secondary'}
                        className={
                          purchase.payment_status === 'pagado' 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-xs' 
                            : 'bg-amber-500 hover:bg-amber-600 text-xs'
                        }
                      >
                        {purchase.payment_status === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {seller.notes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Notas
              </h3>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {seller.notes}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
