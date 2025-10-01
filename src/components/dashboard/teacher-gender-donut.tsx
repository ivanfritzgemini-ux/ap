'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

type ApiResp = { women?: number; men?: number }

// Palette: Mujeres -> orange, Hombres -> blue (match site design)
const COLORS = ['#FF7A18', '#1E90FF']

export function TeacherGenderDonut({ courseId }: { courseId: string }) {
  const [counts, setCounts] = useState<{ women: number; men: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!courseId) return;
      setLoading(true)
      try {
        const resCounts = await fetch(`/api/dashboard/teacher/gender?courseId=${courseId}`);
        const json: ApiResp = await resCounts.json()
        if (!mounted) return
        setCounts({ women: json.women ?? 0, men: json.men ?? 0 })
      } catch (e) {
        if (!mounted) return
        setCounts({ women: 0, men: 0 })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [courseId])

  const total = (counts?.women ?? 0) + (counts?.men ?? 0)
  const data = [
    { name: 'Mujeres', value: counts?.women ?? 0 },
    { name: 'Hombres', value: counts?.men ?? 0 },
  ]

  if (loading || !counts) return <div>Loading...</div>

  return (
    <div className="flex flex-col items-center space-y-4">
      <div style={{ width: 200, height: 200, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={6}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="cursor-pointer hover:opacity-80 transition-opacity" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* center text */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div className="text-center">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-xs text-muted-foreground">estudiantes</div>
            </div>
        </div>
      </div>

      {/* Legend simplificada */}
      <div className="flex flex-col space-y-2 w-full">
        <div className="flex items-center justify-between p-2 rounded-md transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: COLORS[0] }} />
            <span className="text-sm font-medium">Mujeres</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">{counts.women}</div>
            <div className="text-xs text-muted-foreground">{total ? ((counts.women / total) * 100).toFixed(1) : '0.0'}%</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-2 rounded-md transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: COLORS[1] }} />
            <span className="text-sm font-medium">Hombres</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">{counts.men}</div>
            <div className="text-xs text-muted-foreground">{total ? ((counts.men / total) * 100).toFixed(1) : '0.0'}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
