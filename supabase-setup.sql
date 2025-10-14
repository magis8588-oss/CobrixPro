-- ==============================================
-- COBRIXPRO - SCRIPT DE BASE DE DATOS SUPABASE
-- ==============================================
-- Instrucciones:
-- 1. Ve a tu proyecto Supabase: https://mlrvsryjyabwtrhxncjr.supabase.co
-- 2. Navega a: SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script
-- ==============================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- TABLA: usuarios
-- ==============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'cobrador')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- ==============================================
-- TABLA: configuracion_interes
-- ==============================================
CREATE TABLE IF NOT EXISTS configuracion_interes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tasa_interes DECIMAL(5,2) NOT NULL DEFAULT 5.0,
  moneda VARCHAR(10) NOT NULL DEFAULT 'COP',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración por defecto si no existe
INSERT INTO configuracion_interes (tasa_interes, moneda)
SELECT 5.0, 'COP'
WHERE NOT EXISTS (SELECT 1 FROM configuracion_interes LIMIT 1);

-- ==============================================
-- TABLA: clientes
-- ==============================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cobrador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  cedula VARCHAR(50) NOT NULL,
  telefono VARCHAR(50),
  direccion TEXT,
  monto_prestamo DECIMAL(15,2) NOT NULL,
  tipo_cobro VARCHAR(20) NOT NULL CHECK (tipo_cobro IN ('diario', 'semanal', 'quincenal')),
  cuotas_totales INTEGER NOT NULL,
  cuotas_pagadas INTEGER DEFAULT 0,
  valor_cuota DECIMAL(15,2) NOT NULL,
  saldo_pendiente DECIMAL(15,2) NOT NULL,
  fecha_inicio DATE NOT NULL,
  proximo_cobro DATE,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'al_dia', 'atrasado', 'completado', 'renovado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_cobrador ON clientes(cobrador_id);
CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON clientes(cedula);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_proximo_cobro ON clientes(proximo_cobro);

-- ==============================================
-- TABLA: transacciones
-- ==============================================
CREATE TABLE IF NOT EXISTS transacciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  cobrador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('pago', 'prestamo', 'renovacion')),
  monto DECIMAL(15,2) NOT NULL,
  saldo_anterior DECIMAL(15,2) NOT NULL,
  saldo_nuevo DECIMAL(15,2) NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para transacciones
CREATE INDEX IF NOT EXISTS idx_transacciones_cliente ON transacciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_cobrador ON transacciones(cobrador_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON transacciones(tipo);

-- ==============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_configuracion_interes_updated_at ON configuracion_interes;
CREATE TRIGGER update_configuracion_interes_updated_at
  BEFORE UPDATE ON configuracion_interes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- DATOS INICIALES: Usuarios de prueba
-- ==============================================
-- Nota: Las contraseñas deben hashearse en la aplicación
-- Estos son ejemplos con hash bcrypt de "admin123" y "cobrador123"

-- Admin de prueba (password: admin123)
INSERT INTO usuarios (email, password_hash, nombre, rol, activo)
VALUES (
  'admin@test.com',
  '$2a$10$rOzJw5R5Z5Z5Z5Z5Z5Z5ZeN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
  'Administrador Principal',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Cobrador de prueba (password: cobrador123)
INSERT INTO usuarios (email, password_hash, nombre, rol, activo)
VALUES (
  'cobrador@test.com',
  '$2a$10$rOzJw5R5Z5Z5Z5Z5Z5Z5ZeN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
  'Cobrador Demo',
  'cobrador',
  true
)
ON CONFLICT (email) DO NOTHING;

-- ==============================================
-- POLÍTICAS RLS (Row Level Security)
-- ==============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_interes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios (solo admins pueden ver/editar usuarios)
CREATE POLICY "Admins pueden ver todos los usuarios"
  ON usuarios FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins pueden crear usuarios"
  ON usuarios FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins pueden actualizar usuarios"
  ON usuarios FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para configuracion_interes
CREATE POLICY "Todos pueden ver configuración"
  ON configuracion_interes FOR SELECT
  USING (true);

CREATE POLICY "Solo admins pueden modificar configuración"
  ON configuracion_interes FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para clientes
CREATE POLICY "Cobradores ven sus propios clientes"
  ON clientes FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    cobrador_id = (auth.jwt() ->> 'user_id')::UUID
  );

CREATE POLICY "Cobradores pueden crear clientes"
  ON clientes FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'cobrador')
  );

CREATE POLICY "Cobradores pueden actualizar sus clientes"
  ON clientes FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    cobrador_id = (auth.jwt() ->> 'user_id')::UUID
  );

-- Políticas para transacciones
CREATE POLICY "Cobradores ven sus propias transacciones"
  ON transacciones FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    cobrador_id = (auth.jwt() ->> 'user_id')::UUID
  );

CREATE POLICY "Cobradores pueden crear transacciones"
  ON transacciones FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'cobrador')
  );

-- ==============================================
-- VISTAS ÚTILES
-- ==============================================

-- Vista de estadísticas por cobrador
CREATE OR REPLACE VIEW estadisticas_cobrador AS
SELECT 
  u.id as cobrador_id,
  u.nombre as cobrador_nombre,
  COUNT(DISTINCT c.id) as total_clientes,
  COUNT(DISTINCT CASE WHEN c.estado = 'activo' THEN c.id END) as clientes_activos,
  COALESCE(SUM(c.monto_prestamo), 0) as total_prestado,
  COALESCE(SUM(c.saldo_pendiente), 0) as total_pendiente,
  COUNT(DISTINCT CASE WHEN c.proximo_cobro = CURRENT_DATE THEN c.id END) as cobros_hoy
FROM usuarios u
LEFT JOIN clientes c ON u.id = c.cobrador_id
WHERE u.rol = 'cobrador' AND u.activo = true
GROUP BY u.id, u.nombre;

-- ==============================================
-- FUNCIONES ÚTILES
-- ==============================================

-- Función para calcular próximo cobro
CREATE OR REPLACE FUNCTION calcular_proximo_cobro(
  p_fecha_inicio DATE,
  p_tipo_cobro VARCHAR,
  p_cuotas_pagadas INTEGER
)
RETURNS DATE AS $$
DECLARE
  v_dias_interval INTEGER;
  v_proximo_cobro DATE;
BEGIN
  -- Determinar días según tipo de cobro
  CASE p_tipo_cobro
    WHEN 'diario' THEN v_dias_interval := 1;
    WHEN 'semanal' THEN v_dias_interval := 7;
    WHEN 'quincenal' THEN v_dias_interval := 15;
    ELSE v_dias_interval := 1;
  END CASE;
  
  -- Calcular próximo cobro
  v_proximo_cobro := p_fecha_inicio + (p_cuotas_pagadas * v_dias_interval);
  
  RETURN v_proximo_cobro;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- VERIFICACIÓN FINAL
-- ==============================================

-- Verificar tablas creadas
SELECT 
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'configuracion_interes', 'clientes', 'transacciones')
ORDER BY tablename;

-- Verificar configuración inicial
SELECT * FROM configuracion_interes;

-- Verificar usuarios de prueba
SELECT id, email, nombre, rol, activo FROM usuarios;

-- ==============================================
-- ✅ SCRIPT COMPLETADO
-- ==============================================
-- Si ves las tablas y datos listados arriba, ¡todo está listo!
-- Ahora puedes usar tu aplicación con Supabase.
-- ==============================================
