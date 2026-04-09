import { useState } from 'react'
import confetti from 'canvas-confetti'
import { inKindApi } from '../api.js'
import { INSUMO_CATEGORIES } from '../context/FichasContext.jsx'
import { generateTaxDeductionPDF } from '../utils/pdfGenerator.js'


export default function DonacionEspecie({ embedded = false }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    donor_name: '',
    donor_email: '',
    donor_phone: '',
    donor_rfc: '',
    delivery_method: 'in_person',
    tentative_delivery_date: '',
    courier_provider: '',
    tracking_id: '',
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
      
      // Auto-generate Tax Deduction PDF
      if (form.donor_rfc && form.donor_rfc.length >= 12) {
        generateTaxDeductionPDF({
          donorName: form.donor_name,
          donorRFC: form.donor_rfc,
          donationType: 'inKind',
          itemTitle: form.item_description,
          amount: form.estimated_quantity,
          receiptId: pledge.pledge_code
        });
      }
      
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
      donor_name: '', donor_email: '', donor_phone: '', donor_rfc: '',
      delivery_method: 'in_person', tentative_delivery_date: '', courier_provider: '', tracking_id: '',
      category: 'alimentos', item_description: '', estimated_quantity: '', estimated_value: '',
    })
  }

  // Success state
  if (result) {
    return (
      <div className={`dashboard ${embedded ? 'dashboard--embedded' : ''}`} id="especie-page">
        <div className="container">
          <div className="especie-success">
            <div className="especie-success__icon">📦</div>
            <h2 className="especie-success__title">
              ¡Ficha <span className="text-gradient">creada</span>!
            </h2>
            <p className="especie-success__text">
              Tu intención de donación en especie fue registrada exitosamente.
            </p>

            {result.delivery_method === 'courier' ? (
              <div className="especie-success__code-card">
                <p className="especie-success__code-label">ID de seguimiento registrado:</p>
                <div className="especie-success__code">{result.tracking_id}</div>
                <p className="especie-success__code-hint">
                  El equipo validará la entrega usando este ID del servicio de paquetería.
                </p>
              </div>
            ) : (
              <div className="especie-success__code-card">
                <p className="especie-success__code-label">Tu código de donación:</p>
                <div className="especie-success__code">{result.pledge_code}</div>
                <p className="especie-success__code-hint">
                  Guarda este código. Deberás presentarlo al entregar tu donación en la Casa Ronald McDonald.
                </p>
              </div>
            )}

            <div className="especie-success__steps">
              <h4>📋 Próximos pasos:</h4>
              {result.delivery_method === 'courier' ? (
                <ol>
                  <li>Empaca tu donación: <strong>{result.item_description}</strong></li>
                  <li>Envía el paquete por <strong>{result.courier_provider || 'tu paquetería'}</strong></li>
                  <li>Usa y conserva el ID <strong>{result.tracking_id}</strong></li>
                  <li>El equipo validará tu entrega al recibir el paquete</li>
                  <li>Recibirás tu comprobante de donación (deducible de impuestos)</li>
                </ol>
              ) : (
                <ol>
                  <li>Prepara tu donación: <strong>{result.item_description}</strong></li>
                  <li>Lleva tu donación en la fecha tentativa indicada</li>
                  <li>Presenta tu código <strong>{result.pledge_code}</strong> al personal</li>
                  <li>El equipo de finanzas validará tu entrega</li>
                  <li>Recibirás tu comprobante de donación (deducible de impuestos)</li>
                </ol>
              )}
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
      </div>
    )
  }

  return (
    <div className={`dashboard ${embedded ? 'dashboard--embedded' : ''}`} id="especie-page">
      <div className="container">
        <div className="dashboard__header">
          <h1 className="dashboard__title">
            Donar en{' '}
            <span className="text-gradient">Especie</span>
          </h1>
          <p className="dashboard__subtitle">
            Puedes registrar tu donación para entrega física o enviarla por paquetería.
            En ambos casos quedará lista para validación del equipo administrativo.
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

            {/* Método de entrega */}
            <div className="especie-form__section">
              <h4 className="especie-form__section-title">🚚 Método de entrega</h4>
              <div className="vol-tipo-selector" style={{ marginTop: '6px' }}>
                <label className={`vol-tipo-option ${form.delivery_method === 'in_person' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="delivery_method"
                    value="in_person"
                    checked={form.delivery_method === 'in_person'}
                    onChange={handleChange}
                  />
                  <span>🏠 Entrega física en Casa Ronald</span>
                </label>
                <label className={`vol-tipo-option ${form.delivery_method === 'courier' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="delivery_method"
                    value="courier"
                    checked={form.delivery_method === 'courier'}
                    onChange={handleChange}
                  />
                  <span>📦 Envío por paquetería</span>
                </label>
              </div>

              {form.delivery_method === 'in_person' ? (
                <div className="especie-form__field" style={{ marginTop: '12px' }}>
                  <label>Fecha tentativa de entrega *</label>
                  <input
                    type="date"
                    name="tentative_delivery_date"
                    min={todayStr}
                    required
                    value={form.tentative_delivery_date}
                    onChange={handleChange}
                  />
                  <span className="especie-form__hint">Si no se valida en 30 días después de esta fecha, el registro se limpia automáticamente.</span>
                </div>
              ) : (
                <div className="especie-form__row" style={{ marginTop: '12px' }}>
                  <div className="especie-form__field">
                    <label>Paquetería (opcional)</label>
                    <input
                      type="text"
                      name="courier_provider"
                      placeholder="Amazon, DHL, Estafeta..."
                      value={form.courier_provider}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="especie-form__field">
                    <label>ID de seguimiento del paquete *</label>
                    <input
                      type="text"
                      name="tracking_id"
                      required
                      placeholder="Ej: 1Z999AA10123456784"
                      value={form.tracking_id}
                      onChange={handleChange}
                    />
                    <span className="especie-form__hint">Este ID lo usará Admin para validar la llegada del paquete.</span>
                  </div>
                </div>
              )}
            </div>

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
                  <label>Correo electrónico *</label>
                  <input type="email" name="donor_email" required placeholder="ejemplo@correo.com"
                    value={form.donor_email} onChange={handleChange} />
                </div>
              </div>
              <div className="especie-form__row">
                <div className="especie-form__field">
                  <label>Teléfono</label>
                  <input type="tel" name="donor_phone" placeholder="55 1234 5678"
                    value={form.donor_phone} onChange={handleChange} />
                </div>
                <div className="especie-form__field">
                  <label>RFC (Para deducir impuestos) Opcional</label>
                  <input type="text" name="donor_rfc" placeholder="ABCD123456XYZ" minLength="12"
                    value={form.donor_rfc} onChange={handleChange} />
                </div>
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
    </div>
  )
}
