/**
 * ProductCreativesTab - Vista de creativos por producto
 * 
 * Muestra:
 * - Estadísticas del producto (creativos totales, calientes, hook top, canal top)
 * - Timeline de creativos ordenados por fecha
 * - Aprendizajes acumulados
 * - Botón para crear creativo con producto pre-llenado
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatives } from '@/hooks/useCreatives';
import { useCreativeIntelligence } from '@/hooks/useCreativeIntelligence';
import { Product, CreativeIntelligence, HookType, CreativeChannel } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Plus,
  Flame,
  Snowflake,
  MessageSquare,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Sparkles,
  Image,
  Video,
  FileText,
  Zap,
} from 'lucide-react';

interface ProductCreativesTabProps {
  product: Product;
  onCreateClick?: () => void;
}

// Hook type labels
const HOOK_TYPE_LABELS: Record<HookType, string> = {
  precio: 'Precio',
  problema: 'Problema',
  beneficio: 'Beneficio',
  urgencia: 'Urgencia',
  prueba_social: 'Prueba social',
  comparacion: 'Comparación',
};

// Channel labels
const CHANNEL_LABELS: Record<CreativeChannel, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  web: 'Web',
  marketplace: 'Marketplace',
};

export function ProductCreativesTab({ product, onCreateClick }: ProductCreativesTabProps) {
  const navigate = useNavigate();
  const { creatives } = useCreatives();
  const { enrichedCreatives } = useCreativeIntelligence(creatives);

  // Filter creatives for this product
  const productCreatives = useMemo(() => {
    return enrichedCreatives
      .filter(c => c.productId === product.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [enrichedCreatives, product.id]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = productCreatives.length;
    const hot = productCreatives.filter(c => c.calculatedPerformance === 'caliente').length;
    const interesting = productCreatives.filter(c => c.calculatedPerformance === 'interesante').length;
    const cold = productCreatives.filter(c => c.calculatedPerformance === 'frio').length;

    // Find top hook type
    const hookCounts: Record<string, number> = {};
    productCreatives.forEach(c => {
      if (c.hookType) {
        hookCounts[c.hookType] = (hookCounts[c.hookType] || 0) + 1;
      }
    });
    const topHook = Object.entries(hookCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as HookType | undefined;

    // Find top channel
    const channelCounts: Record<string, number> = {};
    productCreatives.forEach(c => {
      channelCounts[c.channel] = (channelCounts[c.channel] || 0) + 1;
    });
    const topChannel = Object.entries(channelCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as CreativeChannel | undefined;

    // Collect learnings
    const learnings = productCreatives
      .filter(c => c.learning && c.learning.trim())
      .map(c => c.learning!)
      .slice(0, 5);

    return { total, hot, interesting, cold, topHook, topChannel, learnings };
  }, [productCreatives]);

  const handleCreateClick = () => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      navigate(`/creatives?productId=${product.id}`);
    }
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'caliente': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'interesante': return <Zap className="w-4 h-4 text-amber-500" />;
      default: return <Snowflake className="w-4 h-4 text-blue-400" />;
    }
  };

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'caliente':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">🔥 Caliente</Badge>;
      case 'interesante':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">⚡ Interesante</Badge>;
      default:
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">❄️ Frío</Badge>;
    }
  };

  const getComparisonIcon = (comparison?: string) => {
    switch (comparison) {
      case 'mejor': return <TrendingUp className="w-3 h-3 text-success" />;
      case 'peor': return <TrendingDown className="w-3 h-3 text-destructive" />;
      default: return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'imagen': return <Image className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total creativos</div>
          </CardContent>
        </Card>
        <Card className={stats.hot > 0 ? 'border-orange-500/30' : ''}>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-orange-500">{stats.hot} 🔥</div>
            <div className="text-xs text-muted-foreground">Calientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-lg font-semibold text-foreground">
              {stats.topHook ? HOOK_TYPE_LABELS[stats.topHook] : '-'}
            </div>
            <div className="text-xs text-muted-foreground">Hook top</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-lg font-semibold text-foreground">
              {stats.topChannel ? CHANNEL_LABELS[stats.topChannel] : '-'}
            </div>
            <div className="text-xs text-muted-foreground">Canal top</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Button */}
      <Button onClick={handleCreateClick} className="w-full gap-2" size="lg">
        <Plus className="w-4 h-4" />
        Crear creativo para este producto
      </Button>

      {/* Learnings Section */}
      {stats.learnings.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              Aprendizajes Acumulados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats.learnings.map((learning, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>"{learning}"</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {productCreatives.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Timeline de Creativos
          </h4>
          
          <div className="space-y-3 border-l-2 border-border pl-4 ml-2">
            {productCreatives.map((creative, idx) => (
              <div 
                key={creative.id}
                className={cn(
                  "relative p-4 rounded-lg border bg-card cursor-pointer hover:border-primary/50 transition-colors",
                  creative.calculatedPerformance === 'caliente' && "border-orange-500/30",
                  creative.calculatedPerformance === 'interesante' && "border-amber-500/30"
                )}
                onClick={() => navigate('/creatives')}
              >
                {/* Timeline dot */}
                <div className={cn(
                  "absolute -left-[1.4rem] top-5 w-3 h-3 rounded-full border-2 bg-background",
                  creative.calculatedPerformance === 'caliente' && "border-orange-500",
                  creative.calculatedPerformance === 'interesante' && "border-amber-500",
                  creative.calculatedPerformance === 'frio' && "border-blue-400"
                )} />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(creative.type)}
                      <span className="font-medium text-sm truncate">
                        {creative.title || `Creativo ${idx + 1}`}
                      </span>
                      {getPerformanceBadge(creative.calculatedPerformance)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {creative.metricMessages || 0} msgs
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {creative.metricSales || 0} ventas
                      </span>
                      {creative.hookType && (
                        <Badge variant="outline" className="text-xs py-0">
                          {HOOK_TYPE_LABELS[creative.hookType]}
                        </Badge>
                      )}
                      {creative.vsPrevious && (
                        <span className="flex items-center gap-1">
                          {getComparisonIcon(creative.vsPrevious)}
                          vs anterior
                        </span>
                      )}
                    </div>
                  </div>

                  {creative.imageUrl && (
                    <img 
                      src={creative.imageUrl} 
                      alt="" 
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Sin creativos aún</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crea tu primer experimento creativo para este producto
            </p>
            <Button onClick={handleCreateClick} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Crear primer creativo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
