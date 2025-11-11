import { useEffect, useState } from 'react'
import { 
  Users,
  AlertCircle,
  UserPlus,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Cliente } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useCalculosPrestamo } from '@/hooks/useCalculosPrestamo'
import { calcularProximoCobro, calcularPrimerCobro } from '@/lib/fechasUtils'
import AlertModal from '@/components/ui/AlertModal'

export default function CollectorOverview() {
  const { user } = useAuth()
  const { tasaInteres, monedaSymbol, calcularCuotas, loading: configLoading } = useCalculosPrestamo()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showRenovarModal, setShowRenovarModal] = useState(false)
  const [clienteRenovar, setClienteRenovar] = useState<Cliente | null>(null)

  // Estado para el modal de alertas
  const [alertState, setAlertState] = useState<{
    open: boolean
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
  }>({
    open: false,
    type: 'info',
    title: '',
    message: ''
  })

  // Form state para nuevo cliente
  const [nombre, setNombre] = useState('')
  const [cedula, setCedula] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [montoPrestamo, setMontoPrestamo] = useState('')
  const [tipoCobro, setTipoCobro] = useState<'diario' | 'semanal' | 'quincenal'>('diario')

  // Form state para renovar
  const [nuevoMonto, setNuevoMonto] = useState('')

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
  const { error } = await supabase
        .from('clientes')
        .select('*')
        .eq('cobrador_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error al cargar clientes:', error)
        return
      }

        // 'data' was removed as unused, so this block should be removed or refactored if needed.
        // If you need to use 'data', re-add it to the destructuring above.
        const response = await supabase
          .from('clientes')
          .select('*')
          .eq('cobrador_id', user?.id)
          .order('created_at', { ascending: false });
        const clientesMapeados = (response.data || []).map((cliente: any) => ({
          ...cliente,
          cuotas_pendientes: cliente.cuotas_totales - cliente.cuotas_pagadas,
          proximo_cobro: cliente.proximo_cobro || new Date().toISOString(),
          estado: cliente.estado === 'atrasado' ? 'mora' : cliente.estado,
        }));
        setClientes(clientesMapeados);
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAgregarCliente = async () => {
    if (!nombre || !cedula || !telefono || !direccion || !montoPrestamo) {
      setAlertState({
        open: true,
        type: 'warning',
        title: 'Campos incompletos',
        message: 'Por favor completa todos los campos'
      })
      return
    }

    const cedulaTrimmed = cedula.trim()
    // Validar que no exista un cliente con la misma cédula que tenga un cobro activo
    try {
      const { data: existingActive, error: checkError } = await supabase
        .from('clientes')
        .select('id')
        .eq('cedula', cedulaTrimmed)
        .neq('estado', 'completado')

      if (checkError) {
        console.error('Error al verificar cédula existente:', checkError)
        setAlertState({ open: true, type: 'error', title: 'Error', message: 'No se pudo verificar la cédula en la base de datos.' })
        return
      }

      if (existingActive && existingActive.length > 0) {
        setAlertState({
          open: true,
          type: 'error',
          title: 'Cliente ya existe',
          message: 'Ya existe un cliente con esa cédula y con un cobro activo. Revisa la lista de clientes.'
        })
        return
      }
    } catch (err) {
      console.error('Error verificando cédula:', err)
      setAlertState({ open: true, type: 'error', title: 'Error', message: 'No se pudo verificar la cédula.' })
      return
    }

    const monto = parseFloat(montoPrestamo)
    if (monto <= 0) {
      setAlertState({
        open: true,
        type: 'warning',
        title: 'Monto inválido',
        message: 'El monto debe ser mayor a cero'
      })
      return
    }

    try {
      const { cuotasTotales, valorCuota } = calcularCuotas(monto, tipoCobro)
      const fechaProximoCobroISO = calcularPrimerCobro(tipoCobro)
      // Usar la variable global 'hoy'
      const year = hoy.getFullYear()
      const month = String(hoy.getMonth() + 1).padStart(2, '0')
      const day = String(hoy.getDate()).padStart(2, '0')
      const fechaInicioString = `${year}-${month}-${day}`
      const fechaProximoCobroString = fechaProximoCobroISO.split('T')[0]

      // Logs de debugging

      // Preparar datos para insertar (estructura de DB real)
      const clienteData = {
        nombre,
        cedula,
        telefono,
        direccion,
        monto_prestamo: monto,
        tipo_cobro: tipoCobro,
        valor_cuota: valorCuota,
        cuotas_totales: cuotasTotales,
        cuotas_pagadas: 0,
        saldo_pendiente: valorCuota * cuotasTotales,
        fecha_inicio: fechaInicioString, // Formato DATE: YYYY-MM-DD
        proximo_cobro: fechaProximoCobroString, // Formato DATE: YYYY-MM-DD
        estado: 'al_dia',
        cobrador_id: user?.id || '',
      }


  const { error } = await supabase
        .from('clientes')
        .insert([clienteData])
        .select('*')
        .single()

      if (error) {
        console.error('❌ Error al guardar cliente:', error)
        setAlertState({
          open: true,
          type: 'error',
          title: 'Error al guardar',
          message: `No se pudo guardar el cliente: ${error.message}`
        })
        return
      }

      
      // Recargar datos
      await loadData()

      // Reset form
      setNombre('')
      setCedula('')
      setTelefono('')
      setDireccion('')
      setMontoPrestamo('')
      setTipoCobro('diario')
      setShowModal(false)

      setAlertState({
        open: true,
        type: 'success',
        title: '¡Cliente agregado!',
        message: 'El cliente se agregó exitosamente'
      })
    } catch (error: any) {
      console.error('❌ Error inesperado:', error)
      setAlertState({
        open: true,
        type: 'error',
        title: 'Error inesperado',
        message: `Ocurrió un error: ${error.message}`
      })
    }
  }

  const handleRegistrarPago = async (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId)
    if (!cliente) return

    const nuevoCuotasPagadas = cliente.cuotas_pagadas + 1
    const nuevoSaldoPendiente = cliente.saldo_pendiente - cliente.valor_cuota
    
    // Calcular próximo cobro sin conversión de zona horaria
    const fechaProximoCobroStr = calcularProximoCobro(new Date(), cliente.tipo_cobro)
    
    const datosActualizacion = {
      cuotas_pagadas: nuevoCuotasPagadas,
      saldo_pendiente: nuevoSaldoPendiente,
      proximo_cobro: fechaProximoCobroStr, // DATE format YYYY-MM-DD
      estado: nuevoCuotasPagadas >= cliente.cuotas_totales ? 'completado' : 'al_dia',
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('clientes')
      .update(datosActualizacion)
      .eq('id', clienteId)

    if (error) {
      console.error('Error al registrar pago:', error)
      setAlertState({
        open: true,
        type: 'error',
        title: 'Error al registrar pago',
        message: `No se pudo registrar el pago: ${error.message}`
      })
      return
    }

    loadData()
  }

  const handleNoPago = async (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId)
    if (!cliente) return

    // Calcular próximo cobro sin conversión de zona horaria
    const fechaProximoCobroStr = calcularProximoCobro(new Date(), cliente.tipo_cobro)
    
    const datosActualizacion = {
      estado: 'atrasado', // En DB se usa 'atrasado' en lugar de 'mora'
      proximo_cobro: fechaProximoCobroStr, // DATE format YYYY-MM-DD
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('clientes')
      .update(datosActualizacion)
      .eq('id', clienteId)

    if (error) {
      console.error('Error al marcar no pago:', error)
      setAlertState({
        open: true,
        type: 'error',
        title: 'Error al marcar no pago',
        message: `No se pudo actualizar el estado: ${error.message}`
      })
      return
    }

    loadData()
  }

  const abrirRenovar = (cliente: Cliente) => {
    setClienteRenovar(cliente)
    setShowRenovarModal(true)
  }

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
      // Usar la variable global 'hoy'
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
      
      loadData()

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

  // Filtrar clientes para cobrar hoy
  const hoy = new Date()
  const fechaHoyString = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  
  const clientesParaCobrarHoy = clientes.filter(cliente => {
    // Extraer solo la parte de la fecha (YYYY-MM-DD) sin conversión de zona horaria
    const fechaCobroString = cliente.proximo_cobro.split('T')[0]

    // Mostrar clientes cuya fecha de cobro sea HOY o ANTERIOR (atrasados)
    // Esto incluye cobros programados para hoy y los que están en mora
    return fechaCobroString <= fechaHoyString && cliente.cuotas_pendientes > 0
  })  // Total de clientes activos (no completados ni cancelados)
  const clientesActivos = clientes.filter(c => c.estado !== 'completado')
  // Clientes renovados este mes (usando fecha_inicio como referencia de renovación)
  const mesActual = hoy.getMonth()
  const anioActual = hoy.getFullYear()
  const renovadosEsteMes = clientes.filter(c => {
    if (c.estado === 'renovado' && c.fecha_inicio) {
      const fecha = new Date(c.fecha_inicio)
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual
    }
    return false
  })
  const stats = {
     totalClientes: clientes.length,
     clientesAlDia: clientes.filter(c => c.estado === 'al_dia' || c.estado === 'renovado').length,
     clientesEnMora: clientes.filter(c => c.estado === 'mora').length,
     clientesActivos: clientesActivos.length,
     renovadosEsteMes: renovadosEsteMes.length,
     cobrosHoy: clientesParaCobrarHoy.length,
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
      {/* Header con botón agregar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Cobros</h2>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <UserPlus size={20} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Clientes para Cobrar Hoy - AHORA PRIMERO */}
      {clientesParaCobrarHoy.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-orange-600" size={20} />
              <h3 className="font-semibold text-orange-900">
                Cobros Programados para Hoy ({clientesParaCobrarHoy.length})
              </h3>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {clientesParaCobrarHoy.map((cliente) => (
              <div key={cliente.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{cliente.nombre}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cliente.estado === 'al_dia' || cliente.estado === 'renovado'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {cliente.estado === 'renovado' ? 'Renovado' : cliente.estado === 'al_dia' ? 'Al Día' : 'Mora'}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {cliente.tipo_cobro}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>📞 {cliente.telefono}</span>
                      <span>📍 {cliente.direccion}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Cuota: <strong className="text-gray-900">{monedaSymbol}{cliente.valor_cuota.toLocaleString('es-CO')}</strong>
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        Pagadas: <strong className="text-green-600">{cliente.cuotas_pagadas}</strong> / {cliente.cuotas_totales}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        Pendiente: <strong className="text-orange-600">{monedaSymbol}{cliente.saldo_pendiente.toLocaleString('es-CO')}</strong>
                      </span>
                    </div>

                    {/* Botones de acción */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleRegistrarPago(cliente.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                        title="Registrar Pago"
                      >
                        <CheckCircle size={16} />
                        <span>Pagó</span>
                      </button>
                      <button
                        onClick={() => handleNoPago(cliente.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                        title="No Pagó"
                      >
                        <XCircle size={16} />
                        <span>No Pagó</span>
                      </button>
                      {cliente.cuotas_pendientes <= 3 && (
                        <button
                          onClick={() => abrirRenovar(cliente)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          title="Renovar Préstamo"
                        >
                          <RefreshCw size={16} />
                          <span>Renovar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {clientesParaCobrarHoy.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ¡Todo al día!
          </h3>
          <p className="text-gray-600">
            No hay cobros programados para hoy
          </p>
        </div>
      )}

      {/* Resumen del Día - AL FINAL */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Resumen del Día</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalClientes}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-green-600 font-medium">{stats.clientesAlDia} al día</span>
              <span className="text-gray-400">•</span>
              <span className="text-orange-600 font-medium">{stats.clientesEnMora} en mora</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Clientes Activos</p>
                <p className="text-3xl font-bold text-blue-900">{stats.clientesActivos}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Clientes con préstamos vigentes
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cobros de Hoy</p>
                <p className="text-3xl font-bold text-orange-600">{stats.cobrosHoy}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="text-orange-600" size={24} />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Clientes programados para hoy
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Renovaciones este mes</p>
                <p className="text-3xl font-bold text-green-700">{stats.renovadosEsteMes}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <RefreshCw className="text-green-600" size={24} />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Clientes que renovaron su préstamo este mes
            </p>
          </div>
        </div>
      </div>

      {/* Modal Agregar Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Agregar Nuevo Cliente</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula *
                  </label>
                  <input
                    type="text"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej: 1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej: 3001234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej: Calle 123 #45-67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto del Préstamo *
                  </label>
                  <input
                    type="number"
                    value={montoPrestamo}
                    onChange={(e) => setMontoPrestamo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej: 200000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Cobro *
                  </label>
                  <select
                    value={tipoCobro}
                    onChange={(e) => setTipoCobro(e.target.value as 'diario' | 'semanal' | 'quincenal')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="diario">Diario (24 cuotas)</option>
                    <option value="semanal">Semanal (4 cuotas)</option>
                    <option value="quincenal">Quincenal (2 cuotas)</option>
                  </select>
                </div>
              </div>

              {/* Preview de cuotas */}
              {montoPrestamo && parseFloat(montoPrestamo) > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Vista Previa del Préstamo</h4>
                  <div className="space-y-1 text-sm">
                    {(() => {
                      const monto = parseFloat(montoPrestamo)
                      const { cuotasTotales, valorCuota, montoConInteres, montoInteres } = calcularCuotas(
                        monto,
                        tipoCobro
                      )
                      // Parsear fecha YYYY-MM-DD sin conversión de zona horaria
                      const fechaPrimerCobroStr = calcularPrimerCobro(tipoCobro)
                      const [year, month, day] = fechaPrimerCobroStr.split('-').map(Number)
                      const fechaPrimerCobro = new Date(year, month - 1, day)
                      
                      return (
                        <>
                          <p className="text-gray-700">
                            Monto del préstamo: <strong>{monedaSymbol}{monto.toLocaleString('es-CO')}</strong>
                          </p>
                          <p className="text-gray-700">
                            Interés ({tasaInteres}%): <strong className="text-green-600">+{monedaSymbol}{montoInteres.toLocaleString('es-CO')}</strong>
                          </p>
                          <p className="text-blue-900 font-semibold border-t border-blue-300 pt-2 mt-2">
                            Total a pagar: {monedaSymbol}{montoConInteres.toLocaleString('es-CO')}
                          </p>
                          <p className="text-gray-700">
                            Número de cuotas: <strong>{cuotasTotales}</strong>
                          </p>
                          <p className="text-blue-900 font-semibold bg-blue-100 px-2 py-1 rounded">
                            Valor de cada cuota: {monedaSymbol}{valorCuota.toLocaleString('es-CO')}
                          </p>
                          <p className="text-gray-600 text-xs mt-2">
                            📅 Primer cobro: {fechaPrimerCobro.toLocaleDateString('es-CO', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long' 
                            })}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {tipoCobro === 'semanal' 
                              ? '🔄 Los cobros se programan cada semana el mismo día' 
                              : tipoCobro === 'diario'
                              ? '🔄 Los cobros se programan cada día hábil'
                              : '🔄 Los cobros se programan cada quincena'}
                          </p>
                          <p className="text-orange-600 text-xs">
                            ⚠️ No se cobra domingos ni días festivos
                          </p>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAgregarCliente}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {/* Save eliminado porque no se usa */}
                <span>Guardar Cliente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Renovar */}
      {showRenovarModal && clienteRenovar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="text-blue-600" size={20} />
                <h3 className="text-xl font-bold text-blue-900">Renovar Préstamo</h3>
              </div>
              <button
                onClick={() => {
                  setShowRenovarModal(false)
                  setClienteRenovar(null)
                  setNuevoMonto('')
                }}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cliente</p>
                <p className="font-semibold text-gray-900">{clienteRenovar.nombre}</p>
              </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-900 mb-2">Deuda Actual</p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>Cuotas pendientes: <strong>{clienteRenovar.cuotas_pendientes}</strong></p>
                  <p>Saldo pendiente: <strong className="text-orange-600">{monedaSymbol}{clienteRenovar.saldo_pendiente.toLocaleString('es-CO')}</strong></p>
                </div>
              </div>              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nuevo Monto a Prestar *
                </label>
                <input
                  type="number"
                  value={nuevoMonto}
                  onChange={(e) => setNuevoMonto(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 200000"
                />
              </div>

              {/* Cálculo de renovación */}
              {nuevoMonto && parseFloat(nuevoMonto) > 0 && (
                <div className="space-y-2">
                  {/* Validación: nuevo monto debe ser mayor a la deuda */}
                  {parseFloat(nuevoMonto) < clienteRenovar.saldo_pendiente ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-900 font-medium text-xs">
                        ⚠️ El nuevo préstamo debe ser mayor a la deuda de {monedaSymbol}{clienteRenovar.saldo_pendiente.toLocaleString('es-CO')}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Monto a entregar al cliente - Compacto */}
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-green-900">💰 Entregar al Cliente</span>
                          <span className="text-2xl font-bold text-green-700">
                            {monedaSymbol}{(parseFloat(nuevoMonto) - clienteRenovar.saldo_pendiente).toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>

                      {/* Resumen detallado - Compacto */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="font-semibold text-blue-900 text-xs mb-2">📋 Detalle de Renovación</h4>
                        <div className="space-y-1 text-xs">
                          {(() => {
                            const montoNuevo = parseFloat(nuevoMonto)
                            const deudaActual = clienteRenovar.saldo_pendiente
                            
                            // Calcular sobre el MONTO NUEVO solamente
                            const { cuotasTotales, valorCuota, montoConInteres, montoInteres } = calcularCuotas(
                              montoNuevo,
                              clienteRenovar.tipo_cobro
                            )
                            
                            // Parsear fecha YYYY-MM-DD sin conversión de zona horaria
                            const fechaPrimerCobroStr = calcularPrimerCobro(clienteRenovar.tipo_cobro)
                            const [year, month, day] = fechaPrimerCobroStr.split('-').map(Number)
                            const fechaPrimerCobro = new Date(year, month - 1, day)
                            
                            return (
                              <>
                                {/* Grid compacto de 2 columnas */}
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <div className="bg-white rounded px-2 py-1.5">
                                    <p className="text-gray-500 text-xs">Deuda cancela:</p>
                                    <p className="text-orange-600 font-semibold">
                                      - {monedaSymbol}{deudaActual.toLocaleString('es-CO')}
                                    </p>
                                  </div>
                                  
                                  <div className="bg-white rounded px-2 py-1.5">
                                    <p className="text-gray-500 text-xs">Nuevo préstamo:</p>
                                    <p className="text-blue-700 font-semibold">
                                      {monedaSymbol}{montoNuevo.toLocaleString('es-CO')}
                                    </p>
                                  </div>

                                  <div className="bg-white rounded px-2 py-1.5">
                                    <p className="text-gray-500 text-xs">Interés ({tasaInteres}%):</p>
                                    <p className="text-green-600 font-semibold">
                                      + {monedaSymbol}{montoInteres.toLocaleString('es-CO')}
                                    </p>
                                  </div>

                                  <div className="bg-blue-100 rounded px-2 py-1.5">
                                    <p className="text-gray-700 text-xs">Total a pagar:</p>
                                    <p className="text-blue-900 font-bold text-sm">
                                      {monedaSymbol}{montoConInteres.toLocaleString('es-CO')}
                                    </p>
                                  </div>
                                </div>

                                {/* Información de cuotas */}
                                <div className="bg-white rounded px-2 py-1.5 border-t border-blue-200">
                                  <p className="text-gray-700">
                                    En <strong className="text-blue-700">{cuotasTotales}</strong> cuotas de <strong className="text-blue-700">{monedaSymbol}{valorCuota.toLocaleString('es-CO')}</strong>
                                  </p>
                                  <p className="text-gray-600 text-xs mt-0.5">
                                    📅 Primer cobro: <strong>{fechaPrimerCobro.toLocaleDateString('es-CO', { 
                                      weekday: 'short', 
                                      day: 'numeric', 
                                      month: 'short' 
                                    })}</strong>
                                  </p>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRenovarModal(false)
                  setClienteRenovar(null)
                  setNuevoMonto('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRenovar}
                disabled={!nuevoMonto || parseFloat(nuevoMonto) <= 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} />
                <span>Renovar Préstamo</span>
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
    </div>
  )
}
