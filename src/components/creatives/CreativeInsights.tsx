import { Card, CardContent } from '@/components/ui/card';
import { CreativeInsights as InsightsType } from '@/hooks/useCreativeIntelligence';
import { HOOK_TYPE_LABELS, PERFORMANCE_CONFIG } from '@/hooks/useCreativeIntelligence';
import { Sparkles, TrendingUp, MessageSquare, Lightbulb } from 'lucide-react';

interface CreativeInsightsProps {
  insights: InsightsType;
}

const channelLabels: Record<string, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  web: 'Web',
};

export function CreativeInsightsPanel({ insights }: CreativeInsightsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Creatives */}
      <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {insights.totalCreatives}
              </p>
              <p className="text-xs text-muted-foreground">
                creativos totales
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hot Creatives */}
      <Card className="bg-gradient-to-br from-orange-500/10 to-card border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {insights.hotCreatives}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  ({insights.hotPercentage}%)
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                🔥 calientes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Hook */}
      <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <MessageSquare className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground truncate">
                {insights.topHookType 
                  ? HOOK_TYPE_LABELS[insights.topHookType]
                  : '—'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                hook más exitoso
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Channel */}
      <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Lightbulb className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {insights.topChannel 
                  ? channelLabels[insights.topChannel]
                  : '—'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                mejor canal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
