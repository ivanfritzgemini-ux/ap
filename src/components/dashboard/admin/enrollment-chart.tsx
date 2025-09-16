"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import React from 'react'

type MonthData = { month: string; enrollments: number }

export function EnrollmentChart({ data }: { data?: MonthData[] }) {
  // If no data provided, fall back to a small default to avoid crashes in client
  const defaultData: MonthData[] = [
    { month: "Ene", enrollments: 0 },
    { month: "Feb", enrollments: 0 },
    { month: "Mar", enrollments: 0 },
    { month: "Abr", enrollments: 0 },
    { month: "May", enrollments: 0 },
    { month: "Jun", enrollments: 0 },
    { month: "Jul", enrollments: 0 },
    { month: "Ago", enrollments: 0 },
    { month: "Sep", enrollments: 0 },
    { month: "Oct", enrollments: 0 },
    { month: "Nov", enrollments: 0 },
    { month: "Dic", enrollments: 0 },
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
        />
        <Tooltip
            cursor={{ fill: 'hsl(var(--secondary))' }}
            contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
            }}
        />
        <Bar dataKey="enrollments" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
