import { createContext, useContext, useState } from 'react'

// Credenciales hardcodeadas del Admin (se reemplazarán con BD)
const ADMIN_CREDENTIALS = {
  email: 'admin@ronald.com',
  password: 'admin123',
  name: 'Administrador',
  role: 'ADMIN',
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'ADMIN'

  function login(email, password) {
    // Validar contra credenciales hardcodeadas
    if (
      email === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setUser({
        name: ADMIN_CREDENTIALS.name,
        email: ADMIN_CREDENTIALS.email,
        role: ADMIN_CREDENTIALS.role,
      })
      return { success: true }
    }
    return { success: false, error: 'Credenciales incorrectas' }
  }

  function logout() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, logout }}>
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
