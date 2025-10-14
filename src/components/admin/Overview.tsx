import { useEffect, useState } from 'react'
import { TrendingUp, Users, DollarSign, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EstadisticaCobrador } from '@/types'

export default function Overview() {
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

  const totalRecaudado = estadisticas.reduce((sum, e) => sum + e.total_recaudado, 0)
  const metaTotal = estadisticas.reduce((sum, e) => sum + e.meta_recaudacion, 0)
  const totalClientesNuevos = estadisticas.reduce((sum, e) => sum + e.clientes_nuevos, 0)
  const promedioRendimiento = estadisticas.length > 0
    ? estadisticas.reduce((sum, e) => sum + e.porcentaje_cumplimiento, 0) / estadisticas.length
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Vista general del sistema de cobros</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Recaudado"
          value={`$${totalRecaudado.toLocaleString('es-CO')}`}
          icon={DollarSign}
          color="green"
          subtitle={`Meta: $${metaTotal.toLocaleString('es-CO')}`}
        />
        <StatCard
          title="Rendimiento Promedio"
          value={`${promedioRendimiento.toFixed(1)}%`}
          icon={TrendingUp}
          color="blue"
          subtitle="De cumplimiento"
        />
        <StatCard
          title="Cobradores Activos"
          value={estadisticas.length.toString()}
          icon={Users}
          color="purple"
          subtitle="En operación"
        />
        <StatCard
          title="Clientes Nuevos"
          value={totalClientesNuevos.toString()}
          icon={UserPlus}
          color="orange"
          subtitle="Este período"
        />
      </div>

      {/* Tabla de Cobradores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cobrador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recaudado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cumplimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clientes Nuevos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Clientes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estadisticas.map((stat) => (
                    <tr key={stat.cobrador_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{stat.cobrador_nombre || 'Sin nombre'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        ${(stat.meta_recaudacion || 0).toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-green-600">
                          ${(stat.total_recaudado || 0).toLocaleString('es-CO')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (stat.porcentaje_cumplimiento || 0) >= 100
                                  ? 'bg-green-500'
                                  : (stat.porcentaje_cumplimiento || 0) >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{
                                width: `${Math.min(stat.porcentaje_cumplimiento || 0, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {(stat.porcentaje_cumplimiento || 0).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          +{stat.clientes_nuevos || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {stat.clientes_totales || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Vista móvil */}
            <div className="md:hidden space-y-4">
              {estadisticas.map((stat) => (
                <div key={stat.cobrador_id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">{stat.cobrador_nombre || 'Sin nombre'}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Meta:</span>
                      <span className="text-sm font-medium">${(stat.meta_recaudacion || 0).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Recaudado:</span>
                      <span className="text-sm font-semibold text-green-600">${(stat.total_recaudado || 0).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Cumplimiento:</span>
                      <span className="text-sm font-medium">{(stat.porcentaje_cumplimiento || 0).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          (stat.porcentaje_cumplimiento || 0) >= 100
                            ? 'bg-green-500'
                            : (stat.porcentaje_cumplimiento || 0) >= 70
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(stat.porcentaje_cumplimiento || 0, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between pt-2 mt-2 border-t">
                      <span className="text-sm text-gray-500">Nuevos:</span>
                      <span className="text-sm font-medium text-blue-600">+{stat.clientes_nuevos || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total clientes:</span>
                      <span className="text-sm font-medium">{stat.clientes_totales || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
