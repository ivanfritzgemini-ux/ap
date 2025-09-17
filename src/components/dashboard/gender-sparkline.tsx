"use client"

import React from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

export default function GenderSparkline({ data, color }: { data: { month: string; value: number }[]; color: string }) {
  return (
    <div style={{ width: 140, height: 60 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
