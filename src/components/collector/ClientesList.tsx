import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Cliente } from '../../types'
import { Search, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useCalculosPrestamo } from '../../hooks/useCalculosPrestamo'
import { calcularProximoCobro, calcularPrimerCobro } from '../../lib/fechasUtils'
import AlertModal from '../ui/AlertModal'

export default function ClientesList() {
  const { user } = useAuth()
  const { monedaSymbol, calcularCuotas, loading: configLoading } = useCalculosPrestamo()
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
  const [nuevoMonto, setNuevoMonto] = useState('')
  
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

  // Determinar si el cobro es HOY
  const esCobroHoy = (cliente: Cliente): boolean => {
    const hoy = new Date()
    const hoyStr = hoy.toISOString().split('T')[0]
    const proximoCobroStr = cliente.proximo_cobro.split('T')[0]
    return proximoCobroStr === hoyStr
  }

  // Calcular cuotas atrasadas
  const calcularCuotasAtrasadas = (cliente: Cliente): number => {
    // IMPORTANTE: Las cuotas atrasadas se calculan SOLO mirando cuántas cuotas
    // están pendientes de pago, NO desde la fecha de inicio
    // El sistema de próximo_cobro ya maneja la lógica de acumulación
    
    // Comparar solo fechas en formato string para evitar problemas de zona horaria
    const hoy = new Date()
    const hoyStr = hoy.toISOString().split('T')[0]
    const proximoCobroStr = cliente.proximo_cobro.split('T')[0]

    // Si el próximo cobro es hoy o futuro, no hay cuotas atrasadas
    // Las cuotas pendientes se pagan cuando el cobrador registra el pago
    if (proximoCobroStr >= hoyStr) return 0

    // Si el próximo cobro ya pasó, calcular cuántos días/cuotas se atrasó
    const [year1, month1, day1] = proximoCobroStr.split('-').map(Number)
    const [year2, month2, day2] = hoyStr.split('-').map(Number)

    const fecha1 = new Date(year1, month1 - 1, day1)
    const fecha2 = new Date(year2, month2 - 1, day2)

    const diasDiferencia = Math.floor((fecha2.getTime() - fecha1.getTime()) / (1000 * 60 * 60 * 24))

    const diasPorCuota: { [key: string]: number } = {
      'diario': 1,
      'semanal': 7,
      'quincenal': 15
    }

    const dias = diasPorCuota[cliente.tipo_cobro] || 7
    
    // Calcular cuántas cuotas se atrasaron
    // Si pasaron 3 días y es diario, son 3 cuotas atrasadas
    const cuotasAtrasadas = Math.floor(diasDiferencia / dias)
    
    // Nunca retornar más cuotas atrasadas que las pendientes
    return Math.min(cuotasAtrasadas, cliente.cuotas_pendientes)
  }// Abrir modal de pago
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

      // IMPORTANTE: El próximo cobro SIEMPRE es según el tipo de cobro desde HOY
      // No importa cuántas cuotas pague, si paga hoy, mañana toca cobrar de nuevo
      // Las cuotas adicionales solo reducen el total pendiente y acelera el fin del préstamo
      const hoy = new Date()
      const fechaProximoCobroStr = calcularProximoCobro(hoy, clienteSeleccionado.tipo_cobro)

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
          estado: 'atrasado',
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
    setNuevoMonto('')
    setShowRenovarModal(true)
  }

  // Renovar préstamo
  const handleRenovar = async () => {
    if (!clienteRenovar || !nuevoMonto) return

    const montoNuevo = parseFloat(nuevoMonto)
    if (montoNuevo <= 0) {
      setAlertState({
        open: true,
        type: 'warning',
        title: 'Monto inválido',
        message: 'El monto debe ser mayor a cero'
      })
      return
    }

    // Validar que el nuevo monto sea mayor que la deuda
    const deudaPendiente = clienteRenovar.saldo_pendiente
    if (montoNuevo < deudaPendiente) {
      setAlertState({
        open: true,
        type: 'warning',
        title: 'Monto insuficiente',
        message: `El nuevo préstamo debe ser mayor a la deuda pendiente de ${monedaSymbol}${deudaPendiente.toLocaleString('es-CO')}`
      })
      return
    }

    try {
      // IMPORTANTE: El préstamo se renueva SOLO con el monto nuevo (no suma la deuda)
      // El cobrador le entrega al cliente: montoNuevo - deudaPendiente
      const montoAEntregar = montoNuevo - deudaPendiente
      // Calcular cuotas sobre el MONTO NUEVO (no sobre monto + deuda)
      const { cuotasTotales, valorCuota } = calcularCuotas(montoNuevo, clienteRenovar.tipo_cobro)
      // Parsear fecha YYYY-MM-DD sin conversión de zona horaria
      const fechaProximoCobroStr = calcularPrimerCobro(clienteRenovar.tipo_cobro)
      const [year, month, day] = fechaProximoCobroStr.split('-').map(Number)
      const fechaProximoCobro = new Date(year, month - 1, day)
      // Usar fecha actual
      const hoy = new Date()
      const fechaInicioString = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

      const datosRenovacion = {
        monto_prestamo: montoNuevo, // Solo el monto nuevo, NO suma la deuda
        valor_cuota: valorCuota,
        cuotas_totales: cuotasTotales,
        cuotas_pagadas: 0,
        saldo_pendiente: valorCuota * cuotasTotales,
        fecha_inicio: fechaInicioString, // DATE format YYYY-MM-DD
        proximo_cobro: fechaProximoCobroStr, // DATE format YYYY-MM-DD
        estado: 'renovado',
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('clientes')
        .update(datosRenovacion)
        .eq('id', clienteRenovar.id)

      if (error) {
        console.error('Error al renovar préstamo:', error)
        setAlertState({
          open: true,
          type: 'error',
          title: 'Error al renovar',
          message: `No se pudo renovar el préstamo: ${error.message}`
        })
        return
      }

      // Mensaje informativo para el cobrador
      setAlertState({
        open: true,
        type: 'success',
        title: '¡Préstamo renovado!',
        message: `💵 Nuevo préstamo: ${monedaSymbol}${montoNuevo.toLocaleString('es-CO')}\n` +
                 `💳 Deuda descontada: ${monedaSymbol}${deudaPendiente.toLocaleString('es-CO')}\n` +
                 `💰 Entregar al cliente: ${monedaSymbol}${montoAEntregar.toLocaleString('es-CO')}\n\n` +
                 `📊 Total a pagar: ${monedaSymbol}${(valorCuota * cuotasTotales).toLocaleString('es-CO')}\n` +
                 `📅 Primer cobro: ${fechaProximoCobro.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}`
      })

      loadClientes()

      setNuevoMonto('')
      setClienteRenovar(null)
      setShowRenovarModal(false)
    } catch (error: any) {
      console.error('Error inesperado:', error)
      setAlertState({
        open: true,
        type: 'error',
        title: 'Error inesperado',
        message: `Ocurrió un error: ${error.message}`
      })
    }
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
            
            // Determinar si es cobro de hoy o mora
            const cobroHoy = esCobroHoy(cliente)
            const estaMora = cliente.estado === 'mora' && !cobroHoy

            // Determinar color del borde según estado
            const borderColor =
              cliente.estado === 'completado' ? 'border-gray-400' :
              estaMora ? 'border-red-500' :
              cobroHoy && cliente.estado === 'mora' ? 'border-orange-500' :
              cliente.estado === 'renovado' ? 'border-blue-500' :
              cliente.estado === 'mora' ? 'border-red-500' :
              'border-green-500'

            return (
              <div
                key={cliente.id}
                className={`bg-white rounded-lg shadow-sm border-l-4 ${borderColor} overflow-hidden hover:shadow-md transition-shadow`}
              >
                {/* Header compacto */}
                <div className={`px-3 py-2 border-b ${
                  cliente.estado === 'completado' ? 'bg-gradient-to-r from-gray-50 to-white border-gray-100' :
                  estaMora ? 'bg-gradient-to-r from-red-50 to-white border-red-100' :
                  cobroHoy && cliente.estado === 'mora' ? 'bg-gradient-to-r from-orange-50 to-white border-orange-100' :
                  cliente.estado === 'renovado' ? 'bg-gradient-to-r from-blue-50 to-white border-blue-100' :
                  cliente.estado === 'mora' ? 'bg-gradient-to-r from-red-50 to-white border-red-100' :
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
                      estaMora ? 'bg-red-100 text-red-700' :
                      cobroHoy ? 'bg-orange-100 text-orange-700' :
                      cliente.estado === 'renovado' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {cliente.estado === 'completado' ? 'OK' :
                       estaMora ? 'MORA' :
                       cobroHoy ? 'HOY' :
                       cliente.estado === 'renovado' ? 'REN' :
                       'OK'}
                    </span>
                      <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                        {cliente.tipo_cobro === 'diario' ? 'D' : cliente.tipo_cobro === 'semanal' ? 'S' : 'Q'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Alerta de atraso/cobro hoy - compacta */}
                  {cuotasAtrasadas > 0 && cliente.estado !== 'completado' && (
                    <div className={`mt-1.5 border rounded px-2 py-1 flex items-center gap-1 ${
                      cobroHoy 
                        ? 'bg-orange-100 border-orange-300' 
                        : 'bg-red-100 border-red-300'
                    }`}>
                      <AlertCircle size={12} className={`flex-shrink-0 ${
                        cobroHoy ? 'text-orange-700' : 'text-red-700'
                      }`} />
                      <span className={`text-xs font-bold ${
                        cobroHoy ? 'text-orange-900' : 'text-red-900'
                      }`}>
                        {cobroHoy 
                          ? '🕐 Cobro hoy' 
                          : `${cuotasAtrasadas} atrasada${cuotasAtrasadas !== 1 ? 's' : ''}`
                        }
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
                          estaMora ? 'text-red-600' : 
                          cobroHoy ? 'text-orange-600' : 
                          'text-blue-600'
                        }`}>
                          {progreso}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-full rounded-full ${
                            estaMora ? 'bg-red-500' :
                            cobroHoy ? 'bg-orange-500' :
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
                      estaMora ? 'bg-red-50' : 
                      cobroHoy ? 'bg-orange-50' : 
                      'bg-green-50'
                    } rounded px-2 py-1`}>
                      <p className={`text-xs ${
                        cliente.estado === 'completado' ? 'text-gray-700' :
                        estaMora ? 'text-red-700' :
                        cobroHoy ? 'text-orange-700' :
                        'text-green-700'
                      }`}>
                        Saldo
                      </p>
                      <p className={`text-xs font-bold ${
                        cliente.estado === 'completado' ? 'text-gray-900' :
                        estaMora ? 'text-red-900' :
                        cobroHoy ? 'text-orange-900' :
                        'text-green-900'
                      }`}>
                        {monedaSymbol}{cliente.saldo_pendiente.toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>

                  {/* Fecha de próximo cobro */}
                  {cliente.estado !== 'completado' && (
                    <div className={`mt-1.5 rounded px-2 py-1 border ${
                      estaMora ? 'bg-red-50 border-red-200' : 
                      cobroHoy ? 'bg-orange-50 border-orange-200' :
                      'bg-purple-50 border-purple-200'
                    }`}>
                      <p className={`text-xs ${
                        estaMora ? 'text-red-700' : 
                        cobroHoy ? 'text-orange-700' :
                        'text-purple-700'
                      }`}>
                        📅 Próximo cobro:
                      </p>
                      <p className={`text-xs font-bold ${
                        estaMora ? 'text-red-900' : 
                        cobroHoy ? 'text-orange-900' :
                        'text-purple-900'
                      }`}>
                        {(() => {
                          const [year, month, day] = cliente.proximo_cobro.split('T')[0].split('-').map(Number);
                          const fecha = new Date(year, month - 1, day);
                          return fecha.toLocaleDateString('es-CO', { 
                            weekday: 'short',
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          });
                        })()}
                      </p>
                    </div>
                  )}                  {/* Botones de acción compactos */}
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
                          <span>No Pagó</span>
                        </button>                      {cliente.cuotas_pendientes <= 10 && cliente.cuotas_pendientes > 0 && (
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

      {/* Modal de Renovar - Funcional */}
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
                  setNuevoMonto('')
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

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nuevo Monto del Préstamo
                </label>
                <input
                  type="number"
                  value={nuevoMonto}
                  onChange={(e) => setNuevoMonto(e.target.value)}
                  placeholder={`Mínimo ${monedaSymbol}${clienteRenovar.saldo_pendiente.toLocaleString('es-CO')}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {nuevoMonto && parseFloat(nuevoMonto) >= clienteRenovar.saldo_pendiente && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-900 mb-1 font-semibold">Preview del Nuevo Préstamo</p>
                  <div className="space-y-1 text-xs text-gray-700">
                    <p>💵 Nuevo préstamo: <strong>{monedaSymbol}{parseFloat(nuevoMonto).toLocaleString('es-CO')}</strong></p>
                    <p>💳 Deuda descontada: <strong>{monedaSymbol}{clienteRenovar.saldo_pendiente.toLocaleString('es-CO')}</strong></p>
                    <p className="text-green-700 font-bold">💰 Entregar al cliente: {monedaSymbol}{(parseFloat(nuevoMonto) - clienteRenovar.saldo_pendiente).toLocaleString('es-CO')}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRenovarModal(false)
                  setClienteRenovar(null)
                  setNuevoMonto('')
                }}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleRenovar}
                disabled={!nuevoMonto || parseFloat(nuevoMonto) < clienteRenovar.saldo_pendiente}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm"
              >
                <RefreshCw size={14} />
                <span>Renovar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
