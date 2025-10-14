-- ============================================
-- VERIFICAR Y ACTUALIZAR ROL DEL ADMIN
-- ============================================

-- 1. Ver el estado actual del usuario
SELECT 
  id,
  email,
  nombre,
  rol,
  activo,
  created_at
FROM usuarios
WHERE email = 'admin@cobrix.com';

-- 2. Si el rol NO es 'admin', ejecuta esto:
UPDATE usuarios
SET 
  rol = 'admin',
  activo = true,
  updated_at = NOW()
WHERE email = 'admin@cobrix.com';

-- 3. Verificar nuevamente
SELECT 
  id,
  email,
  nombre,
  rol,
  activo,
  created_at
FROM usuarios
WHERE email = 'admin@cobrix.com';

-- ✅ El usuario debe aparecer con:
--    - rol: admin
--    - activo: true
