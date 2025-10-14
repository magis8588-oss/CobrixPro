-- ============================================
-- TRIGGER AUTOMÁTICO PARA SINCRONIZAR USUARIOS
-- ============================================
-- Este trigger crea automáticamente un registro en la tabla 'usuarios'
-- cada vez que se crea un usuario en Authentication

-- 1. Crear la función que se ejecutará automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (
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
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario Nuevo'),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'cobrador'),
    true,
    'managed_by_auth',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- OPCIONAL: Insertar usuarios existentes que faltan
-- ============================================
-- Este INSERT solo agrega usuarios de auth.users que NO están en usuarios

INSERT INTO usuarios (id, email, nombre, rol, activo, password_hash, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nombre', 'Usuario ' || SUBSTRING(au.email FROM 1 FOR POSITION('@' IN au.email) - 1)),
  COALESCE(au.raw_user_meta_data->>'rol', 'cobrador')::text,
  true,
  'managed_by_auth',
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN usuarios u ON au.id = u.id
WHERE u.id IS NULL;

-- ============================================
-- VERIFICAR
-- ============================================
SELECT 
  u.id,
  u.email,
  u.nombre,
  u.rol,
  u.activo
FROM usuarios u
ORDER BY u.created_at DESC;

-- ✅ Ahora deberías ver TODOS los usuarios de auth.users también en la tabla usuarios
-- ✅ Y cada vez que crees un usuario nuevo en Authentication, 
--    se creará automáticamente en la tabla usuarios también
