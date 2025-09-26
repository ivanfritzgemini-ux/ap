
SELECT 
    estudiante_id,
    fecha_matricula,
    curso_id,
    es_matricula_actual
FROM estudiantes_detalles 
WHERE fecha_matricula >= '2025-08-01'::timestamp 
  AND fecha_matricula < '2025-09-01'::timestamp
ORDER BY fecha_matricula;
