-- ========================================
-- DESHABILITAR RLS EN TODAS LAS TABLAS
-- ========================================
-- Para evitar problemas de permisos durante desarrollo

-- Tabla: usuarios
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- Tabla: configuracion_interes
ALTER TABLE configuracion_interes DISABLE ROW LEVEL SECURITY;

-- Tabla: clientes
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;

-- Tabla: transacciones
ALTER TABLE transacciones DISABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICACIÓN: Ver estado RLS de todas las tablas
-- ========================================
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '🔒 RLS ACTIVO'
    WHEN rowsecurity = false THEN '✅ RLS DESHABILITADO'
  END as estado_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'configuracion_interes', 'clientes', 'transacciones')
ORDER BY tablename;

-- Resultado esperado:
-- clientes              | ✅ RLS DESHABILITADO
-- configuracion_interes | ✅ RLS DESHABILITADO
-- transacciones         | ✅ RLS DESHABILITADO
-- usuarios              | ✅ RLS DESHABILITADO

-- ========================================
-- ELIMINAR POLÍTICAS EXISTENTES (si las hay)
-- ========================================
-- Ver políticas existentes
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Si hay políticas que deseas eliminar, usa:
-- DROP POLICY IF EXISTS "nombre_de_la_politica" ON nombre_tabla;
