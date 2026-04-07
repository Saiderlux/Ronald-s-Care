import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAdmin } = useAuth()
  const navigate = useNavigate()

  // Si ya está autenticado, redirigir al dashboard
  if (isAdmin) {
    navigate('/admin/dashboard', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simular un pequeño delay de "verificación"
    await new Promise(r => setTimeout(r, 600))

    const result = login(email, password)
    setIsLoading(false)

    if (result.success) {
      navigate('/admin/dashboard', { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <main className="admin-login" id="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__header">
          <div className="admin-login__icon">🔒</div>
          <h1 className="admin-login__title">Panel de Administración</h1>
          <p className="admin-login__subtitle">
            Acceso exclusivo para el equipo de la Fundación
          </p>
        </div>

        <form className="admin-login__form" onSubmit={handleSubmit}>
          {error && (
            <div className="admin-login__error" id="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="admin-login__field">
            <label htmlFor="admin-email" className="admin-login__label">
              Correo electrónico
            </label>
            <input
              id="admin-email"
              type="email"
              className="admin-login__input"
              placeholder="admin@ronald.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="admin-login__field">
            <label htmlFor="admin-password" className="admin-login__label">
              Contraseña
            </label>
            <input
              id="admin-password"
              type="password"
              className="admin-login__input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="admin-login__submit"
            id="admin-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="admin-login__spinner">⏳</span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="admin-login__footer">
          <button
            className="admin-login__back"
            onClick={() => navigate('/')}
          >
            ← Volver al sitio público
          </button>
        </div>
      </div>
    </main>
  )
}
