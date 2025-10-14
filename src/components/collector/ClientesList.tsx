import { useEffect, useState } from 'react'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Search,
  Filter
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Cliente } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useConfigInteres } from '@/hooks/useConfigInteres'

export default function ClientesList() {
  // Renovar cliente: marca como completado y crea nuevo registro
  const handleRenovarCliente = async (cliente: Cliente) => {
    if (!window.confirm(`¿Seguro que deseas renovar a ${cliente.nombre}? Esto marcará la deuda anterior como completada y creará un nuevo préstamo.`)) return;

    try {
      // 1. Marcar cliente actual como completado
      const { error: updateError } = await supabase
        .from('clientes')
        .update({
          estado: 'completado',
          saldo_pendiente: 0,
          cuotas_pagadas: cliente.cuotas_totales,
          cuotas_pendientes: 0
        })
        .eq('id', cliente.id)

      if (updateError) throw updateError

      // 2. Crear nuevo registro de cliente (nuevo préstamo)
      const { error: insertError } = await supabase
        .from('clientes')
        .insert({
          nombre: cliente.nombre,
          cedula: cliente.cedula,
          telefono: cliente.telefono,
          direccion: cliente.direccion,
          monto_prestamo: cliente.monto_prestamo, // O pedir nuevos datos
          tipo_cobro: cliente.tipo_cobro,
          valor_cuota: cliente.valor_cuota,
          cuotas_totales: cliente.cuotas_totales,
          cuotas_pagadas: 0,
          cuotas_pendientes: cliente.cuotas_totales,
          saldo_pendiente: cliente.monto_prestamo,
          proximo_cobro: new Date().toISOString().split('T')[0],
          estado: 'al_dia',
          cobrador_id: cliente.cobrador_id,
          created_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      alert('Cliente renovado correctamente. El historial queda registrado.');
      loadClientes();
    } catch (error: any) {
      alert('Error al renovar cliente: ' + (error?.message || error))
    }
  }
  const { user } = useAuth()
  const { monedaSymbol, loading: configLoading } = useConfigInteres()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<'todos' | 'al_dia' | 'mora' | 'renovado'>('todos')
  const [showModal, setShowModal] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)

  useEffect(() => {
    loadClientes()
  }, [user])

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('cobrador_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setClientes(data)
    } catch (error) {
      console.error('Error loading clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClientes = clientes.filter((cliente) => {
    const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.telefono.includes(searchTerm) ||
                         cliente.cedula.includes(searchTerm)
    const matchesFilter = filterEstado === 'todos' || cliente.estado === filterEstado
    return matchesSearch && matchesFilter
  })

  const getEstadoConfig = (estado: Cliente['estado']) => {
    switch (estado) {
      case 'al_dia':
        return {
          icon: CheckCircle,
          label: 'Al Día',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        }
      case 'mora':
        return {
          icon: Clock,
          label: 'En Mora',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200',
        }
      case 'renovado':
        return {
          icon: AlertCircle,
          label: 'Renovado',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
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
          <h2 className="text-2xl font-bold text-gray-900">Mis Clientes</h2>
          <p className="text-gray-600 mt-1">
            {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''} asignado{filteredClientes.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterEstado('todos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterEstado === 'todos'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterEstado('al_dia')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterEstado === 'al_dia'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Al Día
          </button>
          <button
            onClick={() => setFilterEstado('mora')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterEstado === 'mora'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En Mora
          </button>
          <button
            onClick={() => setFilterEstado('renovado')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterEstado === 'renovado'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Renovados
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, teléfono o cédula..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Clientes Lista tipo tabla */}
      {filteredClientes.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Préstamo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuotas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Próximo Cobro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Renovar</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientes.map((cliente) => {
                const estadoConfig = getEstadoConfig(cliente.estado)
                const EstadoIcon = estadoConfig?.icon
                return (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{cliente.nombre}</td>
                    <td className="px-4 py-3 text-gray-700">{cliente.cedula}</td>
                    <td className="px-4 py-3 text-gray-700">{cliente.telefono}</td>
                    <td className="px-4 py-3 text-gray-700">{cliente.direccion || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{monedaSymbol}{cliente.monto_prestamo?.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {cliente.tipo_cobro}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{cliente.cuotas_pagadas}</span>/{cliente.cuotas_totales}
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary-600">{monedaSymbol}{cliente.saldo_pendiente?.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const [year, month, day] = cliente.proximo_cobro.split('T')[0].split('-').map(Number)
                        const fecha = new Date(year, month - 1, day)
                        return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${estadoConfig?.bgColor} ${estadoConfig?.textColor} ${estadoConfig?.borderColor}`}>
                        {EstadoIcon && <EstadoIcon size={14} className="mr-1" />} {estadoConfig?.label || cliente.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium transition-colors"
                        onClick={() => {
                          setSelectedCliente(cliente);
                          setShowModal(true);
                        }}
                      >
                        Ver Detalles
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cliente.estado !== 'completado' && cliente.cuotas_pendientes <= 10 && cliente.cuotas_pendientes > 0 && (
                        <button
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                          onClick={() => handleRenovarCliente(cliente)}
                        >
                          Renovar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    {/* Modal de Detalles del Cliente */}
    {showModal && selectedCliente && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative animate-fade-in text-gray-900">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold"
            onClick={() => setShowModal(false)}
            aria-label="Cerrar"
          >
            ×
          </button>
          <h3 className="text-xl font-bold mb-4 text-primary-700">Detalles del Cliente</h3>
          {selectedCliente.nombre ? (
            <div className="space-y-2">
              <div><span className="font-semibold">Nombre:</span> {selectedCliente.nombre}</div>
              <div><span className="font-semibold">Cédula:</span> {selectedCliente.cedula}</div>
              <div><span className="font-semibold">Teléfono:</span> {selectedCliente.telefono}</div>
              <div><span className="font-semibold">Dirección:</span> {selectedCliente.direccion || '-'}</div>
              <div><span className="font-semibold">Monto Préstamo:</span> {monedaSymbol}{selectedCliente.monto_prestamo?.toLocaleString('es-CO')}</div>
              <div><span className="font-semibold">Tipo de Cobro:</span> {selectedCliente.tipo_cobro}</div>
              <div><span className="font-semibold">Valor Cuota:</span> {monedaSymbol}{selectedCliente.valor_cuota?.toLocaleString('es-CO')}</div>
              <div><span className="font-semibold">Cuotas Pagadas:</span> {selectedCliente.cuotas_pagadas} / {selectedCliente.cuotas_totales}</div>
              <div><span className="font-semibold">Saldo Pendiente:</span> {monedaSymbol}{selectedCliente.saldo_pendiente?.toLocaleString('es-CO')}</div>
              <div><span className="font-semibold">Próximo Cobro:</span> {selectedCliente.proximo_cobro?.split('T')[0]}</div>
              <div><span className="font-semibold">Estado:</span> {selectedCliente.estado}</div>
              <div><span className="font-semibold">Fecha de Registro:</span> {selectedCliente.created_at?.split('T')[0]}</div>
            </div>
          ) : (
            <div className="text-center text-gray-500">No hay datos para este cliente.</div>
          )}
        </div>
      </div>
    )}
    </div>
  )
}
