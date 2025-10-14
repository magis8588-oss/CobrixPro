-- ============================================
-- OPCIÓN 1: Si ya creaste el usuario en Authentication
-- ============================================
-- Ejecuta esta query para encontrar el UUID del usuario:

SELECT id, email, created_at
FROM auth.users
WHERE email = 'admin@cobrix.com';

-- Copia el 'id' que aparece y úsalo en el siguiente INSERT

-- ============================================
-- OPCIÓN 2: Crear usuario completo (Auth + Tabla)
-- ============================================
-- Si aún NO has creado el usuario, ve a:
-- Authentication > Users > Add user (manual)
-- Email: admin@cobrix.com
-- Password: [tu contraseña]
-- ✓ Auto Confirm User
-- Luego ejecuta el script de abajo

-- ============================================
-- INSERTAR EN TABLA USUARIOS
-- ============================================
-- Reemplaza 'TU-UUID-AQUI' con el ID del paso anterior

INSERT INTO usuarios (
  id,
  email,
  nombre,
  rol,
  activo,
  password_hash,
  created_at,
  updated_at
)
VALUES (
  'TU-UUID-AQUI', -- ⚠️ REEMPLAZA ESTO
  'admin@cobrix.com',
  'Administrador CobrixPro',
  'admin',
  true,
  'managed_by_auth',
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
  rol = 'admin',
  activo = true,
  updated_at = NOW();

-- ============================================
-- VERIFICAR
-- ============================================
SELECT 
  u.id,
  u.email,
  u.nombre,
  u.rol,
  u.activo,
  u.created_at
FROM usuarios u
WHERE u.email = 'admin@cobrix.com';

-- ============================================
-- ✅ Si ves el usuario listado arriba, ¡está listo!
-- Ahora puedes hacer login en la app
-- ============================================
