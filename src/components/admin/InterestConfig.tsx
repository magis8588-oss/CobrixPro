import { useEffect, useState } from 'react'
import { Save, Percent, AlertCircle, Info, Coins } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ConfiguracionInteres } from '@/types'
import { monedas } from '@/lib/mockData'

export default function InterestConfig() {
  const [config, setConfig] = useState<ConfiguracionInteres | null>(null)
  const [tasaInteres, setTasaInteres] = useState('')
  const [moneda, setMoneda] = useState('COP')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_interes')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setConfig(data)
        setTasaInteres(data.tasa_interes.toString())
        setMoneda(data.moneda || 'COP')
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const tasa = parseFloat(tasaInteres)
      
      if (isNaN(tasa) || tasa < 0 || tasa > 100) {
        throw new Error('La tasa de interés debe estar entre 0 y 100')
      }

      const payload = {
        tasa_interes: tasa,
        moneda,
        updated_at: new Date().toISOString(),
      }

      if (config) {
        // Actualizar configuración existente
        const { error } = await supabase
          .from('configuracion_interes')
          .update(payload)
          .eq('id', config.id)

        if (error) throw error
      } else {
        // Crear nueva configuración
        const { error } = await supabase
          .from('configuracion_interes')
          .insert([payload])

        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' })
      fetchConfig()
    } catch (error: any) {
      console.error('Error al guardar:', error)
      setMessage({ type: 'error', text: error.message || 'Error al guardar la configuración' })
    } finally {
      setSaving(false)
    }
  }

  const calcularEjemplo = () => {
    const tasa = parseFloat(tasaInteres)
    if (isNaN(tasa)) return null

    const montoBase = 100000
    const interes = (montoBase * tasa) / 100
    const total = montoBase + interes

    return { montoBase, interes, total }
  }

  const ejemplo = calcularEjemplo()
  const monedaSeleccionada = monedas.find(m => m.code === moneda)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración de Interés</h1>
        <p className="text-gray-600 mt-1">
          Define la tasa de interés que los cobradores aplicarán
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando configuración...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tasa de Interés (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={tasaInteres}
                    onChange={(e) => setTasaInteres(e.target.value)}
                    className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg font-medium"
                    placeholder="0.00"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Percent className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Ejemplo: 5 significa un 5% de interés
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Coins className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                  >
                    {monedas.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.symbol} {m.name} ({m.code})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Selecciona la moneda para los cobros
                </p>
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg flex items-start gap-2 ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <AlertCircle
                    className={`w-5 h-5 flex-shrink-0 ${
                      message.type === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}
                  />
                  <p
                    className={`text-sm ${
                      message.type === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
              </button>

              {config && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Última actualización:{' '}
                    {new Date(config.updated_at).toLocaleString('es-CO')}
                  </p>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Panel de información y ejemplo */}
        <div className="space-y-6">
          {/* Información */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Información Importante
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>
                      Esta tasa será aplicada automáticamente en los cálculos de los cobradores
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>
                      Evita que los cobradores cobren de más o se aprovechen del cliente
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>
                      Los cambios se aplican inmediatamente para todos los usuarios
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>El historial de cambios queda registrado en el sistema</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ejemplo de cálculo */}
          {ejemplo && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Ejemplo de Cálculo</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Monto base:</span>
                  <span className="font-medium text-gray-900">
                    {monedaSeleccionada?.symbol}{ejemplo.montoBase.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Interés ({tasaInteres}%):</span>
                  <span className="font-medium text-primary-600">
                    {monedaSeleccionada?.symbol}{ejemplo.interes.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 bg-primary-50 px-3 rounded-lg">
                  <span className="font-semibold text-gray-900">Total a cobrar:</span>
                  <span className="text-xl font-bold text-primary-600">
                    {monedaSeleccionada?.symbol}{ejemplo.total.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                * Los valores son ejemplos basados en {monedaSeleccionada?.symbol}100,000 {moneda}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
