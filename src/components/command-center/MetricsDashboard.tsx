import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, ShoppingCart, DollarSign, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SparklineData {
  label: string;
  values: number[];
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  currentValue: string;
  icon: React.ReactNode;
}

interface MetricsDashboardProps {
  salesData: SparklineData;
  profitData: SparklineData;
  conversionData?: SparklineData;
  className?: string;
}

function AreaSparkline({ values, trend }: { values: number[]; trend: 'up' | 'down' | 'stable' }) {
  const width = 120;
  const height = 48;
  const padding = 4;
  
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  
  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });
  
  // Create path for line
  const linePath = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, '');
  
  // Create path for area fill
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || width} ${height} L ${points[0]?.x || 0} ${height} Z`;

  const strokeColor = trend === 'up' 
    ? 'hsl(var(--success))' 
    : trend === 'down' 
      ? 'hsl(var(--destructive))' 
      : 'hsl(var(--muted-foreground))';

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop 
            offset="0%" 
            stopColor={trend === 'up' 
              ? 'hsl(var(--success))' 
              : trend === 'down' 
                ? 'hsl(var(--destructive))' 
                : 'hsl(var(--muted-foreground))'
            } 
            stopOpacity="0.3" 
          />
          <stop 
            offset="100%" 
            stopColor={trend === 'up' 
              ? 'hsl(var(--success))' 
              : trend === 'down' 
                ? 'hsl(var(--destructive))' 
                : 'hsl(var(--muted-foreground))'
            } 
            stopOpacity="0.05" 
          />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
      />
      
      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* End dot with glow */}
      <circle
        cx={points[points.length - 1]?.x || 0}
        cy={points[points.length - 1]?.y || 0}
        r={4}
        fill={strokeColor}
        className="drop-shadow-sm"
      />
      <circle
        cx={points[points.length - 1]?.x || 0}
        cy={points[points.length - 1]?.y || 0}
        r={8}
        fill={strokeColor}
        opacity={0.2}
      />
    </svg>
  );
}

function MetricCard({ data }: { data: SparklineData }) {
  const TrendIcon = data.trend === 'up' 
    ? TrendingUp 
    : data.trend === 'down' 
      ? TrendingDown 
      : Minus;

  const trendColor = data.trend === 'up' 
    ? 'text-success' 
    : data.trend === 'down' 
      ? 'text-destructive' 
      : 'text-muted-foreground';

  const trendBg = data.trend === 'up' 
    ? 'bg-success/10' 
    : data.trend === 'down' 
      ? 'bg-destructive/10' 
      : 'bg-muted/50';

  return (
    <div className="metric-card p-5 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-border transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
            {data.icon}
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {data.label}
          </span>
        </div>
        
        {/* Trend Badge */}
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
          trendBg,
          trendColor
        )}>
          <TrendIcon className="w-3 h-3" />
          <span>
            {data.trend === 'stable' ? '0%' : `${data.trend === 'up' ? '+' : '-'}${data.trendPercent}%`}
          </span>
        </div>
      </div>
      
      {/* Value + Chart */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {data.currentValue}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            últimos 7 días
          </p>
        </div>
        
        <AreaSparkline values={data.values} trend={data.trend} />
      </div>
    </div>
  );
}

export function MetricsDashboard({ salesData, profitData, conversionData, className }: MetricsDashboardProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Métricas 7 Días
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Metrics Grid */}
      <div className={cn(
        "grid gap-4",
        conversionData ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
      )}>
        <MetricCard data={salesData} />
        <MetricCard data={profitData} />
        {conversionData && <MetricCard data={conversionData} />}
      </div>
    </div>
  );
}

// Helper to calculate trend data from sales
export function calculateTrendData(
  sales: Array<{ saleDate: string; totalAmount: number; marginAtSale?: number; quantity: number; paymentStatus: string }>
): { salesData: SparklineData; profitData: SparklineData } {
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  // Sales per day
  const salesPerDay = last7Days.map(date =>
    sales.filter(s => s.saleDate.startsWith(date)).reduce((sum, s) => sum + s.quantity, 0)
  );

  // Profit per day (only paid)
  const profitPerDay = last7Days.map(date =>
    sales
      .filter(s => s.saleDate.startsWith(date) && s.paymentStatus === 'pagado')
      .reduce((sum, s) => sum + ((s.marginAtSale || 0) * s.quantity), 0)
  );

  // Calculate trends
  const calcTrend = (values: number[]): { trend: 'up' | 'down' | 'stable'; percent: number } => {
    const firstHalf = values.slice(0, 3).reduce((a, b) => a + b, 0);
    const secondHalf = values.slice(4).reduce((a, b) => a + b, 0);
    
    if (firstHalf === 0 && secondHalf === 0) {
      return { trend: 'stable', percent: 0 };
    }
    
    if (secondHalf > firstHalf) {
      const percent = Math.round(((secondHalf - firstHalf) / Math.max(firstHalf, 1)) * 100);
      return { trend: 'up', percent: Math.min(percent, 999) };
    }
    if (secondHalf < firstHalf) {
      const percent = Math.round(((firstHalf - secondHalf) / Math.max(firstHalf, 1)) * 100);
      return { trend: 'down', percent: Math.min(percent, 999) };
    }
    return { trend: 'stable', percent: 0 };
  };

  const salesTrend = calcTrend(salesPerDay);
  const profitTrend = calcTrend(profitPerDay);

  const totalSales = salesPerDay.reduce((a, b) => a + b, 0);
  const totalProfit = profitPerDay.reduce((a, b) => a + b, 0);

  return {
    salesData: {
      label: 'Ventas',
      values: salesPerDay,
      trend: salesTrend.trend,
      trendPercent: salesTrend.percent,
      currentValue: totalSales.toString(),
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    profitData: {
      label: 'Ganancia',
      values: profitPerDay,
      trend: profitTrend.trend,
      trendPercent: profitTrend.percent,
      currentValue: `$${totalProfit.toLocaleString()}`,
      icon: <DollarSign className="w-4 h-4" />,
    },
  };
}
