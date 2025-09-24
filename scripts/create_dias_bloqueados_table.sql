-- Crear tabla para días bloqueados en el sistema de asistencia
-- Esta tabla almacena los días que están bloqueados para registrar asistencia

CREATE TABLE IF NOT EXISTS public.dias_bloqueados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cadena TEXT, -- Para identificar la cadena específica (opcional)
    nivel TEXT, -- Nivel específico (1, 2, 3, 4) o 'todos' para todos los niveles
    letra TEXT, -- Letra específica (A, B, C, etc.) o 'todas' para todas las letras
    fecha DATE NOT NULL, -- Fecha específica que se bloquea
    resolucion TEXT NOT NULL, -- Número de resolución que autoriza el cierre
    motivo TEXT NOT NULL, -- Motivo del bloqueo (feriado, suspensión de clases, etc.)
    activo BOOLEAN DEFAULT true, -- Si el bloqueo está activo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_dias_bloqueados_fecha ON public.dias_bloqueados(fecha);
CREATE INDEX IF NOT EXISTS idx_dias_bloqueados_nivel ON public.dias_bloqueados(nivel);
CREATE INDEX IF NOT EXISTS idx_dias_bloqueados_activo ON public.dias_bloqueados(activo);

-- Comentarios para documentación
COMMENT ON TABLE public.dias_bloqueados IS 'Tabla para gestionar días bloqueados en el registro de asistencia';
COMMENT ON COLUMN public.dias_bloqueados.cadena IS 'Cadena específica afectada (opcional)';
COMMENT ON COLUMN public.dias_bloqueados.nivel IS 'Nivel afectado: 1-4 o "todos"';
COMMENT ON COLUMN public.dias_bloqueados.letra IS 'Letra del curso afectada: A-Z o "todas"';
COMMENT ON COLUMN public.dias_bloqueados.fecha IS 'Fecha específica bloqueada';
COMMENT ON COLUMN public.dias_bloqueados.resolucion IS 'Número de resolución que autoriza';
COMMENT ON COLUMN public.dias_bloqueados.motivo IS 'Motivo del bloqueo';
COMMENT ON COLUMN public.dias_bloqueados.activo IS 'Si el bloqueo está vigente';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_dias_bloqueados_updated_at ON public.dias_bloqueados;
CREATE TRIGGER update_dias_bloqueados_updated_at 
    BEFORE UPDATE ON public.dias_bloqueados 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();