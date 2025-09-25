// Documentación de las consultas SQL para movimientos del mes
// Implementadas en /api/dashboard/movements

/*
CONSULTAS IMPLEMENTADAS:

1. INGRESOS POR MES (ejemplo para marzo):
   SELECT COUNT(*) AS matriculados_marzo
   FROM estudiantes_detalles
   WHERE fecha_matricula BETWEEN '2025-03-01' AND '2025-03-31'
   
   ✅ Implementado con:
   - .gte('fecha_matricula', from) 
   - .lte('fecha_matricula', to)
   - Sin filtro por es_matricula_actual (cuenta TODAS las matriculaciones del mes)

2. RETIROS POR MES (ejemplo para marzo):
   SELECT COUNT(*) AS retirados_marzo
   FROM estudiantes_detalles
   WHERE fecha_retiro BETWEEN '2025-03-01' AND '2025-03-31'
     AND motivo_retiro <> 'Cambio de curso'
   
   ✅ Implementado con:
   - .gte('fecha_retiro', from)
   - .lte('fecha_retiro', to) 
   - .not('fecha_retiro', 'is', null)
   - .neq('motivo_retiro', 'Cambio de curso')

CAMBIOS REALIZADOS:
- ✅ Eliminado filtro es_matricula_actual=true para ingresos
- ✅ Agregado filtro para excluir motivo_retiro = 'Cambio de curso' 
- ✅ Cambiado de .lt() a .lte() para incluir el último día del mes
- ✅ Mejorado cálculo del rango de fechas para ser más preciso

RESULTADO:
- Ingresos = Todas las matriculaciones en el mes seleccionado
- Retiros = Retiros reales (excluyendo cambios internos de curso)
*/

console.log('Consultas de movimientos del mes actualizadas correctamente');