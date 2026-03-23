import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

interface RadialGaugeProps {
  value: number
  max?: number
  color?: string
  size?: number
  label?: string
  unit?: string
}

export function RadialGauge({ value, max = 100, color = '#3b82f6', size = 80, label, unit = '%' }: RadialGaugeProps) {
  const pct = Math.min((value / max) * 100, 100)
  const data = [{ value: pct, fill: color }]

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: size, height: size + 16 }}>
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={data}
            barSize={8}
          >
            <RadialBar dataKey="value" background={{ fill: 'rgba(255,255,255,0.06)' }} isAnimationActive={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{Math.round(pct)}{unit}</span>
        </div>
      </div>
      {label && <span className="text-xs text-text-tertiary text-center leading-tight">{label}</span>}
    </div>
  )
}
