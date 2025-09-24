"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useRouter } from 'next/navigation'
import GenderSparkline from './gender-sparkline'

type ApiResp = { women?: number; men?: number }
type HistoryResp = { data: { month: string; year: number; women: number; men: number }[] }

// Palette: Mujeres -> orange, Hombres -> blue (match site design)
const COLORS = ['#FF7A18', '#1E90FF']

export function GenderDonut() {
  const [counts, setCounts] = useState<{ women: number; men: number } | null>(null)
  const [history, setHistory] = useState<HistoryResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [resCounts, resHistory] = await Promise.all([
          fetch('/api/dashboard/gender'),
          fetch('/api/dashboard/gender/history'),
        ])
        const json: ApiResp = await resCounts.json()
        const hist: HistoryResp = await resHistory.json()
        if (!mounted) return
        setCounts({ women: json.women ?? 0, men: json.men ?? 0 })
        setHistory(hist)
      } catch (e) {
        if (!mounted) return
        setCounts({ women: 0, men: 0 })
        setHistory(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const total = (counts?.women ?? 0) + (counts?.men ?? 0)
  const data = [
    { name: 'Mujeres', value: counts?.women ?? 0 },
    { name: 'Hombres', value: counts?.men ?? 0 },
  ]

  const onClick = (sex: 'female' | 'male') => {
    router.push(`/dashboard/admin/students?sex=${sex}`)
  }

  const historyFor = useMemo(() => {
    if (!history) return { women: [], men: [] }
    const months = history.data.map((m) => m.month)
    return {
      women: history.data.map((m) => ({ month: m.month, value: m.women })),
      men: history.data.map((m) => ({ month: m.month, value: m.men })),
      months,
    }
  }, [history])

  // compute delta vs previous month for tooltip/enrichment
  const deltas = useMemo(() => {
    if (!history || !Array.isArray(history.data) || history.data.length < 2) return { women: 0, men: 0 }
    const len = history.data.length
    const prev = history.data[len - 2]
    const last = history.data[len - 1]
    return { women: (last.women ?? 0) - (prev.women ?? 0), men: (last.men ?? 0) - (prev.men ?? 0) }
  }, [history])

  if (loading || !counts) return <div>Loading...</div>

  const centerText = hovered
    ? (() => {
        if (hovered === 'Mujeres') {
          const n = counts!.women
          const pct = total ? ((n / total) * 100).toFixed(1) : '0.0'
          return `${n} — ${pct}%`
        }
        if (hovered === 'Hombres') {
          const n = counts!.men
          const pct = total ? ((n / total) * 100).toFixed(1) : '0.0'
          return `${n} — ${pct}%`
        }
        return `${total}`
      })()
    : `${total}`

  const CustomTooltip = ({ name }: { name: string }) => {
    if (!name || !counts) return null
    const value = name === 'Mujeres' ? counts.women : counts.men
    const pct = total ? ((value / total) * 100).toFixed(1) : '0.0'
    const delta = name === 'Mujeres' ? deltas.women : deltas.men
    const sign = delta > 0 ? `+${delta}` : `${delta}`
    return (
      <div className="rounded-md p-2 shadow-sm" style={{ fontSize: 12, minWidth: 180, background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="font-medium">{name}</div>
        <div style={{ fontSize: 12, color: '#ffb58a' }}>{value} ({pct}%) — <span style={{ color: '#FF7A18' }}>{sign}</span> vs mes anterior</div>
      </div>
    )
  }

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
              onMouseEnter={(_, index) => setHovered(data[index]?.name ?? null)}
              onMouseLeave={() => setHovered(null)}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} onClick={() => onClick(index === 0 ? 'female' : 'male')} className="cursor-pointer hover:opacity-80 transition-opacity" />
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
        <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors" onClick={() => onClick('female')}>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: COLORS[0] }} />
            <span className="text-sm font-medium">Mujeres</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">{counts.women}</div>
            <div className="text-xs text-muted-foreground">{total ? ((counts.women / total) * 100).toFixed(1) : '0.0'}%</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors" onClick={() => onClick('male')}>
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
