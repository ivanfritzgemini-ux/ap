"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, TrendingUp, TrendingDown, Users } from 'lucide-react'

interface EnrollmentStats {
  totalMatricula: number
  totalUniqueStudents: number
  ingresos: number
  retiros: number
  year: number
}

export function EnrollmentStatsCard() {
  const [stats, setStats] = useState<EnrollmentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/enrollment-stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching enrollment stats:', error)
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
          <CardTitle className="text-sm font-medium">Matrícula Actual</CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">...</div>
          <p className="text-xs text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    )
  }

  const netChange = (stats?.ingresos ?? 0) - (stats?.retiros ?? 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Matrícula Actual</CardTitle>
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats?.totalMatricula ?? 0}</div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-green-600">+{stats?.ingresos ?? 0} nuevos</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <TrendingDown className="h-3 w-3 text-red-600" />
            <span className="text-red-600">{stats?.retiros ?? 0} retiros</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Total únicos: {stats?.totalUniqueStudents ?? 0} • 
          Activos: {stats?.totalMatricula ?? 0}
          {netChange !== 0 && (
            <span className={`ml-2 ${netChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({netChange > 0 ? '+' : ''}{netChange})
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  )
}