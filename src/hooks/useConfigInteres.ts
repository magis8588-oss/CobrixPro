import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ConfiguracionInteres } from '@/types'
import { monedas } from '@/lib/mockData'

/**
 * Hook personalizado para obtener la configuración de interés del admin
 * Se actualiza automáticamente cuando cambia en Supabase
 */
export function useConfigInteres() {
  const [config, setConfig] = useState<ConfiguracionInteres | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'configuracion_interes',
        },
        (payload) => {
          console.log('Config actualizada:', payload)
          loadConfig()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_interes')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) setConfig(data)
    } catch (error) {
      console.error('Error loading config:', error)
    } finally {
      setLoading(false)
    }
  }

  const moneda = config ? monedas.find(m => m.code === config.moneda) || monedas[0] : monedas[0]

  return {
    config,
    loading,
    tasaInteres: config?.tasa_interes || 5.0,
    monedaCode: config?.moneda || 'COP',
    monedaSymbol: moneda.symbol,
    monedaName: moneda.name,
    refresh: loadConfig,
  }
}
