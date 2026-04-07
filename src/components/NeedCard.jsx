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
  const percentage = Math.round((need.currentAmount / need.goalAmount) * 100)
  const isCompleted = need.currentAmount >= need.goalAmount
  const remaining = need.goalAmount - need.currentAmount

  return (
    <article
      className={`need-card ${need.isUrgent ? 'urgent' : ''}`}
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
        {need.isUrgent && (
          <span className="need-card__urgent-badge">
            🔴 Urgente — {need.deadline}
          </span>
        )}
        <span className="need-card__category-badge">
          {getCategoryLabel(need.category)}
        </span>
      </div>

      <SponsorBanner sponsor={need.sponsor} />

      <div className="need-card__body">
        <span className="need-card__type-label collaborative">🤲 Colaborativa</span>
        <h3 className="need-card__title">{need.title}</h3>
        <p className="need-card__description">{need.description}</p>

        <div className="progress">
          <div className="progress__header">
            <span className="progress__amount">
              ${need.currentAmount.toLocaleString()}
            </span>
            <span className="progress__goal">
              de ${need.goalAmount.toLocaleString()} MXN
            </span>
          </div>
          <div className="progress__bar">
            <div
              className={`progress__fill ${isCompleted ? 'completed' : ''} ${need.sponsor?.type === 'matching' ? 'has-matching' : ''}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="progress__percentage">
            {isCompleted
              ? '✅ ¡Meta alcanzada!'
              : `${percentage}% — Faltan $${remaining.toLocaleString()}`}
          </p>
          {need.sponsor?.type === 'matching' && !isCompleted && (
            <p className="progress__matching">
              🤝 {need.sponsor.name} iguala cada peso que dones
            </p>
          )}
        </div>

        <div className="need-card__footer">
          <span className="need-card__donors">
            <span className="need-card__donors-icon">👥</span>
            {need.donorsCount} donantes
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
  const isCompleted = need.unitsDonated >= need.totalUnits
  const remaining = need.totalUnits - need.unitsDonated
  const stockPercentage = (need.unitsDonated / need.totalUnits) * 100

  return (
    <article
      className={`need-card ${need.isUrgent ? 'urgent' : ''}`}
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
        {need.isUrgent && (
          <span className="need-card__urgent-badge">🔴 Urgente</span>
        )}
        <span className="need-card__category-badge">
          {getCategoryLabel(need.category)}
        </span>
      </div>

      <SponsorBanner sponsor={need.sponsor} />

      <div className="need-card__body">
        <span className="need-card__type-label gift">🎁 Regalo directo</span>
        <h3 className="need-card__title">{need.title}</h3>
        <p className="need-card__description">{need.description}</p>

        <div className="gift-info">
          <div className="gift-info__price">
            ${need.unitPrice.toLocaleString()} MXN
          </div>
          <div className="gift-info__price-label">
            Precio fijo por {need.unitLabel.slice(0, -1)}
          </div>

          <div className="gift-info__stock">
            <span className="gift-info__stock-number">{remaining}</span>
            <span className="gift-info__stock-label">
              de {need.totalUnits} {need.unitLabel} disponibles
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
            {need.unitsDonated} de {need.totalUnits} donados
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
  }
  return labels[category] || category
}
