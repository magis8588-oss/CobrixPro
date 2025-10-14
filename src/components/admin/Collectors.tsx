import { useEffect, useState } from 'react'
import { Trash2, Shield, User as UserIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { User, UserRole } from '@/types'

export default function Collectors() {
  const [cobradores, setCobradores] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCobradores()
  }, [])

  const fetchCobradores = async () => {
    try {
      const { data, error} = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Mapear datos de la BD al formato de la app
      const cobradoresmapped = data?.map(u => ({
        id: u.id,
        email: u.email,
        nombre: u.nombre || 'Sin nombre',
        role: u.rol as UserRole,
        activo: u.activo ?? true,
        created_at: u.created_at,
      })) || []

      setCobradores(cobradoresmapped)
    } catch (error) {
      console.error('Error al cargar cobradores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return

    try {
      // Eliminar el usuario de la tabla usuarios
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCobradores(cobradores.filter((c) => c.id !== id))
      alert('Usuario eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      alert('Error al eliminar el usuario')
    }
  }

  const handleChangeRole = async (user: User) => {
    const newRole: UserRole = user.role === 'admin' ? 'cobrador' : 'admin'
    
    if (!confirm(`¿Cambiar rol a ${newRole}?`)) return

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ rol: newRole })
        .eq('id', user.id)

      if (error) throw error

      fetchCobradores()
      alert('Rol actualizado exitosamente')
    } catch (error) {
      console.error('Error al cambiar rol:', error)
      alert('Error al cambiar el rol')
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: !user.activo })
        .eq('id', user.id)

      if (error) throw error

      fetchCobradores()
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      alert('Error al cambiar el estado')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cobradores</h1>
        <p className="text-gray-600 mt-1">Administra los usuarios del sistema</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando cobradores...</p>
          </div>
        ) : cobradores.length === 0 ? (
          <div className="p-8 text-center">
            <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No hay usuarios registrados</p>
            <p className="text-sm text-gray-500 mt-2">Los usuarios se crean desde Supabase Authentication</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="hidden lg:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cobradores.map((cobrador) => (
                    <tr key={cobrador.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{cobrador.nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {cobrador.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cobrador.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {cobrador.role === 'admin' ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <UserIcon className="w-3 h-3" />
                          )}
                          {cobrador.role === 'admin' ? 'Admin' : 'Cobrador'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(cobrador)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition ${
                            cobrador.activo
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {cobrador.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(cobrador.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleChangeRole(cobrador)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Cambiar rol"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cobrador.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Vista móvil */}
          <div className="lg:hidden space-y-3 p-4">
            {cobradores.map((cobrador) => (
              <div key={cobrador.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{cobrador.nombre}</h3>
                    <p className="text-sm text-gray-600 truncate">{cobrador.email}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      cobrador.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {cobrador.role === 'admin' ? (
                      <Shield className="w-3 h-3" />
                    ) : (
                      <UserIcon className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">{cobrador.role === 'admin' ? 'Admin' : 'Cobrador'}</span>
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <button
                    onClick={() => handleToggleActive(cobrador)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition ${
                      cobrador.activo
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {cobrador.activo ? 'Activo' : 'Inactivo'}
                  </button>
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(cobrador.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleChangeRole(cobrador)}
                    className="px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition text-sm font-medium border border-purple-200 flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Cambiar Rol
                  </button>
                  <button
                    onClick={() => handleDelete(cobrador.id)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium border border-red-200 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
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
