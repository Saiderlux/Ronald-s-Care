import { useState } from 'react'
import confetti from 'canvas-confetti'

const VOLUNTEER_ROLES = [
  {
    id: 1,
    emoji: '🤡',
    title: 'Animador de Fiestas',
    description: 'Haz sonreír a los niños como payaso, botarga o mago. Organizamos fiestas de cumpleaños y eventos especiales en la Casa.',
    skills: ['Animación', 'Trabajo con niños', 'Creatividad'],
    schedule: 'Sábados 10:00 - 14:00',
    spotsLeft: 3,
    totalSpots: 5,
    commitment: '4 hrs/semana',
    category: 'entretenimiento',
  },
  {
    id: 2,
    emoji: '👨‍🍳',
    title: 'Cocinero Voluntario',
    description: 'Prepara desayunos, comidas o cenas nutritivas para las familias. No necesitas ser chef, solo tener ganas de servir.',
    skills: ['Cocina básica', 'Higiene', 'Trabajo en equipo'],
    schedule: 'Lunes a Viernes, turnos de 3 hrs',
    spotsLeft: 5,
    totalSpots: 8,
    commitment: '3 hrs/semana',
    category: 'alimentacion',
  },
  {
    id: 3,
    emoji: '📚',
    title: 'Tutor Escolar',
    description: 'Ayuda a los niños en tratamiento a no perder el año escolar. Matemáticas, español, inglés — lo que domines.',
    skills: ['Paciencia', 'Conocimiento académico', 'Empatía'],
    schedule: 'Martes y Jueves 16:00 - 18:00',
    spotsLeft: 4,
    totalSpots: 6,
    commitment: '4 hrs/semana',
    category: 'educacion',
  },
  {
    id: 4,
    emoji: '🎨',
    title: 'Tallerista de Arte',
    description: 'Pintura, manualidades, música o teatro. Cualquier expresión artística que ayude a los niños a expresarse y distraerse.',
    skills: ['Habilidad artística', 'Creatividad', 'Paciencia'],
    schedule: 'Miércoles 15:00 - 17:00',
    spotsLeft: 2,
    totalSpots: 4,
    commitment: '2 hrs/semana',
    category: 'entretenimiento',
  },
  {
    id: 5,
    emoji: '🧹',
    title: 'Apoyo en Mantenimiento',
    description: 'La Casa necesita manos para pintar, reparar, limpiar y mantener los espacios acogedores para las familias.',
    skills: ['Bricolaje', 'Trabajo físico', 'Disponibilidad'],
    schedule: 'Domingos 9:00 - 13:00',
    spotsLeft: 6,
    totalSpots: 10,
    commitment: '4 hrs/semana',
    category: 'operaciones',
  },
  {
    id: 6,
    emoji: '🫂',
    title: 'Acompañante Emocional',
    description: 'A veces las mamás y papás solo necesitan alguien que los escuche. Sé esa presencia cálida en sus días más difíciles.',
    skills: ['Empatía', 'Escucha activa', 'Estabilidad emocional'],
    schedule: 'Flexible, mínimo 2 hrs/semana',
    spotsLeft: 3,
    totalSpots: 5,
    commitment: '2 hrs/semana',
    category: 'bienestar',
  },
]

export default function Voluntariado() {
  const [selectedRole, setSelectedRole] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    edad: '',
    motivacion: '',
    experiencia: '',
    disponibilidad: 'manana',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  function handleChange(e) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#DA291C', '#FFC72C', '#27AA5E'],
      })
    }, 1500)
  }

  function handleClose() {
    setSelectedRole(null)
    setIsSuccess(false)
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      edad: '',
      motivacion: '',
      experiencia: '',
      disponibilidad: 'manana',
    })
    document.body.style.overflow = ''
  }

  function handleOpenForm(role) {
    setSelectedRole(role)
    setIsSuccess(false)
    document.body.style.overflow = 'hidden'
  }

  return (
    <main className="dashboard" id="voluntariado-page">
      <div className="container">
        {/* Header */}
        <div className="dashboard__header">
          <h1 className="dashboard__title">
            Dona tu{' '}
            <span className="text-gradient">Tiempo</span>
          </h1>
          <p className="dashboard__subtitle">
            No solo de dinero vive la Casa. Tu tiempo, talento y cariño
            también transforman vidas. Postúlate como voluntario.
          </p>
        </div>

        {/* Volunteer Grid */}
        <div className="cards-grid">
          {VOLUNTEER_ROLES.map((role, index) => (
            <article
              className="need-card"
              key={role.id}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className="need-card__image"
                style={{
                  background: `linear-gradient(135deg, ${getGradient(role.category)})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                }}
              >
                {role.emoji}
              </div>

              <div className="need-card__body">
                <span className="need-card__type-label volunteer-label">🙋 Voluntariado</span>
                <h3 className="need-card__title">{role.title}</h3>
                <p className="need-card__description" style={{ WebkitLineClamp: 3 }}>
                  {role.description}
                </p>

                {/* Skills */}
                <div className="vol-skills">
                  {role.skills.map(skill => (
                    <span className="vol-skill-tag" key={skill}>{skill}</span>
                  ))}
                </div>

                {/* Info Row */}
                <div className="vol-info-row">
                  <div className="vol-info-item">
                    <span className="vol-info-icon">🕐</span>
                    <span>{role.commitment}</span>
                  </div>
                  <div className="vol-info-item">
                    <span className="vol-info-icon">📅</span>
                    <span>{role.schedule}</span>
                  </div>
                </div>

                {/* Spots */}
                <div className="vol-spots">
                  <div className="vol-spots__bar">
                    <div
                      className="vol-spots__fill"
                      style={{ width: `${((role.totalSpots - role.spotsLeft) / role.totalSpots) * 100}%` }}
                    />
                  </div>
                  <span className="vol-spots__text">
                    {role.spotsLeft} de {role.totalSpots} lugares disponibles
                  </span>
                </div>

                <div className="need-card__footer">
                  <span className="need-card__donors">
                    <span className="need-card__donors-icon">❤️</span>
                    {role.totalSpots - role.spotsLeft} voluntarios
                  </span>
                  <button
                    className="need-card__btn volunteer-btn"
                    onClick={() => handleOpenForm(role)}
                  >
                    Postularme →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* =============================================
          FORMULARIO MODAL
          ============================================= */}
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
                  Tu postulación como <strong>{selectedRole.title}</strong> fue
                  registrada. El coordinador de la Casa Ronald McDonald te
                  contactará pronto para agendar tu primera visita.
                </p>
                <div style={{
                  background: '#F5F5F5',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  textAlign: 'left',
                  border: '1px solid #E8E8E8',
                }}>
                  <p style={{ fontSize: '0.8125rem', color: '#6B6B6B', lineHeight: 1.6 }}>
                    📧 Recibirás un correo de confirmación en <strong>{formData.email || 'tu correo'}</strong>
                    <br />
                    📅 Horario: <strong>{selectedRole.schedule}</strong>
                    <br />
                    🕐 Compromiso: <strong>{selectedRole.commitment}</strong>
                  </p>
                </div>
                <button className="success-state__btn" onClick={handleClose}>
                  Entendido ✨
                </button>
              </div>
            ) : (
              <>
                <div className="modal__header">
                  <h2 className="modal__title">🙋 Postularme</h2>
                  <button className="modal__close" onClick={handleClose}>✕</button>
                </div>
                <div className="modal__body">
                  {/* Role Info */}
                  <div className="modal__need-info">
                    <div className="modal__need-emoji">{selectedRole.emoji}</div>
                    <div>
                      <p className="modal__need-title">{selectedRole.title}</p>
                      <p className="modal__need-remaining">
                        {selectedRole.schedule} · {selectedRole.spotsLeft} lugares
                      </p>
                    </div>
                  </div>

                  {/* Form */}
                  <form className="vol-form" onSubmit={handleSubmit}>
                    <div className="vol-form__row">
                      <div className="vol-form__field">
                        <label>Nombre completo *</label>
                        <input
                          type="text"
                          name="nombre"
                          required
                          placeholder="Ej. María González"
                          value={formData.nombre}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="vol-form__field">
                        <label>Edad *</label>
                        <input
                          type="number"
                          name="edad"
                          required
                          placeholder="18"
                          min="16"
                          max="99"
                          value={formData.edad}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="vol-form__row">
                      <div className="vol-form__field">
                        <label>Correo electrónico *</label>
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="ejemplo@correo.com"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="vol-form__field">
                        <label>Teléfono</label>
                        <input
                          type="tel"
                          name="telefono"
                          placeholder="55 1234 5678"
                          value={formData.telefono}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="vol-form__field">
                      <label>Disponibilidad preferida *</label>
                      <select
                        name="disponibilidad"
                        value={formData.disponibilidad}
                        onChange={handleChange}
                        required
                      >
                        <option value="manana">Mañanas (9:00 - 13:00)</option>
                        <option value="tarde">Tardes (14:00 - 18:00)</option>
                        <option value="finsemana">Fines de semana</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>

                    <div className="vol-form__field">
                      <label>¿Tienes experiencia previa? (Opcional)</label>
                      <textarea
                        name="experiencia"
                        rows="2"
                        placeholder="Ej. He sido voluntario en Cruz Roja por 2 años..."
                        value={formData.experiencia}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="vol-form__field">
                      <label>¿Por qué quieres ser voluntario? *</label>
                      <textarea
                        name="motivacion"
                        rows="3"
                        required
                        placeholder="Cuéntanos qué te motiva a donar tu tiempo..."
                        value={formData.motivacion}
                        onChange={handleChange}
                      />
                    </div>

                    <button
                      type="submit"
                      className="pay-btn volunteer-submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? '⏳ Enviando postulación...'
                        : `🙋 Postularme como ${selectedRole.title}`
                      }
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
    entretenimiento: '#FFE0B2 0%, #FFCC80 50%, #FFB74D 100%',
    alimentacion: '#fce4ec 0%, #f8bbd0 50%, #f48fb1 100%',
    educacion: '#f3e5f5 0%, #ce93d8 50%, #ba68c8 100%',
    bienestar: '#E8F5E9 0%, #A5D6A7 50%, #81C784 100%',
    operaciones: '#E3F2FD 0%, #90CAF9 50%, #64B5F6 100%',
  }
  return gradients[category] || '#f5f5f5 0%, #e0e0e0 100%'
}
