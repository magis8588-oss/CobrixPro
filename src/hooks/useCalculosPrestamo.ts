import { useConfigInteres } from './useConfigInteres'
import { calcularCuotas, TipoCobro, ResultadoCalculoCuotas } from '@/lib/calculosUtils'

/**
 * Hook personalizado que combina la configuración de interés con los cálculos de préstamos
 * Proporciona una función de cálculo que ya tiene la tasa de interés configurada
 */
export function useCalculosPrestamo() {
  const { tasaInteres, monedaSymbol, monedaCode, config, loading } = useConfigInteres()

  /**
   * Calcula las cuotas usando la tasa de interés configurada en el sistema
   */
  const calcularConConfiguracion = (
    monto: number,
    tipoCobro: TipoCobro
  ): ResultadoCalculoCuotas => {
    return calcularCuotas(monto, tipoCobro, tasaInteres)
  }

  return {
    // Configuración
    tasaInteres,
    monedaSymbol,
    monedaCode,
    config,
    loading,
    
    // Función de cálculo con configuración aplicada
    calcularCuotas: calcularConConfiguracion,
  }
}
