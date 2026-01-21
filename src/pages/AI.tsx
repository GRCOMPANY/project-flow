import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useCreatives } from '@/hooks/useCreatives';
import { useSmartCatalog } from '@/hooks/useSmartCatalog';
import { useBusinessSummary } from '@/hooks/useBusinessSummary';
import { 
  Sparkles, 
  FileText, 
  Image, 
  Video, 
  Mic, 
  Zap, 
  Clock, 
  TrendingUp,
  Package,
  DollarSign,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

const AI_CAPABILITIES = [
  {
    icon: FileText,
    title: 'IA de Texto',
    description: 'Copy publicitario, descripciones de producto y guiones para videos.',
    status: 'soon' as const,
  },
  {
    icon: Image,
    title: 'IA de Imagen',
    description: 'Genera imágenes publicitarias profesionales para tus productos.',
    status: 'soon' as const,
  },
  {
    icon: Video,
    title: 'IA de Video',
    description: 'Crea guiones y estructura para Reels, TikToks y videos cortos.',
    status: 'planned' as const,
  },
  {
    icon: Mic,
    title: 'IA de Audio',
    description: 'Genera locuciones para tus videos publicitarios.',
    status: 'planned' as const,
  },
  {
    icon: Zap,
    title: 'Automatizaciones',
    description: 'Conecta con n8n para automatizar tareas repetitivas.',
    status: 'planned' as const,
  },
];

export default function AI() {
  const { products } = useProducts();
  const { sales } = useSales();
  const { creatives } = useCreatives();
  const smartProducts = useSmartCatalog({ products, sales, creatives });
  const summary = useBusinessSummary({ sales, products, creatives });

  // Generate AI-powered recommendations (rule-based, no external API)
  const generateRecommendations = () => {
    const recommendations: { title: string; description: string; icon: React.ReactNode; priority: 'high' | 'medium' | 'low' }[] = [];

    // Priority 1: Pending payments
    if (summary.pendingCollections > 0) {
      recommendations.push({
        title: `Cobra $${summary.pendingCollectionAmount.toLocaleString()}`,
        description: `Tienes ${summary.pendingCollections} pago${summary.pendingCollections > 1 ? 's' : ''} pendiente${summary.pendingCollections > 1 ? 's' : ''}. Prioriza el flujo de caja.`,
        icon: <DollarSign className="w-5 h-5" />,
        priority: 'high',
      });
    }

    // Priority 2: Featured products without creatives
    const featuredNoCreatives = smartProducts.filter(p => p.isFeatured && p.creativesCount === 0);
    if (featuredNoCreatives.length > 0) {
      recommendations.push({
        title: `Crea creativos para ${featuredNoCreatives[0].name}`,
        description: 'Producto destacado sin contenido publicitario. Alto impacto potencial.',
        icon: <Image className="w-5 h-5" />,
        priority: 'high',
      });
    }

    // Priority 3: High margin products without promotion
    const highMarginNoPromo = smartProducts.find(p => p.marginPercent > 40 && p.creativesCount === 0 && p.status === 'activo');
    if (highMarginNoPromo) {
      recommendations.push({
        title: `Promociona "${highMarginNoPromo.name}"`,
        description: `${highMarginNoPromo.marginPercent.toFixed(0)}% de margen. Gran oportunidad de rentabilidad.`,
        icon: <TrendingUp className="w-5 h-5" />,
        priority: 'medium',
      });
    }

    // Priority 4: Products without recent sales
    const noSales = smartProducts.filter(p => p.status === 'activo' && p.salesLast30Days === 0);
    if (noSales.length > 0) {
      recommendations.push({
        title: `Revisa ${noSales.length} producto${noSales.length > 1 ? 's' : ''} sin ventas`,
        description: 'Sin ventas en 30 días. Considera ajustar precios o crear nuevo contenido.',
        icon: <Package className="w-5 h-5" />,
        priority: 'medium',
      });
    }

    // Priority 5: Creatives pending
    if (summary.creativesPending > 0) {
      recommendations.push({
        title: `Publica ${summary.creativesPending} creativo${summary.creativesPending > 1 ? 's' : ''}`,
        description: 'Tienes contenido listo para publicar. No lo dejes esperando.',
        icon: <Sparkles className="w-5 h-5" />,
        priority: 'low',
      });
    }

    return recommendations.slice(0, 3);
  };

  const recommendations = generateRecommendations();

  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full grc-gradient mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            Centro de IA
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Decisiones inteligentes basadas en tus datos
          </p>
        </header>

        {/* AI Recommendations (MVP - No external APIs) */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              Recomendaciones del Día
            </h2>
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <Card key={index} className={`
                  ${rec.priority === 'high' ? 'border-l-4 border-l-destructive' : ''}
                  ${rec.priority === 'medium' ? 'border-l-4 border-l-warning' : ''}
                  ${rec.priority === 'low' ? 'border-l-4 border-l-success' : ''}
                `}>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      {rec.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{rec.title}</h3>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Sparkles className="w-12 h-12 mx-auto text-success mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  ¡Todo en orden!
                </h3>
                <p className="text-muted-foreground">
                  No hay recomendaciones urgentes. El negocio va bien.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* AI Capabilities */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold text-foreground">
              Capacidades de IA
            </h2>
          </div>

          <div className="grid gap-4">
            {AI_CAPABILITIES.map((capability) => (
              <Card key={capability.title} className="overflow-hidden">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <capability.icon className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{capability.title}</h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          capability.status === 'soon' 
                            ? 'border-warning text-warning' 
                            : 'border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {capability.status === 'soon' ? 'Próximamente' : 'En planificación'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{capability.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Future Integrations */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Preparando el Futuro
            </CardTitle>
            <CardDescription>
              Tecnologías que se integrarán próximamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-foreground font-medium">Gemini / OpenAI</span>
              <span className="text-muted-foreground">— Generación de contenido con IA</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-foreground font-medium">n8n</span>
              <span className="text-muted-foreground">— Automatización de flujos de trabajo</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-foreground font-medium">Shopify</span>
              <span className="text-muted-foreground">— Sincronización de productos y ventas</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-foreground font-medium">WhatsApp Business</span>
              <span className="text-muted-foreground">— Mensajería automatizada</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
