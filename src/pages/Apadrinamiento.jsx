import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { sponsorshipApi } from '../api.js'

const SPONSORSHIP_TYPES = [
  { id: 'monetary_recurring', label: '💰 Monetario Recurrente', description: 'Aportar una cantidad fija mensual', icon: '💰' },
  { id: 'housing', label: '🏠 Vivienda / Hospedaje', description: 'Ofrecer un espacio para el niño y su acompañante', icon: '🏠' },
  { id: 'services', label: '🔧 Servicios', description: 'Pintura, plomería, remodelación, transporte', icon: '🔧' },
  { id: 'education', label: '📚 Educación', description: 'Tutorías, material escolar, becas', icon: '📚' },
  { id: 'in_kind_large', label: '📦 Especie Grande', description: 'Muebles, electrodomésticos, equipamiento', icon: '📦' },
  { id: 'matching', label: '🤝 Matching Empresarial', description: 'Tu empresa iguala donaciones', icon: '🤝' },
  { id: 'other', label: '✨ Otro', description: 'Cuéntanos qué puedes ofrecer', icon: '✨' },
]

export default function Apadrinamiento({ embedded = false }) {
  const [opportunities, setOpportunities] = useState([])
  const [selectedOpp, setSelectedOpp] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    sponsorship_type: 'monetary_recurring',
    offer_description: '',
    ficha_id: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    sponsorshipApi.getPublic().then(setOpportunities).catch(console.error)
  }, [])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSelectOpportunity(opp) {
    setSelectedOpp(opp)
    setForm(prev => ({ ...prev, ficha_id: opp.id }))
    setShowForm(true)
    document.body.style.overflow = 'hidden'
  }

  function handleOpenGeneral() {
    setSelectedOpp(null)
    setForm(prev => ({ ...prev, ficha_id: null }))
    setShowForm(true)
    document.body.style.overflow = 'hidden'
  }

  function handleClose() {
    setShowForm(false)
    setIsSuccess(false)
    setSelectedOpp(null)
    document.body.style.overflow = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await sponsorshipApi.create(form)
      setIsSuccess(true)
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#DA291C', '#FFC72C', '#27AA5E'] })
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`dashboard ${embedded ? 'dashboard--embedded' : ''}`} id="apadrinamiento-page">
      <div className="container">
        <div className="dashboard__header">
          <h1 className="dashboard__title">
            <span className="text-gradient">Apadrinamiento</span>
          </h1>
          <p className="dashboard__subtitle">
            El apadrinamiento va más allá del dinero. Puedes ofrecer un hogar temporal,
            servicios, educación o cualquier recurso que transforme la vida de un niño y su familia.
          </p>
        </div>

        {/* Sponsorship Types Grid */}
        <div className="section-header">
          <h2 className="section-title">
            🤝 ¿Cómo puedes apadrinar?
          </h2>
        </div>
        <div className="apadrinamiento-types-grid">
          {SPONSORSHIP_TYPES.map(type => (
            <div key={type.id} className="apadrinamiento-type-card">
              <span className="apadrinamiento-type-card__icon">{type.icon}</span>
              <h4 className="apadrinamiento-type-card__label">{type.label}</h4>
              <p className="apadrinamiento-type-card__desc">{type.description}</p>
            </div>
          ))}
        </div>

        {/* Available Opportunities */}
        {opportunities.length > 0 && (
          <>
            <div className="section-header" style={{ marginTop: '48px' }}>
              <h2 className="section-title">
                🌟 Oportunidades Activas
                <span className="section-count"> — El admin ha publicado estas necesidades</span>
              </h2>
            </div>
            <div className="cards-grid">
              {opportunities.map(opp => (
                <article className="need-card" key={opp.id}>
                  <div style={{ position: 'relative' }}>
                    <div className="need-card__image" style={{
                      background: 'linear-gradient(135deg, #e8f5e9 0%, #a5d6a7 50%, #66bb6a 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem',
                    }}>
                      {opp.emoji}
                    </div>
                  </div>
                  <div className="need-card__body">
                    <span className="need-card__type-label" style={{ background: '#e8f5e9', color: '#2e7d32' }}>🤝 Apadrinamiento</span>
                    <h3 className="need-card__title">{opp.title}</h3>
                    <p className="need-card__description">{opp.description}</p>
                    {opp.duration && (
                      <p style={{ fontSize: '0.8125rem', color: '#6B6B6B', marginTop: '8px' }}>
                        ⏱️ Duración estimada: {opp.duration}
                      </p>
                    )}
                    <div className="need-card__footer">
                      <span className="need-card__donors">
                        <span className="need-card__donors-icon">🤝</span>
                        {opp.sponsorship_type || 'Abierto'}
                      </span>
                      <button className="need-card__btn" onClick={() => handleSelectOpportunity(opp)}>
                        Me Interesa →
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {/* General CTA */}
        <div className="apadrinamiento-cta">
          <div className="apadrinamiento-cta__content">
            <span className="apadrinamiento-cta__icon">💡</span>
            <div>
              <h3>¿Tienes algo que ofrecer?</h3>
              <p>
                No importa si no ves una oportunidad específica. Cuéntanos qué puedes aportar
                y nuestro equipo evaluará cómo canalizarlo para máximo impacto.
              </p>
            </div>
            <button className="btn-primary" onClick={handleOpenGeneral}>
              Enviar Propuesta 🤝
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal vol-modal" onClick={e => e.stopPropagation()}>
            {isSuccess ? (
              <div className="success-state">
                <div className="success-state__icon">🤝</div>
                <h2 className="success-state__title">
                  ¡Solicitud <span className="text-gradient">enviada</span>!
                </h2>
                <p className="success-state__message">
                  Tu propuesta de apadrinamiento fue registrada. El equipo de la Casa Ronald la revisará
                  y te contactará pronto para coordinar los detalles.
                </p>
                <button className="success-state__btn" onClick={handleClose}>
                  Entendido ✨
                </button>
              </div>
            ) : (
              <>
                <div className="modal__header">
                  <h2 className="modal__title">🤝 Solicitud de Apadrinamiento</h2>
                  <button className="modal__close" onClick={handleClose}>✕</button>
                </div>
                <div className="modal__body">
                  {selectedOpp && (
                    <div className="modal__need-info">
                      <div className="modal__need-emoji">{selectedOpp.emoji}</div>
                      <div>
                        <p className="modal__need-title">{selectedOpp.title}</p>
                        <p className="modal__need-remaining">{selectedOpp.description}</p>
                      </div>
                    </div>
                  )}
                  <form className="vol-form" onSubmit={handleSubmit}>
                    <div className="vol-form__row">
                      <div className="vol-form__field">
                        <label>Nombre completo *</label>
                        <input type="text" name="requester_name" required placeholder="Tu nombre"
                          value={form.requester_name} onChange={handleChange} />
                      </div>
                      <div className="vol-form__field">
                        <label>Correo electrónico *</label>
                        <input type="email" name="requester_email" required placeholder="tu@correo.com"
                          value={form.requester_email} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="vol-form__row">
                      <div className="vol-form__field">
                        <label>Teléfono</label>
                        <input type="tel" name="requester_phone" placeholder="55 1234 5678"
                          value={form.requester_phone} onChange={handleChange} />
                      </div>
                      <div className="vol-form__field">
                        <label>Tipo de apadrinamiento *</label>
                        <select name="sponsorship_type" value={form.sponsorship_type} onChange={handleChange}>
                          {SPONSORSHIP_TYPES.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="vol-form__field">
                      <label>Describe tu propuesta *</label>
                      <textarea name="offer_description" rows={4} required
                        placeholder="Cuéntanos en detalle qué puedes ofrecer, por cuánto tiempo, y cualquier condición relevante..."
                        value={form.offer_description} onChange={handleChange} />
                    </div>
                    <button type="submit" className="pay-btn volunteer-submit" disabled={isSubmitting}>
                      {isSubmitting ? '⏳ Enviando...' : '🤝 Enviar Solicitud de Apadrinamiento'}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
