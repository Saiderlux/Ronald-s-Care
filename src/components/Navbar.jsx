import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import ronaldsCareLogo from '../../5b501c14-0a60-4bcc-8f18-8fb5444b78fa.jpeg'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoSrc, setLogoSrc] = useState(ronaldsCareLogo)
  const isDonationRoute = ['/donar', '/donar-especie', '/apadrinamiento', '/voluntariado']
    .some(route => location.pathname.startsWith(route))

  return (
    <nav className="navbar" id="navbar">
      <div className="container navbar__inner">
        <NavLink to="/" className="navbar__logo">
          <span className="navbar__logo-icon navbar__logo-icon--image">
            <img
              src={logoSrc}
              alt="Logo Ronald's Care"
              className="navbar__logo-image"
              loading="eager"
              decoding="async"
              onError={() => setLogoSrc('/favicon.svg')}
            />
          </span>
          <span>Ronald&apos;s Care</span>
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
              className={({ isActive }) => `navbar__link ${(isActive || isDonationRoute) ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}>
              Donaciones
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
