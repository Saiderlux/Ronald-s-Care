import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useFichas, FICHA_CATEGORIES, VOLUNTEER_CATEGORIES, FICHA_TYPES } from '../context/FichasContext.jsx'

// Plantilla de campos vacíos
const EMPTY_FORM = {
  type: 'collaborative',
  title: '',
  description: '',
  category: 'mantenimiento',
  emoji: '🔧',
  // Voluntariado fields
  eventDate: '',
  eventLocation: '',
  maxCapacity: '',
  // Donación fields
  goalAmount: '',
  // Regalo fields
  unitPrice: '',
  totalUnits: '',
  unitLabel: '',
  // Common
  isUrgent: false,
  deadline: '',
  sponsor: null,
}

const EMOJI_OPTIONS_DONATION = ['⛽', '🍕', '🥣', '🎬', '📚', '🧴', '🛏️', '🥪', '🧩', '💊', '🎨', '🏥', '🚐', '💛', '🎁', '🏠']
const EMOJI_OPTIONS_VOLUNTEER = ['🔧', '🎨', '🧹', '🍳', '🎉', '📖', '🤝', '🏗️', '🌱', '🎭', '🏃', '🎸']

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const { fichas, addFicha, deleteFicha } = useFichas()
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [successMsg, setSuccessMsg] = useState('')

  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // Al cambiar tipo, resetear categoría y emoji al default de ese tipo
  function handleTypeChange(typeId) {
    if (typeId === 'collaborative') {
      setForm(prev => ({ ...prev, type: typeId, category: 'mantenimiento', emoji: '🔧' }))
    } else {
      setForm(prev => ({ ...prev, type: typeId, category: 'alimentacion', emoji: '🍕' }))
    }
  }

  function handleSubmit(e) {
    e.preventDefault()

    const fichaData = {
      type: form.type,
      title: form.title,
      description: form.description,
      category: form.category,
      emoji: form.emoji,
      isUrgent: form.isUrgent,
      deadline: form.isUrgent ? form.deadline : null,
      sponsor: null,
    }

    // Campos específicos por tipo
    if (form.type === 'collaborative') {
      // Voluntariado
      fichaData.eventDate = form.eventDate
      fichaData.eventLocation = form.eventLocation
      fichaData.maxCapacity = parseInt(form.maxCapacity) || 0
    }

    if (form.type === 'donation') {
      fichaData.goalAmount = parseFloat(form.goalAmount) || 0
    }

    if (form.type === 'gift') {
      fichaData.unitPrice = parseFloat(form.unitPrice) || 0
      fichaData.totalUnits = parseInt(form.totalUnits) || 0
      fichaData.unitLabel = form.unitLabel || 'unidades'
    }

    addFicha(fichaData)
    setForm({ ...EMPTY_FORM })
    setShowForm(false)
    setSuccessMsg(`✅ Ficha "${fichaData.title}" creada exitosamente`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  function handleDelete(id, title) {
    if (window.confirm(`¿Eliminar la ficha "${title}"?`)) {
      deleteFicha(id)
    }
  }

  // Contar fichas por tipo
  const countByType = (type) => fichas.filter(f => f.type === type).length

  // Emojis y categorías según el tipo seleccionado
  const currentCategories = form.type === 'collaborative' ? VOLUNTEER_CATEGORIES : FICHA_CATEGORIES
  const currentEmojis = form.type === 'collaborative' ? EMOJI_OPTIONS_VOLUNTEER : EMOJI_OPTIONS_DONATION

  return (
    <main className="admin-dash" id="admin-dashboard">
      {/* Top Bar */}
      <header className="admin-dash__topbar">
        <div className="container admin-dash__topbar-inner">
          <div className="admin-dash__brand">
            <span className="admin-dash__brand-icon">⚙️</span>
            <span>Panel Admin — <strong>Conexión Tangible</strong></span>
          </div>
          <div className="admin-dash__user-info">
            <span className="admin-dash__user-name">
              👤 {user?.name}
            </span>
            <button className="admin-dash__logout" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="container admin-dash__content">
        {/* Stats Bar */}
        <div className="admin-dash__stats">
          <div className="admin-dash__stat-card">
            <span className="admin-dash__stat-number">{fichas.length}</span>
            <span className="admin-dash__stat-label">Fichas Totales</span>
          </div>
          <div className="admin-dash__stat-card">
            <span className="admin-dash__stat-number">{countByType('collaborative')}</span>
            <span className="admin-dash__stat-label">🤲 Voluntariado</span>
          </div>
          <div className="admin-dash__stat-card">
            <span className="admin-dash__stat-number">{countByType('gift')}</span>
            <span className="admin-dash__stat-label">🎁 Regalos</span>
          </div>
          <div className="admin-dash__stat-card">
            <span className="admin-dash__stat-number">{countByType('donation')}</span>
            <span className="admin-dash__stat-label">💰 Donaciones</span>
          </div>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="admin-dash__success">{successMsg}</div>
        )}

        {/* Actions */}
        <div className="admin-dash__actions">
          <h2 className="admin-dash__section-title">Gestión de Fichas</h2>
          <button
            className="admin-dash__create-btn"
            id="create-ficha-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancelar' : '＋ Crear Nueva Ficha'}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="admin-dash__form-wrapper">
            <form className="admin-dash__form" onSubmit={handleSubmit}>
              <h3 className="admin-dash__form-title">Nueva Ficha</h3>

              {/* Tipo de Ficha */}
              <div className="admin-dash__form-group">
                <label className="admin-dash__form-label">Tipo de Ficha</label>
                <div className="admin-dash__type-selector">
                  {FICHA_TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className={`admin-dash__type-btn ${form.type === t.id ? 'active' : ''}`}
                      onClick={() => handleTypeChange(t.id)}
                    >
                      <span className="admin-dash__type-btn-label">{t.label}</span>
                      <span className="admin-dash__type-btn-desc">{t.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div className="admin-dash__form-group">
                <label htmlFor="ficha-title" className="admin-dash__form-label">
                  {form.type === 'collaborative' ? 'Nombre del evento' : 'Título de la ficha'}
                </label>
                <input
                  id="ficha-title"
                  name="title"
                  type="text"
                  className="admin-dash__form-input"
                  placeholder={
                    form.type === 'collaborative'
                      ? 'Ej: Pintar los cuartos del 3er piso'
                      : 'Ej: Gasolina para traslados seguros al hospital'
                  }
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Descripción */}
              <div className="admin-dash__form-group">
                <label htmlFor="ficha-description" className="admin-dash__form-label">
                  Descripción
                </label>
                <textarea
                  id="ficha-description"
                  name="description"
                  className="admin-dash__form-textarea"
                  placeholder={
                    form.type === 'collaborative'
                      ? 'Describe la actividad de voluntariado, qué se hará y qué se necesita...'
                      : 'Describe la necesidad con detalle emotivo y real...'
                  }
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Categoría + Emoji Row */}
              <div className="admin-dash__form-row">
                <div className="admin-dash__form-group" style={{ flex: 1 }}>
                  <label htmlFor="ficha-category" className="admin-dash__form-label">
                    {form.type === 'collaborative' ? 'Tipo de actividad' : 'Categoría'}
                  </label>
                  <select
                    id="ficha-category"
                    name="category"
                    className="admin-dash__form-select"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {currentCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-dash__form-group">
                  <label className="admin-dash__form-label">Emoji</label>
                  <div className="admin-dash__emoji-grid">
                    {currentEmojis.map(em => (
                      <button
                        key={em}
                        type="button"
                        className={`admin-dash__emoji-btn ${form.emoji === em ? 'active' : ''}`}
                        onClick={() => setForm(prev => ({ ...prev, emoji: em }))}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ===== CAMPOS ESPECÍFICOS POR TIPO ===== */}

              {/* VOLUNTARIADO: Fecha, Ubicación, Capacidad */}
              {form.type === 'collaborative' && (
                <>
                  <div className="admin-dash__form-row">
                    <div className="admin-dash__form-group" style={{ flex: 1 }}>
                      <label htmlFor="ficha-event-date" className="admin-dash__form-label">
                        📅 Fecha del evento
                      </label>
                      <input
                        id="ficha-event-date"
                        name="eventDate"
                        type="date"
                        className="admin-dash__form-input"
                        value={form.eventDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="admin-dash__form-group" style={{ flex: 1 }}>
                      <label htmlFor="ficha-max-capacity" className="admin-dash__form-label">
                        👥 Cupos disponibles
                      </label>
                      <input
                        id="ficha-max-capacity"
                        name="maxCapacity"
                        type="number"
                        min="1"
                        className="admin-dash__form-input"
                        placeholder="Ej: 20"
                        value={form.maxCapacity}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="admin-dash__form-group">
                    <label htmlFor="ficha-event-location" className="admin-dash__form-label">
                      📍 Ubicación
                    </label>
                    <input
                      id="ficha-event-location"
                      name="eventLocation"
                      type="text"
                      className="admin-dash__form-input"
                      placeholder="Ej: Casa Ronald McDonald - Av. Insurgentes Sur 1234"
                      value={form.eventLocation}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              )}

              {/* DONACIÓN: Meta en pesos */}
              {form.type === 'donation' && (
                <div className="admin-dash__form-group">
                  <label htmlFor="ficha-goal" className="admin-dash__form-label">
                    💵 Meta en pesos (MXN)
                  </label>
                  <input
                    id="ficha-goal"
                    name="goalAmount"
                    type="number"
                    min="1"
                    className="admin-dash__form-input"
                    placeholder="Ej: 1200"
                    value={form.goalAmount}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              {/* REGALO: Precio, Unidades, Etiqueta */}
              {form.type === 'gift' && (
                <>
                  <div className="admin-dash__form-row">
                    <div className="admin-dash__form-group" style={{ flex: 1 }}>
                      <label htmlFor="ficha-unit-price" className="admin-dash__form-label">
                        💵 Precio por unidad (MXN)
                      </label>
                      <input
                        id="ficha-unit-price"
                        name="unitPrice"
                        type="number"
                        min="1"
                        className="admin-dash__form-input"
                        placeholder="Ej: 150"
                        value={form.unitPrice}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="admin-dash__form-group" style={{ flex: 1 }}>
                      <label htmlFor="ficha-total-units" className="admin-dash__form-label">
                        📦 Unidades totales
                      </label>
                      <input
                        id="ficha-total-units"
                        name="totalUnits"
                        type="number"
                        min="1"
                        className="admin-dash__form-input"
                        placeholder="Ej: 10"
                        value={form.totalUnits}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="admin-dash__form-group">
                    <label htmlFor="ficha-unit-label" className="admin-dash__form-label">
                      🏷️ Etiqueta de unidad (plural)
                    </label>
                    <input
                      id="ficha-unit-label"
                      name="unitLabel"
                      type="text"
                      className="admin-dash__form-input"
                      placeholder="Ej: kits, cobijas, loncheras"
                      value={form.unitLabel}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              )}

              {/* Urgencia */}
              <div className="admin-dash__form-group">
                <label className="admin-dash__form-checkbox-label">
                  <input
                    type="checkbox"
                    name="isUrgent"
                    checked={form.isUrgent}
                    onChange={handleChange}
                  />
                  <span>🔴 Marcar como URGENTE</span>
                </label>
                {form.isUrgent && (
                  <input
                    name="deadline"
                    type="text"
                    className="admin-dash__form-input"
                    placeholder="Ej: 12 horas, 24 horas, 3 días"
                    value={form.deadline}
                    onChange={handleChange}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>

              {/* Submit */}
              <button type="submit" className="admin-dash__form-submit" id="submit-ficha">
                Crear Ficha ✨
              </button>
            </form>
          </div>
        )}

        {/* Fichas List */}
        {fichas.length === 0 ? (
          <div className="admin-dash__empty">
            <span className="admin-dash__empty-icon">📋</span>
            <p className="admin-dash__empty-title">No hay fichas creadas aún</p>
            <p className="admin-dash__empty-text">
              Crea tu primera ficha con el botón de arriba.<br />
              Las fichas aparecerán en el catálogo público para los donantes.
            </p>
          </div>
        ) : (
          <div className="admin-dash__fichas-grid">
            {fichas.map(ficha => (
              <div key={ficha.id} className="admin-dash__ficha-card" id={`admin-ficha-${ficha.id}`}>
                <div className="admin-dash__ficha-header">
                  <span className="admin-dash__ficha-emoji">{ficha.emoji}</span>
                  <span className={`admin-dash__ficha-type type-${ficha.type}`}>
                    {ficha.type === 'collaborative' && '🤲 Voluntariado'}
                    {ficha.type === 'gift' && '🎁 Regalo'}
                    {ficha.type === 'donation' && '💰 Donación'}
                  </span>
                  {ficha.isUrgent && (
                    <span className="admin-dash__ficha-urgent">🔴 Urgente</span>
                  )}
                </div>
                <h4 className="admin-dash__ficha-title">{ficha.title}</h4>
                <p className="admin-dash__ficha-desc">{ficha.description}</p>
                <div className="admin-dash__ficha-meta">
                  {ficha.type === 'collaborative' && (
                    <>
                      <span>📅 {ficha.eventDate}</span>
                      <span>👥 {ficha.currentEnrolled || 0}/{ficha.maxCapacity} inscritos</span>
                    </>
                  )}
                  {ficha.type === 'donation' && (
                    <>
                      <span>Meta: <strong>${ficha.goalAmount?.toLocaleString()} MXN</strong></span>
                      <span>👥 {ficha.donorsCount} donantes</span>
                    </>
                  )}
                  {ficha.type === 'gift' && (
                    <>
                      <span>${ficha.unitPrice?.toLocaleString()} × {ficha.totalUnits} {ficha.unitLabel}</span>
                      <span>🎁 {ficha.unitsDonated}/{ficha.totalUnits} donados</span>
                    </>
                  )}
                </div>
                {ficha.type === 'donation' && (
                  <div className="admin-dash__ficha-progress">
                    <div className="admin-dash__ficha-progress-bar">
                      <div
                        className="admin-dash__ficha-progress-fill"
                        style={{ width: `${Math.min((ficha.currentAmount / ficha.goalAmount) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="admin-dash__ficha-progress-text">
                      ${ficha.currentAmount?.toLocaleString()} / ${ficha.goalAmount?.toLocaleString()}
                    </span>
                  </div>
                )}
                {ficha.type === 'collaborative' && (
                  <div className="admin-dash__ficha-progress">
                    <div className="admin-dash__ficha-progress-bar">
                      <div
                        className="admin-dash__ficha-progress-fill"
                        style={{ width: `${Math.min(((ficha.currentEnrolled || 0) / ficha.maxCapacity) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="admin-dash__ficha-progress-text">
                      {ficha.currentEnrolled || 0} / {ficha.maxCapacity} voluntarios inscritos
                    </span>
                  </div>
                )}
                {ficha.type === 'collaborative' && ficha.eventLocation && (
                  <div className="admin-dash__ficha-location">
                    📍 {ficha.eventLocation}
                  </div>
                )}
                <div className="admin-dash__ficha-actions">
                  <button
                    className="admin-dash__ficha-delete"
                    onClick={() => handleDelete(ficha.id, ficha.title)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
