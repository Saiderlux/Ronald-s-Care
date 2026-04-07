import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { DONATION_AMOUNTS, donateToCollaborative, donateToGift } from '../data/mockData.js'

export default function PaymentModal({ need, onClose, onDonationComplete }) {
  const navigate = useNavigate()
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

  const remaining = isGift
    ? need.totalUnits - need.unitsDonated
    : need.goalAmount - need.currentAmount

  const activeAmount = isGift
    ? need.unitPrice * giftQuantity
    : (selectedAmount || (customAmount ? parseInt(customAmount) : 0))

  function fireConfetti() {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#DA291C', '#FFC72C', '#FF6F00', '#27AA5E'],
    })
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#DA291C', '#FFC72C'] })
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FF6F00', '#27AA5E'] })
    }, 300)
  }

  function handleDonate() {
    if (!activeAmount || activeAmount <= 0) return
    setIsProcessing(true)

    setTimeout(() => {
      let updatedNeed
      if (isGift) {
        updatedNeed = donateToGift(need.id, giftQuantity)
        setDonatedQuantity(giftQuantity)
        setDonatedAmount(need.unitPrice * giftQuantity)
        // Check if this donation completed all units
        setDidComplete(updatedNeed.unitsDonated >= updatedNeed.totalUnits)
      } else {
        const finalAmount = Math.min(activeAmount, remaining)
        updatedNeed = donateToCollaborative(need.id, finalAmount)
        setDonatedAmount(finalAmount)
        // Check if this donation completed the goal
        setDidComplete(updatedNeed.currentAmount >= updatedNeed.goalAmount)
      }

      setIsProcessing(false)
      setIsSuccess(true)
      fireConfetti()
      onDonationComplete(updatedNeed)
    }, 1500)
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
    const matchText = need.sponsor?.type === 'matching'
      ? ` ${need.sponsor.name} igualó tu donación, ¡así que el impacto real es el doble!`
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
                  Donaste <strong>{donatedQuantity} {need.unitLabel}</strong> (${donatedAmount.toLocaleString()} MXN)
                  para "{need.title}".{matchText}
                </>
              ) : (
                <>
                  Tu aportación de <strong>${donatedAmount.toLocaleString()} MXN</strong> a "
                  {need.title}" ya fue registrada.{matchText}
                </>
              )}
            </p>

            {/* EMAIL PREVIEW when card is completed */}
            {didComplete && (
              <div style={{
                background: '#F5F5F5',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'left',
                border: '1px solid #E8E8E8',
                animation: 'fadeInUp 0.5s ease-out 0.3s backwards',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                }}>
                  <span style={{
                    background: '#DA291C',
                    color: 'white',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                  }}>📧</span>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#292929' }}>
                      Correo enviado a tu bandeja
                    </p>
                    <p style={{ fontSize: '0.65rem', color: '#9E9E9E' }}>
                      Conexión Tangible · Ahora
                    </p>
                  </div>
                </div>
                <p style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#292929',
                  marginBottom: '4px',
                }}>
                  🎉 ¡Meta cumplida! "{need.title}"
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6B6B6B',
                  lineHeight: 1.5,
                }}>
                  Gracias a tu donación de ${donatedAmount.toLocaleString()} y a {need.donorsCount} donantes,
                  esta necesidad fue cubierta. Te compartiremos el resultado cuando el recurso sea utilizado.
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
                  ${need.unitPrice.toLocaleString()} MXN por {need.unitLabel.slice(0, -1)} · {remaining} disponibles
                </p>
              </div>
            </div>

            {need.sponsor?.type === 'matching' && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(39,170,94,0.08)',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '0.875rem',
                color: '#27AA5E',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                🤝 {need.sponsor.name} iguala: por cada 1 que dones, ellos donan otro
              </div>
            )}

            <div className="quantity-selector">
              <button
                className="quantity-selector__btn"
                disabled={giftQuantity <= 1}
                onClick={() => setGiftQuantity(q => q - 1)}
              >−</button>
              <div className="quantity-selector__value">
                <div className="quantity-selector__number">{giftQuantity}</div>
                <div className="quantity-selector__label">{need.unitLabel}</div>
              </div>
              <button
                className="quantity-selector__btn"
                disabled={giftQuantity >= remaining}
                onClick={() => setGiftQuantity(q => q + 1)}
              >+</button>
            </div>
            <div className="quantity-selector__total">
              Total: <strong>${(need.unitPrice * giftQuantity).toLocaleString()} MXN</strong>
              {need.sponsor?.type === 'matching' && (
                <span style={{ color: '#27AA5E' }}> (+{giftQuantity} de {need.sponsor.name})</span>
              )}
            </div>

            <button
              className="pay-btn gift"
              style={{ marginTop: '20px' }}
              disabled={isProcessing}
              onClick={handleDonate}
            >
              {isProcessing ? (
                <>⏳ Procesando...</>
              ) : (
                <>
                  🎁 Regalar {giftQuantity} {need.unitLabel} — ${(need.unitPrice * giftQuantity).toLocaleString()}
                  <span className="pay-btn__badge">SIMULADO</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // =============================================
  // COLLABORATIVE MODAL
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

          {need.sponsor?.type === 'matching' && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(39,170,94,0.08)',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '0.875rem',
              color: '#27AA5E',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              🤝 {need.sponsor.name} duplica tu donación — ¡tu impacto vale x2!
            </div>
          )}

          <div className="amount-grid">
            {DONATION_AMOUNTS.map(({ value, label }) => (
              <button
                key={value}
                className={`amount-btn ${selectedAmount === value ? 'selected' : ''}`}
                onClick={() => handleSelectAmount(value)}
              >
                ${value}
                <span className="amount-btn__label">{label}</span>
              </button>
            ))}
          </div>

          <div className="custom-amount">
            <label className="custom-amount__label">O escribe tu monto:</label>
            <input
              type="text"
              className="custom-amount__input"
              placeholder="$ Otro monto..."
              value={customAmount}
              onChange={handleCustomChange}
            />
          </div>

          <button
            className="pay-btn"
            disabled={!activeAmount || activeAmount <= 0 || isProcessing}
            onClick={handleDonate}
          >
            {isProcessing ? (
              <>⏳ Procesando pago simulado...</>
            ) : (
              <>
                ❤️ Donar {activeAmount > 0 ? `$${activeAmount.toLocaleString()} MXN` : ''}
                {activeAmount > 0 && <span className="pay-btn__badge">SIMULADO</span>}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
