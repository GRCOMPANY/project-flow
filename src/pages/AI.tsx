import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Mic,
  Zap,
  ArrowRight,
  Clock
} from 'lucide-react';

const AI_CAPABILITIES = [
  {
    icon: FileText,
    title: 'IA de Texto',
    description: 'Genera copy, guiones de venta, descripciones de productos y más',
    status: 'soon',
  },
  {
    icon: ImageIcon,
    title: 'IA de Imagen',
    description: 'Crea imágenes publicitarias profesionales para tus productos',
    status: 'soon',
  },
  {
    icon: Video,
    title: 'IA de Video',
    description: 'Genera guiones para Reels y TikToks que venden',
    status: 'soon',
  },
  {
    icon: Mic,
    title: 'IA de Audio',
    description: 'Locuciones profesionales para tus anuncios',
    status: 'planned',
  },
  {
    icon: Zap,
    title: 'Automatizaciones',
    description: 'Conecta con n8n para automatizar flujos de trabajo',
    status: 'planned',
  },
];

export default function AI() {
  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl grc-gradient mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Inteligencia Artificial
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            La IA no manda, la IA ejecuta. Herramientas inteligentes para potenciar tu negocio.
          </p>
        </header>

        <div className="space-y-4">
          {AI_CAPABILITIES.map((capability) => (
            <div 
              key={capability.title}
              className="grc-card p-6 flex items-center gap-4"
            >
              <div className="p-3 rounded-xl bg-secondary shrink-0">
                <capability.icon className="w-6 h-6 text-muted-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-0.5">
                  {capability.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {capability.description}
                </p>
              </div>
              
              <div className="shrink-0">
                {capability.status === 'soon' ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--grc-gold))] font-medium">
                    <Clock className="w-4 h-4" />
                    Próximamente
                  </span>
                ) : capability.status === 'planned' ? (
                  <span className="text-sm text-muted-foreground">
                    En planificación
                  </span>
                ) : (
                  <Button size="sm" className="gap-1.5">
                    Usar
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grc-card p-8 text-center bg-gradient-to-br from-card to-secondary">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            🚀 Preparando el futuro
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-4">
            Estamos construyendo capacidades de IA específicas para GRC IMPORTACIONES. 
            Pronto podrás generar creativos con un clic.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground">
              Gemini
            </span>
            <span className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground">
              n8n
            </span>
            <span className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground">
              Shopify
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
