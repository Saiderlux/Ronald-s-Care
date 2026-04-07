import { useNavigate } from 'react-router-dom'
import { IMPACT_NOTIFICATIONS } from '../data/mockData.js'

export default function Impact() {
  const navigate = useNavigate()

  return (
    <main className="impact" id="impact-page">
      <div className="container">
        {/* Header */}
        <div className="impact__header">
          <h1 className="impact__title">
            Tu{' '}
            <span className="text-golden">Impacto</span>{' '}
            en Tiempo Real
          </h1>
          <p className="impact__subtitle">
            Aquí puedes ver exactamente cómo tu donación se convirtió en
            acción. Transparencia radical, sin secretos.
          </p>
        </div>

        {/* Timeline */}
        <div className="impact-timeline" id="impact-timeline">
          {IMPACT_NOTIFICATIONS.map((item, index) => (
            <div
              className={`impact-item ${item.type === 'completed' ? 'completed' : ''}`}
              key={item.id}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="impact-item__dot">{item.emoji}</div>
              <div className="impact-item__content">
                <p className="impact-item__time">{item.time}</p>
                <h3 className="impact-item__title">{item.title}</h3>
                <p className="impact-item__text">{item.message}</p>
                <span className="impact-item__highlight">
                  {item.highlight}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA to emails */}
        <div style={{
          textAlign: 'center',
          marginTop: '48px',
          padding: '32px',
          background: '#FFF9F0',
          borderRadius: '16px',
          border: '1px solid #E8E8E8',
          animation: 'fadeInUp 0.6s ease-out 0.6s backwards',
        }}>
          <p style={{ fontSize: '2rem', marginBottom: '12px' }}>📧</p>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px', color: '#292929' }}>
            ¿Quieres ver cómo lucen los correos de agradecimiento?
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6B6B6B', marginBottom: '20px' }}>
            Cada vez que una ficha que apoyaste se completa, recibirás un correo como estos.
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate('/correos')}
          >
            Ver Correos Simulados →
          </button>
        </div>
      </div>
    </main>
  )
}
