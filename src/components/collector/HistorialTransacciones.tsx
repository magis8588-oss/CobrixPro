import { useEffect, useState } from 'react'
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Transaccion } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useConfigInteres } from '@/hooks/useConfigInteres'

export default function HistorialTransacciones() {
  const { user } = useAuth()
  const { monedaSymbol, loading: configLoading } = useConfigInteres()
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState<'todos' | 'cobro' | 'pago' | 'ajuste'>('todos')

  useEffect(() => {
    loadTransacciones()
  }, [user])

  const loadTransacciones = async () => {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('cobrador_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setTransacciones(data)
    } catch (error) {
      console.error('Error loading transacciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransacciones = transacciones.filter((t) => {
    return filterTipo === 'todos' || t.tipo === filterTipo
  })

  const getTipoConfig = (tipo: Transaccion['tipo']) => {
    switch (tipo) {
      case 'pago':
        return {
          icon: ArrowDownCircle,
          label: 'Pago',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          prefix: '+',
        }
      case 'cobro':
        return {
          icon: ArrowUpCircle,
          label: 'Cobro',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          prefix: '-',
        }
      case 'ajuste':
        return {
          icon: RefreshCw,
          label: 'Ajuste',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          prefix: '',
        }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Transacciones</h2>
          <p className="text-gray-600 mt-1">
            {filteredTransacciones.length} transacción{filteredTransacciones.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterTipo('todos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterTipo === 'todos'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterTipo('pago')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterTipo === 'pago'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pagos
          </button>
          <button
            onClick={() => setFilterTipo('cobro')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterTipo === 'cobro'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cobros
          </button>
          <button
            onClick={() => setFilterTipo('ajuste')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterTipo === 'ajuste'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ajustes
          </button>
        </div>
      </div>

      {/* Transacciones List */}
      {filteredTransacciones.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No se encontraron transacciones</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Vista desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Anterior
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Nuevo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransacciones.map((transaccion) => {
                  const config = getTipoConfig(transaccion.tipo)
                  const TipoIcon = config.icon

                  return (
                    <tr key={transaccion.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 ${config.bgColor} rounded-lg`}>
                            <TipoIcon className={config.color} size={16} />
                          </div>
                          <span className={`text-sm font-medium ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {transaccion.cliente_nombre}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{transaccion.descripcion}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-semibold ${config.color}`}>
                          {config.prefix}{monedaSymbol}{transaccion.monto.toLocaleString('es-CO')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-600">
                          {monedaSymbol}{transaccion.saldo_anterior.toLocaleString('es-CO')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {monedaSymbol}{transaccion.saldo_nuevo.toLocaleString('es-CO')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          {new Date(transaccion.fecha).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(transaccion.fecha).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Vista móvil */}
          <div className="lg:hidden divide-y divide-gray-200">
            {filteredTransacciones.map((transaccion) => {
              const config = getTipoConfig(transaccion.tipo)
              const TipoIcon = config.icon

              return (
                <div key={transaccion.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 ${config.bgColor} rounded-lg flex-shrink-0`}>
                      <TipoIcon className={config.color} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{transaccion.cliente_nombre}</h4>
                      <p className="text-sm text-gray-600 mt-1">{transaccion.descripcion}</p>
                    </div>
                    <span className={`text-sm font-medium ${config.color} flex-shrink-0`}>
                      {config.label}
                    </span>
                  </div>
                  
                  <div className="space-y-2 ml-14">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Monto:</span>
                      <span className={`text-sm font-semibold ${config.color}`}>
                        {config.prefix}{monedaSymbol}{transaccion.monto.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Saldo anterior:</span>
                      <span className="text-sm text-gray-600">
                        {monedaSymbol}{transaccion.saldo_anterior.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Saldo nuevo:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {monedaSymbol}{transaccion.saldo_nuevo.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                      <Calendar size={14} />
                      {new Date(transaccion.fecha).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      <span className="text-xs text-gray-400">
                        {new Date(transaccion.fecha).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
