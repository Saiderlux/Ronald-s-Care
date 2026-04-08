import { useState } from 'react'
import { useFichas } from '../context/FichasContext.jsx'
import NeedCard from '../components/NeedCard.jsx'
import PaymentModal from '../components/PaymentModal.jsx'

const CATEGORIES = [
  { id: 'all', label: '🏠 Todas', emoji: '🏠' },
  { id: 'transporte', label: '🚐 Transporte', emoji: '🚐' },
  { id: 'alimentacion', label: '🍕 Alimentación', emoji: '🍕' },
  { id: 'higiene', label: '🧴 Higiene', emoji: '🧴' },
  { id: 'bienestar', label: '💛 Bienestar', emoji: '💛' },
  { id: 'educacion', label: '📚 Educación', emoji: '📚' },
  { id: 'salud', label: '🏥 Salud', emoji: '🏥' },
]

export default function Dashboard() {
  const { getDonationNeeds, getGiftNeeds, loading } = useFichas()
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedNeed, setSelectedNeed] = useState(null)
  const [, forceUpdate] = useState(0)

  const giftNeeds = getGiftNeeds()
  const donationNeeds = getDonationNeeds()

  // Filter by category
  const filterByCategory = (items) =>
    activeFilter === 'all' ? items : items.filter(n => n.category === activeFilter)

  const filteredGifts = filterByCategory(giftNeeds)
  const filteredDonations = filterByCategory(donationNeeds)

  // Sort: urgent first, completed last
  const sortedGifts = [...filteredGifts].sort((a, b) => {
    if (a.is_urgent && !b.is_urgent) return -1
    if (!a.is_urgent && b.is_urgent) return 1
    const doneA = a.units_donated >= a.total_units
    const doneB = b.units_donated >= b.total_units
    if (doneA && !doneB) return 1
    if (doneB && !doneA) return -1
    return 0
  })

  const sortedDonations = [...filteredDonations].sort((a, b) => {
    if (a.is_urgent && !b.is_urgent) return -1
    if (!a.is_urgent && b.is_urgent) return 1
    const pctA = (a.goal_amount > 0) ? a.current_amount / a.goal_amount : 0
    const pctB = (b.goal_amount > 0) ? b.current_amount / b.goal_amount : 0
    if (pctA >= 1 && pctB < 1) return 1
    if (pctB >= 1 && pctA < 1) return -1
    return pctA - pctB
  })

  function handleDonate(need) {
    setSelectedNeed(need)
  }

  function handleDonationComplete() {
    forceUpdate(n => n + 1)
  }

  function handleCloseModal() {
    setSelectedNeed(null)
  }

  const totalFichas = sortedGifts.length + sortedDonations.length

  if (loading) {
    return (
      <main className="dashboard" id="dashboard">
        <div className="container">
          <div className="dashboard__header">
            <h1 className="dashboard__title">Cargando...</h1>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="dashboard" id="dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard__header">
          <h1 className="dashboard__title">
            Iniciativas de{' '}
            <span className="text-gradient">Necesidades</span>
          </h1>
          <p className="dashboard__subtitle">
            Cada tarjeta es una necesidad real de la Casa Ronald McDonald.
            Elige cómo quieres ayudar hoy.
          </p>
        </div>

        {/* Filters */}
        <div className="dashboard__filters" id="filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`filter-btn ${activeFilter === cat.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {totalFichas === 0 && (
          <div className="dashboard__empty-state">
            <span className="dashboard__empty-icon">🏠</span>
            <h3 className="dashboard__empty-title">
              Aún no hay necesidades publicadas
            </h3>
            <p className="dashboard__empty-text">
              El equipo de la Fundación está preparando las fichas de necesidades.
              <br />
              ¡Vuelve pronto para ver cómo puedes ayudar!
            </p>
          </div>
        )}

        {/* Gift Needs */}
        {sortedGifts.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">
                🎁 Regalos Directos
                <span className="section-count">
                  — Dona un monto fijo y regala algo concreto
                </span>
              </h2>
            </div>
            <div className="cards-grid">
              {sortedGifts.map(need => (
                <NeedCard key={need.id} need={need} onDonate={handleDonate} />
              ))}
            </div>
          </>
        )}

        {/* Donation Needs */}
        {sortedDonations.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">
                💰 Donaciones
                <span className="section-count">
                  — Aporta libremente a una causa
                </span>
              </h2>
            </div>
            <div className="cards-grid">
              {sortedDonations.map(need => (
                <NeedCard key={need.id} need={need} onDonate={handleDonate} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {selectedNeed && (
        <PaymentModal
          need={selectedNeed}
          onClose={handleCloseModal}
          onDonationComplete={handleDonationComplete}
        />
      )}
    </main>
  )
}
