import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { FichasProvider } from './context/FichasContext.jsx'
import { InventoryProvider } from './context/InventoryContext.jsx'
import { InvoiceProvider } from './context/InvoiceContext.jsx'
import Navbar from './components/Navbar.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Impact from './pages/Impact.jsx'
import ThankYouEmails from './pages/ThankYouEmails.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminInventory from './pages/AdminInventory.jsx'

function AppContent() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/donar" element={<Dashboard />} />
        <Route path="/impacto" element={<Impact />} />
        <Route path="/correos" element={<ThankYouEmails />} />
        <Route path="/voluntariado" element={<Navigate to="/donar#voluntariado-section" replace />} />
        <Route path="/donar-especie" element={<Navigate to="/donar#especie-section" replace />} />
        <Route path="/apadrinamiento" element={<Navigate to="/donar" replace />} />

        {/* Rutas de Admin */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/inventario"
          element={
            <AdminRoute>
              <AdminInventory />
            </AdminRoute>
          }
        />
      </Routes>
      {!isAdminRoute && (
        <footer className="footer">
          <div className="container">
            <p className="footer__text">
              Hecho con <span className="footer__heart">❤️</span> por Think Tank — Hackathon 2025
              <br />
              En apoyo a la Fundación Infantil Ronald McDonald
            </p>
          </div>
        </footer>
      )}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <FichasProvider>
        <InventoryProvider>
          <InvoiceProvider>
            <AppContent />
          </InvoiceProvider>
        </InventoryProvider>
      </FichasProvider>
    </AuthProvider>
  )
}

export default App
