import { useState } from 'react'
import confetti from 'canvas-confetti'
import { inKindApi } from '../api.js'
import { INSUMO_CATEGORIES } from '../context/FichasContext.jsx'

export default function DonacionEspecie() {
  const [form, setForm] = useState({
    donor_name: '',
    donor_email: '',
    donor_phone: '',
    category: 'alimentos',
    item_description: '',
    estimated_quantity: '',
    estimated_value: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const pledge = await inKindApi.create({
        ...form,
        estimated_value: parseFloat(form.estimated_value) || 0,
      })
      setResult(pledge)
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#DA291C', '#FFC72C', '#27AA5E'] })
    } catch (err) {
      alert('Error al crear la ficha: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleNewPledge() {
    setResult(null)
    setForm({
      donor_name: '', donor_email: '', donor_phone: '',
      category: 'alimentos', item_description: '', estimated_quantity: '', estimated_value: '',
    })
  }

  // Success state
  if (result) {
    return (
      <main className="dashboard" id="especie-page">
        <div className="container">
          <div className="especie-success">
            <div className="especie-success__icon">📦</div>
            <h2 className="especie-success__title">
              ¡Ficha <span className="text-gradient">creada</span>!
            </h2>
            <p className="especie-success__text">
              Tu intención de donación en especie fue registrada exitosamente.
            </p>

            <div className="especie-success__code-card">
              <p className="especie-success__code-label">Tu código de donación:</p>
              <div className="especie-success__code">{result.pledge_code}</div>
              <p className="especie-success__code-hint">
                Guarda este código. Deberás presentarlo al entregar tu donación en la Casa Ronald McDonald.
              </p>
            </div>

            <div className="especie-success__steps">
              <h4>📋 Próximos pasos:</h4>
              <ol>
                <li>Prepara tu donación: <strong>{result.item_description}</strong></li>
                <li>Lleva tu donación a la Casa Ronald McDonald más cercana</li>
                <li>Presenta tu código <strong>{result.pledge_code}</strong> al personal</li>
                <li>El equipo de finanzas validará tu entrega</li>
                <li>Recibirás tu comprobante de donación (deducible de impuestos)</li>
              </ol>
            </div>

            <div className="especie-success__actions">
              <button className="btn-primary" onClick={handleNewPledge}>
                Crear otra donación 📦
              </button>
              <button className="btn-secondary" onClick={() => {
                navigator.clipboard?.writeText(result.pledge_code)
                alert('Código copiado: ' + result.pledge_code)
              }}>
                Copiar código 📋
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="dashboard" id="especie-page">
      <div className="container">
        <div className="dashboard__header">
          <h1 className="dashboard__title">
            Donar en{' '}
            <span className="text-gradient">Especie</span>
          </h1>
          <p className="dashboard__subtitle">
            ¿Tienes arroz, cobijas, artículos de higiene u otros insumos?
            Crea una ficha con lo que vas a donar, llévalo a la Casa Ronald y presenta tu código.
          </p>
        </div>

        {/* Info Cards */}
        <div className="especie-info-grid">
          <div className="especie-info-card">
            <span className="especie-info-card__icon">📝</span>
            <h4>1. Registra</h4>
            <p>Llena el formulario con los detalles de lo que vas a donar</p>
          </div>
          <div className="especie-info-card">
            <span className="especie-info-card__icon">🏠</span>
            <h4>2. Entrega</h4>
            <p>Lleva tu donación a la Casa Ronald McDonald con tu código</p>
          </div>
          <div className="especie-info-card">
            <span className="especie-info-card__icon">✅</span>
            <h4>3. Validación</h4>
            <p>El personal verifica y registra tu donación en el inventario</p>
          </div>
          <div className="especie-info-card">
            <span className="especie-info-card__icon">🧾</span>
            <h4>4. Deducción</h4>
            <p>Recibe tu comprobante fiscal deducible de impuestos</p>
          </div>
        </div>

        {/* Form */}
        <div className="especie-form-wrapper">
          <form className="especie-form" onSubmit={handleSubmit}>
            <h3 className="especie-form__title">📦 Registrar Donación en Especie</h3>

            {/* Datos personales */}
            <div className="especie-form__section">
              <h4 className="especie-form__section-title">👤 Tus datos</h4>
              <div className="especie-form__row">
                <div className="especie-form__field">
                  <label>Nombre completo *</label>
                  <input type="text" name="donor_name" required placeholder="Ej: María González"
                    value={form.donor_name} onChange={handleChange} />
                </div>
                <div className="especie-form__field">
                  <label>Correo electrónico</label>
                  <input type="email" name="donor_email" placeholder="ejemplo@correo.com"
                    value={form.donor_email} onChange={handleChange} />
                </div>
              </div>
              <div className="especie-form__field">
                <label>Teléfono</label>
                <input type="tel" name="donor_phone" placeholder="55 1234 5678"
                  value={form.donor_phone} onChange={handleChange} />
              </div>
            </div>

            {/* Datos de la donación */}
            <div className="especie-form__section">
              <h4 className="especie-form__section-title">📦 Detalle de la donación</h4>
              <div className="especie-form__field">
                <label>Categoría *</label>
                <select name="category" value={form.category} onChange={handleChange} required>
                  {INSUMO_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="especie-form__field">
                <label>¿Qué vas a donar? *</label>
                <textarea name="item_description" required rows={3}
                  placeholder="Describe detalladamente tu donación. Ej: 5 bolsas de arroz de 1kg, 10 jabones de tocador marca Dove"
                  value={form.item_description} onChange={handleChange} />
              </div>
              <div className="especie-form__row">
                <div className="especie-form__field">
                  <label>Cantidad estimada</label>
                  <input type="text" name="estimated_quantity" placeholder="Ej: 5 bolsas, 10 piezas"
                    value={form.estimated_quantity} onChange={handleChange} />
                </div>
                <div className="especie-form__field">
                  <label>Valor estimado (MXN)</label>
                  <input type="number" name="estimated_value" min="0" placeholder="Ej: 500"
                    value={form.estimated_value} onChange={handleChange} />
                  <span className="especie-form__hint">Para fines de deducción fiscal</span>
                </div>
              </div>
            </div>

            <button type="submit" className="especie-form__submit" disabled={isSubmitting}>
              {isSubmitting ? '⏳ Generando ficha...' : '📦 Generar Ficha de Donación en Especie'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
