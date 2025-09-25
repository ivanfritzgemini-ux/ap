import React, { useEffect, useState } from 'react';

interface RadialProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  sublabel?: string;
  animated?: boolean;
}

export function RadialProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className = '',
  label,
  sublabel,
  animated = true
}: RadialProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedValue(value);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValue(value);
    }
  }, [value, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(animatedValue / max, 1);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage * circumference);

  // Colores dinámicos basados en el valor
  const getColor = (val: number) => {
    if (val >= 90) return { primary: '#10b981', secondary: '#10b98120' }; // Verde
    if (val >= 85) return { primary: '#f59e0b', secondary: '#f59e0b20' }; // Amarillo
    if (val >= 80) return { primary: '#f97316', secondary: '#f9731620' }; // Naranja
    return { primary: '#ef4444', secondary: '#ef444420' }; // Rojo
  };

  const colors = getColor(value);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Círculo de fondo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20 dark:text-muted/10"
        />
        
        {/* Gradiente para el progreso */}
        <defs>
          <linearGradient id={`gradient-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.8" />
          </linearGradient>
          
          {/* Filtro para glow effect */}
          <filter id={`glow-${value}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Círculo de progreso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#gradient-${value})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          filter={`url(#glow-${value})`}
          className="transition-all duration-1000 ease-out"
          style={{
            strokeDashoffset: animated ? strokeDashoffset : circumference - (percentage * circumference)
          }}
        />
        
        {/* Punto final brillante */}
        {percentage > 0 && (
          <circle
            cx={size / 2 + radius * Math.cos(2 * Math.PI * percentage - Math.PI / 2)}
            cy={size / 2 + radius * Math.sin(2 * Math.PI * percentage - Math.PI / 2)}
            r={strokeWidth / 2 + 1}
            fill={colors.primary}
            className="animate-pulse"
          />
        )}
      </svg>
      
      {/* Texto central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-2xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
          {Math.round(value)}%
        </div>
        {label && (
          <div className="text-xs font-medium text-muted-foreground mt-1">
            {label}
          </div>
        )}
        {sublabel && (
          <div className="text-xs text-muted-foreground/80">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para múltiples indicadores radiales
interface RadialGridProps {
  items: Array<{
    id: string;
    value: number;
    label: string;
    sublabel?: string;
  }>;
}

export function RadialGrid({ items }: RadialGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg"
        >
          <RadialProgress
            value={item.value}
            label={item.label}
            sublabel={item.sublabel}
            size={100}
            strokeWidth={6}
          />
        </div>
      ))}
    </div>
  );
}