-- ========================================
-- FIX: Deshabilitar RLS en tabla clientes
-- ========================================
-- Error: "new row violates row-level security policy for table clientes"
-- Solución: Deshabilitar RLS temporalmente para desarrollo

-- OPCIÓN 1: Deshabilitar RLS completamente (RECOMENDADO PARA DESARROLLO)
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;

-- Verificar que se deshabilitó
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'clientes';

-- ========================================
-- OPCIÓN 2: Crear políticas permisivas (para producción futura)
-- ========================================
-- Si prefieres mantener RLS activo, descomenta estas líneas:

/*
-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Permitir a los cobradores INSERT en sus propios clientes
CREATE POLICY "Cobradores pueden insertar clientes"
ON clientes
FOR INSERT
TO authenticated
WITH CHECK (cobrador_id = auth.uid());

-- Permitir a los cobradores SELECT sus propios clientes
CREATE POLICY "Cobradores pueden ver sus clientes"
ON clientes
FOR SELECT
TO authenticated
USING (cobrador_id = auth.uid());

-- Permitir a los cobradores UPDATE sus propios clientes
CREATE POLICY "Cobradores pueden actualizar sus clientes"
ON clientes
FOR UPDATE
TO authenticated
USING (cobrador_id = auth.uid())
WITH CHECK (cobrador_id = auth.uid());

-- Permitir a los cobradores DELETE sus propios clientes
CREATE POLICY "Cobradores pueden eliminar sus clientes"
ON clientes
FOR DELETE
TO authenticated
USING (cobrador_id = auth.uid());

-- Permitir a los admins acceso total
CREATE POLICY "Admins acceso total clientes"
ON clientes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.rol = 'admin'
  )
);
*/

-- ========================================
-- VERIFICACIÓN
-- ========================================
-- Verificar estado RLS de todas las tablas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver políticas existentes en clientes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'clientes';
