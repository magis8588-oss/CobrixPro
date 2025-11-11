import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '@/components/admin/Sidebar'

import Overview from '@/components/admin/Overview'
import ClientesView from '@/components/admin/ClientesView'
import Collectors from '@/components/admin/Collectors'
import InterestConfig from '@/components/admin/InterestConfig'

export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-20 lg:pt-4 px-4 pb-4 md:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/clientes" element={<ClientesView />} />
            <Route path="/cobradores" element={<Collectors />} />
            <Route path="/configuracion" element={<InterestConfig />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
