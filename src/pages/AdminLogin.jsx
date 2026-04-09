import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth, ROLE_INFO } from '../context/AuthContext.jsx'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    const result = await login(email, password)
    setIsLoading(false)
    if (result.success) {
      navigate('/admin/dashboard')
    } else {
      setError(result.error)
    }
  }

  return (
    <main className="admin-login" id="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__header">
          <span className="admin-login__icon">🔐</span>
          <h1 className="admin-login__title">Panel Administrativo</h1>
          <p className="admin-login__subtitle">Conexión Tangible</p>
        </div>

        <form className="admin-login__form" onSubmit={handleSubmit}>
          {error && <div className="admin-login__error">{error}</div>}

          <div className="admin-login__field">
            <label htmlFor="admin-email">Correo electrónico</label>
            <input id="admin-email" type="email" required
              placeholder="tu@ronald.com" value={email}
              onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="admin-login__field">
            <label htmlFor="admin-password">Contraseña</label>
            <input id="admin-password" type="password" required
              placeholder="••••••" value={password}
              onChange={e => setPassword(e.target.value)} />
          </div>

          <button type="submit" className="admin-login__submit" disabled={isLoading}>
            {isLoading ? '⏳ Verificando...' : 'Iniciar Sesión →'}
          </button>
        </form>

        {/* Role hints */}
        <div className="admin-login__roles">
          <p className="admin-login__roles-title">👥 Usuarios de prueba:</p>
          <div className="admin-login__roles-grid">
            {Object.entries(ROLE_INFO).map(([role, info]) => {
              const emails = {
                ADMIN: 'admin@ronald.com / admin123',
                IDENTIFIER: 'identificador@ronald.com / id123',
                FINANCE: 'finanzas@ronald.com / fin123',
                COMMUNICATOR: 'comunicacion@ronald.com / com123',
              }
              return (
                <button key={role} type="button" className="admin-login__role-hint"
                  onClick={() => {
                    const [e, p] = emails[role].split(' / ')
                    setEmail(e)
                    setPassword(p)
                  }}
                  style={{ borderColor: info.color }}>
                  <span style={{ color: info.color, fontWeight: 700 }}>{info.label}</span>
                  <span className="admin-login__role-desc">{info.description}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
