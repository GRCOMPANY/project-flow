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

interface TrendSparklinesProps {
  salesData: SparklineData;
  profitData: SparklineData;
  conversionData?: SparklineData;
  className?: string;
}

function Sparkline({ values, trend }: { values: number[]; trend: 'up' | 'down' | 'stable' }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  
  // Generate SVG path
  const width = 80;
  const height = 32;
  const padding = 2;
  
  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });
  
  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, '');

  const strokeColor = trend === 'up' 
    ? 'hsl(var(--success))' 
    : trend === 'down' 
      ? 'hsl(var(--destructive))' 
      : 'hsl(var(--muted-foreground))';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1]?.x || 0}
        cy={points[points.length - 1]?.y || 0}
        r={3}
        fill={strokeColor}
      />
    </svg>
  );
}

function SparklineCard({ data }: { data: SparklineData }) {
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

  return (
    <div className="sparkline-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
          {data.icon}
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {data.label}
        </span>
      </div>
      
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {data.currentValue}
          </p>
          <div className={cn("flex items-center gap-1 mt-1", trendColor)}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">
              {data.trend === 'stable' ? '0%' : `${data.trend === 'up' ? '+' : '-'}${data.trendPercent}%`}
            </span>
          </div>
        </div>
        
        <Sparkline values={data.values} trend={data.trend} />
      </div>
    </div>
  );
}

export function TrendSparklines({ salesData, profitData, conversionData, className }: TrendSparklinesProps) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-3 gap-3", className)}>
      <SparklineCard data={salesData} />
      <SparklineCard data={profitData} />
      {conversionData && (
        <div className="col-span-2 lg:col-span-1">
          <SparklineCard data={conversionData} />
        </div>
      )}
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
      label: 'Ventas 7d',
      values: salesPerDay,
      trend: salesTrend.trend,
      trendPercent: salesTrend.percent,
      currentValue: totalSales.toString(),
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    profitData: {
      label: 'Ganancia 7d',
      values: profitPerDay,
      trend: profitTrend.trend,
      trendPercent: profitTrend.percent,
      currentValue: `$${totalProfit.toLocaleString()}`,
      icon: <DollarSign className="w-4 h-4" />,
    },
  };
}
