import { Routes, Route, Navigate } from 'react-router-dom'
import CollectorSidebar from '@/components/collector/Sidebar'
import CollectorHeader from '@/components/collector/Header'
import CollectorOverview from '@/components/collector/Overview'
import ClientesList from '@/components/collector/ClientesList'
import RegistrarPago from '@/components/collector/RegistrarPago'
import HistorialTransacciones from '@/components/collector/HistorialTransacciones'
import CalculadoraIntereses from '@/components/collector/CalculadoraIntereses'

export default function CollectorDashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <CollectorSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0 ml-0">
        <CollectorHeader />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <Routes>
              <Route index element={<CollectorOverview />} />
              <Route path="clientes" element={<ClientesList />} />
              <Route path="pagos" element={<RegistrarPago />} />
              <Route path="historial" element={<HistorialTransacciones />} />
              <Route path="calculadora" element={<CalculadoraIntereses />} />
              <Route path="*" element={<Navigate to="/collector" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}
