"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface AttendanceStats {
  currentAverage: number
  previousAverage: number
  change: number
  totalStudents: number
  isSimulated: boolean
}

export function AttendanceStatsCard() {
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/attendance-stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching attendance stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Asistencia Promedio</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">...</div>
          <p className="text-xs text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    )
  }

  const getTrendIcon = () => {
    if (!stats) return <Minus className="h-3 w-3 text-muted-foreground" />
    
    if (stats.change > 0.5) {
      return <TrendingUp className="h-3 w-3 text-green-600" />
    } else if (stats.change < -0.5) {
      return <TrendingDown className="h-3 w-3 text-red-600" />
    } else {
      return <Minus className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getTrendColor = () => {
    if (!stats) return 'text-muted-foreground'
    
    if (stats.change > 0.5) return 'text-green-600'
    if (stats.change < -0.5) return 'text-red-600'
    return 'text-muted-foreground'
  }

  const getTrendText = () => {
    if (!stats) return 'Sin datos'
    
    if (Math.abs(stats.change) < 0.1) return 'Estable'
    
    const prefix = stats.change > 0 ? '+' : ''
    return `${prefix}${stats.change}% vs mes anterior`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Asistencia Promedio</CardTitle>
        <CheckCircle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats?.currentAverage ?? 0}%</div>
        <div className="flex items-center gap-1 mt-1">
          {getTrendIcon()}
          <span className={`text-xs ${getTrendColor()}`}>
            {getTrendText()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Basado en {stats?.totalStudents ?? 0} estudiantes
          {stats?.isSimulated && <span className="ml-1">(estimado)</span>}
        </p>
      </CardContent>
    </Card>
  )
}