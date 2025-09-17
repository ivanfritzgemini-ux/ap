"use client"

import { useEffect, useState } from 'react'
import { UserPlus, UserMinus } from 'lucide-react'

type Props = {
  month: string
}

export function MonthlyMovementsClient({ month }: Props) {
  const [ingresos, setIngresos] = useState<number | null>(null)
  const [retiros, setRetiros] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/dashboard/movements?month=${encodeURIComponent(month)}`)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const json = await res.json()
        if (!mounted) return
        setIngresos(typeof json.ingresos === 'number' ? json.ingresos : 0)
        setRetiros(typeof json.retiros === 'number' ? json.retiros : 0)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Error fetching movements')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchData()
    return () => { mounted = false }
  }, [month])

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg bg-green-900/50 p-4 flex items-center gap-4">
        <div className="p-3 rounded-full bg-green-500/20">
          <UserPlus className="h-6 w-6 text-green-400" />
        </div>
        <div>
          <p className="text-sm text-green-400">Nuevos Ingresos</p>
          <p className="text-2xl font-bold">{loading ? '...' : ingresos ?? '-'}</p>
        </div>
      </div>
      <div className="rounded-lg bg-red-900/50 p-4 flex items-center gap-4">
        <div className="p-3 rounded-full bg-red-500/20">
          <UserMinus className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <p className="text-sm text-red-400">Alumnos Retirados</p>
          <p className="text-2xl font-bold">{loading ? '...' : retiros ?? '-'}</p>
        </div>
      </div>
      {error && <div className="col-span-2 text-xs text-red-400">{error}</div>}
    </div>
  )
}
