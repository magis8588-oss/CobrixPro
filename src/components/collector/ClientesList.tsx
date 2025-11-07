import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Cliente } from '../../types'
import { Search, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useConfigInteres } from '../../hooks/useConfigInteres'
import { calcularProximoCobro } from '../../lib/fechasUtils'
import AlertModal from '../ui/AlertModal'

export default function ClientesList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { monedaSymbol, loading: configLoading } = useConfigInteres()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'al_dia' | 'mora' | 'renovado' | 'completado'>('todos')
  
  // Estados para el modal de pago múltiple
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [cuotasAPagar, setCuotasAPagar] = useState(1)
  
  // Estados para el modal de renovar
  const [showRenovarModal, setShowRenovarModal] = useState(false)
  const [clienteRenovar, setClienteRenovar] = useState<Cliente | null>(null)
  
  // Estado para alertas
  const [alertState, setAlertState] = useState({
    open: false,
    type: 'success' as 'success' | 'error' | 'warning',
    title: '',
    message: ''
  })

  useEffect(() => {
    if (user) {
      loadClientes()
    }
  }, [user])

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('cobrador_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Mapear datos para asegurar compatibilidad
      const clientesMapeados = (data || []).map((cliente: any) => ({
        ...cliente,
        cuotas_pendientes: cliente.cuotas_totales - cliente.cuotas_pagadas,
        proximo_cobro: cliente.proximo_cobro || new Date().toISOString(),
        estado: cliente.estado === 'atrasado' ? 'mora' : cliente.estado,
      }))
      
      setClientes(clientesMapeados)
    } catch (error) {
      console.error('Error loading clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calcular cuotas atrasadas
  const calcularCuotasAtrasadas = (cliente: Cliente): number => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const proximoCobro = new Date(cliente.proximo_cobro)
    proximoCobro.setHours(0, 0, 0, 0)
    
    if (proximoCobro >= hoy) return 0
    
    const diasDiferencia = Math.floor((hoy.getTime() - proximoCobro.getTime()) / (1000 * 60 * 60 * 24))
    
    const diasPorCuota: { [key: string]: number } = {
      'diario': 1,
      'semanal': 7,
      'quincenal': 15
    }
    
    const dias = diasPorCuota[cliente.tipo_cobro] || 7
    return Math.floor(diasDiferencia / dias) + 1
  }

  // Abrir modal de pago
  const abrirModalPago = (cliente: Cliente) => {
    const atrasadas = calcularCuotasAtrasadas(cliente)
    setClienteSeleccionado(cliente)
    setCuotasAPagar(atrasadas > 0 ? atrasadas : 1)
    setShowPagoModal(true)
  }

  // Registrar pago de múltiples cuotas
  const handlePagarCuotas = async () => {
    if (!clienteSeleccionado || cuotasAPagar <= 0) return

    const cuotasDisponibles = clienteSeleccionado.cuotas_pendientes
    if (cuotasAPagar > cuotasDisponibles) {
      setAlertState({
        open: true,
        type: 'error',
        title: 'Error',
        message: `No puedes pagar ${cuotasAPagar} cuotas. Solo quedan ${cuotasDisponibles} pendientes.`
      })
      return
    }

    try {
      const nuevoCuotasPagadas = clienteSeleccionado.cuotas_pagadas + cuotasAPagar
      const nuevoSaldoPendiente = clienteSeleccionado.saldo_pendiente - (clienteSeleccionado.valor_cuota * cuotasAPagar)
      
      // Calcular próximo cobro avanzando las cuotas pagadas
      let fechaProximoCobro = new Date(clienteSeleccionado.proximo_cobro)
      const diasPorCuota: { [key: string]: number } = {
        'diario': 1,
        'semanal': 7,
        'quincenal': 15
      }
      const diasAvance = diasPorCuota[clienteSeleccionado.tipo_cobro] * cuotasAPagar
      fechaProximoCobro.setDate(fechaProximoCobro.getDate() + diasAvance)
      
      const fechaProximoCobroStr = calcularProximoCobro(fechaProximoCobro, clienteSeleccionado.tipo_cobro)
      
      const datosActualizacion = {
        cuotas_pagadas: nuevoCuotasPagadas,
        saldo_pendiente: nuevoSaldoPendiente,
        proximo_cobro: fechaProximoCobroStr,
        estado: nuevoCuotasPagadas >= clienteSeleccionado.cuotas_totales ? 'completado' : 'al_dia',
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('clientes')
        .update(datosActualizacion)
        .eq('id', clienteSeleccionado.id)

      if (error) throw error

      setAlertState({
        open: true,
        type: 'success',
        title: '✅ Pago registrado',
        message: `Se registraron ${cuotasAPagar} cuota${cuotasAPagar > 1 ? 's' : ''} por ${monedaSymbol}${(clienteSeleccionado.valor_cuota * cuotasAPagar).toLocaleString('es-CO')}`
      })

      setShowPagoModal(false)
      setClienteSeleccionado(null)
      setCuotasAPagar(1)
      loadClientes()
    } catch (error: any) {
      console.error('Error al registrar pago:', error)
      setAlertState({
        open: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo registrar el pago'
      })
    }
  }

  // Marcar como no pagó
  const handleNoPago = async (clienteId: string) => {
    try {
      const cliente = clientes.find(c => c.id === clienteId)
      if (!cliente) return

      const fechaProximoCobroStr = calcularProximoCobro(new Date(), cliente.tipo_cobro)
      
      const { error } = await supabase
        .from('clientes')
        .update({
          estado: 'mora',
          proximo_cobro: fechaProximoCobroStr,
          updated_at: new Date().toISOString()
        })
        .eq('id', clienteId)

      if (error) throw error

      setAlertState({
        open: true,
        type: 'warning',
        title: 'Cliente marcado en mora',
        message: `${cliente.nombre} ha sido marcado como atrasado`
      })

      loadClientes()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Abrir modal de renovar
  const abrirRenovar = (cliente: Cliente) => {
    setClienteRenovar(cliente)
    setShowRenovarModal(true)
  }

  const clientesFiltrados = clientes.filter(cliente => {
    const matchSearch = 
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cedula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefono.includes(searchTerm)

    const matchEstado = filtroEstado === 'todos' || 
                       (filtroEstado === 'mora' && cliente.estado === 'mora') ||
                       cliente.estado === filtroEstado

    return matchSearch && matchEstado
  })

  if (loading || configLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando clientes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mis Clientes</h2>
        <p className="text-gray-600 mt-1">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} asignado{clientes.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white border-none rounded-lg focus:ring-2 focus:ring-primary-500 placeholder-gray-400"
          />
        </div>

        {/* Pestañas de filtro - SIN scroll horizontal */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroEstado === 'todos'
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroEstado('al_dia')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroEstado === 'al_dia'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Al Día
          </button>
          <button
            onClick={() => setFiltroEstado('mora')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroEstado === 'mora'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En Mora
          </button>
          <button
            onClick={() => setFiltroEstado('renovado')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroEstado === 'renovado'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Renovados
          </button>
          <button
            onClick={() => setFiltroEstado('completado')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroEstado === 'completado'
                ? 'bg-gray-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completados
          </button>
        </div>
      </div>

      {/* Grid de Tarjetas - Mobile First */}
      <div className="grid grid-cols-1 gap-4">
        {clientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron clientes
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Intenta con otro término de búsqueda' : 'No hay clientes con este filtro'}
            </p>
          </div>
        ) : (
          clientesFiltrados.map((cliente) => {
            const cuotasAtrasadas = calcularCuotasAtrasadas(cliente)
            const progreso = ((cliente.cuotas_pagadas / cliente.cuotas_totales) * 100).toFixed(0)
            
            // Determinar color del borde según estado
            const borderColor = 
              cliente.estado === 'completado' ? 'border-gray-400' :
              cliente.estado === 'mora' || cuotasAtrasadas > 0 ? 'border-red-500' :
              cliente.estado === 'renovado' ? 'border-blue-500' :
              'border-green-500'
            
            return (
              <div 
                key={cliente.id} 
                className={`bg-white rounded-lg shadow-sm border-l-4 ${borderColor} overflow-hidden hover:shadow-md transition-shadow`}
              >
                {/* Header compacto */}
                <div className={`px-3 py-2 border-b ${
                  cliente.estado === 'completado' ? 'bg-gradient-to-r from-gray-50 to-white border-gray-100' :
                  cliente.estado === 'mora' || cuotasAtrasadas > 0 ? 'bg-gradient-to-r from-red-50 to-white border-red-100' :
                  cliente.estado === 'renovado' ? 'bg-gradient-to-r from-blue-50 to-white border-blue-100' :
                  'bg-gradient-to-r from-green-50 to-white border-green-100'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">
                        {cliente.nombre}
                      </h4>
                      <p className="text-xs text-gray-600">
                        📱 {cliente.telefono}
                      </p>
                    </div>
                    <div className="flex gap-1 items-center flex-shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                        cliente.estado === 'completado' ? 'bg-gray-100 text-gray-700' :
                        cliente.estado === 'mora' ? 'bg-red-100 text-red-700' :
                        cliente.estado === 'renovado' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {cliente.estado === 'completado' ? 'OK' :
                         cliente.estado === 'mora' ? 'MORA' :
                         cliente.estado === 'renovado' ? 'REN' :
                         'OK'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                        {cliente.tipo_cobro === 'diario' ? 'D' : cliente.tipo_cobro === 'semanal' ? 'S' : 'Q'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Alerta de atraso - compacta */}
                  {cuotasAtrasadas > 0 && cliente.estado !== 'completado' && (
                    <div className="mt-1.5 bg-red-100 border border-red-300 rounded px-2 py-1 flex items-center gap-1">
                      <AlertCircle size={12} className="text-red-700 flex-shrink-0" />
                      <span className="text-xs font-bold text-red-900">
                        {cuotasAtrasadas} atrasada{cuotasAtrasadas !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenido compacto */}
                <div className="px-3 py-2 space-y-2">
                  {/* Barra de progreso */}
                  {cliente.estado !== 'completado' && (
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">{cliente.cuotas_pagadas}/{cliente.cuotas_totales}</span>
                        <span className={`font-bold ${
                          cuotasAtrasadas > 0 ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {progreso}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-full rounded-full ${
                            cuotasAtrasadas > 0 ? 'bg-red-500' :
                            parseInt(progreso) >= 75 ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Info financiera compacta */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-blue-50 rounded px-2 py-1">
                      <p className="text-xs text-blue-700">Cuota</p>
                      <p className="text-xs font-bold text-blue-900">
                        {monedaSymbol}{cliente.valor_cuota.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className={`${
                      cliente.estado === 'completado' ? 'bg-gray-50' : 
                      cuotasAtrasadas > 0 ? 'bg-red-50' : 'bg-green-50'
                    } rounded px-2 py-1`}>
                      <p className={`text-xs ${
                        cliente.estado === 'completado' ? 'text-gray-700' :
                        cuotasAtrasadas > 0 ? 'text-red-700' : 'text-green-700'
                      }`}>
                        Saldo
                      </p>
                      <p className={`text-xs font-bold ${
                        cliente.estado === 'completado' ? 'text-gray-900' :
                        cuotasAtrasadas > 0 ? 'text-red-900' : 'text-green-900'
                      }`}>
                        {monedaSymbol}{cliente.saldo_pendiente.toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción compactos */}
                  {cliente.estado !== 'completado' && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => abrirModalPago(cliente)}
                        className="flex items-center justify-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                      >
                        <CheckCircle size={12} />
                        <span>{cuotasAtrasadas > 0 ? `(${cuotasAtrasadas})` : 'Pagar'}</span>
                      </button>
                      
                      <button
                        onClick={() => handleNoPago(cliente.id)}
                        className="flex items-center justify-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                      >
                        <XCircle size={12} />
                        <span>Mora</span>
                      </button>
                      
                      {cliente.cuotas_pendientes <= 10 && cliente.cuotas_pendientes > 0 && (
                        <button
                          onClick={() => abrirRenovar(cliente)}
                          className="col-span-2 flex items-center justify-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                        >
                          <RefreshCw size={12} />
                          <span>Renovar (faltan {cliente.cuotas_pendientes})</span>
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Mensaje de completado compacto */}
                  {cliente.estado === 'completado' && (
                    <div className="bg-green-50 border border-green-200 rounded px-2 py-1 flex items-center gap-1.5">
                      <CheckCircle className="text-green-600 flex-shrink-0" size={14} />
                      <p className="font-bold text-green-900 text-xs">✅ Completado</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de Pago Múltiple */}
      {showPagoModal && clienteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={18} />
                <h3 className="text-lg font-bold text-green-900">Registrar Pago</h3>
              </div>
              <button
                onClick={() => {
                  setShowPagoModal(false)
                  setClienteSeleccionado(null)
                  setCuotasAPagar(1)
                }}
                className="p-1 hover:bg-green-100 rounded-lg transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Cliente</p>
                <p className="font-semibold text-gray-900 text-sm">{clienteSeleccionado.nombre}</p>
              </div>

              {/* Información de cuotas */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700">Cuotas pendientes:</span>
                  <span className="font-bold text-blue-900">{clienteSeleccionado.cuotas_pendientes}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700">Valor por cuota:</span>
                  <span className="font-bold text-blue-900">{monedaSymbol}{clienteSeleccionado.valor_cuota.toLocaleString('es-CO')}</span>
                </div>
              </div>

              {/* Cuotas atrasadas */}
              {calcularCuotasAtrasadas(clienteSeleccionado) > 0 && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle className="text-red-600" size={14} />
                    <span className="font-bold text-red-900 text-xs">Cuotas atrasadas</span>
                  </div>
                  <p className="text-xs text-red-700">
                    {calcularCuotasAtrasadas(clienteSeleccionado)} cuota{calcularCuotasAtrasadas(clienteSeleccionado) > 1 ? 's' : ''} atrasada{calcularCuotasAtrasadas(clienteSeleccionado) > 1 ? 's' : ''}.
                  </p>
                </div>
              )}

              {/* Selector de cuotas */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ¿Cuántas cuotas?
                </label>
                <input
                  type="number"
                  min="1"
                  max={clienteSeleccionado.cuotas_pendientes}
                  value={cuotasAPagar}
                  onChange={(e) => setCuotasAPagar(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-base font-bold"
                />
              </div>

              {/* Botones rápidos */}
              <div className="grid grid-cols-3 gap-1.5">
                {calcularCuotasAtrasadas(clienteSeleccionado) > 0 && (
                  <button
                    onClick={() => setCuotasAPagar(calcularCuotasAtrasadas(clienteSeleccionado))}
                    className="px-2 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                  >
                    Atrasadas ({calcularCuotasAtrasadas(clienteSeleccionado)})
                  </button>
                )}
                <button
                  onClick={() => setCuotasAPagar(1)}
                  className="px-2 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                >
                  Solo 1
                </button>
                <button
                  onClick={() => setCuotasAPagar(clienteSeleccionado.cuotas_pendientes)}
                  className="px-2 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                >
                  Todas
                </button>
              </div>

              {/* Total a pagar */}
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-lg p-3">
                <p className="text-xs text-green-700 mb-0.5">Total a recibir</p>
                <p className="text-2xl font-bold text-green-900">
                  {monedaSymbol}{(clienteSeleccionado.valor_cuota * cuotasAPagar).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  {cuotasAPagar} cuota{cuotasAPagar > 1 ? 's' : ''} × {monedaSymbol}{clienteSeleccionado.valor_cuota.toLocaleString('es-CO')}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowPagoModal(false)
                  setClienteSeleccionado(null)
                  setCuotasAPagar(1)
                }}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handlePagarCuotas}
                disabled={cuotasAPagar <= 0 || cuotasAPagar > clienteSeleccionado.cuotas_pendientes}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <CheckCircle size={16} />
                <span>Confirmar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alertas */}
      <AlertModal
        isOpen={alertState.open}
        onClose={() => setAlertState(prev => ({ ...prev, open: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />

      {/* Modal de Renovar - Redirige a Dashboard */}
      {showRenovarModal && clienteRenovar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="text-blue-600" size={18} />
                <h3 className="text-lg font-bold text-blue-900">Renovar Préstamo</h3>
              </div>
              <button
                onClick={() => {
                  setShowRenovarModal(false)
                  setClienteRenovar(null)
                }}
                className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Cliente</p>
                <p className="font-semibold text-gray-900 text-sm">{clienteRenovar.nombre}</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs text-orange-900 mb-1 font-semibold">Deuda Actual</p>
                <div className="space-y-1 text-xs text-gray-700">
                  <p>Cuotas pendientes: <strong>{clienteRenovar.cuotas_pendientes}</strong></p>
                  <p>Saldo pendiente: <strong className="text-orange-600">{monedaSymbol}{clienteRenovar.saldo_pendiente.toLocaleString('es-CO')}</strong></p>
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-900 font-semibold mb-2">
                  💡 Para renovar este préstamo
                </p>
                <p className="text-xs text-blue-700">
                  Ve al <strong>Dashboard principal</strong> donde encontrarás el botón de renovar con todos los cálculos automáticos
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRenovarModal(false)
                  setClienteRenovar(null)
                }}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowRenovarModal(false)
                  setClienteRenovar(null)
                  navigate('/collector/dashboard')
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm"
              >
                <RefreshCw size={14} />
                <span>Ir al Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
