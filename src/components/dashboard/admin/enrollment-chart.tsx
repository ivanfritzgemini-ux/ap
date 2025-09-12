"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { month: "Ene", enrollments: 186 },
  { month: "Feb", enrollments: 205 },
  { month: "Mar", enrollments: 287 },
  { month: "Abr", enrollments: 190 },
  { month: "May", enrollments: 220 },
  { month: "Jun", enrollments: 175 },
  { month: "Jul", enrollments: 90 },
  { month: "Ago", enrollments: 287 },
  { month: "Sep", enrollments: 240 },
  { month: "Oct", enrollments: 190 },
  { month: "Nov", enrollments: 220 },
  { month: "Dic", enrollments: 290 },
]

export function EnrollmentChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
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
            domain={[0, 300]}
            ticks={[0, 75, 150, 225, 300]}
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
