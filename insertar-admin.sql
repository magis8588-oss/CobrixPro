-- ============================================
-- INSERTAR ADMIN EN TABLA USUARIOS
-- ============================================
-- UUID obtenido de auth.users: 6dca8c4c-9b95-4dbf-aa48-36df332fcdd9

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
  '6dca8c4c-9b95-4dbf-aa48-36df332fcdd9',
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

-- ✅ Deberías ver el usuario con rol 'admin' y activo = true
