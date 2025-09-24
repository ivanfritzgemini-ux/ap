# Manejo de Estudiantes Retirados - Sistema de Libro de Clases

## Resumen

El sistema implementa un modelo de "libro de clases" educativo donde los estudiantes retirados mantienen un registro histórico completo. Cuando un estudiante cambia de curso o se retira, se conserva el registro de su matrícula anterior para fines de auditoría y seguimiento.

## Actualización Reciente (Septiembre 2025)

### Problema Resuelto
- **Error**: `Could not find the table 'public.historial_cambios_curso' in the schema cache`
- **Causa**: El código intentaba crear/usar una tabla `historial_cambios_curso` que no existía
- **Solución**: Eliminada dependencia de tabla externa, el historial ahora se construye desde `estudiantes_detalles`

### Cambios Implementados
1. **API `/api/students/change-course` simplificada**:
   - Removida lógica de creación de tabla `historial_cambios_curso`
   - Historial construido dinámicamente desde registros de matrícula existentes
   - Mantiene funcionalidad completa de cambio de curso

2. **Componente frontend actualizado**:
   - Interfaz de historial actualizada para mostrar timeline de matrículas/retiros
   - Badges visuales para estado actual vs histórico
   - Mejor presentación de información temporal

## Estructura de Base de Datos

### Tabla `estudiantes_detalles`
- **Múltiples registros por estudiante**: Un estudiante puede tener varias matrículas (una por curso o cambio)
- **Campo `es_matricula_actual`**: Indica si la matrícula está activa (`true`) o retirada (`false`)
- **Campos de retiro**: `fecha_retiro` y `motivo_retiro` registran cuándo y por qué se retiró

### Ejemplo de Datos
```sql
-- Estudiante con historial de cambio de curso
INSERT INTO estudiantes_detalles VALUES 
(1, 'user123', 'curso-8a', '2024-03-01', '2024-11-15', 'Cambio de curso', false), -- Retirada
(2, 'user123', 'curso-8b', '2024-11-15', null, null, true);                     -- Activa
```

## Comportamiento por Contexto

### 1. Lista General de Estudiantes (`/dashboard/admin/students`)
- **Muestra**: Todos los estudiantes únicos (activos y retirados)
- **Lógica**: Un estudiante por `estudiante_id`, priorizando matrícula activa
- **Visualización**: Badge "Retirado" si no tiene matrícula activa
- **Datos mostrados**: Si tiene matrícula activa → datos actuales. Si está retirado → datos de última matrícula

### 2. Lista de Estudiantes por Curso
- **Muestra**: Todos los estudiantes que han estado en ese curso
- **Incluye**: Estudiantes actuales y retirados del curso
- **Uso**: Para historial completo y asistencia histórica

### 3. Gestión de Asistencia
- **Muestra**: Todos los estudiantes que estuvieron matriculados durante el período
- **Lógica de filtrado**: Considera fechas de matrícula y retiro vs período consultado
- **Permite**: Registrar asistencia de estudiantes retirados durante su período activo

## Operaciones Principales

### Cambio de Curso
```typescript
// 1. Marcar matrícula anterior como retirada
UPDATE estudiantes_detalles 
SET es_matricula_actual = false, fecha_retiro = CURRENT_DATE, motivo_retiro = 'Cambio de curso'
WHERE estudiante_id = ? AND es_matricula_actual = true;

// 2. Crear nueva matrícula activa
INSERT INTO estudiantes_detalles (estudiante_id, curso_id, es_matricula_actual, fecha_matricula)
VALUES (?, nuevo_curso_id, true, CURRENT_DATE);
```

### Retiro de Estudiante
```typescript
UPDATE estudiantes_detalles 
SET es_matricula_actual = false, fecha_retiro = ?, motivo_retiro = ?
WHERE estudiante_id = ? AND es_matricula_actual = true;
```

## Archivos Modificados

### APIs
- `/api/students/change-course/route.ts` - Lógica INSERT+UPDATE para cambios
- `/api/students/withdraw/route.ts` - Marca matrícula como no activa
- `/api/cursos/[id]/alumnos/route.ts` - Muestra historial completo del curso

### Funciones de Datos
- `/lib/data.ts::getStudents()` - Agrupación por estudiante con prioridad activa
- `/lib/data.ts::getStudentsByCourse()` - Historial completo del curso

### Componentes UI
- `StudentManagementClient` - Badge "Retirado" y acciones contextuales
- Páginas de asistencia - Filtrado por fechas de matrícula/retiro

## Validaciones y Reglas de Negocio

1. **Un estudiante solo puede tener una matrícula activa**: `es_matricula_actual = true`
2. **Los retiros deben tener fecha**: `fecha_retiro` requerida para retiros manuales
3. **Los cambios de curso son automáticos**: El sistema gestiona el retiro y nueva matrícula
4. **Preservación histórica**: Nunca se eliminan registros de matrícula, solo se marcan como inactivas

## Consideraciones de UI/UX

- **Estudiantes retirados aparecen con badge rojo "Retirado"**
- **Nombres tachados** (`line-through`) para estudiantes retirados
- **Acciones contextuales** disponibles según estado (cambiar curso, retirar, etc.)
- **Filtros de fecha** en asistencia respetan períodos de matrícula

## Casos de Uso Típicos

1. **Estudiante se traslada de 8°A a 8°B**: Aparece como retirado en 8°A y activo en 8°B
2. **Consultar asistencia histórica**: Se pueden ver registros de estudiantes que ya se retiraron
3. **Auditoría educativa**: Historial completo de movimientos estudiantiles disponible
4. **Reintegración**: Estudiante retirado puede ser matriculado nuevamente en nuevo registro
