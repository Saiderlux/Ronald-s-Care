import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { useFichas } from '../context/FichasContext.jsx'
import { generateTaxDeductionPDF } from '../utils/pdfGenerator.js'

const DONATION_AMOUNTS = [
  { value: 20, label: '1 pasaje' },
  { value: 50, label: '1 kit' },
  { value: 100, label: '5 comidas' },
  { value: 200, label: '1 tanque' },
  { value: 500, label: '1 semana' },
  { value: 1000, label: 'Padrino ⭐' },
]

export default function PaymentModal({ need, onClose, onDonationComplete }) {
  const navigate = useNavigate()
  const { donateToFicha } = useFichas()
  const isGift = need.type === 'gift'

  // Collaborative state
  const [selectedAmount, setSelectedAmount] = useState(null)
  const [customAmount, setCustomAmount] = useState('')

  // Gift state
  const [giftQuantity, setGiftQuantity] = useState(1)

  // Shared state
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [didComplete, setDidComplete] = useState(false)
  const [donatedAmount, setDonatedAmount] = useState(0)
  const [donatedQuantity, setDonatedQuantity] = useState(0)

  // Invoice step
  const [showInvoiceStep, setShowInvoiceStep] = useState(false)
  const [wantsInvoice, setWantsInvoice] = useState(false)
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [donorRFC, setDonorRFC] = useState('')

  const sponsor = need.sponsor_json ? JSON.parse(need.sponsor_json) : null
  const remaining = isGift
    ? need.total_units - need.units_donated
    : (need.goal_amount || 0) - (need.current_amount || 0)

  const activeAmount = isGift
    ? (need.unit_price || 0) * giftQuantity
    : (selectedAmount || (customAmount ? parseInt(customAmount) : 0))

  const normalizedDonorEmail = donorEmail.trim().toLowerCase()
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedDonorEmail)

  function fireConfetti() {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#DA291C', '#FFC72C', '#FF6F00', '#27AA5E'] })
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#DA291C', '#FFC72C'] })
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FF6F00', '#27AA5E'] })
    }, 300)
  }

  async function handleDonate() {
    if (!activeAmount || activeAmount <= 0) return
    setIsProcessing(true)

    try {
      const donationData = {
        donor_name: donorName || 'Anónimo',
        donor_email: normalizedDonorEmail,
        wants_invoice: wantsInvoice,
      }

      if (isGift) {
        donationData.quantity = giftQuantity
        donationData.amount = need.unit_price * giftQuantity
        setDonatedQuantity(giftQuantity)
        setDonatedAmount(need.unit_price * giftQuantity)
      } else {
        const finalAmount = Math.min(activeAmount, remaining)
        donationData.amount = finalAmount
        setDonatedAmount(finalAmount)
      }

      const updatedNeed = await donateToFicha(need.id, donationData)

      if (isGift) {
        setDidComplete(updatedNeed.units_donated >= updatedNeed.total_units)
      } else {
        setDidComplete(updatedNeed.goal_amount > 0 && updatedNeed.current_amount >= updatedNeed.goal_amount)
      }

      if (wantsInvoice && donorRFC && donorRFC.length >= 12) {
        const amt = isGift ? (need.unit_price * giftQuantity) : Math.min(activeAmount, remaining)
        generateTaxDeductionPDF({
          donorName: donorName || 'Donante',
          donorRFC: donorRFC,
          donationType: 'monetary',
          itemTitle: need.title,
          amount: amt,
          receiptId: 'DON-' + Math.floor(Math.random() * 100000)
        });
      }

      setIsSuccess(true)
      fireConfetti()
      if (onDonationComplete) onDonationComplete(updatedNeed)
    } catch (err) {
      alert('Error al donar: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  function handleProceedToDonate() {
    if (!isValidEmail) {
      alert('Por favor ingresa un correo electrónico válido para registrar tu impacto.')
      return
    }
    setShowInvoiceStep(false)
    handleDonate()
  }

  function handleSelectAmount(value) {
    setSelectedAmount(value)
    setCustomAmount('')
  }

  function handleCustomChange(e) {
    const val = e.target.value.replace(/\D/g, '')
    setCustomAmount(val)
    setSelectedAmount(null)
  }

  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
  }

  function handleClose() {
    document.body.style.overflow = ''
    onClose()
  }

  function handleGoToEmails() {
    document.body.style.overflow = ''
    onClose()
    navigate('/correos')
  }

  // =============================================
  // SUCCESS STATE
  // =============================================
  if (isSuccess) {
    const matchText = sponsor?.type === 'matching'
      ? ` ${sponsor.name} igualó tu donación, ¡así que el impacto real es el doble!`
      : ''

    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="success-state">
            <div className="success-state__icon">{didComplete ? '🏆' : '🎉'}</div>
            <h2 className="success-state__title">
              {didComplete
                ? <>¡Meta <span className="text-gradient">completada</span>!</>
                : <>¡Gracias por tu <span className="text-gradient">corazón</span>!</>
              }
            </h2>
            <p className="success-state__message">
              {isGift ? (
                <>
                  Donaste <strong>{donatedQuantity} {need.unit_label}</strong> (${donatedAmount.toLocaleString()} MXN)
                  para "{need.title}".{matchText}
                </>
              ) : (
                <>
                  Tu aportación de <strong>${donatedAmount.toLocaleString()} MXN</strong> a "
                  {need.title}" ya fue registrada.{matchText}
                </>
              )}
            </p>

            {wantsInvoice && (
              <div style={{
                background: '#e8f5e9', borderRadius: '12px', padding: '12px 16px',
                marginBottom: '16px', fontSize: '0.875rem', color: '#2e7d32',
              }}>
                🧾 Tu solicitud de factura fue registrada. Recibirás tu CFDI por correo.
              </div>
            )}

            {didComplete && (
              <div style={{
                background: '#F5F5F5', borderRadius: '12px', padding: '16px',
                marginBottom: '20px', textAlign: 'left', border: '1px solid #E8E8E8',
              }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#292929', marginBottom: '4px' }}>
                  🎉 ¡Meta cumplida! "{need.title}"
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6B6B6B', lineHeight: 1.5 }}>
                  El equipo de comunicación preparará un correo de agradecimiento con prueba de uso.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {didComplete ? (
                <button className="success-state__btn" onClick={handleGoToEmails}>
                  📧 Ver Mis Correos
                </button>
              ) : (
                <button className="success-state__btn" onClick={handleClose}>
                  Seguir Donando ✨
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =============================================
  // INVOICE STEP
  // =============================================
  if (showInvoiceStep) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal__header">
            <h2 className="modal__title">🧾 ¿Deseas factura?</h2>
            <button className="modal__close" onClick={handleClose}>✕</button>
          </div>
          <div className="modal__body">
            <p style={{ marginBottom: '20px', color: '#6B6B6B', lineHeight: 1.6 }}>
              Tu donación de <strong>${activeAmount.toLocaleString()} MXN</strong> puede ser deducible de impuestos.
              Puedes proporcionar tus datos ahora o después.
            </p>
            <div className="vol-form__field" style={{ marginBottom: '12px' }}>
              <label>Tu nombre (opcional)</label>
              <input type="text" placeholder="Para personalizar tu agradecimiento"
                value={donorName} onChange={e => setDonorName(e.target.value)} />
            </div>
            <div className="vol-form__field" style={{ marginBottom: '20px' }}>
              <label>Correo electrónico (obligatorio) *</label>
              <input type="email" required placeholder="Tu correo para registrar tu impacto"
                value={donorEmail} onChange={e => setDonorEmail(e.target.value)} />
              {!isValidEmail && donorEmail.length > 0 && (
                <small style={{ color: '#DA291C' }}>Ingresa un correo válido (ejemplo@correo.com)</small>
              )}
            </div>
            {wantsInvoice && (
              <div className="vol-form__field" style={{ marginBottom: '20px' }}>
                <label>RFC (Para deducir impuestos) *</label>
                <input type="text" placeholder="ABCD123456XYZ" minLength="12"
                  value={donorRFC} onChange={e => setDonorRFC(e.target.value)} />
              </div>
            )}
            <div className="vol-tipo-selector" style={{ marginBottom: '20px' }}>
              <label className={`vol-tipo-option ${wantsInvoice ? 'active' : ''}`}>
                <input type="radio" checked={wantsInvoice}
                  onChange={() => setWantsInvoice(true)} />
                <span>🧾 Sí, quiero factura</span>
              </label>
              <label className={`vol-tipo-option ${!wantsInvoice ? 'active' : ''}`}>
                <input type="radio" checked={!wantsInvoice}
                  onChange={() => setWantsInvoice(false)} />
                <span>👍 No por ahora</span>
              </label>
            </div>
            <button className="pay-btn" onClick={handleProceedToDonate} disabled={isProcessing || !isValidEmail}>
              {isProcessing ? '⏳ Procesando...' : `❤️ Confirmar Donación — $${activeAmount.toLocaleString()} MXN`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // =============================================
  // GIFT MODAL
  // =============================================
  if (isGift) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal__header">
            <h2 className="modal__title">🎁 Regalar</h2>
            <button className="modal__close" onClick={handleClose}>✕</button>
          </div>
          <div className="modal__body">
            <div className="modal__need-info">
              <div className="modal__need-emoji">{need.emoji}</div>
              <div>
                <p className="modal__need-title">{need.title}</p>
                <p className="modal__need-remaining">
                  ${(need.unit_price || 0).toLocaleString()} MXN por unidad · {remaining} disponibles
                </p>
              </div>
            </div>

            {sponsor?.type === 'matching' && (
              <div style={{
                padding: '12px 16px', background: 'rgba(39,170,94,0.08)',
                borderRadius: '12px', marginBottom: '20px', fontSize: '0.875rem',
                color: '#27AA5E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                🤝 {sponsor.name} iguala: por cada 1 que dones, ellos donan otro
              </div>
            )}

            <div className="quantity-selector">
              <button className="quantity-selector__btn" disabled={giftQuantity <= 1}
                onClick={() => setGiftQuantity(q => q - 1)}>−</button>
              <div className="quantity-selector__value">
                <div className="quantity-selector__number">{giftQuantity}</div>
                <div className="quantity-selector__label">{need.unit_label || 'unidades'}</div>
              </div>
              <button className="quantity-selector__btn" disabled={giftQuantity >= remaining}
                onClick={() => setGiftQuantity(q => q + 1)}>+</button>
            </div>
            <div className="quantity-selector__total">
              Total: <strong>${((need.unit_price || 0) * giftQuantity).toLocaleString()} MXN</strong>
            </div>

            <button className="pay-btn gift" style={{ marginTop: '20px' }}
              disabled={isProcessing}
              onClick={() => setShowInvoiceStep(true)}>
              🎁 Regalar {giftQuantity} {need.unit_label || 'unidades'} — ${((need.unit_price || 0) * giftQuantity).toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // =============================================
  // COLLABORATIVE / DONATION MODAL
  // =============================================
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">🤲 Aportar</h2>
          <button className="modal__close" onClick={handleClose}>✕</button>
        </div>
        <div className="modal__body">
          <div className="modal__need-info">
            <div className="modal__need-emoji">{need.emoji}</div>
            <div>
              <p className="modal__need-title">{need.title}</p>
              <p className="modal__need-remaining">
                Faltan ${remaining.toLocaleString()} MXN para completar
              </p>
            </div>
          </div>

          {sponsor?.type === 'matching' && (
            <div style={{
              padding: '12px 16px', background: 'rgba(39,170,94,0.08)',
              borderRadius: '12px', marginBottom: '20px', fontSize: '0.875rem',
              color: '#27AA5E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              🤝 {sponsor.name} duplica tu donación — ¡tu impacto vale x2!
            </div>
          )}

          <div className="amount-grid">
            {DONATION_AMOUNTS.map(({ value, label }) => (
              <button key={value}
                className={`amount-btn ${selectedAmount === value ? 'selected' : ''}`}
                onClick={() => handleSelectAmount(value)}>
                ${value}
                <span className="amount-btn__label">{label}</span>
              </button>
            ))}
          </div>

          <div className="custom-amount">
            <label className="custom-amount__label">O escribe tu monto:</label>
            <input type="text" className="custom-amount__input"
              placeholder="$ Otro monto..." value={customAmount}
              onChange={handleCustomChange} />
          </div>

          <button className="pay-btn"
            disabled={!activeAmount || activeAmount <= 0 || isProcessing}
            onClick={() => setShowInvoiceStep(true)}>
            ❤️ Donar {activeAmount > 0 ? `$${activeAmount.toLocaleString()} MXN` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
