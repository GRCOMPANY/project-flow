import { TrendingUp, TrendingDown, Minus, ShoppingCart, DollarSign, BarChart3, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SparklineData {
  label: string;
  values: number[];
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  currentValue: string;
  previousValue?: string;
  icon: React.ReactNode;
}

interface MetricsDashboardProps {
  salesData: SparklineData;
  profitData: SparklineData;
  marginData?: SparklineData;
  className?: string;
}

function AreaSparkline({ values, trend }: { values: number[]; trend: 'up' | 'down' | 'stable' }) {
  const width = 140;
  const height = 56;
  const padding = 6;
  
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  
  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });
  
  // Create smooth curve path
  const linePath = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (point.x - prev.x) / 3;
    const cpx2 = prev.x + 2 * (point.x - prev.x) / 3;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${point.y}, ${point.x} ${point.y}`;
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
            stopOpacity="0.35" 
          />
          <stop 
            offset="100%" 
            stopColor={trend === 'up' 
              ? 'hsl(var(--success))' 
              : trend === 'down' 
                ? 'hsl(var(--destructive))' 
                : 'hsl(var(--muted-foreground))'
            } 
            stopOpacity="0.02" 
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
      
      {/* End dot with glow effect */}
      <circle
        cx={points[points.length - 1]?.x || 0}
        cy={points[points.length - 1]?.y || 0}
        r={10}
        fill={strokeColor}
        opacity={0.15}
      />
      <circle
        cx={points[points.length - 1]?.x || 0}
        cy={points[points.length - 1]?.y || 0}
        r={5}
        fill={strokeColor}
        className="drop-shadow-sm"
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

  const trendBadgeClass = data.trend === 'up' 
    ? 'comparison-badge-up' 
    : data.trend === 'down' 
      ? 'comparison-badge-down' 
      : 'comparison-badge-stable';

  return (
    <div className="metric-card-premium p-5 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
            {data.icon}
          </div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {data.label}
          </span>
        </div>
      </div>
      
      {/* Value + Chart */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {data.currentValue}
          </p>
          
          {/* Trend Badge with Context */}
          <div className="flex flex-col gap-1">
            <div className={cn("comparison-badge", trendBadgeClass)}>
              <TrendIcon className="w-3 h-3" />
              <span>
                {data.trend === 'stable' ? '0%' : `${data.trend === 'up' ? '+' : ''}${data.trendPercent}%`}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground pl-0.5">
              vs semana anterior
            </span>
          </div>
        </div>
        
        <AreaSparkline values={data.values} trend={data.trend} />
      </div>
    </div>
  );
}

export function MetricsDashboard({ salesData, profitData, marginData, className }: MetricsDashboardProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center">
          <BarChart3 className="w-4.5 h-4.5 text-muted-foreground" />
        </div>
        <div>
          <span className="text-sm font-bold text-foreground uppercase tracking-wide">
            Métricas 7 Días
          </span>
          <p className="text-xs text-muted-foreground">
            Comparativa vs período anterior
          </p>
        </div>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Metrics Grid */}
      <div className={cn(
        "grid gap-4",
        marginData ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
      )}>
        <MetricCard data={salesData} />
        <MetricCard data={profitData} />
        {marginData && <MetricCard data={marginData} />}
      </div>
    </div>
  );
}

// Helper to calculate trend data from sales
export function calculateTrendData(
  sales: Array<{ saleDate: string; totalAmount: number; marginAtSale?: number; quantity: number; paymentStatus: string }>
): { salesData: SparklineData; profitData: SparklineData; marginData: SparklineData } {
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  // Previous 7 days for comparison
  const prev7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  // Sales per day
  const salesPerDay = last7Days.map(date =>
    sales.filter(s => s.saleDate.startsWith(date)).reduce((sum, s) => sum + s.quantity, 0)
  );

  const prevSalesPerDay = prev7Days.map(date =>
    sales.filter(s => s.saleDate.startsWith(date)).reduce((sum, s) => sum + s.quantity, 0)
  );

  // Profit per day (only paid)
  const profitPerDay = last7Days.map(date =>
    sales
      .filter(s => s.saleDate.startsWith(date) && s.paymentStatus === 'pagado')
      .reduce((sum, s) => sum + ((s.marginAtSale || 0) * s.quantity), 0)
  );

  const prevProfitPerDay = prev7Days.map(date =>
    sales
      .filter(s => s.saleDate.startsWith(date) && s.paymentStatus === 'pagado')
      .reduce((sum, s) => sum + ((s.marginAtSale || 0) * s.quantity), 0)
  );

  // Margin per day (average margin of paid sales)
  const marginPerDay = last7Days.map(date => {
    const daySales = sales.filter(s => s.saleDate.startsWith(date) && s.paymentStatus === 'pagado');
    if (daySales.length === 0) return 0;
    const totalMargin = daySales.reduce((sum, s) => sum + (s.marginAtSale || 0), 0);
    return totalMargin / daySales.length;
  });

  // Calculate trends (current week vs previous week)
  const calcTrend = (current: number[], previous: number[]): { trend: 'up' | 'down' | 'stable'; percent: number } => {
    const currentTotal = current.reduce((a, b) => a + b, 0);
    const previousTotal = previous.reduce((a, b) => a + b, 0);
    
    if (previousTotal === 0 && currentTotal === 0) {
      return { trend: 'stable', percent: 0 };
    }
    
    if (previousTotal === 0) {
      return { trend: 'up', percent: 100 };
    }

    const change = ((currentTotal - previousTotal) / previousTotal) * 100;
    
    if (Math.abs(change) < 2) {
      return { trend: 'stable', percent: 0 };
    }
    
    return {
      trend: change > 0 ? 'up' : 'down',
      percent: Math.abs(Math.round(change))
    };
  };

  const salesTrend = calcTrend(salesPerDay, prevSalesPerDay);
  const profitTrend = calcTrend(profitPerDay, prevProfitPerDay);

  const totalSales = salesPerDay.reduce((a, b) => a + b, 0);
  const totalProfit = profitPerDay.reduce((a, b) => a + b, 0);
  const avgMargin = marginPerDay.filter(m => m > 0).length > 0
    ? Math.round(marginPerDay.filter(m => m > 0).reduce((a, b) => a + b, 0) / marginPerDay.filter(m => m > 0).length)
    : 0;

  // Margin trend
  const prevMarginAvg = prev7Days.map(date => {
    const daySales = sales.filter(s => s.saleDate.startsWith(date) && s.paymentStatus === 'pagado');
    if (daySales.length === 0) return 0;
    return daySales.reduce((sum, s) => sum + (s.marginAtSale || 0), 0) / daySales.length;
  });
  
  const prevAvgMargin = prevMarginAvg.filter(m => m > 0).length > 0
    ? Math.round(prevMarginAvg.filter(m => m > 0).reduce((a, b) => a + b, 0) / prevMarginAvg.filter(m => m > 0).length)
    : 0;

  const marginTrend = avgMargin > prevAvgMargin 
    ? { trend: 'up' as const, percent: prevAvgMargin > 0 ? Math.round(((avgMargin - prevAvgMargin) / prevAvgMargin) * 100) : 0 }
    : avgMargin < prevAvgMargin
      ? { trend: 'down' as const, percent: prevAvgMargin > 0 ? Math.round(((prevAvgMargin - avgMargin) / prevAvgMargin) * 100) : 0 }
      : { trend: 'stable' as const, percent: 0 };

  return {
    salesData: {
      label: 'Ventas',
      values: salesPerDay,
      trend: salesTrend.trend,
      trendPercent: salesTrend.percent,
      currentValue: totalSales.toString(),
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    profitData: {
      label: 'Ganancia',
      values: profitPerDay,
      trend: profitTrend.trend,
      trendPercent: profitTrend.percent,
      currentValue: `$${totalProfit.toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5" />,
    },
    marginData: {
      label: 'Margen Prom.',
      values: marginPerDay,
      trend: marginTrend.trend,
      trendPercent: marginTrend.percent,
      currentValue: `${avgMargin}%`,
      icon: <Percent className="w-5 h-5" />,
    },
  };
}