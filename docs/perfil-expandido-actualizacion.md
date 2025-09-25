# Actualización de Perfil de Usuario - Campos Expandidos

## 🚨 **IMPORTANTE: Migración de Base de Datos Requerida**

Antes de usar las nuevas funcionalidades, **debes ejecutar el script de migración SQL** en tu base de datos.

### 📋 **Script a Ejecutar**

```sql
-- Agregar campos adicionales de perfil a la tabla usuarios

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS direccion TEXT;

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS foto_perfil TEXT;
```

### 🔧 **Cómo Ejecutar la Migración**

#### Opción 1: Supabase Dashboard
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a "SQL Editor"
3. Copia y pega el contenido de `scripts/add_profile_fields.sql`
4. Ejecuta el script

#### Opción 2: CLI de Supabase
```bash
supabase db reset --db-url "tu_connection_string_aqui"
```

#### Opción 3: Cliente SQL directo
1. Conecta a tu base de datos PostgreSQL
2. Ejecuta el archivo `scripts/add_profile_fields.sql`

---

## ✅ **Nuevas Funcionalidades Agregadas**

### 📝 **Campos Adicionales de Perfil**
- ✅ **Teléfono**: Campo de texto para número telefónico
- ✅ **Dirección**: Campo de texto largo para dirección completa  
- ✅ **Fecha de Nacimiento**: Selector de fecha con validación
- ✅ **Foto de Perfil**: Subida y visualización de imagen de perfil

### 🎨 **Mejoras de UI/UX**
- **Avatar Interactivo**: Hover effect con ícono de cámara para cambiar foto
- **Validación de Imágenes**: Solo acepta archivos de imagen < 5MB
- **Estados de Carga**: Indicador visual durante subida de imagen
- **Layout Mejorado**: Campos organizados en grid responsive
- **Formato de Fecha**: Visualización localizada en español chileno

### 🔒 **Seguridad**
- **Validación de Archivos**: Solo imágenes permitidas
- **Límite de Tamaño**: Máximo 5MB por imagen
- **Autorización**: Solo propietario puede cambiar su foto
- **Sanitización**: Nombres de archivo únicos y seguros

### 📂 **Almacenamiento de Archivos**
- **Directorio**: `/public/uploads/profiles/`
- **Nomenclatura**: `profile_{userId}_{timestamp}.{ext}`
- **Acceso Público**: URLs servidas estáticamente por Next.js

---

## 🚀 **Cómo Usar las Nuevas Funciones**

### Cambiar Foto de Perfil
1. Ve a "Mi Cuenta"
2. Haz hover sobre el avatar
3. Aparecerá un ícono de cámara
4. Haz clic y selecciona una imagen
5. La foto se subirá automáticamente

### Editar Información Adicional  
1. Haz clic en "Editar" en la página de perfil
2. Los nuevos campos aparecerán:
   - **Teléfono**: Formato sugerido +56 9 1234 5678
   - **Dirección**: Dirección completa de domicilio
   - **Fecha de Nacimiento**: Selector de fecha
3. Completa los campos deseados
4. Haz clic en "Guardar"

---

## 📋 **Archivos Modificados**

### Frontend
- ✅ `src/lib/types.ts` - Tipos TypeScript actualizados
- ✅ `src/app/dashboard/mi-cuenta/page.tsx` - Consulta expandida
- ✅ `src/components/dashboard/profile-client.tsx` - UI completa

### Backend  
- ✅ `src/app/api/users/profile/route.ts` - Endpoint actualizado
- ✅ `src/app/api/users/profile/image/route.ts` - Nuevo endpoint para imágenes

### Base de Datos
- ✅ `scripts/add_profile_fields.sql` - Script de migración

### Estructura de Archivos
- ✅ `public/uploads/profiles/` - Directorio para fotos de perfil

---

## 🛠️ **Próximos Pasos Sugeridos**

### Inmediatos
1. **Ejecutar migración SQL** (REQUERIDO)
2. Probar subida de fotos de perfil
3. Validar formularios con datos completos

### Futuros
- [ ] Integración con storage externo (AWS S3, Cloudinary)
- [ ] Recorte/redimensionado automático de imágenes
- [ ] Historial de cambios de perfil
- [ ] Validación de RUT chileno
- [ ] Validación de números de teléfono

---

## 🎉 **Estado: Listo para Usar**

Una vez ejecutada la migración SQL, todas las funcionalidades estarán completamente operativas.

**Tamaño de página actualizado**: 7.84 kB (era 6.8 kB)
**Nuevos endpoints**: 1 adicional
**Campos editables**: 7 total (era 4)