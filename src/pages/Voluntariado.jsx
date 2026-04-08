import { useState } from 'react'
import confetti from 'canvas-confetti'
import { useFichas } from '../context/FichasContext.jsx'
import { volunteersApi } from '../api.js'

export default function Voluntariado() {
  const { getCollaborativeNeeds, refreshFichas } = useFichas()
  const volunteerEvents = getCollaborativeNeeds()

  const [selectedRole, setSelectedRole] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '', email: '', telefono: '', edad: '',
    motivacion: '', disponibilidad: 'manana',
    tipo: 'individual', corporateSlots: '', empresa: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  function handleChange(e) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const slots = formData.tipo === 'empresarial' ? parseInt(formData.corporateSlots) || 1 : 1
      await volunteersApi.register({
        ficha_id: selectedRole.id,
        name: formData.nombre,
        email: formData.email,
        phone: formData.telefono || null,
        age: parseInt(formData.edad) || null,
        motivation: formData.motivacion,
        reg_type: formData.tipo,
        company_name: formData.empresa || null,
        slots: slots,
      })
      refreshFichas()
      setIsSubmitting(false)
      setIsSuccess(true)
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#DA291C', '#FFC72C', '#27AA5E'] })
    } catch (err) {
      alert('Error: ' + err.message)
      setIsSubmitting(false)
    }
  }

  function handleClose() {
    setSelectedRole(null)
    setIsSuccess(false)
    setFormData({
      nombre: '', email: '', telefono: '', edad: '',
      motivacion: '', disponibilidad: 'manana',
      tipo: 'individual', corporateSlots: '', empresa: '',
    })
    document.body.style.overflow = ''
  }

  function handleOpenForm(event) {
    setSelectedRole(event)
    setIsSuccess(false)
    document.body.style.overflow = 'hidden'
  }

  return (
    <main className="dashboard" id="voluntariado-page">
      <div className="container">
        <div className="dashboard__header">
          <h1 className="dashboard__title">
            Dona tu{' '}<span className="text-gradient">Tiempo</span>
          </h1>
          <p className="dashboard__subtitle">
            No solo de dinero vive la Casa. Tu tiempo, talento y cariño
            también transforman vidas. Inscríbete como voluntario.
          </p>
        </div>

        {volunteerEvents.length === 0 && (
          <div className="dashboard__empty-state">
            <span className="dashboard__empty-icon">🤲</span>
            <h3 className="dashboard__empty-title">Aún no hay eventos de voluntariado</h3>
            <p className="dashboard__empty-text">
              El equipo de la Fundación está organizando nuevos eventos.<br />
              ¡Vuelve pronto para ver cómo puedes donar tu tiempo!
            </p>
          </div>
        )}

        <div className="cards-grid">
          {volunteerEvents.map((event, index) => {
            const spotsLeft = event.max_capacity - (event.current_enrolled || 0)
            const isFull = spotsLeft <= 0
            const fillPct = ((event.current_enrolled || 0) / event.max_capacity) * 100

            return (
              <article className={`need-card ${event.is_urgent ? 'urgent' : ''}`}
                key={event.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <div style={{ position: 'relative' }}>
                  <div className="need-card__image" style={{
                    background: `linear-gradient(135deg, ${getGradient(event.category)})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem',
                  }}>
                    {event.emoji}
                  </div>
                  {event.is_urgent === 1 && (
                    <span className="need-card__urgent-badge">
                      🔴 Urgente {event.deadline ? `— ${event.deadline}` : ''}
                    </span>
                  )}
                </div>
                <div className="need-card__body">
                  <span className="need-card__type-label volunteer-label">🤲 Voluntariado</span>
                  <h3 className="need-card__title">{event.title}</h3>
                  <p className="need-card__description" style={{ WebkitLineClamp: 3 }}>
                    {event.description}
                  </p>
                  <div className="vol-info-row">
                    {event.event_date && (
                      <div className="vol-info-item">
                        <span className="vol-info-icon">📅</span><span>{event.event_date}</span>
                      </div>
                    )}
                    {event.event_location && (
                      <div className="vol-info-item">
                        <span className="vol-info-icon">📍</span><span>{event.event_location}</span>
                      </div>
                    )}
                  </div>
                  <div className="vol-spots">
                    <div className="vol-spots__bar">
                      <div className="vol-spots__fill" style={{ width: `${fillPct}%` }} />
                    </div>
                    <span className="vol-spots__text">
                      {isFull ? '✅ ¡Cupo lleno!' : `${spotsLeft} de ${event.max_capacity} lugares disponibles`}
                    </span>
                  </div>
                  <div className="need-card__footer">
                    <span className="need-card__donors">
                      <span className="need-card__donors-icon">❤️</span>
                      {event.current_enrolled || 0} voluntarios
                    </span>
                    <button className={`need-card__btn ${isFull ? 'completed-btn' : 'volunteer-btn'}`}
                      onClick={() => handleOpenForm(event)} disabled={isFull}>
                      {isFull ? '✅ Cupo Lleno' : 'Inscribirme →'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      {selectedRole && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal vol-modal" onClick={e => e.stopPropagation()}>
            {isSuccess ? (
              <div className="success-state">
                <div className="success-state__icon">🎉</div>
                <h2 className="success-state__title">
                  ¡Bienvenido al <span className="text-gradient">equipo</span>!
                </h2>
                <p className="success-state__message">
                  Tu inscripción para <strong>{selectedRole.title}</strong> fue registrada.
                  El coordinador te contactará pronto.
                </p>
                <div style={{
                  background: '#F5F5F5', borderRadius: '12px', padding: '16px',
                  marginBottom: '20px', textAlign: 'left', border: '1px solid #E8E8E8',
                }}>
                  <p style={{ fontSize: '0.8125rem', color: '#6B6B6B', lineHeight: 1.6 }}>
                    📧 Correo de confirmación a <strong>{formData.email}</strong><br />
                    📅 Fecha: <strong>{selectedRole.event_date}</strong><br />
                    📍 Lugar: <strong>{selectedRole.event_location}</strong>
                    {formData.tipo === 'empresarial' && (
                      <><br />🏢 Empresa: <strong>{formData.empresa}</strong> — {formData.corporateSlots} lugares</>
                    )}
                  </p>
                </div>
                <button className="success-state__btn" onClick={handleClose}>
                  Entendido ✨
                </button>
              </div>
            ) : (
              <>
                <div className="modal__header">
                  <h2 className="modal__title">🙋 Inscribirme</h2>
                  <button className="modal__close" onClick={handleClose}>✕</button>
                </div>
                <div className="modal__body">
                  <div className="modal__need-info">
                    <div className="modal__need-emoji">{selectedRole.emoji}</div>
                    <div>
                      <p className="modal__need-title">{selectedRole.title}</p>
                      <p className="modal__need-remaining">
                        📅 {selectedRole.event_date} · 📍 {selectedRole.event_location}
                      </p>
                    </div>
                  </div>
                  <div className="vol-tipo-selector">
                    <label className={`vol-tipo-option ${formData.tipo === 'individual' ? 'active' : ''}`}>
                      <input type="radio" name="tipo" value="individual"
                        checked={formData.tipo === 'individual'} onChange={handleChange} />
                      <span>🧑 Individual</span>
                    </label>
                    <label className={`vol-tipo-option ${formData.tipo === 'empresarial' ? 'active' : ''}`}>
                      <input type="radio" name="tipo" value="empresarial"
                        checked={formData.tipo === 'empresarial'} onChange={handleChange} />
                      <span>🏢 Empresarial</span>
                    </label>
                  </div>
                  <form className="vol-form" onSubmit={handleSubmit}>
                    {formData.tipo === 'empresarial' && (
                      <div className="vol-form__row">
                        <div className="vol-form__field">
                          <label>Empresa *</label>
                          <input type="text" name="empresa" required placeholder="Comex, Liverpool..."
                            value={formData.empresa} onChange={handleChange} />
                        </div>
                        <div className="vol-form__field">
                          <label>Lugares *</label>
                          <input type="number" name="corporateSlots" required min="1"
                            max={selectedRole.max_capacity - (selectedRole.current_enrolled || 0)}
                            value={formData.corporateSlots} onChange={handleChange} />
                        </div>
                      </div>
                    )}
                    <div className="vol-form__row">
                      <div className="vol-form__field">
                        <label>{formData.tipo === 'empresarial' ? 'Contacto *' : 'Nombre *'}</label>
                        <input type="text" name="nombre" required placeholder="María González"
                          value={formData.nombre} onChange={handleChange} />
                      </div>
                      <div className="vol-form__field">
                        <label>Edad *</label>
                        <input type="number" name="edad" required min="16" max="99" placeholder="18"
                          value={formData.edad} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="vol-form__row">
                      <div className="vol-form__field">
                        <label>Correo *</label>
                        <input type="email" name="email" required placeholder="ejemplo@correo.com"
                          value={formData.email} onChange={handleChange} />
                      </div>
                      <div className="vol-form__field">
                        <label>Teléfono</label>
                        <input type="tel" name="telefono" placeholder="55 1234 5678"
                          value={formData.telefono} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="vol-form__field">
                      <label>¿Por qué quieres ser voluntario? *</label>
                      <textarea name="motivacion" rows="3" required
                        placeholder="Cuéntanos qué te motiva..."
                        value={formData.motivacion} onChange={handleChange} />
                    </div>
                    <button type="submit" className="pay-btn volunteer-submit" disabled={isSubmitting}>
                      {isSubmitting ? '⏳ Enviando...'
                        : formData.tipo === 'empresarial'
                          ? `🏢 Reservar ${formData.corporateSlots || ''} lugares`
                          : `🙋 Inscribirme en ${selectedRole.title}`}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

function getGradient(category) {
  const gradients = {
    mantenimiento: '#E3F2FD 0%, #90CAF9 50%, #64B5F6 100%',
    pintura: '#F3E5F5 0%, #CE93D8 50%, #BA68C8 100%',
    limpieza: '#E0F7FA 0%, #80DEEA 50%, #4DD0E1 100%',
    cocina: '#fce4ec 0%, #f8bbd0 50%, #f48fb1 100%',
    recreacion: '#FFE0B2 0%, #FFCC80 50%, #FFB74D 100%',
    educacion_vol: '#f3e5f5 0%, #ce93d8 50%, #ba68c8 100%',
    acompanamiento: '#E8F5E9 0%, #A5D6A7 50%, #81C784 100%',
    alimentacion: '#fce4ec 0%, #f8bbd0 50%, #f48fb1 100%',
    educacion: '#f3e5f5 0%, #ce93d8 50%, #ba68c8 100%',
    bienestar: '#E8F5E9 0%, #A5D6A7 50%, #81C784 100%',
  }
  return gradients[category] || '#f5f5f5 0%, #e0e0e0 100%'
}
