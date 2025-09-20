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
    <div className="flex items-center gap-4" style={{ position: 'relative' }}>
      <div style={{ width: 180, height: 180, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={4}
              onMouseEnter={(_, index) => setHovered(data[index]?.name ?? null)}
              onMouseLeave={() => setHovered(null)}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} onClick={() => onClick(index === 0 ? 'female' : 'male')} />
              ))}
            </Pie>
            {/* Tooltip removed: rendering a compact hover box below the card for better readability */}
          </PieChart>
        </ResponsiveContainer>

        {/* center text */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div className="text-center">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-lg font-semibold">{centerText}</div>
            </div>
        </div>
      </div>

      {/* Hover box moved into the right column so it appears to the right of the donut */}
      <div style={{ height: 180, position: 'relative' }}>
        {hovered ? (
          <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 40 }}>
            <CustomTooltip name={hovered} />
          </div>
        ) : null}

        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 text-xs cursor-pointer" onClick={() => onClick('female')}>
              <span className="w-3 h-3 inline-block rounded-full" style={{ background: COLORS[0] }} />
              <span className="font-medium">{total ? ((counts.women / total) * 100).toFixed(1) : '0.0'}%</span>
              <span className="ml-2 font-semibold">Mujeres</span>
              <span className="ml-2 text-muted-foreground">{counts.women}</span>
            </div>
            <div className="mt-1">
              <GenderSparkline data={historyFor.women} color={COLORS[0]} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs cursor-pointer" onClick={() => onClick('male')}>
              <span className="w-3 h-3 inline-block rounded-full" style={{ background: COLORS[1] }} />
              <span className="font-medium">{total ? ((counts.men / total) * 100).toFixed(1) : '0.0'}%</span>
              <span className="ml-2 font-semibold">Hombres</span>
              <span className="ml-2 text-muted-foreground">{counts.men}</span>
            </div>
            <div className="mt-1">
              <GenderSparkline data={historyFor.men} color={COLORS[1]} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
