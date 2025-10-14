import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  User, 
  CreditCard,
  Save,
  X,
  CheckCircle,
  Calculator
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Cliente } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useConfigInteres } from '@/hooks/useConfigInteres'

export default function RegistrarPago() {
  const { user } = useAuth()
  const { tasaInteres, monedaSymbol, loading: configLoading } = useConfigInteres()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [clienteId, setClienteId] = useState('')
  const [monto, setMonto] = useState('')
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    loadClientes()
  }, [user])

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('cobrador_id', user?.id)
        .order('nombre')

      if (error) throw error
      if (data) setClientes(data)
    } catch (error) {
      console.error('Error loading clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const clienteSeleccionado = clientes.find(c => c.id === clienteId)
  const montoNumerico = parseFloat(monto) || 0
  const montoInteres = (montoNumerico * tasaInteres) / 100
  const montoTotal = montoNumerico + montoInteres

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clienteId || !monto || montoNumerico <= 0) {
      setMessage({ type: 'error', text: 'Por favor completa todos los campos requeridos' })
      return
    }

    if (!clienteSeleccionado) {
      setMessage({ type: 'error', text: 'Cliente no encontrado' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // Guardar en Supabase
      const { error } = await supabase.from('pagos').insert([
        {
          cliente_id: clienteId,
          cliente_nombre: clienteSeleccionado.nombre,
          monto: montoNumerico,
          monto_interes: montoInteres,
          monto_total: montoTotal,
          metodo_pago: metodoPago,
          fecha_pago: new Date().toISOString(),
          notas: notas || null,
          cobrador_id: user?.id,
          cobrador_nombre: user?.nombre,
        },
      ])

      if (error) throw error

      setMessage({ type: 'success', text: 'Pago registrado exitosamente' })
      
      // Reset form
      setClienteId('')
      setMonto('')
      setMetodoPago('efectivo')
      setNotas('')
    } catch (error: any) {
      console.error('Error saving pago:', error)
      setMessage({ type: 'error', text: error.message || 'Error al registrar el pago' })
    } finally {
      setSaving(false)
    }
  }

  if (loading || configLoading) {
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
        <h2 className="text-2xl font-bold text-gray-900">Registrar Pago</h2>
        <p className="text-gray-600 mt-1">Registra un nuevo pago de cliente</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="flex-shrink-0" size={20} />
          ) : (
            <X className="flex-shrink-0" size={20} />
          )}
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)}>
            <X size={20} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} - Pendiente: {monedaSymbol}{cliente.saldo_pendiente.toLocaleString('es-CO')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto del Pago *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  min="0"
                  step="1000"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Ingresa el monto sin intereses
              </p>
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMetodoPago('efectivo')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    metodoPago === 'efectivo'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <DollarSign className="mx-auto mb-2" size={24} />
                  <span className="text-sm font-medium">Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('transferencia')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    metodoPago === 'transferencia'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="mx-auto mb-2" size={24} />
                  <span className="text-sm font-medium">Transferencia</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('tarjeta')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    metodoPago === 'tarjeta'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="mx-auto mb-2" size={24} />
                  <span className="text-sm font-medium">Tarjeta</span>
                </button>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (Opcional)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Observaciones adicionales sobre el pago..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving || !clienteId || !monto}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Registrar Pago
                </>
              )}
            </button>
          </form>
        </div>

        {/* Resumen */}
        <div className="space-y-6">
          {/* Cliente Info */}
          {clienteSeleccionado && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Cliente Seleccionado</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium text-gray-900">{clienteSeleccionado.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saldo Pendiente</p>
                  <p className="text-lg font-bold text-red-600">
                    {monedaSymbol}{clienteSeleccionado.saldo_pendiente.toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      clienteSeleccionado.estado === 'al_dia'
                        ? 'bg-green-100 text-green-700'
                        : clienteSeleccionado.estado === 'mora'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {clienteSeleccionado.estado === 'al_dia'
                      ? 'Al Día'
                      : clienteSeleccionado.estado === 'mora'
                      ? 'En Mora'
                      : 'Renovado'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cálculo del Pago */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="text-primary-600" size={20} />
              <h3 className="font-semibold text-gray-900">Cálculo del Pago</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Monto base:</span>
                <span className="font-medium text-gray-900">
                  {monedaSymbol}{montoNumerico.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Interés ({tasaInteres}%):</span>
                <span className="font-medium text-primary-600">
                  +{monedaSymbol}{montoInteres.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="pt-3 border-t border-primary-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total a cobrar:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {monedaSymbol}{montoTotal.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
