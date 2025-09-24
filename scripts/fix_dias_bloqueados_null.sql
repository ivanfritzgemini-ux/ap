-- Modificar tabla dias_bloqueados para permitir curso_id NULL
-- Esto permite crear bloqueos globales (para todos los cursos)

-- Remover la restricción NOT NULL de curso_id
ALTER TABLE public.dias_bloqueados 
ALTER COLUMN curso_id DROP NOT NULL;

-- Agregar comentario para clarificar el comportamiento
COMMENT ON COLUMN public.dias_bloqueados.curso_id IS 'ID del curso específico afectado. Si es NULL, el bloqueo aplica a todos los cursos';

-- Crear índice para optimizar consultas con NULL
CREATE INDEX IF NOT EXISTS idx_dias_bloqueados_curso_id_null 
ON public.dias_bloqueados(curso_id) 
WHERE curso_id IS NULL;

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