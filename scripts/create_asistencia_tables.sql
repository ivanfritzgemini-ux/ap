-- ============================================================================
-- SCRIPT PARA CREAR TABLAS DEL SISTEMA DE ASISTENCIA
-- Fecha: 2025-09-22
-- Descripción: Crea todas las tablas necesarias para el módulo de asistencia
-- Esquema ajustado para la base de datos existente
-- ============================================================================

-- Verificar si las extensiones necesarias están habilitadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- VERIFICACIÓN DE TABLAS EXISTENTES
-- ============================================================================
-- Este script asume que ya existen:
-- - usuarios (tabla principal de usuarios)
-- - estudiantes_detalles (detalles de estudiantes)
-- - cursos (información de cursos)
-- - roles (roles del sistema)
-- - sexos (géneros)
-- - establecimientos (información del establecimiento)
-- - periodos_academicos (períodos académicos)

-- ============================================================================
-- 1. ACTUALIZAR TABLA PERÍODOS ACADÉMICOS (si necesita campos adicionales)
-- ============================================================================
-- Agregar campos si no existen
ALTER TABLE periodos_academicos 
ADD COLUMN IF NOT EXISTS fecha_corte_asistencia DATE,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Agregar constraints si no existen
DO $$
BEGIN
    -- Verificar y agregar constraint de fechas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ck_periodos_fechas' 
        AND table_name = 'periodos_academicos'
    ) THEN
        ALTER TABLE periodos_academicos 
        ADD CONSTRAINT ck_periodos_fechas CHECK (fecha_inicio < fecha_fin);
    END IF;
    
    -- Verificar y agregar constraint de fecha_corte
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ck_periodos_corte' 
        AND table_name = 'periodos_academicos'
    ) THEN
        ALTER TABLE periodos_academicos 
        ADD CONSTRAINT ck_periodos_corte CHECK (fecha_corte_asistencia IS NULL OR fecha_corte_asistencia >= fecha_fin);
    END IF;
END
$$;

-- ============================================================================
-- 2. TABLA DE FERIADOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS feriados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'feriado',
    descripcion TEXT,
    nacional BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT ck_feriados_tipo CHECK (tipo IN ('feriado', 'suspension_clases', 'vacaciones', 'otro'))
);

-- ============================================================================
-- 3. TABLA DE DÍAS BLOQUEADOS POR CURSO
-- ============================================================================
CREATE TABLE IF NOT EXISTS dias_bloqueados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id UUID NOT NULL,
    fecha DATE NOT NULL,
    resolucion VARCHAR(200) NOT NULL,
    motivo TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    -- Constraints
    CONSTRAINT uk_dias_bloqueados_curso_fecha UNIQUE(curso_id, fecha),
    
    -- Foreign Keys (ajustados a tu esquema)
    CONSTRAINT fk_dias_bloqueados_curso FOREIGN KEY (curso_id) 
        REFERENCES cursos(id) ON DELETE CASCADE,
    CONSTRAINT fk_dias_bloqueados_created_by FOREIGN KEY (created_by) 
        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ============================================================================
-- 4. TABLA PRINCIPAL DE ASISTENCIA
-- ============================================================================
CREATE TABLE IF NOT EXISTS asistencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estudiante_id UUID NOT NULL,
    curso_id UUID NOT NULL,
    fecha DATE NOT NULL,
    presente BOOLEAN NOT NULL DEFAULT false,
    justificado BOOLEAN DEFAULT false,
    tipo_ausencia VARCHAR(50) DEFAULT 'injustificada',
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT uk_asistencia_estudiante_fecha UNIQUE(estudiante_id, fecha),
    CONSTRAINT ck_asistencia_tipo CHECK (tipo_ausencia IN ('injustificada', 'justificada', 'medica', 'familiar', 'otro')),
    
    -- Foreign Keys (ajustados a tu esquema)
    CONSTRAINT fk_asistencia_estudiante FOREIGN KEY (estudiante_id) 
        REFERENCES estudiantes_detalles(id) ON DELETE CASCADE,
    CONSTRAINT fk_asistencia_curso FOREIGN KEY (curso_id) 
        REFERENCES cursos(id) ON DELETE CASCADE,
    CONSTRAINT fk_asistencia_created_by FOREIGN KEY (created_by) 
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_asistencia_updated_by FOREIGN KEY (updated_by) 
        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ============================================================================
-- 5. TABLA DE JUSTIFICACIONES
-- ============================================================================
CREATE TABLE IF NOT EXISTS justificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asistencia_id UUID NOT NULL,
    estudiante_id UUID NOT NULL,
    fecha_ausencia DATE NOT NULL,
    motivo TEXT NOT NULL,
    tipo_justificacion VARCHAR(50) NOT NULL DEFAULT 'medica',
    documento_adjunto TEXT, -- URL del documento
    aprobado BOOLEAN DEFAULT NULL, -- NULL = pendiente, true = aprobado, false = rechazado
    observaciones_aprobacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    approved_by UUID,
    
    -- Constraints
    CONSTRAINT ck_justificaciones_tipo CHECK (tipo_justificacion IN ('medica', 'familiar', 'academica', 'personal', 'otro')),
    
    -- Foreign Keys (ajustados a tu esquema)
    CONSTRAINT fk_justificaciones_asistencia FOREIGN KEY (asistencia_id) 
        REFERENCES asistencia(id) ON DELETE CASCADE,
    CONSTRAINT fk_justificaciones_estudiante FOREIGN KEY (estudiante_id) 
        REFERENCES estudiantes_detalles(id) ON DELETE CASCADE,
    CONSTRAINT fk_justificaciones_created_by FOREIGN KEY (created_by) 
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_justificaciones_approved_by FOREIGN KEY (approved_by) 
        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ============================================================================
-- 6. ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices para tabla asistencia
CREATE INDEX IF NOT EXISTS idx_asistencia_estudiante_fecha ON asistencia(estudiante_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_asistencia_curso_fecha ON asistencia(curso_id, fecha);
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha_presente ON asistencia(fecha, presente);

-- Índices para días bloqueados
CREATE INDEX IF NOT EXISTS idx_dias_bloqueados_fecha ON dias_bloqueados(fecha);
CREATE INDEX IF NOT EXISTS idx_dias_bloqueados_curso ON dias_bloqueados(curso_id);
CREATE INDEX IF NOT EXISTS idx_dias_bloqueados_activo ON dias_bloqueados(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_dias_bloqueados_curso_fecha_activo ON dias_bloqueados(curso_id, fecha, activo) WHERE activo = true;

-- Índices para feriados
CREATE INDEX IF NOT EXISTS idx_feriados_fecha ON feriados(fecha);
CREATE INDEX IF NOT EXISTS idx_feriados_tipo_activo ON feriados(tipo, activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_feriados_nacional_activo ON feriados(nacional, activo) WHERE activo = true;

-- Índices para períodos académicos
CREATE INDEX IF NOT EXISTS idx_periodos_activo ON periodos_academicos(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_periodos_fechas ON periodos_academicos(fecha_inicio, fecha_fin);

-- Índices para justificaciones
CREATE INDEX IF NOT EXISTS idx_justificaciones_estudiante ON justificaciones(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_justificaciones_fecha ON justificaciones(fecha_ausencia);
CREATE INDEX IF NOT EXISTS idx_justificaciones_aprobado ON justificaciones(aprobado);

-- ============================================================================
-- 7. TRIGGERS PARA TIMESTAMPS AUTOMÁTICOS
-- ============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para todas las tablas
CREATE TRIGGER update_periodos_academicos_updated_at 
    BEFORE UPDATE ON periodos_academicos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feriados_updated_at 
    BEFORE UPDATE ON feriados 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dias_bloqueados_updated_at 
    BEFORE UPDATE ON dias_bloqueados 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asistencia_updated_at 
    BEFORE UPDATE ON asistencia 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_justificaciones_updated_at 
    BEFORE UPDATE ON justificaciones 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. VISTA MATERIALIZADA PARA ESTADÍSTICAS
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS estadisticas_asistencia_mensual AS
SELECT 
    a.curso_id,
    a.estudiante_id,
    EXTRACT(YEAR FROM a.fecha) as año,
    EXTRACT(MONTH FROM a.fecha) as mes,
    COUNT(*) as total_registros_asistencia,
    COUNT(*) FILTER (WHERE a.presente = true) as total_presentes,
    COUNT(*) FILTER (WHERE a.presente = false) as total_ausentes,
    COUNT(*) FILTER (WHERE a.presente = false AND a.justificado = true) as ausentes_justificadas,
    COUNT(*) FILTER (WHERE a.presente = false AND a.justificado = false) as ausentes_injustificadas,
    ROUND(
        (COUNT(*) FILTER (WHERE a.presente = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) as porcentaje_asistencia,
    MIN(a.fecha) as primera_fecha,
    MAX(a.fecha) as ultima_fecha
FROM asistencia a
GROUP BY a.curso_id, a.estudiante_id, EXTRACT(YEAR FROM a.fecha), EXTRACT(MONTH FROM a.fecha);

-- Índices para la vista materializada
CREATE INDEX IF NOT EXISTS idx_estadisticas_curso_estudiante ON estadisticas_asistencia_mensual(curso_id, estudiante_id);
CREATE INDEX IF NOT EXISTS idx_estadisticas_año_mes ON estadisticas_asistencia_mensual(año, mes);

-- ============================================================================
-- 9. FUNCIONES ÚTILES
-- ============================================================================

-- Función para verificar si un día es hábil para un curso específico
CREATE OR REPLACE FUNCTION es_dia_habil_para_curso(
    p_fecha DATE,
    p_curso_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar si es fin de semana
    IF EXTRACT(DOW FROM p_fecha) IN (0, 6) THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar feriados generales
    IF EXISTS (
        SELECT 1 FROM feriados 
        WHERE fecha = p_fecha AND activo = true
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar bloqueos específicos del curso
    IF EXISTS (
        SELECT 1 FROM dias_bloqueados 
        WHERE fecha = p_fecha 
        AND curso_id = p_curso_id 
        AND activo = true
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener días hábiles en un rango para un curso
CREATE OR REPLACE FUNCTION obtener_dias_habiles_curso(
    p_curso_id UUID,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
) RETURNS TABLE(fecha DATE, es_habil BOOLEAN, motivo_no_habil TEXT) AS $$
BEGIN
    RETURN QUERY
    WITH fechas_serie AS (
        SELECT generate_series(p_fecha_inicio, p_fecha_fin, '1 day'::interval)::DATE as fecha
    ),
    dias_info AS (
        SELECT 
            fs.fecha,
            CASE 
                WHEN EXTRACT(DOW FROM fs.fecha) IN (0, 6) THEN FALSE
                WHEN f.fecha IS NOT NULL THEN FALSE
                WHEN db.fecha IS NOT NULL THEN FALSE
                ELSE TRUE
            END as es_habil,
            CASE 
                WHEN EXTRACT(DOW FROM fs.fecha) IN (0, 6) THEN 'Fin de semana'
                WHEN f.fecha IS NOT NULL THEN f.nombre
                WHEN db.fecha IS NOT NULL THEN db.motivo
                ELSE NULL
            END as motivo_no_habil
        FROM fechas_serie fs
        LEFT JOIN feriados f ON f.fecha = fs.fecha AND f.activo = true
        LEFT JOIN dias_bloqueados db ON db.fecha = fs.fecha AND db.curso_id = p_curso_id AND db.activo = true
    )
    SELECT * FROM dias_info ORDER BY dias_info.fecha;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. INSERTAR DATOS INICIALES
-- ============================================================================

-- Insertar período académico actual (ajustado a la estructura existente)
INSERT INTO periodos_academicos (nombre, fecha_inicio, fecha_fin, fecha_corte_asistencia) 
VALUES ('Segundo Semestre 2025', '2025-08-01', '2025-12-20', '2025-12-25')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar feriados chilenos 2025
INSERT INTO feriados (fecha, nombre, tipo, nacional) VALUES
('2025-01-01', 'Año Nuevo', 'feriado', true),
('2025-04-18', 'Viernes Santo', 'feriado', true),
('2025-04-19', 'Sábado Santo', 'feriado', true),
('2025-05-01', 'Día del Trabajador', 'feriado', true),
('2025-05-21', 'Día de las Glorias Navales', 'feriado', true),
('2025-06-29', 'San Pedro y San Pablo', 'feriado', true),
('2025-07-16', 'Día de la Virgen del Carmen', 'feriado', true),
('2025-08-15', 'Asunción de la Virgen', 'feriado', true),
('2025-09-18', 'Fiestas Patrias', 'feriado', true),
('2025-09-19', 'Glorias del Ejército', 'feriado', true),
('2025-10-12', 'Encuentro de Dos Mundos', 'feriado', true),
('2025-10-31', 'Día de las Iglesias Evangélicas', 'feriado', true),
('2025-11-01', 'Día de Todos los Santos', 'feriado', true),
('2025-12-08', 'Inmaculada Concepción', 'feriado', true),
('2025-12-25', 'Navidad', 'feriado', true)
ON CONFLICT (fecha) DO NOTHING;

-- ============================================================================
-- 11. CONFIGURACIÓN DE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en las tablas principales
ALTER TABLE asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_bloqueados ENABLE ROW LEVEL SECURITY;
ALTER TABLE justificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas para asistencia
CREATE POLICY "admin_asistencia_completa" ON asistencia
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            JOIN roles r ON u.rol_id = r.id
            WHERE u.id = auth.uid() 
            AND r.nombre_rol IN ('Administrador', 'Director')
        )
    );

CREATE POLICY "profesor_asistencia_curso" ON asistencia
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cursos c 
            WHERE c.id = asistencia.curso_id 
            AND c.profesor_jefe_id = auth.uid()
        )
    );

CREATE POLICY "estudiante_asistencia_propia" ON asistencia
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            JOIN roles r ON u.rol_id = r.id
            JOIN estudiantes_detalles ed ON ed.id = u.id
            WHERE u.id = auth.uid() 
            AND r.nombre_rol = 'Estudiante'
            AND ed.id = asistencia.estudiante_id
        )
    );

-- Políticas para días bloqueados
CREATE POLICY "admin_dias_bloqueados" ON dias_bloqueados
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            JOIN roles r ON u.rol_id = r.id
            WHERE u.id = auth.uid() 
            AND r.nombre_rol IN ('Administrador', 'Director')
        )
    );

CREATE POLICY "profesor_dias_bloqueados_curso" ON dias_bloqueados
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cursos c 
            WHERE c.id = dias_bloqueados.curso_id 
            AND c.profesor_jefe_id = auth.uid()
        )
    );

-- Políticas para justificaciones
CREATE POLICY "admin_justificaciones_completa" ON justificaciones
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            JOIN roles r ON u.rol_id = r.id
            WHERE u.id = auth.uid() 
            AND r.nombre_rol IN ('Administrador', 'Director')
        )
    );

CREATE POLICY "profesor_justificaciones_curso" ON justificaciones
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM asistencia a
            JOIN cursos c ON a.curso_id = c.id
            WHERE a.id = justificaciones.asistencia_id 
            AND c.profesor_jefe_id = auth.uid()
        )
    );

CREATE POLICY "estudiante_justificaciones_propias" ON justificaciones
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            JOIN roles r ON u.rol_id = r.id
            JOIN estudiantes_detalles ed ON ed.id = u.id
            WHERE u.id = auth.uid() 
            AND r.nombre_rol = 'Estudiante'
            AND ed.id = justificaciones.estudiante_id
        )
    );

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Refrescar la vista materializada inicial
REFRESH MATERIALIZED VIEW estadisticas_asistencia_mensual;

-- Mostrar resumen de tablas creadas
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SCRIPT COMPLETADO EXITOSAMENTE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Tablas creadas:';
    RAISE NOTICE '- periodos_academicos';
    RAISE NOTICE '- feriados';
    RAISE NOTICE '- dias_bloqueados';
    RAISE NOTICE '- asistencia';
    RAISE NOTICE '- justificaciones';
    RAISE NOTICE '- estadisticas_asistencia_mensual (vista materializada)';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Funciones creadas:';
    RAISE NOTICE '- es_dia_habil_para_curso()';
    RAISE NOTICE '- obtener_dias_habiles_curso()';
    RAISE NOTICE '- update_updated_at_column()';
    RAISE NOTICE '============================================================================';
END
$$;