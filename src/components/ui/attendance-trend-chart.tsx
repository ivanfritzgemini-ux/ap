import React from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface AttendanceTrendProps {
  data?: Array<{
    mes: string;
    asistencia: number;
    meta: number;
  }>;
  height?: number;
}

export function AttendanceTrendChart({ 
  data = [
    { mes: 'Mar', asistencia: 85, meta: 90 },
    { mes: 'Abr', asistencia: 88, meta: 90 },
    { mes: 'May', asistencia: 92, meta: 90 },
    { mes: 'Jun', asistencia: 87, meta: 90 },
    { mes: 'Jul', asistencia: 90, meta: 90 },
    { mes: 'Ago', asistencia: 93, meta: 90 },
    { mes: 'Sep', asistencia: 89, meta: 90 },
  ],
  height = 200
}: AttendanceTrendProps) {
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm p-3 rounded-lg border border-border/50 shadow-xl">
          <p className="font-medium">{`${label} 2025`}</p>
          <p className="text-sm text-blue-500">
            {`Asistencia: ${payload[0].value}%`}
          </p>
          <p className="text-sm text-muted-foreground">
            {`Meta: ${payload[1]?.value || 90}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <defs>
            {/* Gradiente principal */}
            <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.1} />
            </linearGradient>
            
            {/* Gradiente para la línea de meta */}
            <linearGradient id="metaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
            
            {/* Filtro de brillo */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <XAxis 
            dataKey="mes"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          
          <YAxis 
            domain={['dataMin - 5', 'dataMax + 5']}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `${value}%`}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Área de meta (referencia) */}
          <Area
            type="monotone"
            dataKey="meta"
            stroke="#10b981"
            strokeWidth={1}
            strokeDasharray="5 5"
            fill="url(#metaGradient)"
            fillOpacity={0.3}
          />
          
          {/* Área principal de asistencia */}
          <Area
            type="monotone"
            dataKey="asistencia"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#attendanceGradient)"
            filter="url(#glow)"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ 
              r: 6, 
              stroke: '#3b82f6', 
              strokeWidth: 2, 
              fill: '#ffffff',
              filter: 'url(#glow)'
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Leyenda moderna */}
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
          <span className="text-muted-foreground">Asistencia Real</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-1 border border-dashed border-green-500 rounded-sm"></div>
          <span className="text-muted-foreground">Meta (90%)</span>
        </div>
      </div>
    </div>
  );
}

// Componente para tarjeta con gráfico de tendencia
export function AttendanceTrendCard() {
  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-card to-card/80 border border-border/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-base">Tendencia de Asistencia</h3>
          <p className="text-sm text-muted-foreground">Evolución mensual del año escolar</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-500">93%</div>
          <div className="text-xs text-muted-foreground">Último mes</div>
        </div>
      </div>
      
      <AttendanceTrendChart height={180} />
      
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/30">
        <div className="text-center">
          <div className="text-sm font-semibold text-green-500">↗ +3%</div>
          <div className="text-xs text-muted-foreground">vs mes anterior</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-blue-500">89.7%</div>
          <div className="text-xs text-muted-foreground">Promedio anual</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-purple-500">5/7</div>
          <div className="text-xs text-muted-foreground">Meses {`>`} Meta</div>
        </div>
      </div>
    </div>
  );
}