import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface MiniAreaChartProps {
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  color?: string
  height?: number
  showAxes?: boolean
  tooltipFormatter?: (value: number) => string
}

export function MiniAreaChart({
  data,
  xKey,
  yKey,
  color = '#3b82f6',
  height = 120,
  showAxes = true,
  tooltipFormatter,
}: MiniAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showAxes && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
        {showAxes && <XAxis dataKey={xKey} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />}
        {showAxes && <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} />}
        <Tooltip
          formatter={(value: number) =>
            tooltipFormatter ? [tooltipFormatter(value), yKey] : [value, yKey]
          }
          contentStyle={{
            background: 'rgba(15, 15, 24, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '11px',
          }}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${yKey})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
