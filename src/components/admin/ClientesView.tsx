import { useEffect, useState } from 'react'
import { Edit2, Trash2, X, Users, Search, DollarSign, Calendar, User, CreditCard, TrendingUp } from 'lucide-react'
import AlertModal from '@/components/ui/AlertModal'
import { supabase } from '@/lib/supabase'
import { useConfigInteres } from '@/hooks/useConfigInteres'
import { useAuth } from '@/contexts/AuthContext'

interface ClienteAdmin {
  id: string
  nombre: string
  cedula: string
  telefono: string
  direccion: string
  monto_prestamo: number
  tipo_cobro: 'diario' | 'semanal' | 'quincenal'
  valor_cuota: number
  cuotas_totales: number
  cuotas_pagadas: number
  saldo_pendiente: number
  proximo_cobro: string
  estado: string
  cobrador_id: string
  cobrador_nombre: string
  cobrador_email: string
  fecha_inicio: string
  created_at: string
}

export default function ClientesView() {
  const { user } = useAuth()
  // Estados para modales
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteAdmin | null>(null)

  // Estados para el formulario de edición
  const [editNombre, setEditNombre] = useState('')
  const [editCedula, setEditCedula] = useState('')
  const [editTelefono, setEditTelefono] = useState('')
  const [editDireccion, setEditDireccion] = useState('')
  const [editCobradorId, setEditCobradorId] = useState('')

  // Estado para AlertModal
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

  const { monedaSymbol } = useConfigInteres()
  const [clientes, setClientes] = useState<ClienteAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'al_dia' | 'atrasado' | 'renovado' | 'completado'>('todos')
  const [filtroCobrador, setFiltroCobrador] = useState<string>('todos')
  const [cobradores, setCobradores] = useState<{ id: string; nombre: string }[]>([])
  // lista completa de cobradores (usuarios con rol 'cobrador') para asignar desde admin
  const [cobradoresList, setCobradoresList] = useState<{ id: string; nombre: string }[]>([])

  // Crear cliente legado (admin)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createNombre, setCreateNombre] = useState('')
  const [createCedula, setCreateCedula] = useState('')
  const [createTelefono, setCreateTelefono] = useState('')
  const [createDireccion, setCreateDireccion] = useState('')
  const [createMonto, setCreateMonto] = useState('')
  const [createTipoCobro, setCreateTipoCobro] = useState<'diario' | 'semanal' | 'quincenal'>('diario')
  const [createCuotasPagadas, setCreateCuotasPagadas] = useState('0')
  const [createProximoCobro, setCreateProximoCobro] = useState('') // YYYY-MM-DD
  const [createFechaInicio, setCreateFechaInicio] = useState('') // YYYY-MM-DD
  const [createCobradorId, setCreateCobradorId] = useState('')

  useEffect(() => {
    loadData()
    fetchCobradoresList()
  }, [])

  const loadData = async () => {
    try {
      // Cargar clientes con información del cobrador
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select(`
          *,
          cobrador:usuarios!clientes_cobrador_id_fkey(nombre, email)
        `)
        .order('created_at', { ascending: false })

      if (clientesError) throw clientesError

      // Mapear datos
      const clientesMapeados = clientesData?.map(cliente => ({
        ...cliente,
        cobrador_nombre: cliente.cobrador?.nombre || 'Sin cobrador',
        cobrador_email: cliente.cobrador?.email || '',
        cuotas_pendientes: cliente.cuotas_totales - cliente.cuotas_pagadas,
      })) || []

      setClientes(clientesMapeados)

      // Extraer lista única de cobradores
      const cobradoresUnicos = Array.from(
        new Map(
          clientesMapeados
            .filter(c => c.cobrador_nombre !== 'Sin cobrador')
            .map(c => [c.cobrador_id, { id: c.cobrador_id, nombre: c.cobrador_nombre }])
        ).values()
      )
      setCobradores(cobradoresUnicos)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper para calcular cuotas similar a la lógica del cobrador
  const calcularCuotas = (monto: number, tipo: 'diario' | 'semanal' | 'quincenal') => {
    const tasa = 0 // en admin no necesitamos interés dinámico aquí, se setea por defecto 0
    const montoInteres = monto * tasa
    const montoConInteres = monto + montoInteres

    let cuotasTotales = 24
    if (tipo === 'semanal') cuotasTotales = 10
    if (tipo === 'quincenal') cuotasTotales = 5

    const valorCuota = Math.ceil(montoConInteres / cuotasTotales)
    return { cuotasTotales, valorCuota, montoConInteres, montoInteres }
  }

  const handleCreateLegacy = async () => {
    // Validaciones mínimas
    if (!createNombre.trim() || !createCedula.trim() || !createMonto) {
      setAlertState({ open: true, type: 'warning', title: 'Campos incompletos', message: 'Nombre, cédula y monto son obligatorios' })
      return
    }

    const monto = parseFloat(createMonto)
    if (isNaN(monto) || monto <= 0) {
      setAlertState({ open: true, type: 'warning', title: 'Monto inválido', message: 'El monto debe ser mayor a cero' })
      return
    }

    const { cuotasTotales, valorCuota } = calcularCuotas(monto, createTipoCobro)

    const fechaInicio = createFechaInicio || new Date().toISOString().split('T')[0]
    const proximoCobro = createProximoCobro || fechaInicio

    const clienteData = {
      nombre: createNombre.trim(),
      cedula: createCedula.trim(),
      telefono: createTelefono.trim(),
      direccion: createDireccion.trim(),
      monto_prestamo: monto,
      tipo_cobro: createTipoCobro,
      valor_cuota: valorCuota,
      cuotas_totales: cuotasTotales,
      cuotas_pagadas: parseInt(createCuotasPagadas || '0', 10),
      saldo_pendiente: valorCuota * (cuotasTotales - (parseInt(createCuotasPagadas || '0', 10))),
      fecha_inicio: fechaInicio,
      proximo_cobro: proximoCobro,
      estado: parseInt(createCuotasPagadas || '0', 10) >= cuotasTotales ? 'completado' : 'al_dia',
      cobrador_id: createCobradorId || null,
    }

    try {
      const { error } = await supabase.from('clientes').insert([clienteData])
      if (error) throw error

      setAlertState({ open: true, type: 'success', title: '¡Cliente creado!', message: 'El cliente legado fue creado correctamente' })
      setShowCreateModal(false)
      // Reset fields
      setCreateNombre('')
      setCreateCedula('')
      setCreateTelefono('')
      setCreateDireccion('')
      setCreateMonto('')
      setCreateTipoCobro('diario')
      setCreateCuotasPagadas('0')
      setCreateProximoCobro('')
      setCreateFechaInicio('')
      setCreateCobradorId('')
      loadData()
    } catch (err: any) {
      console.error('Error al crear cliente legado:', err)
      setAlertState({ open: true, type: 'error', title: 'Error', message: err.message || 'No se pudo crear el cliente' })
    }
  }

  const fetchCobradoresList = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('rol', 'cobrador')
        .order('nombre', { ascending: true })

      if (error) throw error

      const list = data?.map((u: any) => ({ id: u.id, nombre: u.nombre || u.email || 'Sin nombre' })) || []
      setCobradoresList(list)
    } catch (err) {
      console.error('Error al cargar lista de cobradores:', err)
    }
  }

  // Handlers de edición/eliminación
  const handleEditarCliente = (cliente: ClienteAdmin) => {
    setClienteSeleccionado(cliente)
    setEditNombre(cliente.nombre)
    setEditCedula(cliente.cedula)
    setEditTelefono(cliente.telefono)
    setEditDireccion(cliente.direccion)
    setEditCobradorId(cliente.cobrador_id || '')
    setShowEditModal(true)
  }

  const handleGuardarEdicion = async () => {
    if (!clienteSeleccionado) return

    if (!editNombre.trim() || !editCedula.trim()) {
      setAlertState({
        open: true,
        type: 'warning',
        title: 'Campos requeridos',
        message: 'El nombre y la cédula son obligatorios'
      })
      return
    }

    try {
      const updatePayload: any = {
        nombre: editNombre.trim(),
        cedula: editCedula.trim(),
        telefono: editTelefono.trim(),
        direccion: editDireccion.trim(),
        updated_at: new Date().toISOString()
      }

      // Si el admin seleccionó un cobrador, actualizar la asignación
      if (editCobradorId) updatePayload.cobrador_id = editCobradorId

      const { error } = await supabase
        .from('clientes')
        .update(updatePayload)
        .eq('id', clienteSeleccionado.id)

      if (error) throw error

      setAlertState({
        open: true,
        type: 'success',
        title: '¡Cliente actualizado!',
        message: `Los datos de ${editNombre} se actualizaron correctamente`
      })

      setShowEditModal(false)
      setClienteSeleccionado(null)
      loadData()
    } catch (error: any) {
      console.error('Error al actualizar cliente:', error)
      setAlertState({
        open: true,
        type: 'error',
        title: 'Error al actualizar',
        message: `No se pudo actualizar el cliente: ${error.message}`
      })
    }
  }

  const handleEliminarCliente = (cliente: ClienteAdmin) => {
    setClienteSeleccionado(cliente)
    setShowDeleteModal(true)
  }

  const confirmarEliminar = async () => {
    if (!clienteSeleccionado) return

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteSeleccionado.id)

      if (error) throw error

      setAlertState({
        open: true,
        type: 'success',
        title: '¡Cliente eliminado!',
        message: `El cliente ${clienteSeleccionado.nombre} fue eliminado correctamente`
      })

      setShowDeleteModal(false)
      setClienteSeleccionado(null)
      loadData()
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error)
      setAlertState({
        open: true,
        type: 'error',
        title: 'Error al eliminar',
        message: `No se pudo eliminar el cliente: ${error.message}`
      })
    }
  }

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(cliente => {
    const matchSearch = 
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cedula.includes(searchTerm) ||
      cliente.cobrador_nombre.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchEstado = filtroEstado === 'todos' || cliente.estado === filtroEstado
    const matchCobrador = filtroCobrador === 'todos' || cliente.cobrador_id === filtroCobrador

    return matchSearch && matchEstado && matchCobrador
  })

  // Estadísticas rápidas
  const stats = {
    totalClientes: clientes.length,
    totalPrestado: clientes.reduce((sum, c) => sum + c.monto_prestamo, 0),
    totalRecaudado: clientes.reduce((sum, c) => sum + (c.valor_cuota * c.cuotas_pagadas), 0),
    totalPendiente: clientes.reduce((sum, c) => sum + c.saldo_pendiente, 0),
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      al_dia: 'bg-green-100 text-green-800 border-green-200',
      atrasado: 'bg-red-100 text-red-800 border-red-200',
      renovado: 'bg-blue-100 text-blue-800 border-blue-200',
      completado: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getEstadoTexto = (estado: string) => {
    const textos = {
      al_dia: 'Al Día',
      atrasado: 'Atrasado',
      renovado: 'Renovado',
      completado: 'Completado',
    }
    return textos[estado as keyof typeof textos] || estado
  }

  const getTipoCobroColor = (tipo: string) => {
    const colores = {
      diario: 'bg-purple-100 text-purple-700',
      semanal: 'bg-orange-100 text-orange-700',
      quincenal: 'bg-cyan-100 text-cyan-700',
    }
    return colores[tipo as keyof typeof colores] || 'bg-gray-100 text-gray-700'
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Vista general de todos los clientes del sistema</p>
        </div>

        {user?.role === 'admin' && (
          <div className="w-full sm:w-auto">
            <button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              + Crear Cliente (Legado)
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalClientes}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Prestado</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {monedaSymbol}{stats.totalPrestado.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Recaudado</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {monedaSymbol}{stats.totalRecaudado.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Saldo Pendiente</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {monedaSymbol}{stats.totalPendiente.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o cobrador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="al_dia">Al Día</option>
              <option value="atrasado">Atrasado</option>
              <option value="renovado">Renovado</option>
              <option value="completado">Completado</option>
            </select>
          </div>

          {/* Filtro por Cobrador */}
          <div>
            <select
              value={filtroCobrador}
              onChange={(e) => setFiltroCobrador(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="todos">Todos los cobradores</option>
              {cobradores.map(cobrador => (
                <option key={cobrador.id} value={cobrador.id}>{cobrador.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando clientes...</p>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron clientes</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || filtroEstado !== 'todos' || filtroCobrador !== 'todos'
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Los cobradores aún no han agregado clientes'}
            </p>
          </div>
        ) : (
          <>
            {/* Vista Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cobrador</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Préstamo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuotas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Próximo Cobro</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientesFiltrados.map((cliente) => {
                    const cuotasPendientes = cliente.cuotas_totales - cliente.cuotas_pagadas
                    return (
                      <tr key={cliente.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{cliente.nombre}</p>
                            <p className="text-sm text-gray-500">{cliente.cedula}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{cliente.cobrador_nombre}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">
                            {monedaSymbol}{cliente.monto_prestamo.toLocaleString('es-CO')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTipoCobroColor(cliente.tipo_cobro)}`}>
                            {cliente.tipo_cobro.charAt(0).toUpperCase() + cliente.tipo_cobro.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <p className="text-gray-900">
                              <span className="font-semibold">{cliente.cuotas_pagadas}</span>/{cliente.cuotas_totales}
                            </p>
                            <p className="text-gray-500">Faltan {cuotasPendientes}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-orange-600">
                            {monedaSymbol}{cliente.saldo_pendiente.toLocaleString('es-CO')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {(() => {
                              // Parsear fecha YYYY-MM-DD sin conversión de zona horaria
                              const [year, month, day] = cliente.proximo_cobro.split('T')[0].split('-').map(Number)
                              const fecha = new Date(year, month - 1, day)
                              return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getEstadoBadge(cliente.estado)}`}>
                            {getEstadoTexto(cliente.estado)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditarCliente(cliente)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar cliente"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleEliminarCliente(cliente)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar cliente"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
      {/* Modal de Edición */}
      {showEditModal && clienteSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Editar Cliente</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setClienteSeleccionado(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cédula *
                </label>
                <input
                  type="text"
                  value={editCedula}
                  onChange={(e) => setEditCedula(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Número de cédula"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={editTelefono}
                  onChange={(e) => setEditTelefono(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Número de teléfono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={editDireccion}
                  onChange={(e) => setEditDireccion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dirección completa"
                />
              </div>

              {/* Asignar cobrador (admin) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignar Cobrador</label>
                <select
                  value={editCobradorId}
                  onChange={(e) => setEditCobradorId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Mantener asignación actual --</option>
                  {(cobradoresList.length ? cobradoresList : cobradores).map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>Nota:</strong> Solo se pueden editar los datos personales. Los datos del préstamo no se pueden modificar.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setClienteSeleccionado(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarEdicion}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && clienteSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                ¿Eliminar Cliente?
              </h2>
              
              <p className="text-gray-600 text-center mb-4">
                Estás a punto de eliminar a <strong>{clienteSeleccionado.nombre}</strong>.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800">
                  ⚠️ <strong>Esta acción no se puede deshacer.</strong> Se eliminarán todos los datos del cliente incluyendo su historial de pagos.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setClienteSeleccionado(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertState.open}
        onClose={() => setAlertState({ ...alertState, open: false })}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
      />
      {/* Modal Crear Cliente (Legado) - Admin */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Crear Cliente (Legado)</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                  <input type="text" value={createNombre} onChange={e => setCreateNombre(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cédula *</label>
                  <input type="text" value={createCedula} onChange={e => setCreateCedula(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="text" value={createTelefono} onChange={e => setCreateTelefono(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input type="text" value={createDireccion} onChange={e => setCreateDireccion(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto del Préstamo *</label>
                  <input type="number" value={createMonto} onChange={e => setCreateMonto(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cobro</label>
                  <select value={createTipoCobro} onChange={e => setCreateTipoCobro(e.target.value as any)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuotas pagadas</label>
                  <input type="number" min={0} value={createCuotasPagadas} onChange={e => setCreateCuotasPagadas(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio (YYYY-MM-DD)</label>
                  <input type="date" value={createFechaInicio} onChange={e => setCreateFechaInicio(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Próximo cobro (YYYY-MM-DD)</label>
                  <input type="date" value={createProximoCobro} onChange={e => setCreateProximoCobro(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asignar Cobrador</label>
                  <select value={createCobradorId} onChange={e => setCreateCobradorId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Sin cobrador</option>
                    {cobradoresList.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg">Cancelar</button>
              <button onClick={handleCreateLegacy} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">Crear Cliente Legado</button>
            </div>
          </div>
        </div>
      )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Vista Móvil/Tablet */}
            <div className="lg:hidden divide-y divide-gray-200">
              {clientesFiltrados.map((cliente) => {
                const cuotasPendientes = cliente.cuotas_totales - cliente.cuotas_pagadas
                return (
                  <div key={cliente.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{cliente.nombre}</h3>
                        <p className="text-sm text-gray-500">{cliente.cedula}</p>
                      </div>
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getEstadoBadge(cliente.estado)}`}>
                        {getEstadoTexto(cliente.estado)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <User className="w-4 h-4" /> Cobrador:
                        </span>
                        <span className="font-medium text-gray-900">{cliente.cobrador_nombre}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Préstamo:</span>
                        <span className="font-semibold text-gray-900">
                          {monedaSymbol}{cliente.monto_prestamo.toLocaleString('es-CO')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tipo:</span>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getTipoCobroColor(cliente.tipo_cobro)}`}>
                          {cliente.tipo_cobro.charAt(0).toUpperCase() + cliente.tipo_cobro.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cuotas:</span>
                        <span className="font-medium text-gray-900">
                          {cliente.cuotas_pagadas}/{cliente.cuotas_totales} <span className="text-gray-500">(Faltan {cuotasPendientes})</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Saldo:</span>
                        <span className="font-semibold text-orange-600">
                          {monedaSymbol}{cliente.saldo_pendiente.toLocaleString('es-CO')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> Próximo cobro:
                        </span>
                        <span className="font-medium text-gray-900">
                          {(() => {
                            // Parsear fecha YYYY-MM-DD sin conversión de zona horaria
                            const [year, month, day] = cliente.proximo_cobro.split('T')[0].split('-').map(Number)
                            const fecha = new Date(year, month - 1, day)
                            return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Contador de resultados */}
      {!loading && clientesFiltrados.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Mostrando {clientesFiltrados.length} de {clientes.length} clientes
        </div>
      )}
    </div>
  )
}
