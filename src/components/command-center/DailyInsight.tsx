import { Lightbulb, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BusinessSummary, SmartTask } from '@/types';
import { SmartProduct } from '@/hooks/useSmartCatalog';

interface DailyInsightProps {
  summary: BusinessSummary;
  smartProducts: SmartProduct[];
  tasks: SmartTask[];
}

export function DailyInsight({ summary, smartProducts, tasks }: DailyInsightProps) {
  // Generate insights based on business data
  const generateInsights = (): string[] => {
    const insights: string[] = [];

    // Pending collections insight
    if (summary.pendingCollections > 0) {
      insights.push(
        `Tienes ${summary.pendingCollections} cobro${summary.pendingCollections > 1 ? 's' : ''} pendiente${summary.pendingCollections > 1 ? 's' : ''} por $${summary.pendingCollectionAmount.toLocaleString()}.`
      );
    }

    // Products needing attention
    const highPriorityProducts = smartProducts.filter(p => p.priorityScore === 'alta');
    if (highPriorityProducts.length > 0) {
      const productNames = highPriorityProducts.slice(0, 2).map(p => p.name).join(' y ');
      insights.push(
        `${highPriorityProducts.length} producto${highPriorityProducts.length > 1 ? 's necesitan' : ' necesita'} atención urgente: ${productNames}.`
      );
    }

    // Featured products without creatives
    const featuredWithoutCreatives = smartProducts.filter(
      p => p.isFeatured && p.creativesCount === 0
    );
    if (featuredWithoutCreatives.length > 0) {
      insights.push(
        `${featuredWithoutCreatives.length} producto${featuredWithoutCreatives.length > 1 ? 's destacados no tienen' : ' destacado no tiene'} creativos publicitarios.`
      );
    }

    // Sales performance
    if (summary.salesThisMonth > 0) {
      insights.push(
        `Este mes llevas ${summary.salesThisMonth} venta${summary.salesThisMonth > 1 ? 's' : ''} por $${summary.revenueThisMonth.toLocaleString()}.`
      );
    } else {
      insights.push('Aún no hay ventas registradas este mes.');
    }

    // Creative insights
    if (summary.creativesPending > 0) {
      insights.push(
        `Tienes ${summary.creativesPending} creativo${summary.creativesPending > 1 ? 's' : ''} pendiente${summary.creativesPending > 1 ? 's' : ''} de publicar.`
      );
    }

    return insights;
  };

  // Generate top recommendation
  const getTopRecommendation = (): { text: string; icon: React.ReactNode } | null => {
    // Priority 1: Pending payments
    if (summary.pendingCollections > 0) {
      return {
        text: `Cobra los $${summary.pendingCollectionAmount.toLocaleString()} pendientes para mejorar tu flujo de caja.`,
        icon: <AlertCircle className="w-5 h-5 text-warning" />,
      };
    }

    // Priority 2: Featured products without creatives
    const featuredNoCreative = smartProducts.find(p => p.isFeatured && p.creativesCount === 0);
    if (featuredNoCreative) {
      return {
        text: `Crea un creativo para "${featuredNoCreative.name}" — es producto destacado sin contenido.`,
        icon: <Sparkles className="w-5 h-5 text-primary" />,
      };
    }

    // Priority 3: High margin product without promotion
    const highMarginNoCreative = smartProducts.find(
      p => p.marginPercent > 40 && p.creativesCount === 0 && p.status === 'activo'
    );
    if (highMarginNoCreative) {
      return {
        text: `"${highMarginNoCreative.name}" tiene ${highMarginNoCreative.marginPercent.toFixed(0)}% de margen. Considera promocionarlo.`,
        icon: <TrendingUp className="w-5 h-5 text-success" />,
      };
    }

    // Priority 4: Products without sales
    const noSalesProduct = smartProducts.find(
      p => p.status === 'activo' && p.salesLast30Days === 0
    );
    if (noSalesProduct) {
      return {
        text: `"${noSalesProduct.name}" lleva 30 días sin ventas. Revisa el precio o crea contenido.`,
        icon: <Lightbulb className="w-5 h-5 text-warning" />,
      };
    }

    return null;
  };

  const insights = generateInsights();
  const topRecommendation = getTopRecommendation();

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-primary" />
          Resumen del Día
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Insights */}
        <div className="space-y-2">
          {insights.slice(0, 3).map((insight, index) => (
            <p key={index} className="text-sm text-muted-foreground">
              • {insight}
            </p>
          ))}
        </div>

        {/* Top Recommendation */}
        {topRecommendation && (
          <div className="mt-4 p-3 bg-background/80 rounded-lg border border-border/50">
            <div className="flex items-start gap-3">
              {topRecommendation.icon}
              <div>
                <p className="text-sm font-medium text-foreground">
                  Recomendación Principal
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {topRecommendation.text}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
