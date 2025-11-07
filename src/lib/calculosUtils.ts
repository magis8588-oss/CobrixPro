/**
 * Utilidades para cálculos de préstamos y cuotas
 * Contiene la lógica de negocio para cálculos de intereses y cuotas
 */

/**
 * Configuración de cuotas según tipo de cobro
 * - Diario: 24 cuotas (aproximadamente 1 mes)
 * - Semanal: 4 cuotas (aproximadamente 1 mes)
 * - Quincenal: 2 cuotas (aproximadamente 1 mes)
 */
const CUOTAS_CONFIG = {
  diario: 24,
  semanal: 4,
  quincenal: 2,
} as const

export type TipoCobro = 'diario' | 'semanal' | 'quincenal'

export interface ResultadoCalculoCuotas {
  cuotasTotales: number
  valorCuota: number
  montoConInteres: number
  montoInteres: number
}

/**
 * Calcula las cuotas, intereses y valor total de un préstamo
 * 
 * @param monto - Monto del préstamo sin intereses
 * @param tipoCobro - Tipo de frecuencia de cobro (diario, semanal, quincenal)
 * @param tasaInteres - Tasa de interés en porcentaje (ej: 5.0 para 5%)
 * @returns Objeto con cuotas totales, valor de cada cuota, monto con interés y monto de interés
 * 
 * @example
 * ```typescript
 * const resultado = calcularCuotas(200000, 'semanal', 5.0)
 * // resultado = {
 * //   cuotasTotales: 4,
 * //   valorCuota: 52500,
 * //   montoConInteres: 210000,
 * //   montoInteres: 10000
 * // }
 * ```
 */
export function calcularCuotas(
  monto: number,
  tipoCobro: TipoCobro,
  tasaInteres: number
): ResultadoCalculoCuotas {
  // Validar inputs
  if (monto <= 0) {
    throw new Error('El monto debe ser mayor a cero')
  }
  
  if (tasaInteres < 0) {
    throw new Error('La tasa de interés no puede ser negativa')
  }

  // Calcular interés
  const tasa = tasaInteres / 100
  const montoInteres = monto * tasa
  const montoConInteres = monto + montoInteres

  // Obtener número de cuotas según tipo
  const cuotasTotales = CUOTAS_CONFIG[tipoCobro]

  // Calcular valor de cada cuota (redondeado hacia arriba)
  const valorCuota = Math.ceil(montoConInteres / cuotasTotales)

  return {
    cuotasTotales,
    valorCuota,
    montoConInteres,
    montoInteres,
  }
}

/**
 * Calcula el saldo pendiente de un préstamo
 * 
 * @param valorCuota - Valor de cada cuota
 * @param cuotasPendientes - Número de cuotas que faltan por pagar
 * @returns Saldo pendiente total
 * 
 * @example
 * ```typescript
 * const saldo = calcularSaldoPendiente(52500, 2)
 * // saldo = 105000
 * ```
 */
export function calcularSaldoPendiente(
  valorCuota: number,
  cuotasPendientes: number
): number {
  if (valorCuota < 0 || cuotasPendientes < 0) {
    throw new Error('Los valores no pueden ser negativos')
  }

  return valorCuota * cuotasPendientes
}

/**
 * Calcula el número de cuotas pendientes
 * 
 * @param cuotasTotales - Número total de cuotas del préstamo
 * @param cuotasPagadas - Número de cuotas ya pagadas
 * @returns Número de cuotas que faltan por pagar
 */
export function calcularCuotasPendientes(
  cuotasTotales: number,
  cuotasPagadas: number
): number {
  if (cuotasTotales < 0 || cuotasPagadas < 0) {
    throw new Error('Los valores no pueden ser negativos')
  }

  if (cuotasPagadas > cuotasTotales) {
    throw new Error('Las cuotas pagadas no pueden ser mayores a las cuotas totales')
  }

  return cuotasTotales - cuotasPagadas
}

/**
 * Calcula el porcentaje de progreso de pago
 * 
 * @param cuotasPagadas - Número de cuotas ya pagadas
 * @param cuotasTotales - Número total de cuotas del préstamo
 * @returns Porcentaje de avance (0-100)
 */
export function calcularPorcentajeProgreso(
  cuotasPagadas: number,
  cuotasTotales: number
): number {
  if (cuotasTotales === 0) return 0
  if (cuotasPagadas < 0 || cuotasTotales < 0) return 0

  const porcentaje = (cuotasPagadas / cuotasTotales) * 100
  return Math.min(100, Math.max(0, porcentaje))
}

/**
 * Obtiene la etiqueta legible del tipo de cobro con el número de cuotas
 * 
 * @param tipoCobro - Tipo de cobro
 * @returns Etiqueta formateada (ej: "Diario (24 cuotas)")
 */
export function obtenerEtiquetaTipoCobro(tipoCobro: TipoCobro): string {
  const cuotas = CUOTAS_CONFIG[tipoCobro]
  const tipo = tipoCobro.charAt(0).toUpperCase() + tipoCobro.slice(1)
  return `${tipo} (${cuotas} cuotas)`
}

/**
 * Valida si un cliente puede renovar su préstamo
 * Según las reglas de negocio, solo se puede renovar cuando quedan 3 o menos cuotas
 * 
 * @param cuotasPendientes - Número de cuotas pendientes del cliente
 * @returns true si puede renovar, false si no
 */
export function puedeRenovar(cuotasPendientes: number): boolean {
  return cuotasPendientes <= 3 && cuotasPendientes >= 0
}

/**
 * Calcula el monto a entregar al cliente en una renovación
 * El cliente recibe el nuevo monto menos la deuda actual
 * 
 * @param nuevoMonto - Monto del nuevo préstamo
 * @param deudaActual - Saldo pendiente del préstamo actual
 * @returns Monto que se entrega al cliente en efectivo
 */
export function calcularMontoRenovacion(
  nuevoMonto: number,
  deudaActual: number
): number {
  if (nuevoMonto <= deudaActual) {
    throw new Error('El nuevo préstamo debe ser mayor a la deuda actual')
  }

  return nuevoMonto - deudaActual
}
