import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, ShoppingCart, DollarSign, BarChart3, Percent, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface SaleRecord {
  saleDate: string;
  totalAmount: number;
  marginAtSale?: number | null;
  marginPercentAtSale?: number | null;
  quantity: number;
  paymentStatus: string;
}

interface SparklineData {
  label: string;
  values: number[];
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  currentValue: string;
  icon: React.ReactNode;
}

interface MetricsDashboardProps {
  sales: SaleRecord[];
  className?: string;
}

function AreaSparkline({ values, trend }: { values: number[]; trend: 'up' | 'down' | 'stable' }) {
  const width = 160;
  const height = 64;
  const padding = 6;
  
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  
  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });
  
  const linePath = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (point.x - prev.x) / 3;
    const cpx2 = prev.x + 2 * (point.x - prev.x) / 3;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${point.y}, ${point.x} ${point.y}`;
  }, '');
  
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
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1]?.x || 0} cy={points[points.length - 1]?.y || 0} r={10} fill={strokeColor} opacity={0.15} />
      <circle cx={points[points.length - 1]?.x || 0} cy={points[points.length - 1]?.y || 0} r={5} fill={strokeColor} className="drop-shadow-sm" />
    </svg>
  );
}

function MetricCard({ data }: { data: SparklineData }) {
  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;

  const trendBadgeClass = data.trend === 'up' 
    ? 'comparison-badge-up' 
    : data.trend === 'down' 
      ? 'comparison-badge-down' 
      : 'comparison-badge-stable';

  return (
    <div className="metric-card-premium p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
            {data.icon}
          </div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.12em]">
            {data.label}
          </span>
        </div>
      </div>
      
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2.5">
          <p className="text-3xl md:text-4xl font-bold text-primary tracking-tight" style={{ fontFeatureSettings: "'tnum'" }}>
            {data.currentValue}
          </p>
          <div className="flex flex-col gap-1">
            <div className={cn("comparison-badge", trendBadgeClass)}>
              <TrendIcon className="w-3 h-3" />
              <span>
                {data.trend === 'stable' ? '0%' : `${data.trend === 'up' ? '+' : ''}${data.trendPercent}%`}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground pl-0.5">
              vs mes anterior
            </span>
          </div>
        </div>
        
        <AreaSparkline values={data.values} trend={data.trend} />
      </div>
    </div>
  );
}

function calcTrend(current: number, previous: number): { trend: 'up' | 'down' | 'stable'; percent: number } {
  if (previous === 0 && current === 0) return { trend: 'stable', percent: 0 };
  if (previous === 0) return { trend: 'up', percent: 100 };
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 2) return { trend: 'stable', percent: 0 };
  return { trend: change > 0 ? 'up' : 'down', percent: Math.abs(Math.round(change)) };
}

export function MetricsDashboard({ sales, className }: MetricsDashboardProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set(sales.map(s => new Date(s.saleDate).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [sales]);

  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };

  const goToCurrentMonth = () => { setSelectedMonth(now.getMonth()); setSelectedYear(now.getFullYear()); };

  const metricsData = useMemo(() => {
    const filterByMonth = (month: number, year: number) =>
      sales.filter(s => { const d = new Date(s.saleDate); return d.getMonth() === month && d.getFullYear() === year; });

    const currentSales = filterByMonth(selectedMonth, selectedYear);
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const previousSales = filterByMonth(prevMonth, prevYear);

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    const salesPerDay = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return currentSales.filter(s => new Date(s.saleDate).getDate() === day).reduce((sum, s) => sum + s.quantity, 0);
    });

    const profitPerDay = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return currentSales
        .filter(s => new Date(s.saleDate).getDate() === day && s.paymentStatus === 'pagado')
        .reduce((sum, s) => sum + ((s.marginAtSale || 0) * s.quantity), 0);
    });

    const marginPerDay = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const daySales = currentSales.filter(s => new Date(s.saleDate).getDate() === day && s.paymentStatus === 'pagado');
      if (daySales.length === 0) return 0;
      return daySales.reduce((sum, s) => sum + (s.marginAtSale || 0), 0) / daySales.length;
    });

    const totalSales = currentSales.reduce((sum, s) => sum + s.quantity, 0);
    const prevTotalSales = previousSales.reduce((sum, s) => sum + s.quantity, 0);

    const totalProfit = currentSales.filter(s => s.paymentStatus === 'pagado').reduce((sum, s) => sum + ((s.marginAtSale || 0) * s.quantity), 0);
    const prevTotalProfit = previousSales.filter(s => s.paymentStatus === 'pagado').reduce((sum, s) => sum + ((s.marginAtSale || 0) * s.quantity), 0);

    const paidCurrent = currentSales.filter(s => s.paymentStatus === 'pagado' && s.marginAtSale != null);
    const avgMargin = paidCurrent.length > 0 ? Math.round(paidCurrent.reduce((sum, s) => sum + (s.marginAtSale || 0), 0) / paidCurrent.length) : 0;
    const paidPrev = previousSales.filter(s => s.paymentStatus === 'pagado' && s.marginAtSale != null);
    const prevAvgMargin = paidPrev.length > 0 ? Math.round(paidPrev.reduce((sum, s) => sum + (s.marginAtSale || 0), 0) / paidPrev.length) : 0;

    const salesTrend = calcTrend(totalSales, prevTotalSales);
    const profitTrend = calcTrend(totalProfit, prevTotalProfit);
    const marginTrend = calcTrend(avgMargin, prevAvgMargin);

    return {
      salesData: {
        label: 'Ventas',
        values: salesPerDay,
        trend: salesTrend.trend,
        trendPercent: salesTrend.percent,
        currentValue: totalSales.toString(),
        icon: <ShoppingCart className="w-5 h-5" />,
      } as SparklineData,
      profitData: {
        label: 'Ganancia',
        values: profitPerDay,
        trend: profitTrend.trend,
        trendPercent: profitTrend.percent,
        currentValue: `$${totalProfit.toLocaleString()}`,
        icon: <DollarSign className="w-5 h-5" />,
      } as SparklineData,
      marginData: {
        label: 'Margen Prom.',
        values: marginPerDay,
        trend: marginTrend.trend,
        trendPercent: marginTrend.percent,
        currentValue: `${avgMargin}%`,
        icon: <Percent className="w-5 h-5" />,
      } as SparklineData,
    };
  }, [sales, selectedMonth, selectedYear]);

  return (
    <div className={cn("space-y-5", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center">
          <BarChart3 className="w-4.5 h-4.5 text-muted-foreground" />
        </div>
        <div>
          <span className="text-sm font-bold text-foreground uppercase tracking-wide">
            Métricas del Mes
          </span>
          <p className="text-xs text-muted-foreground">
            Comparativa vs mes anterior
          </p>
        </div>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="icon" onClick={goToPreviousMonth} title="Mes anterior">
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.map((name, i) => (
              <SelectItem key={i} value={String(i)}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!isCurrentMonth && (
          <Button variant="ghost" size="sm" onClick={goToCurrentMonth}>
            Mes actual
          </Button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <MetricCard data={metricsData.salesData} />
        <MetricCard data={metricsData.profitData} />
        <MetricCard data={metricsData.marginData} />
      </div>
    </div>
  );
}
