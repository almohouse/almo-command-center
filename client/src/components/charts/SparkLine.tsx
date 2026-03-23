import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface SparkLineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
}

export function SparkLine({ data, color = '#3b82f6', height = 32, width }: SparkLineProps) {
  const chartData = data.map((value, i) => ({ i, value }))

  return (
    <ResponsiveContainer width={width ?? '100%'} height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
