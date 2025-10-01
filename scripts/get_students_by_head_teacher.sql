CREATE OR REPLACE FUNCTION get_students_by_head_teacher(p_profesor_jefe_id UUID)
RETURNS TABLE(
  id UUID,
  nombre_completo TEXT,
  email TEXT,
  nro_registro TEXT,
  fecha_matricula DATE,
  fecha_retiro DATE
)
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, CONCAT(u.apellidos, ' ', u.nombres) AS nombre_completo, u.email::TEXT,
         ed.nro_registro, ed.fecha_matricula, ed.fecha_retiro
  FROM public.usuarios u
  JOIN public.estudiantes_detalles ed ON ed.estudiante_id = u.id
  JOIN public.cursos c ON ed.curso_id = c.id
  WHERE c.profesor_jefe_id = p_profesor_jefe_id
  ORDER BY u.apellidos, u.nombres;
END;
$$ LANGUAGE plpgsql;