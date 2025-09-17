"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import React from 'react'

type MonthData = { month: string; matriculas: number }

export function EnrollmentChart({ data }: { data?: MonthData[] }) {
  // If no data provided, fall back to a small default to avoid crashes in client
  const defaultData: MonthData[] = [
    { month: "Mar", matriculas: 0 },
    { month: "Abr", matriculas: 0 },
    { month: "May", matriculas: 0 },
    { month: "Jun", matriculas: 0 },
    { month: "Jul", matriculas: 0 },
    { month: "Ago", matriculas: 0 },
    { month: "Sep", matriculas: 0 },
    { month: "Oct", matriculas: 0 },
    { month: "Nov", matriculas: 0 },
    { month: "Dic", matriculas: 0 },
  ]

  const chartData = data && data.length ? data : defaultData

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis 
            dataKey="month" 
            stroke="#888888" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
        />
    <YAxis
      stroke="#888888"
      fontSize={12}
      tickLine={false}
      axisLine={false}
      tickFormatter={(value) => `${value}`}
      domain={[0, 'dataMax']}
      label={{ value: 'Matrículas', angle: -90, position: 'insideLeft', offset: -10 }}
    />
    <Tooltip
      cursor={{ fill: 'hsl(var(--secondary))' }}
      contentStyle={{
        backgroundColor: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))',
      }}
      formatter={(value: any) => [value, 'Matrículas']}
    />
        <Bar dataKey="matriculas" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
