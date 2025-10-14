-- ============================================
-- CREAR USUARIO ADMINISTRADOR
-- ============================================
-- Ejecuta este script en el SQL Editor de Supabase
-- para crear tu usuario admin principal
-- ============================================

-- IMPORTANTE: Primero debes crear el usuario en Authentication
-- Ve a: Authentication > Users > Add user
-- Email: admin@cobrix.com
-- Password: [Tu contraseña segura]
-- Confirma el email automáticamente
-- Copia el UUID que se genera

-- Una vez tengas el UUID del usuario, reemplaza 'USER_UUID_AQUI' 
-- con el ID real y ejecuta este INSERT:

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
  'USER_UUID_AQUI', -- Reemplaza con el UUID real del usuario
  'admin@cobrix.com',
  'Administrador Principal',
  'admin',
  true,
  'managed_by_supabase_auth', -- El hash lo maneja Supabase Auth
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  nombre = EXCLUDED.nombre,
  rol = 'admin',
  activo = true,
  updated_at = NOW();

-- ============================================
-- VERIFICAR QUE SE CREÓ CORRECTAMENTE
-- ============================================
SELECT 
  id,
  email,
  nombre,
  rol,
  activo,
  created_at
FROM usuarios
WHERE email = 'admin@cobrix.com';

-- ============================================
-- ✅ HECHO!
-- ============================================
-- Ahora puedes hacer login con:
-- Email: admin@cobrix.com
-- Password: [La que configuraste]
-- ============================================
