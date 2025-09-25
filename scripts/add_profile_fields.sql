-- Agregar campos adicionales de perfil a la tabla usuarios
-- Ejecutar este script en la base de datos para agregar los nuevos campos

-- Agregar columna para teléfono
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

-- Agregar columna para dirección
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS direccion TEXT;

-- Agregar columna para fecha de nacimiento
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;

-- Agregar columna para foto de perfil (URL o path del archivo)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS foto_perfil TEXT;

-- Agregar comentarios descriptivos
COMMENT ON COLUMN usuarios.telefono IS 'Número de teléfono del usuario';
COMMENT ON COLUMN usuarios.direccion IS 'Dirección de domicilio del usuario';
COMMENT ON COLUMN usuarios.fecha_nacimiento IS 'Fecha de nacimiento del usuario';
COMMENT ON COLUMN usuarios.foto_perfil IS 'URL o ruta de la foto de perfil del usuario';

-- Verificar la estructura actualizada
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'usuarios' 
-- ORDER BY ordinal_position;