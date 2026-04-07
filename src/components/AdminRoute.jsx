import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return children
}
