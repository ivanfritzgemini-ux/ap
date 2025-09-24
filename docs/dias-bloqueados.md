# Funcionalidad de Días Bloqueados de Asistencia

Esta nueva funcionalidad permite a los administradores del establecimiento bloquear días específicos en el sistema de asistencia. Los días bloqueados no permiten el registro de asistencia para los cursos afectados.

## Características Implementadas

### 1. Gestión de Días Bloqueados
- **Ubicación**: Dashboard → Administración → Establecimiento
- **Nueva sección**: "Días Bloqueados de Asistencia"

### 2. Campos de Configuración
- **Nivel**: Selección granular de niveles afectados:
  - Todos los niveles
  - Todos los primeros (1° año)
  - Todos los segundos (2° año) 
  - Todos los terceros (3° año)
  - Todos los cuartos (4° año)
  - Nivel específico (1°, 2°, 3°, 4°)

- **Letra**: Selección de cursos por letra:
  - Todas las letras
  - Letra específica (A, B, C, D, E, F)

- **Fecha**: Fecha específica a bloquear
- **Resolución**: Número de resolución que autoriza el bloqueo
- **Motivo**: Descripción del motivo del bloqueo

### 3. Funcionalidades CRUD
- ✅ Crear nuevo bloqueo
- ✅ Editar bloqueo existente  
- ✅ Eliminar bloqueo
- ✅ Listar todos los bloqueos

## Archivos Creados/Modificados

### Nuevos Archivos
1. `src/app/api/dias-bloqueados/route.ts` - API endpoints CRUD
2. `src/app/api/dias-bloqueados/validar/route.ts` - API para validar bloqueos
3. `src/components/dashboard/admin/dias-bloqueados-management.tsx` - Componente UI
4. `src/lib/dias-bloqueados.ts` - Funciones utilitarias de validación
5. `scripts/create_dias_bloqueados_table.sql` - Script de migración de BD

### Archivos Modificados
1. `src/app/dashboard/admin/establecimiento/page.tsx` - Integración del nuevo componente

## Base de Datos

### Nueva Tabla: `dias_bloqueados`
```sql
CREATE TABLE public.dias_bloqueados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cadena TEXT,
    nivel TEXT, 
    letra TEXT,
    fecha DATE NOT NULL,
    resolucion TEXT NOT NULL,
    motivo TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## APIs Disponibles

### 1. CRUD de Días Bloqueados
- `GET /api/dias-bloqueados` - Listar todos los bloqueos
- `POST /api/dias-bloqueados` - Crear nuevo bloqueo
- `PUT /api/dias-bloqueados` - Actualizar bloqueo
- `DELETE /api/dias-bloqueados?id={id}` - Eliminar bloqueo

### 2. Validación de Bloqueos
- `GET /api/dias-bloqueados/validar?fecha={fecha}&cursoId={id}` - Validar día específico
- `GET /api/dias-bloqueados/validar?fechas={fecha1,fecha2}&cursoId={id}` - Validar múltiples días

## Lógica de Validación

El sistema valida si un día está bloqueado según esta jerarquía:

1. **Nivel**: 
   - "todos" → Aplica a todos los niveles
   - "todos-primeros" → Solo 1° año
   - "todos-segundos" → Solo 2° año
   - "todos-terceros" → Solo 3° año  
   - "todos-cuartos" → Solo 4° año
   - Número específico → Solo ese nivel

2. **Letra**:
   - "todas" → Aplica a todas las letras del nivel
   - Letra específica → Solo esa letra

3. **Fecha**: Debe coincidir exactamente

## Uso en el Sistema de Asistencia

### Integración Futura
Los días bloqueados pueden integrarse con el sistema de asistencia existente:

```typescript
import { validarDiaBloqueado } from '@/lib/dias-bloqueados'

// En el componente de asistencia
const validacion = await validarDiaBloqueado(fecha, cursoId, nivel, letra)
if (validacion.bloqueado) {
  // Mostrar mensaje de bloqueo
  // Deshabilitar campos de asistencia
  // Mostrar motivos y resoluciones
}
```

## Instalación

1. **Ejecutar migración de BD**:
   ```bash
   # Ejecutar el script SQL en tu base de datos Supabase
   psql -f scripts/create_dias_bloqueados_table.sql
   ```

2. **La funcionalidad ya está integrada** en la página de establecimiento

## Próximos Pasos

- [ ] Integrar validación en el sistema de asistencia existente
- [ ] Agregar notificaciones cuando se intente acceder a días bloqueados
- [ ] Implementar vista de calendario para visualizar días bloqueados
- [ ] Agregar filtros por período académico
- [ ] Exportar/importar configuraciones de bloqueos