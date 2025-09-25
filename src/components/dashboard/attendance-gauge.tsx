import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AttendanceGaugeProps {
  percentage: number;
  size?: number;
}

export function AttendanceGauge({ percentage, size = 260 }: AttendanceGaugeProps) {
  // Datos para el gráfico semicircular
  const data = [
    { name: 'filled', value: percentage },
    { name: 'empty', value: 100 - percentage }
  ];

  // Colores basados en el porcentaje
  const getColor = (percentage: number) => {
    if (percentage >= 95) return '#22c55e'; // Verde brillante
    if (percentage >= 90) return '#84cc16'; // Verde lima
    if (percentage >= 85) return '#eab308'; // Amarillo
    if (percentage >= 80) return '#f97316'; // Naranja
    return '#ef4444'; // Rojo
  };

  const fillColor = getColor(percentage);
  const emptyColor = '#e5e7eb'; // Gris claro para la parte vacía

  return (
    <div className="relative flex flex-col items-center">
      {/* Contenedor del gráfico más grande */}
      <div className="relative" style={{ width: size + 40, height: (size + 40) * 0.65 }}>
        {/* Marcadores en el contorno exterior del gráfico */}
        <div className="absolute inset-0">
          {/* Calcular posiciones en el arco semicircular */}
          {[
            { percent: 0, angle: 180, label: '0%', color: 'text-gray-500' },
            { percent: 25, angle: 135, label: '25%', color: 'text-gray-400' },
            { percent: 50, angle: 90, label: '50%', color: 'text-gray-500' },
            { percent: 75, angle: 45, label: '75%', color: 'text-gray-400' },
            { percent: 85, angle: 27, label: '85%', color: 'text-amber-600', isMinimum: true },
            { percent: 100, angle: 0, label: '100%', color: 'text-gray-500' }
          ].map(({ percent, angle, label, color, isMinimum }) => {
            // Convertir ángulo a radianes
            const angleRad = (angle * Math.PI) / 180;
            // Radio del círculo exterior (un poco más grande que el gráfico)
            const radius = (size * 0.45) + 25;
            // Centro del gráfico
            const centerX = 20 + (size / 2);
            const centerY = 20 + (size * 0.85 * 0.6);
            
            // Calcular posición x, y
            const x = centerX + radius * Math.cos(angleRad);
            const y = centerY - radius * Math.sin(angleRad);
            
            return (
              <div
                key={percent}
                className={`absolute ${color} font-medium transform -translate-x-1/2 -translate-y-1/2`}
                style={{
                  left: x,
                  top: y,
                  fontSize: `${size * (isMinimum ? 0.050 : 0.046)}px`,
                  fontWeight: isMinimum ? 'bold' : 'normal'
                }}
              >
                {label}
                {isMinimum && (
                  <div 
                    className="text-amber-500 text-center"
                    style={{ fontSize: `${size * 0.036}px` }}
                  >
                    mín
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Gráfico */}
        <div className="absolute" style={{ top: 20, left: 20, width: size, height: size * 0.6 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="85%" // Posicionar más abajo para efecto semicircular
                startAngle={180} // Comenzar desde la izquierda
                endAngle={0} // Terminar en la derecha (semicírculo)
                innerRadius={size * 0.28} // Radio interno más grande
                outerRadius={size * 0.45} // Radio externo más grande
                paddingAngle={0}
                dataKey="value"
              >
                <Cell fill={fillColor} />
                <Cell fill={emptyColor} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Indicador central con el porcentaje - alineado con la base del gráfico */}
        <div 
          className="absolute flex flex-col items-center justify-center"
          style={{ 
            top: size * 0.4, 
            left: 20,
            width: size,
            height: size * 0.2,
          }}
        >
          <div className="text-center">
            <div 
              className="font-bold text-gray-900 dark:text-gray-100"
              style={{ fontSize: `${size * 0.11}px` }}
            >
              {percentage}%
            </div>
            <div 
              className="text-gray-500 dark:text-gray-400 font-medium"
              style={{ fontSize: `${size * 0.042}px`, marginTop: `${size * 0.01}px` }}
            >
              Asistencia Promedio
            </div>
          </div>
        </div>
      </div>
      
      {/* Indicador de estado - Subido 5px y agrandado 40% */}
      <div className="text-center" style={{ marginTop: `${(size * 0.015) - 5}px` }}>
        <div 
          className="inline-flex items-center rounded-full font-medium"
          style={{
            backgroundColor: `${fillColor}20`,
            color: fillColor,
            fontSize: `${size * 0.048 * 1.4}px`, // Agrandado 40%
            padding: `${size * 0.018 * 1.4}px ${size * 0.045 * 1.4}px` // Padding también agrandado 40%
          }}
        >
          {percentage >= 95 ? '🏆 Excelente' :
           percentage >= 90 ? '✅ Muy Bueno' :
           percentage >= 85 ? '⚡ Bueno' :
           percentage >= 80 ? '⚠️ Regular' :
           '🚨 Crítico'}
        </div>
      </div>
    </div>
  );
}