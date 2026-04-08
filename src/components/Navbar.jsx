import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Navbar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="navbar" id="navbar">
      <div className="container navbar__inner">
        <NavLink to="/" className="navbar__logo">
          <span className="navbar__logo-icon">🏠</span>
          <span>Conexión <span className="text-gradient">Tangible</span></span>
        </NavLink>

        <button className="navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú">
          {menuOpen ? '✕' : '☰'}
        </button>

        <ul className={`navbar__links ${menuOpen ? 'open' : ''}`}>
          <li>
            <NavLink to="/"
              className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`} end
              onClick={() => setMenuOpen(false)}>
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink to="/donar"
              className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}>
              Iniciativas
            </NavLink>
          </li>
          <li>
            <NavLink to="/donar-especie"
              className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}>
              En Especie
            </NavLink>
          </li>
          <li>
            <NavLink to="/apadrinamiento"
              className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}>
              Apadrinamiento
            </NavLink>
          </li>
          <li>
            <NavLink to="/voluntariado"
              className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}>
              Voluntariado
            </NavLink>
          </li>
          <li>
            <NavLink to="/impacto"
              className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}>
              Mi Impacto
            </NavLink>
          </li>
          <li>
            <NavLink to="/correos"
              className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}>
              📧 Correos
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin"
              className={({ isActive }) => `navbar__link navbar__link--admin ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}>
              🔒 Admin
            </NavLink>
          </li>
        </ul>

        <button className="navbar__cta" id="navbar-cta" onClick={() => navigate('/donar')}>
          Donar Ahora ❤️
        </button>
      </div>
    </nav>
  )
}
