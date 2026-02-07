import { CreativeIntelligence } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  PERFORMANCE_CONFIG, 
  COMPARISON_CONFIG,
  HOOK_TYPE_LABELS,
} from '@/hooks/useCreativeIntelligence';
import {
  Image as ImageIcon,
  Video,
  FileText,
  Instagram,
  MessageCircle,
  Globe,
  Facebook,
  Eye,
  RotateCcw,
  TrendingUp,
  MessageSquare,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

const typeIcons = {
  imagen: ImageIcon,
  video: Video,
  copy: FileText,
};

const channelIcons = {
  instagram: Instagram,
  whatsapp: MessageCircle,
  tiktok: Video,
  facebook: Facebook,
  web: Globe,
};

const channelLabels = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  web: 'Web',
};

interface CreativeCardProps {
  creative: CreativeIntelligence;
  onView: (creative: CreativeIntelligence) => void;
  onRepeat?: (creative: CreativeIntelligence) => void;
  onScale?: (creative: CreativeIntelligence) => void;
  isAdmin?: boolean;
}

export function CreativeCard({ 
  creative, 
  onView, 
  onRepeat, 
  onScale,
  isAdmin = false,
}: CreativeCardProps) {
  const TypeIcon = typeIcons[creative.type] || FileText;
  const ChannelIcon = channelIcons[creative.channel] || Globe;
  const performance = PERFORMANCE_CONFIG[creative.calculatedPerformance];
  const comparison = creative.vsPrevious ? COMPARISON_CONFIG[creative.vsPrevious] : null;

  // Check if creative has media
  const hasMedia = creative.hasMedia || creative.imageUrl || creative.videoUrl;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-border/50 hover:border-primary/30">
      {/* Image/Preview Area */}
      <div className="relative aspect-video bg-muted">
        {creative.imageUrl ? (
          <img 
            src={creative.imageUrl} 
            alt={creative.title || 'Creative'} 
            className="w-full h-full object-cover"
          />
        ) : creative.videoUrl ? (
          <video 
            src={creative.videoUrl} 
            className="w-full h-full object-cover"
            muted
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}
        
        {/* No Media Warning Overlay */}
        {!hasMedia && (
          <div className="absolute inset-0 bg-warning/20 flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-2 bg-warning/90 rounded-lg text-warning-foreground">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Sin material visual</span>
            </div>
          </div>
        )}
        
        {/* Performance Badge - Top Left */}
        <div className="absolute top-3 left-3">
          <Badge 
            className={`
              ${creative.calculatedPerformance === 'caliente' 
                ? 'bg-orange-500/90 text-white border-orange-600' 
                : creative.calculatedPerformance === 'interesante'
                ? 'bg-amber-500/90 text-black border-amber-600'
                : 'bg-blue-500/90 text-white border-blue-600'
              }
              text-sm font-bold shadow-lg
            `}
          >
            {performance.emoji} {performance.label}
          </Badge>
        </div>

        {/* Channel Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md">
            <ChannelIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{channelLabels[creative.channel] || creative.channel}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-foreground mb-1 truncate">
          {creative.title || creative.product?.name || 'Sin título'}
        </h3>
        
        {/* Product reference */}
        {creative.product && (
          <p className="text-sm text-muted-foreground mb-2 truncate">
            📦 {creative.product.name}
          </p>
        )}

        {/* Hook Type */}
        {creative.hookType && (
          <Badge variant="outline" className="mb-3 text-xs">
            {HOOK_TYPE_LABELS[creative.hookType]}
          </Badge>
        )}

        {/* Metrics Row */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            <span className="font-medium">{creative.metricMessages || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">{creative.metricSales || 0} ventas</span>
          </div>
        </div>

        {/* Comparison with Previous */}
        {comparison && (
          <div className={`
            text-sm mb-3 p-2 rounded-md
            ${creative.vsPrevious === 'mejor' 
              ? 'bg-green-500/10 text-green-600' 
              : creative.vsPrevious === 'peor'
              ? 'bg-red-500/10 text-red-600'
              : 'bg-muted text-muted-foreground'
            }
          `}>
            <span className="font-medium">
              {comparison.emoji} {comparison.label} que anterior
            </span>
            {creative.messagesDelta !== undefined && creative.messagesDelta !== 0 && (
              <span className="ml-2 text-xs">
                ({creative.messagesDelta > 0 ? '+' : ''}{creative.messagesDelta} msgs)
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={() => onView(creative)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
