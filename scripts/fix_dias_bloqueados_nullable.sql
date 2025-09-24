-- Script para corregir la tabla dias_bloqueados
-- Permitir valores NULL en curso_id para bloqueos globales

-- Modificar la columna curso_id para permitir NULL
ALTER TABLE public.dias_bloqueados 
ALTER COLUMN curso_id DROP NOT NULL;

-- Agregar comentarios para documentar el comportamiento
COMMENT ON COLUMN public.dias_bloqueados.curso_id IS 'ID del curso específico afectado. NULL = todos los cursos';

-- Crear índice para mejorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_dias_bloqueados_curso_id ON public.dias_bloqueados(curso_id);

-- Verificar la estructura actualizada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'dias_bloqueados' 
AND table_schema = 'public'
ORDER BY ordinal_position;