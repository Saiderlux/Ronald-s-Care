export default function NeedCard({ need, onDonate }) {
  if (need.type === 'gift') {
    return <GiftCard need={need} onDonate={onDonate} />
  }
  return <CollaborativeCard need={need} onDonate={onDonate} />
}

// =============================================
// SPONSOR BANNER (shared)
// =============================================
function SponsorBanner({ sponsor }) {
  if (!sponsor) return null

  return (
    <div className={`need-card__sponsor-banner ${sponsor.type === 'matching' ? 'matching' : ''}`}>
      <div className="need-card__sponsor-logo">
        {sponsor.emoji}
      </div>
      <div className="need-card__sponsor-info">
        <div className="need-card__sponsor-name">{sponsor.name}</div>
        <div className="need-card__sponsor-action">
          {sponsor.type === 'matching'
            ? 'Duplica cada peso que dones 🤝'
            : 'Apadrina esta necesidad completa ⭐'}
        </div>
      </div>
    </div>
  )
}

// =============================================
// FICHA TIPO 1: COLABORATIVA (barra de progreso)
// =============================================
function CollaborativeCard({ need, onDonate }) {
  const goalAmount = need.goal_amount || 0
  const currentAmount = need.current_amount || 0
  const percentage = goalAmount > 0 ? Math.round((currentAmount / goalAmount) * 100) : 0
  const isCompleted = need.status === 'completed' || (goalAmount > 0 && currentAmount >= goalAmount)
  const remaining = goalAmount - currentAmount
  const sponsor = need.sponsor_json ? JSON.parse(need.sponsor_json) : null

  return (
    <article
      className={`need-card ${need.is_urgent ? 'urgent' : ''}`}
      id={`need-card-${need.id}`}
      style={{ animationDelay: `${(need.id % 10) * 0.1}s` }}
    >
      <div style={{ position: 'relative' }}>
        <div
          className="need-card__image"
          style={{
            background: `linear-gradient(135deg, ${getGradientByCategory(need.category)})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4rem',
          }}
        >
          {need.emoji}
        </div>
        {need.is_urgent === 1 && (
          <span className="need-card__urgent-badge">
            🔴 Urgente {need.deadline ? `— ${need.deadline}` : ''}
          </span>
        )}
        <span className="need-card__category-badge">
          {getCategoryLabel(need.category)}
        </span>
      </div>

      <SponsorBanner sponsor={sponsor} />

      <div className="need-card__body">
        <span className="need-card__type-label collaborative">
          {need.type === 'donation' ? '💰 Donación' : '🤲 Colaborativa'}
        </span>
        {need.auto_generated === 1 && (
          <span style={{
            display: 'inline-block', marginLeft: 8, padding: '2px 8px',
            background: '#E3F2FD', color: '#1565C0', borderRadius: '6px',
            fontSize: '10px', fontWeight: 700,
          }}>
            🤖 Auto-generada
          </span>
        )}
        <h3 className="need-card__title">{need.title}</h3>
        {need.event_location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#6B6B6B', marginBottom: '8px' }}>
            <span>📍</span><span>{need.event_location}</span>
          </div>
        )}
        <p className="need-card__description">{need.description}</p>

        <div className="progress">
          <div className="progress__header">
            <span className="progress__amount">
              ${currentAmount.toLocaleString()}
            </span>
            <span className="progress__goal">
              de ${goalAmount.toLocaleString()} MXN
            </span>
          </div>
          <div className="progress__bar">
            <div
              className={`progress__fill ${isCompleted ? 'completed' : ''} ${sponsor?.type === 'matching' ? 'has-matching' : ''}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="progress__percentage">
            {isCompleted
              ? '✅ ¡Meta alcanzada!'
              : `${percentage}% — Faltan $${remaining.toLocaleString()}`}
          </p>
          {sponsor?.type === 'matching' && !isCompleted && (
            <p className="progress__matching">
              🤝 {sponsor.name} iguala cada peso que dones
            </p>
          )}
        </div>

        <div className="need-card__footer">
          <span className="need-card__donors">
            <span className="need-card__donors-icon">👥</span>
            {need.donors_count || 0} donantes
          </span>
          <button
            className={`need-card__btn ${isCompleted ? 'completed-btn' : ''}`}
            disabled={isCompleted}
            onClick={() => onDonate(need)}
          >
            {isCompleted ? '✅ Completada' : 'Apoyar →'}
          </button>
        </div>
      </div>
    </article>
  )
}

// =============================================
// FICHA TIPO 2: REGALO (monto fijo, unidades)
// =============================================
function GiftCard({ need, onDonate }) {
  const unitsDonated = need.units_donated || 0
  const totalUnits = need.total_units || 0
  const unitPrice = need.unit_price || 0
  const unitLabel = need.unit_label || 'unidades'
  const isCompleted = need.status === 'completed' || unitsDonated >= totalUnits
  const remaining = totalUnits - unitsDonated
  const stockPercentage = totalUnits > 0 ? (unitsDonated / totalUnits) * 100 : 0
  const sponsor = need.sponsor_json ? JSON.parse(need.sponsor_json) : null

  return (
    <article
      className={`need-card ${need.is_urgent ? 'urgent' : ''}`}
      id={`need-card-${need.id}`}
      style={{ animationDelay: `${(need.id % 10) * 0.1}s` }}
    >
      <div style={{ position: 'relative' }}>
        <div
          className="need-card__image"
          style={{
            background: `linear-gradient(135deg, ${getGradientByCategory(need.category)})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4rem',
          }}
        >
          {need.emoji}
        </div>
        {need.is_urgent === 1 && (
          <span className="need-card__urgent-badge">🔴 Urgente</span>
        )}
        <span className="need-card__category-badge">
          {getCategoryLabel(need.category)}
        </span>
      </div>

      <SponsorBanner sponsor={sponsor} />

      <div className="need-card__body">
        <span className="need-card__type-label gift">🎁 Regalo directo</span>
        <h3 className="need-card__title">{need.title}</h3>
        {need.event_location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#6B6B6B', marginBottom: '8px' }}>
            <span>📍</span><span>{need.event_location}</span>
          </div>
        )}
        <p className="need-card__description">{need.description}</p>

        <div className="gift-info">
          <div className="gift-info__price">
            ${unitPrice.toLocaleString()} MXN
          </div>
          <div className="gift-info__price-label">
            Precio fijo por {unitLabel.endsWith('s') ? unitLabel.slice(0, -1) : unitLabel}
          </div>

          <div className="gift-info__stock">
            <span className="gift-info__stock-number">{remaining}</span>
            <span className="gift-info__stock-label">
              de {totalUnits} {unitLabel} disponibles
            </span>
            <div className="gift-info__stock-bar">
              <div
                className="gift-info__stock-fill"
                style={{ width: `${100 - stockPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="need-card__footer">
          <span className="need-card__donors">
            <span className="need-card__donors-icon">🎁</span>
            {unitsDonated} de {totalUnits} donados
          </span>
          <button
            className={`need-card__btn ${isCompleted ? 'completed-btn' : 'gift-btn'}`}
            disabled={isCompleted}
            onClick={() => onDonate(need)}
          >
            {isCompleted ? '✅ Todos donados' : 'Regalar →'}
          </button>
        </div>
      </div>
    </article>
  )
}

// =============================================
// HELPERS
// =============================================
function getGradientByCategory(category) {
  const gradients = {
    transporte: '#e3f2fd 0%, #bbdefb 50%, #90caf9 100%',
    alimentacion: '#fce4ec 0%, #f8bbd0 50%, #f48fb1 100%',
    higiene: '#e0f2f1 0%, #b2dfdb 50%, #80cbc4 100%',
    bienestar: '#fff3e0 0%, #ffe0b2 50%, #ffcc80 100%',
    educacion: '#f3e5f5 0%, #ce93d8 50%, #ba68c8 100%',
    salud: '#e8f5e9 0%, #a5d6a7 50%, #81c784 100%',
    limpieza: '#e0f7fa 0%, #80deea 50%, #4dd0e1 100%',
    ropa: '#fce4ec 0%, #f8bbd0 50%, #ef9a9a 100%',
    alimentos: '#fce4ec 0%, #f8bbd0 50%, #f48fb1 100%',
  }
  return gradients[category] || '#f5f5f5 0%, #e0e0e0 100%'
}

function getCategoryLabel(category) {
  const labels = {
    transporte: '🚐 Transporte',
    alimentacion: '🍕 Alimentación',
    higiene: '🧴 Higiene',
    bienestar: '💛 Bienestar',
    educacion: '📚 Educación',
    salud: '🏥 Salud',
    limpieza: '🧹 Limpieza',
    ropa: '👕 Ropa',
    alimentos: '🍕 Alimentos',
    otros: '📦 Otros',
  }
  return labels[category] || category
}
