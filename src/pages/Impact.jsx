import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { impactApi } from '../api.js'

export default function Impact() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [impactData, setImpactData] = useState(null)

  async function handleSearchImpact(e) {
    e.preventDefault()
    setError('')
    setImpactData(null)

    const normalized = email.trim().toLowerCase()
    if (!normalized) {
      setError('Ingresa tu correo para consultar tu impacto.')
      return
    }

    setLoading(true)
    try {
      const data = await impactApi.getByEmail(normalized)
      setImpactData(data)
    } catch (err) {
      setError(err.message || 'No pudimos cargar tu impacto por ahora.')
    } finally {
      setLoading(false)
    }
  }

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
            Ingresa tu correo para conocer tus aportes, tu nivel de apoyo
            y las fichas en las que participaste.
          </p>
        </div>

        <form className="impact-search" onSubmit={handleSearchImpact}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu-correo@ejemplo.com"
            required
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Consultando...' : 'Ver mi impacto'}
          </button>
        </form>

        {error && <p className="impact-search__error">{error}</p>}

        {impactData && (
          <>
            <div className="impact-level-card">
              <p className="impact-level-card__eyebrow">Nivel de donador</p>
              <h2 className="impact-level-card__title">{impactData.support_level.title}</h2>
              <p className="impact-level-card__text">{impactData.support_level.message}</p>

              <div className="impact-level-card__stats">
                <div className="impact-stat">
                  <span className="impact-stat__value">{impactData.total_actions || 0}</span>
                  <span className="impact-stat__label">Acciones de apoyo</span>
                </div>
                <div className="impact-stat">
                  <span className="impact-stat__value">{impactData.unique_fichas || 0}</span>
                  <span className="impact-stat__label">Fichas apoyadas</span>
                </div>
                <div className="impact-stat">
                  <span className="impact-stat__value">{impactData.completed_supported || 0}</span>
                  <span className="impact-stat__label">Objetivos completados</span>
                </div>
              </div>
            </div>

            <div className="impact-participations">
              <h3 className="impact-participations__title">Aportes en donaciones y regalos</h3>

              {impactData.participations?.length > 0 ? (
                <div className="impact-participations__grid">
                  {impactData.participations.map(item => (
                    <article className="impact-participation-card" key={`${item.ficha_id}-${item.last_donation_at}`}>
                      <div className="impact-participation-card__header">
                        <span className="impact-participation-card__emoji">{item.ficha_emoji || '🎁'}</span>
                        <span className="impact-participation-card__type">
                          {item.ficha_type === 'gift' ? '🎁 Regalo directo' : '💰 Donación'}
                        </span>
                      </div>
                      <h4 className="impact-participation-card__title">{item.ficha_title || 'Ficha sin título'}</h4>
                      <p className="impact-participation-card__meta">
                        {item.donations_count} aportes · Último apoyo: {item.last_donation_at ? new Date(item.last_donation_at).toLocaleDateString() : '—'}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="impact-participations__empty">No encontramos fichas asociadas a este correo todavía.</p>
              )}
            </div>

            <div className="impact-participations" style={{ marginTop: '24px' }}>
              <h3 className="impact-participations__title">Voluntariados en los que participaste</h3>

              {impactData.volunteer_participations?.length > 0 ? (
                <div className="impact-participations__grid">
                  {impactData.volunteer_participations.map(item => (
                    <article className="impact-participation-card" key={`vol-${item.ficha_id}-${item.last_participation_at}`}>
                      <div className="impact-participation-card__header">
                        <span className="impact-participation-card__emoji">{item.ficha_emoji || '🙋'}</span>
                        <span className="impact-participation-card__type">🙋 Voluntariado</span>
                      </div>
                      <h4 className="impact-participation-card__title">{item.ficha_title || 'Actividad de voluntariado'}</h4>
                      <p className="impact-participation-card__meta">
                        {item.participations_count} participación(es) aprobada(s)
                        {item.total_slots ? ` · ${item.total_slots} lugar(es)` : ''}
                        {' · '}Última: {item.last_participation_at ? new Date(item.last_participation_at).toLocaleDateString() : '—'}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="impact-participations__empty">Aún no hay participaciones aprobadas de voluntariado para este correo.</p>
              )}
            </div>

            <div className="impact-participations" style={{ marginTop: '24px' }}>
              <h3 className="impact-participations__title">Donaciones en especie validadas</h3>

              {impactData.in_kind_participations?.length > 0 ? (
                <div className="impact-participations__grid">
                  {impactData.in_kind_participations.map(item => (
                    <article className="impact-participation-card" key={`ink-${item.id}`}>
                      <div className="impact-participation-card__header">
                        <span className="impact-participation-card__emoji">📦</span>
                        <span className="impact-participation-card__type">
                          {item.delivery_method === 'courier' ? '📦 Paquetería' : '🏠 Entrega física'}
                        </span>
                      </div>
                      <h4 className="impact-participation-card__title">{item.item_description}</h4>
                      <p className="impact-participation-card__meta">
                        {item.estimated_quantity ? `Cantidad: ${item.estimated_quantity} · ` : ''}
                        Validada: {item.validated_at ? new Date(item.validated_at).toLocaleDateString() : '—'}
                      </p>
                      <p className="impact-participation-card__meta">
                        {item.delivery_method === 'courier'
                          ? `Tracking: ${item.tracking_id || '—'}`
                          : `Código: ${item.pledge_code || '—'}`}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="impact-participations__empty">No hay donaciones en especie validadas para este correo.</p>
              )}
            </div>
          </>
        )}

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
