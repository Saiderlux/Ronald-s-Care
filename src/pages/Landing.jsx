import { useNavigate } from 'react-router-dom'
import StoriesCarousel from '../components/StoriesCarousel.jsx'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <main>
      <section className="hero" id="hero">
        <div className="hero__content">
          <span className="hero__badge">
            🏠 Fundación Infantil Ronald McDonald
          </span>

          <h1 className="hero__title">
            Cada peso tiene un{' '}
            <span className="text-gradient">nombre</span>,{' '}
            una{' '}
            <span className="text-golden">historia</span>{' '}
            y un destino
          </h1>

          <p className="hero__subtitle">
            Transforma tu donación en el apadrinamiento de necesidades reales:
            gasolina, cenas, kits de higiene. Tú decides a quién ayudas y
            ves exactamente cómo se usa cada peso.
          </p>

          <div className="hero__actions">
            <button
              className="btn-primary"
              id="hero-cta"
              onClick={() => navigate('/donar')}
            >
              Ver Necesidades Activas →
            </button>
            <button
              className="btn-secondary"
              id="hero-impact"
              onClick={() => navigate('/impacto')}
            >
              ¿Cómo funciona?
            </button>
          </div>

          {/* Stories Carousel */}
          <div className="hero__stories">
            <p className="hero__stories-label">📸 Historias de impacto</p>
            <StoriesCarousel />
          </div>

          <div className="hero__stats">
            <div className="stat">
              <div className="stat__number">$12,450</div>
              <div className="stat__label">Recaudados</div>
            </div>
            <div className="stat">
              <div className="stat__number">75</div>
              <div className="stat__label">Donantes</div>
            </div>
            <div className="stat">
              <div className="stat__number">5</div>
              <div className="stat__label">Metas Cumplidas</div>
            </div>
            <div className="stat">
              <div className="stat__number">32</div>
              <div className="stat__label">Familias Beneficiadas</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
