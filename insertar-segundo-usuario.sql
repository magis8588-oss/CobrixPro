-- ============================================
-- INSERTAR SEGUNDO USUARIO EN TABLA USUARIOS
-- ============================================
-- UUID obtenido de auth.users: d673360a-5a1a-428f-bf07-ad091d708361
-- Email: stiven@cobrix.com

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
  'd673360a-5a1a-428f-bf07-ad091d708361',
  'stiven@cobrix.com',
  'Stiven Usuario',
  'cobrador',
  true,
  'managed_by_auth',
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
  email = EXCLUDED.email,
  nombre = EXCLUDED.nombre,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  updated_at = NOW();

-- ============================================
-- VERIFICAR AMBOS USUARIOS
-- ============================================
SELECT 
  id,
  email,
  nombre,
  rol,
  activo,
  created_at
FROM usuarios
ORDER BY created_at DESC;

-- ✅ Deberías ver 2 usuarios:
--    1. admin@cobrix.com (rol: admin)
--    2. stiven@cobrix.com (rol: cobrador)
