"use client"

import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart, ComposedChart } from "recharts"

interface CourseData {
  curso: string
  estudiantes: number
  masculinos: number
  femeninos: number
  cursoId: number
}

export function StudentsByCourseChart() {
  const [data, setData] = useState<CourseData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/students-by-course')
        if (res.ok) {
          const courseData = await res.json()
          setData(courseData)
        }
      } catch (error) {
        console.error('Error fetching students by course:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-muted-foreground">Cargando datos...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-muted-foreground">No hay datos de cursos disponibles</div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis 
          dataKey="curso" 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
          label={{ value: 'Estudiantes', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--secondary))' }}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: any, name: string) => {
            if (name === 'Masculinos') return [value, 'Masculinos']
            if (name === 'Femeninos') return [value, 'Femeninas']
            if (name === 'Total') return [value, 'Total Estudiantes']
            return [value, 'Total']
          }}
          labelFormatter={(label) => `Curso: ${label}`}
        />
        <Bar 
          dataKey="masculinos" 
          stackId="gender"
          fill="#3b82f6" 
          radius={[0, 0, 0, 0]}
          name="Masculinos"
        />
        <Bar 
          dataKey="femeninos" 
          stackId="gender"
          fill="#ec4899" 
          radius={[4, 4, 0, 0]}
          name="Femeninos"
        />
        <Line 
          type="monotone" 
          dataKey="estudiantes" 
          stroke="#f59e0b" 
          strokeWidth={3}
          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
          name="Total"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}