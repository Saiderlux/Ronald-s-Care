import { NavLink, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="navbar" id="navbar">
      <div className="container navbar__inner">
        <NavLink to="/" className="navbar__logo">
          <span className="navbar__logo-icon">🏠</span>
          <span>Conexión <span className="text-gradient">Tangible</span></span>
        </NavLink>

        <ul className="navbar__links">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              end
            >
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/donar"
              className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
            >
              Catálogo
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/impacto"
              className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
            >
              Mi Impacto
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/voluntariado"
              className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
            >
              Voluntariado
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/correos"
              className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
            >
              📧 Correos
            </NavLink>
          </li>
        </ul>

        <button
          className="navbar__cta"
          id="navbar-cta"
          onClick={() => navigate('/donar')}
        >
          Donar Ahora ❤️
        </button>
      </div>
    </nav>
  )
}
