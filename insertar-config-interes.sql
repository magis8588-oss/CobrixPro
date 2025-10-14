-- Insertar configuración de interés inicial si no existe
-- Ejecutar este script en el SQL Editor de Supabase

INSERT INTO configuracion_interes (
  tasa_interes,
  moneda,
  updated_at
) VALUES (
  20.0,  -- 20% de interés por defecto
  'COP', -- Peso Colombiano
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verificar que se insertó correctamente
SELECT * FROM configuracion_interes ORDER BY updated_at DESC LIMIT 1;
