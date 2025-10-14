-- ==============================================
-- ACTUALIZAR VISTA DE ESTADÍSTICAS DEL COBRADOR
-- ==============================================
-- Este script corrige la vista para mostrar las estadísticas
-- correctas en el panel del administrador
-- ==============================================

-- Eliminar la vista anterior si existe
DROP VIEW IF EXISTS estadisticas_cobrador CASCADE;

-- Crear la vista actualizada con todos los campos necesarios
CREATE OR REPLACE VIEW estadisticas_cobrador AS
SELECT 
  u.id as cobrador_id,
  u.nombre as cobrador_nombre,
  u.email as cobrador_email,
  
  -- Contadores de clientes
  COUNT(DISTINCT c.id) as clientes_totales,
  COUNT(DISTINCT CASE 
    WHEN c.created_at >= CURRENT_DATE - INTERVAL '30 days' 
    THEN c.id 
  END) as clientes_nuevos,
  
  COUNT(DISTINCT CASE 
    WHEN c.estado = 'al_dia' OR c.estado = 'renovado' 
    THEN c.id 
  END) as clientes_al_dia,
  
  COUNT(DISTINCT CASE 
    WHEN c.estado = 'atrasado' 
    THEN c.id 
  END) as clientes_mora,
  
  -- Estadísticas financieras
  COALESCE(SUM(c.monto_prestamo), 0) as total_prestado,
  
  COALESCE(SUM(
    c.valor_cuota * c.cuotas_pagadas
  ), 0) as total_recaudado,
  
  COALESCE(SUM(c.saldo_pendiente), 0) as saldo_pendiente,
  
  -- Meta de recaudación (suponemos 80% del total prestado como meta)
  COALESCE(SUM(c.monto_prestamo), 0) * 0.8 as meta_recaudacion,
  
  -- Porcentaje de cumplimiento
  CASE 
    WHEN COALESCE(SUM(c.monto_prestamo), 0) > 0 THEN
      (COALESCE(SUM(c.valor_cuota * c.cuotas_pagadas), 0) / 
       (COALESCE(SUM(c.monto_prestamo), 0) * 0.8)) * 100
    ELSE 0
  END as porcentaje_cumplimiento,
  
  -- Cobros programados para hoy
  COUNT(DISTINCT CASE 
    WHEN c.proximo_cobro = CURRENT_DATE 
    AND c.cuotas_pagadas < c.cuotas_totales
    THEN c.id 
  END) as cobros_hoy,
  
  -- Última actualización
  NOW() as actualizado_at
  
FROM usuarios u
LEFT JOIN clientes c ON u.id = c.cobrador_id
WHERE u.rol = 'cobrador' AND u.activo = true
GROUP BY u.id, u.nombre, u.email;

-- ==============================================
-- VERIFICACIÓN
-- ==============================================

-- Verificar que la vista se creó correctamente
SELECT 
  cobrador_nombre,
  clientes_totales,
  clientes_nuevos,
  total_recaudado,
  meta_recaudacion,
  porcentaje_cumplimiento
FROM estadisticas_cobrador
ORDER BY total_recaudado DESC;

-- Verificar estructura de la vista
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'estadisticas_cobrador'
ORDER BY ordinal_position;
