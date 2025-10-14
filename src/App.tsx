import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DevModeBanner from './components/DevModeBanner'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import CollectorDashboard from './pages/collector/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DevModeBanner />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/collector/*"
            element={
              <ProtectedRoute allowedRoles={['cobrador']}>
                <CollectorDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
