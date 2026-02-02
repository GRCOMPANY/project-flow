import { useMemo } from 'react';
import { 
  Creative, 
  CreativeIntelligence, 
  CreativePerformance, 
  ComparisonResult,
  HookType,
  CreativeChannel 
} from '@/types';

// Constants for performance calculation thresholds
const THRESHOLDS = {
  CALIENTE_SALES: 5,
  CALIENTE_MESSAGES: 30,
  INTERESANTE_SALES: 2,
  INTERESANTE_MESSAGES: 10,
};

// Labels for UI display
export const HOOK_TYPE_LABELS: Record<HookType, string> = {
  precio: '💰 Precio',
  problema: '😓 Problema',
  beneficio: '✨ Beneficio',
  urgencia: '⏰ Urgencia',
  prueba_social: '👥 Prueba Social',
  comparacion: '⚖️ Comparación',
};

export const TARGET_AUDIENCE_LABELS = {
  precio_bajo: '💸 Precio bajo / Impulso',
  precio_medio: '💵 Precio medio / Racional',
  regalo: '🎁 Regalo',
  uso_personal: '👤 Uso personal',
  reventa: '🔄 Reventa',
  otro: '📋 Otro',
};

export const MESSAGE_APPROACH_LABELS = {
  emocional: '❤️ Emocional',
  racional: '🧠 Racional',
  promocional: '📢 Promocional',
  educativo: '📚 Educativo',
};

export const ENGAGEMENT_LABELS = {
  bajo: '📉 Bajo',
  medio: '📊 Medio',
  alto: '📈 Alto',
};

export const PERFORMANCE_CONFIG: Record<CreativePerformance, { label: string; emoji: string; color: string }> = {
  frio: { label: 'Frío', emoji: '❄️', color: 'text-blue-500' },
  interesante: { label: 'Interesante', emoji: '🟡', color: 'text-yellow-500' },
  caliente: { label: 'Caliente', emoji: '🔥', color: 'text-orange-500' },
};

export const COMPARISON_CONFIG: Record<ComparisonResult, { label: string; emoji: string; color: string }> = {
  mejor: { label: 'Mejor', emoji: '↑', color: 'text-green-500' },
  peor: { label: 'Peor', emoji: '↓', color: 'text-red-500' },
  igual: { label: 'Igual', emoji: '→', color: 'text-muted-foreground' },
};

// Calculate automatic performance based on metrics
export function calculatePerformance(creative: Creative): CreativePerformance {
  const { 
    metricMessages = 0, 
    metricSales = 0, 
    engagementLevel,
    vsPrevious 
  } = creative;

  // Priority 1: Direct sales
  if (metricSales >= THRESHOLDS.CALIENTE_SALES) return 'caliente';
  if (metricSales >= THRESHOLDS.INTERESANTE_SALES) return 'interesante';
  
  // Priority 2: Messages received
  if (metricMessages >= THRESHOLDS.CALIENTE_MESSAGES) return 'caliente';
  if (metricMessages >= THRESHOLDS.INTERESANTE_MESSAGES) return 'interesante';
  
  // Priority 3: Perceived engagement
  if (engagementLevel === 'alto') return 'caliente';
  if (engagementLevel === 'medio') return 'interesante';
  
  // Priority 4: Comparison with previous
  if (vsPrevious === 'mejor') return 'interesante';
  
  return 'frio';
}

// Compare two creatives and determine result
export function compareCreatives(
  current: Creative, 
  previous: Creative | null
): { result: ComparisonResult; whatChanged: string[] } {
  if (!previous) {
    return { result: 'igual', whatChanged: [] };
  }

  const changes: string[] = [];
  
  // Detect what changed
  if (current.hookType !== previous.hookType) {
    changes.push(`Hook: ${previous.hookType || 'ninguno'} → ${current.hookType || 'ninguno'}`);
  }
  if (current.type !== previous.type) {
    changes.push(`Formato: ${previous.type} → ${current.type}`);
  }
  if (current.targetAudience !== previous.targetAudience) {
    changes.push(`Público: ${previous.targetAudience || 'ninguno'} → ${current.targetAudience || 'ninguno'}`);
  }
  if (current.messageApproach !== previous.messageApproach) {
    changes.push(`Enfoque: ${previous.messageApproach || 'ninguno'} → ${current.messageApproach || 'ninguno'}`);
  }

  // Calculate performance delta
  const currentScore = (current.metricSales || 0) * 10 + (current.metricMessages || 0);
  const previousScore = (previous.metricSales || 0) * 10 + (previous.metricMessages || 0);
  
  let result: ComparisonResult;
  if (currentScore > previousScore * 1.2) {
    result = 'mejor';
  } else if (currentScore < previousScore * 0.8) {
    result = 'peor';
  } else {
    result = 'igual';
  }

  return { result, whatChanged: changes };
}

// Find previous creative for same product and channel
export function findPreviousCreative(
  creatives: Creative[],
  currentId: string,
  productId: string | undefined,
  channel: CreativeChannel
): Creative | null {
  if (!productId) return null;
  
  const sorted = creatives
    .filter(c => 
      c.id !== currentId && 
      c.productId === productId && 
      c.channel === channel
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return sorted[0] || null;
}

// Detect patterns across all creatives
export interface CreativeInsights {
  totalCreatives: number;
  hotCreatives: number;
  hotPercentage: number;
  topHookType: HookType | null;
  topChannel: CreativeChannel | null;
  topAudience: string | null;
  learnings: string[];
}

export function detectPatterns(creatives: Creative[]): CreativeInsights {
  if (creatives.length === 0) {
    return {
      totalCreatives: 0,
      hotCreatives: 0,
      hotPercentage: 0,
      topHookType: null,
      topChannel: null,
      topAudience: null,
      learnings: [],
    };
  }

  // Count hot creatives
  const enriched = creatives.map(c => ({
    ...c,
    performance: calculatePerformance(c),
  }));
  
  const hotCreatives = enriched.filter(c => c.performance === 'caliente');
  
  // Find top hook type
  const hookCounts = new Map<HookType, number>();
  hotCreatives.forEach(c => {
    if (c.hookType) {
      hookCounts.set(c.hookType, (hookCounts.get(c.hookType) || 0) + 1);
    }
  });
  
  let topHookType: HookType | null = null;
  let maxHookCount = 0;
  hookCounts.forEach((count, hook) => {
    if (count > maxHookCount) {
      maxHookCount = count;
      topHookType = hook;
    }
  });

  // Find top channel
  const channelCounts = new Map<CreativeChannel, number>();
  hotCreatives.forEach(c => {
    channelCounts.set(c.channel, (channelCounts.get(c.channel) || 0) + 1);
  });
  
  let topChannel: CreativeChannel | null = null;
  let maxChannelCount = 0;
  channelCounts.forEach((count, channel) => {
    if (count > maxChannelCount) {
      maxChannelCount = count;
      topChannel = channel;
    }
  });

  // Collect learnings
  const learnings = creatives
    .filter(c => c.learning && c.learning.trim().length > 0)
    .map(c => c.learning!)
    .slice(0, 5);

  return {
    totalCreatives: creatives.length,
    hotCreatives: hotCreatives.length,
    hotPercentage: Math.round((hotCreatives.length / creatives.length) * 100),
    topHookType,
    topChannel,
    topAudience: null, // Could be implemented similarly
    learnings,
  };
}

// Main hook
export function useCreativeIntelligence(creatives: Creative[]) {
  // Enrich creatives with calculated fields
  const enrichedCreatives = useMemo<CreativeIntelligence[]>(() => {
    return creatives.map(creative => {
      const previousCreative = findPreviousCreative(
        creatives,
        creative.id,
        creative.productId,
        creative.channel
      );
      
      const { result: vsPreviousResult, whatChanged } = compareCreatives(creative, previousCreative);
      
      return {
        ...creative,
        calculatedPerformance: calculatePerformance(creative),
        previousCreative: previousCreative || undefined,
        vsPrevious: previousCreative ? vsPreviousResult : undefined,
        whatChanged: whatChanged.length > 0 ? whatChanged.join('; ') : undefined,
        messagesDelta: previousCreative 
          ? (creative.metricMessages || 0) - (previousCreative.metricMessages || 0)
          : undefined,
        salesDelta: previousCreative
          ? (creative.metricSales || 0) - (previousCreative.metricSales || 0)
          : undefined,
      };
    });
  }, [creatives]);

  // Global insights
  const insights = useMemo(() => detectPatterns(creatives), [creatives]);

  // Group by product
  const byProduct = useMemo(() => {
    const grouped = new Map<string, CreativeIntelligence[]>();
    
    enrichedCreatives.forEach(c => {
      if (c.productId) {
        const existing = grouped.get(c.productId) || [];
        existing.push(c);
        grouped.set(c.productId, existing);
      }
    });
    
    return grouped;
  }, [enrichedCreatives]);

  // Filter functions
  const filterByPerformance = (performance: CreativePerformance) => 
    enrichedCreatives.filter(c => c.calculatedPerformance === performance);
  
  const filterByChannel = (channel: CreativeChannel) =>
    enrichedCreatives.filter(c => c.channel === channel);
  
  const filterByHookType = (hookType: HookType) =>
    enrichedCreatives.filter(c => c.hookType === hookType);

  return {
    enrichedCreatives,
    insights,
    byProduct,
    filterByPerformance,
    filterByChannel,
    filterByHookType,
  };
}
