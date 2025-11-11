import { useEffect, useState } from 'react'
import { TrendingUp, Users, DollarSign, UserPlus, Calendar, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EstadisticaCobrador } from '@/types'
import { useConfigInteres } from '@/hooks/useConfigInteres'

export default function Overview() {
  const { monedaSymbol } = useConfigInteres()
  const [estadisticas, setEstadisticas] = useState<EstadisticaCobrador[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEstadisticas()
    
    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('estadisticas_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usuarios',
        },
        () => {
          fetchEstadisticas()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchEstadisticas = async () => {
    try {
      const { data, error } = await supabase
        .from('estadisticas_cobrador')
        .select('*')

      if (error) throw error

      setEstadisticas(data || [])
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cálculos totales
  const totalEnCirculacion = estadisticas.reduce((sum, e) => sum + (e.saldo_pendiente || 0), 0)
  const totalClientes = estadisticas.reduce((sum, e) => sum + (e.clientes_totales || 0), 0)
  const cobradoresActivos = estadisticas.length
  const promedioRendimiento = estadisticas.length > 0
    ? estadisticas.reduce((sum, e) => sum + e.porcentaje_cumplimiento, 0) / estadisticas.length
    : 0

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">Vista general del sistema de cobros</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <StatCard
          title="Total en Circulación"
          value={`${monedaSymbol}${totalEnCirculacion.toLocaleString('es-CO')}`}
          icon={DollarSign}
          color="green"
          subtitle="Dinero prestado activo"
        />
        <StatCard
          title="Total Clientes"
          value={totalClientes.toString()}
          icon={Users}
          color="blue"
          subtitle="De todos los cobradores"
        />
        <StatCard
          title="Cobradores Activos"
          value={cobradoresActivos.toString()}
          icon={UserPlus}
          color="purple"
          subtitle="En operación"
        />
        <StatCard
          title="Rendimiento Promedio"
          value={`${promedioRendimiento.toFixed(1)}%`}
          icon={TrendingUp}
          color="orange"
          subtitle="De cumplimiento"
        />
      </div>

      {/* Tabla de Cobradores */}
      <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Estadísticas por Cobrador
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
          </div>
        ) : estadisticas.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No hay cobradores registrados</p>
            <p className="text-sm text-gray-500 mt-1">
              Agrega cobradores desde la sección "Cobradores"
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Vista desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cobrador
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cobrado
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Prestado
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cobrar Hoy
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto Hoy
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atrasados
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clientes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estadisticas.map((stat) => {
                    // Calcular recaudo diario: total_recaudado es lo que ya se cobró
                    // Simplemente mostrar el total recaudado hasta la fecha
                    const totalRecaudado = stat.total_recaudado || 0
                    
                    // Calcular monto a cobrar hoy basado en cuotas programadas
                    const montoACobrarHoy = stat.cobros_hoy > 0 && stat.clientes_totales > 0
                      ? (stat.saldo_pendiente / stat.clientes_totales) * stat.cobros_hoy
                      : 0
                    
                    return (
                      <tr key={stat.cobrador_id} className="hover:bg-gray-50 transition">
                        <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 text-sm lg:text-base">{stat.cobrador_nombre || 'Sin nombre'}</div>
                        </td>
                        <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <span className="text-green-600 font-semibold text-sm lg:text-base">
                            {monedaSymbol}{totalRecaudado.toLocaleString('es-CO')}
                          </span>
                        </td>
                        <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <span className="font-semibold text-blue-600 text-sm lg:text-base">
                            {monedaSymbol}{(stat.total_prestado || 0).toLocaleString('es-CO')}
                          </span>
                        </td>
                        <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <Calendar size={14} className="text-orange-500" />
                            <span className="font-semibold text-gray-900 text-sm lg:text-base">{stat.cobros_hoy || 0}</span>
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <span className="font-semibold text-orange-600 text-sm lg:text-base">
                            {monedaSymbol}{montoACobrarHoy.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                          </span>
                        </td>
                        <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <AlertCircle size={14} className="text-red-500" />
                            <span className={`font-semibold text-sm lg:text-base ${stat.clientes_mora > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {stat.clientes_mora || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-center">
                          <span className="font-medium text-gray-900 text-sm lg:text-base">{stat.clientes_totales || 0}</span>
                          <p className="text-xs text-gray-500">
                            {stat.clientes_al_dia || 0} al día
                          </p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Vista móvil */}
            <div className="md:hidden space-y-4 p-4">
              {estadisticas.map((stat) => {
                const totalRecaudado = stat.total_recaudado || 0
                const montoACobrarHoy = stat.cobros_hoy > 0 && stat.clientes_totales > 0
                  ? (stat.saldo_pendiente / stat.clientes_totales) * stat.cobros_hoy
                  : 0

                return (
                  <div key={stat.cobrador_id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 text-base">{stat.cobrador_nombre || 'Sin nombre'}</h3>
                    
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Total cobrado:</span>
                        <span className="text-sm font-bold text-green-600">{monedaSymbol}{totalRecaudado.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Total prestado:</span>
                        <span className="text-sm font-semibold text-blue-600">{monedaSymbol}{(stat.total_prestado || 0).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Para cobrar hoy:</span>
                        <span className="text-sm font-medium">{stat.cobros_hoy || 0} clientes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Monto a cobrar:</span>
                        <span className="text-sm font-semibold text-orange-600">{monedaSymbol}{montoACobrarHoy.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 mt-2 border-t">
                        <span className="text-sm text-gray-500">Atrasados:</span>
                        <span className={`text-sm font-semibold ${stat.clientes_mora > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {stat.clientes_mora || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Total clientes:</span>
                        <span className="text-sm font-medium">{stat.clientes_totales || 0} ({stat.clientes_al_dia || 0} al día)</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ElementType
  color: 'green' | 'blue' | 'purple' | 'orange'
  subtitle: string
}

function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 p-4 md:p-5 lg:p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 md:mt-2 break-words">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5 md:mt-1 truncate">{subtitle}</p>
        </div>
        <div className={`p-2 md:p-3 rounded-lg flex-shrink-0 ${colorClasses[color]}`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </div>
    </div>
  )
}
