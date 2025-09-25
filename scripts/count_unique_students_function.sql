-- Función para contar estudiantes únicos
-- Esta función debe ejecutarse en Supabase SQL Editor

CREATE OR REPLACE FUNCTION count_unique_students()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT estudiante_id) 
    FROM estudiantes_detalles
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;