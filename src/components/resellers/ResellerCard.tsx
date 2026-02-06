import { Seller, ResellerType } from '@/types';
import { RESELLER_TYPE_LABELS } from '@/hooks/useSellers';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Phone, 
  Edit2, 
  Trash2, 
  DollarSign, 
  Clock, 
  ShoppingCart,
  Eye 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ResellerCardProps {
  seller: Seller;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetail: () => void;
}

export function ResellerCard({ 
  seller, 
  isAdmin, 
  onEdit, 
  onDelete,
  onViewDetail 
}: ResellerCardProps) {
  const hasPendingBalance = (seller.pendingBalance || 0) > 0;
  
  return (
    <Card className={`hover:shadow-md transition-shadow ${hasPendingBalance ? 'border-amber-500/50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Main Info */}
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-foreground">{seller.name}</h3>
                <Badge variant={seller.status === 'activo' ? 'default' : 'secondary'}>
                  {seller.status}
                </Badge>
                {seller.type && seller.type !== 'revendedor' && (
                  <Badge variant="outline">
                    {RESELLER_TYPE_LABELS[seller.type]}
                  </Badge>
                )}
              </div>
              
              {/* Contact */}
              {seller.contact && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" /> {seller.contact}
                </p>
              )}
              
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <ShoppingCart className="w-3 h-3" />
                  </div>
                  <p className="text-lg font-bold">
                    ${(seller.totalPurchased || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total comprado</p>
                </div>
                
                <div className={`text-center p-3 rounded-lg ${
                  hasPendingBalance ? 'bg-amber-500/10' : 'bg-muted/50'
                }`}>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" />
                  </div>
                  <p className={`text-lg font-bold ${hasPendingBalance ? 'text-amber-600' : ''}`}>
                    ${(seller.pendingBalance || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Pendiente</p>
                </div>
                
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <DollarSign className="w-3 h-3" />
                  </div>
                  <p className="text-lg font-bold">
                    {seller.salesCount || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Ventas</p>
                </div>
              </div>
              
              {/* Last Sale */}
              {seller.lastSaleDate && (
                <p className="text-xs text-muted-foreground mt-3">
                  Última compra: {formatDistanceToNow(new Date(seller.lastSaleDate), { 
                    addSuffix: true, 
                    locale: es 
                  })}
                </p>
              )}
              
              {/* Notes */}
              {seller.notes && (
                <p className="text-sm text-muted-foreground mt-2 italic border-l-2 border-muted pl-2">
                  {seller.notes}
                </p>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={onViewDetail} className="gap-1">
              <Eye className="w-4 h-4" />
              Detalle
            </Button>
            
            {isAdmin && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
