-- Función para obtener estudiantes con asistencia perfecta
-- Adaptada de la consulta proporcionada por el usuario

CREATE OR REPLACE FUNCTION get_estudiantes_asistencia_perfecta(
    mes_param INTEGER,
    año_param INTEGER,
    dia_inicio INTEGER DEFAULT 1
)
RETURNS TABLE(
    id INTEGER,
    nombres TEXT,
    apellidos TEXT,
    nombreCompleto TEXT,
    curso TEXT,
    curso_id INTEGER,
    diasPresente BIGINT,
    diasRegistrados BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    fecha_inicio DATE;
    fecha_fin DATE;
BEGIN
    -- Calcular fechas del período
    fecha_inicio := DATE_TRUNC('month', MAKE_DATE(año_param, mes_param, 1)) + INTERVAL '1 day' * (dia_inicio - 1);
    fecha_fin := (DATE_TRUNC('month', MAKE_DATE(año_param, mes_param + 1, 1)) - INTERVAL '1 day');

    RETURN QUERY
    WITH mes_habiles AS (
        SELECT generate_series(fecha_inicio, fecha_fin, interval '1 day') AS fecha
    ),
    mes_habiles_filtrados AS (
        SELECT fecha::date
        FROM mes_habiles
        WHERE extract(dow from fecha) BETWEEN 1 AND 5
    ),
    asistencias_por_estudiante AS (
        SELECT
            a.estudiante_id,
            a.curso_id,
            COUNT(*) FILTER (WHERE a.presente = TRUE) AS dias_asistidos,
            COUNT(mhf.fecha) AS dias_habiles_total
        FROM asistencia a
        CROSS JOIN mes_habiles_filtrados mhf
        WHERE a.fecha BETWEEN fecha_inicio AND fecha_fin
        GROUP BY a.estudiante_id, a.curso_id
        HAVING COUNT(*) FILTER (WHERE a.presente = TRUE) = COUNT(mhf.fecha)
    )
    SELECT
        ed.id,
        u.nombres,
        u.apellidos,
        (u.apellidos || ', ' || u.nombres) AS nombreCompleto,
        COALESCE(c.nombre_curso, c.nivel || c.letra) AS curso,
        ed.curso_id,
        ae.dias_asistidos,
        ae.dias_habiles_total
    FROM asistencias_por_estudiante ae
    JOIN estudiantes_detalles ed ON ed.estudiante_id = ae.estudiante_id
    JOIN usuarios u ON u.id = ae.estudiante_id
    LEFT JOIN cursos c ON c.id = ae.curso_id
    ORDER BY c.nombre_curso, u.apellidos, u.nombres;
END;
$$;