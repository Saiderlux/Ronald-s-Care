import { useState } from 'react'
import confetti from 'canvas-confetti'
import { useFichas } from '../context/FichasContext.jsx'
import { volunteersApi } from '../api.js'
import { evaluarVoluntario } from '../services/aiService.js'

export default function Voluntariado({ embedded = false, eventsOverride = null }) {
  const { getCollaborativeNeeds, refreshFichas } = useFichas()
  const volunteerEvents = Array.isArray(eventsOverride) ? eventsOverride : getCollaborativeNeeds()

  const [selectedRole, setSelectedRole] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '', email: '', telefono: '', edad: '',
    motivacion: '', disponibilidad: 'manana',
    tipo: 'individual', corporateSlots: '', empresa: '',
    isPrevVolunteer: 'no', likesKids: 'si', habilidad: 'empatia'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState(null)
  const [rejectionMessage, setRejectionMessage] = useState(null)

  function handleChange(e) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formData.tipo === 'individual') {
        try {
          const evaluacion = await evaluarVoluntario(formData);
          if (evaluacion.estado === 'RECHAZADO') {
            // Mostrar mensaje de rechazo en la UI, no bloqueamos con alert
            setRejectionMessage(evaluacion.feedback || 'Tu perfil no cumple los requisitos mínimos en este momento.');
            setIsSubmitting(false);
            return;
          }
          setEvaluationResult(evaluacion.feedback);
        } catch (aiErr) {
          // Si la IA falla, no bloqueamos el registro — el Admin lo revisará manualmente
          console.warn('IA no disponible, registro procederá para revisión manual:', aiErr.message);
          setEvaluationResult(null);
        }
      } else {
        setEvaluationResult("Inscripción empresarial verificada automáticamente por convenios.");
      }

      const slots = formData.tipo === 'empresarial' ? parseInt(formData.corporateSlots) || 1 : 1
      let finalMotivation = formData.motivacion;
      if (formData.tipo === 'individual') {
        const hasVolunteered = formData.isPrevVolunteer === 'si' ? 'Sí' : 'No';
        const likesKids = formData.likesKids === 'si' ? 'Sí' : 'No';
        finalMotivation = `Disponibilidad: ${formData.disponibilidad} | Voluntario antes: ${hasVolunteered} | Le gustan los niños: ${likesKids} | Habilidad: ${formData.habilidad}\nMotivación: ${formData.motivacion}`;
      }

      await volunteersApi.register({
        ficha_id: selectedRole.id,
        name: formData.nombre,
        email: formData.email,
        phone: formData.telefono || null,
        age: parseInt(formData.edad) || null,
        motivation: finalMotivation,
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
    setEvaluationResult(null)
    setRejectionMessage(null)
    setFormData({
      nombre: '', email: '', telefono: '', edad: '',
      motivacion: '', disponibilidad: 'manana',
      tipo: 'individual', corporateSlots: '', empresa: '',
      isPrevVolunteer: 'no', likesKids: 'si', habilidad: 'empatia'
    })
    document.body.style.overflow = ''
  }

  function handleOpenForm(event) {
    setSelectedRole(event)
    setIsSuccess(false)
    document.body.style.overflow = 'hidden'
  }

  return (
    <div className={`dashboard ${embedded ? 'dashboard--embedded' : ''}`} id="voluntariado-page">
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
                  {evaluationResult && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #c8e6c9' }}>
                      <p style={{ fontSize: '0.8125rem', color: '#2e7d32', fontStyle: 'italic' }}>
                        🤖 <strong>Nota de Evaluación IA:</strong> {evaluationResult}
                      </p>
                    </div>
                  )}
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
                    {/* Mensaje de rechazo por IA (sin tonterías) */}
                    {rejectionMessage && (
                      <div style={{
                        background: '#FFF3E0', border: '2px solid #FF9800', borderRadius: '12px',
                        padding: '16px', marginBottom: '20px',
                      }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#E65100', fontSize: '0.95rem', marginBottom: '6px' }}>
                          ⚠️ Postulación no válida
                        </p>
                        <p style={{ margin: 0, color: '#BF360C', fontSize: '0.875rem', lineHeight: 1.5 }}>
                          {rejectionMessage}
                        </p>
                        <button type="button" onClick={() => setRejectionMessage(null)}
                          style={{ marginTop: '10px', background: 'none', border: '1px solid #E65100', borderRadius: '8px',
                            padding: '6px 14px', color: '#E65100', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                          Intentar de nuevo
                        </button>
                      </div>
                    )}
                    {formData.tipo === 'empresarial' && (
                      <div className="vol-form__row">
                        <div className="vol-form__field">
                          <label>Empresa *</label>
                          <input type="text" name="empresa" required placeholder="Comex, Liverpool..."
                            value={formData.empresa} onChange={handleChange} />
                        </div>
                        <div className="vol-form__field">
                          <label>Lugares requeridos *</label>
                          <input type="number" name="corporateSlots" required min="1"
                            max={selectedRole.max_capacity - (selectedRole.current_enrolled || 0)}
                            value={formData.corporateSlots} onChange={handleChange} />
                        </div>
                      </div>
                    )}
                    
                    <div className="vol-form__row">
                      <div className="vol-form__field">
                        <label>{formData.tipo === 'empresarial' ? 'Contacto Principal *' : 'Nombre Completo *'}</label>
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
                        <label>Correo Electrónico *</label>
                        <input type="email" name="email" required placeholder="ejemplo@correo.com"
                          value={formData.email} onChange={handleChange} />
                      </div>
                      <div className="vol-form__field">
                        <label>Teléfono (Opcional)</label>
                        <input type="tel" name="telefono" placeholder="55 1234 5678"
                          value={formData.telefono} onChange={handleChange} />
                      </div>
                    </div>

                    {formData.tipo === 'individual' && (
                      <>
                        <div className="vol-form__field">
                          <label>¿En qué horario te gustaría ayudar? *</label>
                          <div className="vol-tipo-selector" style={{ marginTop: '5px', gap: '8px' }}>
                            <label className={`vol-tipo-option ${formData.disponibilidad === 'manana' ? 'active' : ''}`} style={{ padding: '8px', fontSize: '0.9rem' }}>
                              <input type="radio" name="disponibilidad" value="manana"
                                checked={formData.disponibilidad === 'manana'} onChange={handleChange} />
                              <span>🌅 Mañana</span>
                            </label>
                            <label className={`vol-tipo-option ${formData.disponibilidad === 'tarde' ? 'active' : ''}`} style={{ padding: '8px', fontSize: '0.9rem' }}>
                              <input type="radio" name="disponibilidad" value="tarde"
                                checked={formData.disponibilidad === 'tarde'} onChange={handleChange} />
                              <span>🌇 Tarde</span>
                            </label>
                            <label className={`vol-tipo-option ${formData.disponibilidad === 'fin_semana' ? 'active' : ''}`} style={{ padding: '8px', fontSize: '0.9rem' }}>
                              <input type="radio" name="disponibilidad" value="fin_semana"
                                checked={formData.disponibilidad === 'fin_semana'} onChange={handleChange} />
                              <span>📅 Fines de semana</span>
                            </label>
                          </div>
                        </div>

                        <div className="vol-form__row">
                          <div className="vol-form__field">
                            <label>¿Ya has sido voluntario antes? *</label>
                            <div className="vol-tipo-selector" style={{ marginTop: '5px', gap: '8px' }}>
                              <label className={`vol-tipo-option ${formData.isPrevVolunteer === 'si' ? 'active' : ''}`} style={{ padding: '8px', fontSize: '0.9rem' }}>
                                <input type="radio" name="isPrevVolunteer" value="si" checked={formData.isPrevVolunteer === 'si'} onChange={handleChange} /> <span>Sí</span>
                              </label>
                              <label className={`vol-tipo-option ${formData.isPrevVolunteer === 'no' ? 'active' : ''}`} style={{ padding: '8px', fontSize: '0.9rem' }}>
                                <input type="radio" name="isPrevVolunteer" value="no" checked={formData.isPrevVolunteer === 'no'} onChange={handleChange} /> <span>No</span>
                              </label>
                            </div>
                          </div>
                          
                          <div className="vol-form__field">
                            <label>¿Te gusta convivir con niños? *</label>
                            <div className="vol-tipo-selector" style={{ marginTop: '5px', gap: '8px' }}>
                              <label className={`vol-tipo-option ${formData.likesKids === 'si' ? 'active' : ''}`} style={{ padding: '8px', fontSize: '0.9rem' }}>
                                <input type="radio" name="likesKids" value="si" checked={formData.likesKids === 'si'} onChange={handleChange} /> <span>¡Me encantan!</span>
                              </label>
                              <label className={`vol-tipo-option ${formData.likesKids === 'no' ? 'active' : ''}`} style={{ padding: '8px', fontSize: '0.9rem' }}>
                                <input type="radio" name="likesKids" value="no" checked={formData.likesKids === 'no'} onChange={handleChange} /> <span>Prefiero otra área</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="vol-form__field">
                          <label>¿Cuál es tu habilidad principal? *</label>
                          <div className="vol-tipo-selector" style={{ marginTop: '5px', gap: '8px', flexWrap: 'wrap' }}>
                            <label className={`vol-tipo-option ${formData.habilidad === 'fuerza' ? 'active' : ''}`} style={{ padding: '8px', fontSize: '0.9rem' }}>
                              <input type="radio" name="habilidad" value="fuerza" checked={formData.habilidad === 'fuerza'} onChange={handleChange} /> <span>💪 Trabajo manual/físico</span>
                            </label>
                            <label className={`vol-tipo-option ${formData.habilidad === 'empatia' ? 'active' : ''}`} style={{ padding: '8px', fontSize: '0.9rem' }}>
                              <input type="radio" name="habilidad" value="empatia" checked={formData.habilidad === 'empatia'} onChange={handleChange} /> <span>❤️ Escucha activa/Empatía</span>
                            </label>
                            <label className={`vol-tipo-option ${formData.habilidad === 'logistica' ? 'active' : ''}`} style={{ padding: '8px', fontSize: '0.9rem' }}>
                              <input type="radio" name="habilidad" value="logistica" checked={formData.habilidad === 'logistica'} onChange={handleChange} /> <span>📋 Logística y Orden</span>
                            </label>
                            <label className={`vol-tipo-option ${formData.habilidad === 'creatividad' ? 'active' : ''}`} style={{ padding: '8px', fontSize: '0.9rem' }}>
                              <input type="radio" name="habilidad" value="creatividad" checked={formData.habilidad === 'creatividad'} onChange={handleChange} /> <span>🎨 Creatividad/Juego</span>
                            </label>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="vol-form__field">
                      <label>¿Por qué quieres ser voluntario? *</label>
                      <textarea name="motivacion" rows="3" required
                        placeholder="Cuéntanos un poco de ti. Nos encanta conocer qué te mueve a ayudar..."
                        value={formData.motivacion} onChange={handleChange} />
                    </div>

                    <button type="submit" className="pay-btn volunteer-submit" disabled={isSubmitting}>
                      {isSubmitting ? '⏳ Analizando perfil y enviando...'
                        : formData.tipo === 'empresarial'
                          ? `🏢 Reservar ${formData.corporateSlots || ''} lugares`
                          : `🙋 Enviar mi postulación para ${selectedRole.title}`}
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
