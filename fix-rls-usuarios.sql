-- ============================================
-- SOLUCIÓN AL ERROR 406 - RLS BLOCKING
-- ============================================
-- El problema es que Row Level Security está bloqueando
-- el acceso a la tabla usuarios

-- OPCIÓN 1: Deshabilitar RLS temporalmente (más fácil para desarrollo)
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- OPCIÓN 2: Crear políticas RLS correctas (recomendado para producción)
-- Descomenta estas líneas si prefieres mantener RLS activo:

/*
-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil"
ON usuarios
FOR SELECT
USING (auth.uid() = id);

-- Política: Los admins pueden ver todos los perfiles
CREATE POLICY "Los admins pueden ver todos los perfiles"
ON usuarios
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND rol = 'admin'
  )
);

-- Política: Los admins pueden insertar usuarios
CREATE POLICY "Los admins pueden insertar usuarios"
ON usuarios
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND rol = 'admin'
  )
);

-- Política: Los admins pueden actualizar usuarios
CREATE POLICY "Los admins pueden actualizar usuarios"
ON usuarios
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND rol = 'admin'
  )
);

-- Política: Los admins pueden eliminar usuarios
CREATE POLICY "Los admins pueden eliminar usuarios"
ON usuarios
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND rol = 'admin'
  )
);
*/

-- ============================================
-- VERIFICAR QUE FUNCIONA
-- ============================================
SELECT 
  id,
  email,
  nombre,
  rol,
  activo
FROM usuarios
WHERE email = 'admin@cobrix.com';

-- ✅ Si esto funciona, el problema está resuelto
