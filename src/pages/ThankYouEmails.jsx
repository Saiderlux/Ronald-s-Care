import { useState } from 'react'
import { SIMULATED_EMAILS } from '../data/mockData.js'

export default function ThankYouEmails() {
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [openedIds, setOpenedIds] = useState(new Set())

  function handleOpen(email) {
    setSelectedEmail(email)
    setOpenedIds(prev => new Set([...prev, email.id]))
  }

  return (
    <main className="impact" id="emails-page">
      <div className="container">
        {/* Header */}
        <div className="impact__header">
          <h1 className="impact__title">
            📧 Correos de{' '}
            <span className="text-gradient">Agradecimiento</span>
          </h1>
          <p className="impact__subtitle">
            Cada vez que una ficha a la que donaste se completa, recibes un
            correo como estos. Transparencia y gratitud, siempre.
          </p>
        </div>

        {/* Phone Mockup */}
        <div className="email-simulator">
          <h2 className="email-simulator__title">
            📱 Bandeja de entrada simulada
          </h2>

          <div className="email-phone">
            <div className="email-phone__notch" />
            <div className="email-phone__screen">
              {/* Header */}
              <div className="email-phone__header">
                <div className="email-phone__header-icon">🏠</div>
                <div className="email-phone__header-text">
                  <div className="email-phone__header-title">Conexión Tangible</div>
                  <div className="email-phone__header-subtitle">
                    {SIMULATED_EMAILS.filter(e => e.unread && !openedIds.has(e.id)).length} sin leer
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="email-phone__body">
                {selectedEmail ? (
                  <EmailDetail
                    email={selectedEmail}
                    onBack={() => setSelectedEmail(null)}
                  />
                ) : (
                  SIMULATED_EMAILS.map((email, index) => {
                    const isUnread = email.unread && !openedIds.has(email.id)
                    return (
                      <div
                        className={`email-item ${isUnread ? 'unread' : ''}`}
                        key={email.id}
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => handleOpen(email)}
                      >
                        <div className="email-item__row">
                          <span className="email-item__emoji">{email.emoji}</span>
                          <div className="email-item__content">
                            <p className="email-item__subject">{email.subject}</p>
                            <p className="email-item__preview">{email.preview}</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span className="email-item__time">{email.time}</span>
                            {isUnread && <span className="email-item__dot" />}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// =============================================
// EMAIL DETAIL VIEW
// =============================================
function EmailDetail({ email, onBack }) {
  return (
    <div style={{ animation: 'slideInRight 0.3s ease-out' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          color: '#DA291C',
          fontWeight: 600,
          fontSize: '0.875rem',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        ← Volver a bandeja
      </button>

      <div style={{ marginBottom: '16px' }}>
        <p style={{
          fontSize: '0.75rem',
          color: '#9E9E9E',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '4px',
        }}>
          De: {email.from}
        </p>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: '#292929',
          lineHeight: 1.4,
        }}>
          {email.subject}
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#9E9E9E', marginTop: '4px' }}>
          {email.time}
        </p>
      </div>

      <div style={{
        borderTop: '1px solid #E8E8E8',
        paddingTop: '16px',
      }}>
        {email.fullBody.split('\n').map((line, i) => {
          const isHighlight = /^[💰🍟📊🚐🧴👧🏬🛏️❤️🍕]/.test(line)
          return (
            <p
              key={i}
              style={{
                fontSize: '0.8125rem',
                color: isHighlight ? '#292929' : '#6B6B6B',
                fontWeight: isHighlight ? 600 : 400,
                lineHeight: 1.7,
                marginBottom: line === '' ? '12px' : '2px',
                fontStyle: line.startsWith('"') ? 'italic' : 'normal',
              }}
            >
              {line || '\u00A0'}
            </p>
          )
        })}

        {/* Dynamic Images (Drawing) */}
        {email.images && email.images.length > 0 && (
          <div style={{ marginTop: '16px', marginBottom: '16px', textAlign: 'center' }}>
            {email.images.map((imgSrc, i) => (
              <img 
                key={i} 
                src={imgSrc} 
                alt="Dibujo de agradecimiento" 
                style={{ 
                  maxWidth: '100%', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '4px solid white',
                  transform: 'rotate(-2deg)'
                }} 
              />
            ))}
          </div>
        )}

        {/* Dynamic Post Images Text */}
        {email.postImagesText && (
          <p style={{
            fontSize: '0.8125rem',
            color: '#6B6B6B',
            lineHeight: 1.7,
            marginBottom: '16px',
          }}>
            {email.postImagesText}
          </p>
        )}

        {/* Dynamic Receipt Image */}
        {email.receiptImage && (
           <div style={{ textAlign: 'center', marginTop: '8px', marginBottom: '16px' }}>
             <img 
               src={email.receiptImage} 
               alt="Ticket de donación" 
               style={{ 
                 maxWidth: '100%', 
                 borderRadius: '8px', 
                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
               }} 
             />
           </div>
        )}
      </div>
    </div>
  )
}
