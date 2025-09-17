"use client"

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MonthlyMovementsClient } from './monthly-movements-client'

const months = [
  { key: 'mar', label: 'Marzo' },
  { key: 'abr', label: 'Abril' },
  { key: 'may', label: 'Mayo' },
  { key: 'jun', label: 'Junio' },
  { key: 'jul', label: 'Julio' },
  { key: 'ago', label: 'Agosto' },
  { key: 'sep', label: 'Septiembre' },
  { key: 'oct', label: 'Octubre' },
  { key: 'nov', label: 'Noviembre' },
  { key: 'dic', label: 'Diciembre' },
]

function currentMonthKey() {
  const m = new Date().getMonth() // 0-11
  const map: Record<number, string> = {
    0: 'ene', 1: 'feb', 2: 'mar', 3: 'abr', 4: 'may', 5: 'jun', 6: 'jul', 7: 'ago', 8: 'sep', 9: 'oct', 10: 'nov', 11: 'dic'
  }
  return map[m]
}

export function MonthlyMovementsWrapper() {
  const defaultKey = currentMonthKey()
  const initial = months.find(m => m.key === defaultKey)?.key ?? months[0].key
  const [month, setMonth] = useState(initial)
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div />
        <Select value={month} onValueChange={(v) => setMonth(v)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Seleccione un mes" />
          </SelectTrigger>
          <SelectContent>
            {months.map(m => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <MonthlyMovementsClient month={month} />
    </div>
  )
}
