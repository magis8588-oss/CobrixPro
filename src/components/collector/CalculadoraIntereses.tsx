import { useState } from 'react'
import { Calculator, DollarSign, Percent } from 'lucide-react'
import { useConfigInteres } from '@/hooks/useConfigInteres'

export default function CalculadoraIntereses() {
  const { tasaInteres: tasaAdmin, monedaSymbol, monedaCode, loading } = useConfigInteres()
  const [monto, setMonto] = useState('')
  const [tasaPersonalizada, setTasaPersonalizada] = useState('')
  const [usarTasaPersonalizada, setUsarTasaPersonalizada] = useState(false)

  const tasaInteres = usarTasaPersonalizada && tasaPersonalizada
    ? parseFloat(tasaPersonalizada)
    : tasaAdmin

  const montoNumerico = parseFloat(monto) || 0
  const interes = (montoNumerico * tasaInteres) / 100
  const total = montoNumerico + interes

  // Ejemplos predefinidos
  const ejemplos = [
    { monto: 100000, label: '100K' },
    { monto: 500000, label: '500K' },
    { monto: 1000000, label: '1M' },
    { monto: 5000000, label: '5M' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Calculadora de Intereses</h2>
        <p className="text-gray-600 mt-1">
          Calcula rápidamente los intereses y el total a cobrar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Calculator className="text-primary-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Ingresa los Datos</h3>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto del Préstamo/Pago
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                min="0"
                step="1000"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                placeholder="0"
              />
            </div>

            {/* Quick Options */}
            <div className="mt-3 grid grid-cols-4 gap-2">
              {ejemplos.map((ejemplo) => (
                <button
                  key={ejemplo.monto}
                  type="button"
                  onClick={() => setMonto(ejemplo.monto.toString())}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {ejemplo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tasa de Interés */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Tasa de Interés
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usarTasaPersonalizada}
                  onChange={(e) => setUsarTasaPersonalizada(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">Personalizar</span>
              </label>
            </div>

            {usarTasaPersonalizada ? (
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  value={tasaPersonalizada}
                  onChange={(e) => setTasaPersonalizada(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.0"
                />
              </div>
            ) : (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-primary-700">Tasa Estándar:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {tasaAdmin}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> La tasa de interés estándar es configurada por el administrador
              y se aplica por defecto a todos los pagos.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Resultado Principal */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-sm p-8 text-white">
            <h3 className="text-lg font-semibold mb-6">Resultado del Cálculo</h3>

            <div className="space-y-6">
              <div>
                <p className="text-primary-100 text-sm mb-2">Monto Base</p>
                <p className="text-3xl font-bold">
                  {monedaSymbol}{montoNumerico.toLocaleString('es-CO')}
                </p>
              </div>

              <div className="h-px bg-white/20"></div>

              <div>
                <p className="text-primary-100 text-sm mb-2">
                  Interés ({tasaInteres.toFixed(2)}%)
                </p>
                <p className="text-2xl font-semibold">
                  +{monedaSymbol}{interes.toLocaleString('es-CO')}
                </p>
              </div>

              <div className="h-px bg-white/20"></div>

              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-primary-100 text-sm mb-2">Total a Cobrar</p>
                <p className="text-4xl font-bold">
                  {monedaSymbol}{total.toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </div>

          {/* Desglose */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Desglose Detallado</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Capital:</span>
                <span className="font-medium text-gray-900">
                  {monedaSymbol}{montoNumerico.toLocaleString('es-CO')}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Tasa aplicada:</span>
                <span className="font-medium text-primary-600">
                  {tasaInteres.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Interés generado:</span>
                <span className="font-medium text-primary-600">
                  {monedaSymbol}{interes.toLocaleString('es-CO')}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 bg-primary-50 px-3 rounded-lg">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-primary-600">
                  {monedaSymbol}{total.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {montoNumerico > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  De {monedaSymbol}{montoNumerico.toLocaleString('es-CO')}, el interés representa el{' '}
                  {((interes / montoNumerico) * 100).toFixed(2)}% del total
                </p>
              </div>
            )}
          </div>

          {/* Moneda Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Moneda:</strong> {monedaCode} ({monedaSymbol})
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Todos los cálculos se realizan en la moneda configurada por el administrador
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
