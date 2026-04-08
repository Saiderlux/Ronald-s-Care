import { createContext, useContext, useState, useEffect } from 'react'
import { loginApi, logoutApi, parseToken } from '../api.js'

const AuthContext = createContext(null)

// Roles disponibles
export const ROLES = {
  ADMIN: 'ADMIN',
  IDENTIFIER: 'IDENTIFIER',
  FINANCE: 'FINANCE',
  COMMUNICATOR: 'COMMUNICATOR',
}

// Permisos por rol
const ROLE_PERMISSIONS = {
  ADMIN: ['*'], // Todo
  IDENTIFIER: ['fichas.create', 'fichas.edit', 'fichas.delete', 'inventory.view', 'inventory.manage', 'volunteers.view', 'sponsorship.review'],
  FINANCE: ['donations.view', 'inkind.validate', 'invoices.manage', 'invoices.generate', 'stats.view'],
  COMMUNICATOR: ['communications.create', 'communications.send', 'fichas.view'],
}

export const ROLE_INFO = {
  ADMIN: { label: '👑 Super Admin', color: '#DA291C', description: 'Acceso total al sistema' },
  IDENTIFIER: { label: '🔍 Identificador', color: '#2196F3', description: 'Crea fichas y gestiona inventario' },
  FINANCE: { label: '💰 Finanzas', color: '#27AA5E', description: 'Valida donaciones y genera facturas' },
  COMMUNICATOR: { label: '📢 Comunicador', color: '#FF6F00', description: 'Envía correos y pruebas de impacto' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaurar sesión al montar
  useEffect(() => {
    const stored = parseToken()
    if (stored) {
      setUser(stored)
    }
    setLoading(false)
  }, [])

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'ADMIN'

  function hasPermission(permission) {
    if (!user) return false
    if (user.role === 'ADMIN') return true
    const perms = ROLE_PERMISSIONS[user.role] || []
    return perms.includes('*') || perms.includes(permission)
  }

  function hasRole(...roles) {
    if (!user) return false
    return user.role === 'ADMIN' || roles.includes(user.role)
  }

  async function login(email, password) {
    try {
      const result = await loginApi(email, password)
      setUser(result.user)
      return { success: true, user: result.user }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  function logout() {
    logoutApi()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isAdmin, loading,
      login, logout, hasPermission, hasRole,
      ROLES, ROLE_INFO,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
