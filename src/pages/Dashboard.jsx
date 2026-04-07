import { useState } from 'react'
import { getCollaborativeNeeds, getGiftNeeds, CATEGORIES } from '../data/mockData.js'
import NeedCard from '../components/NeedCard.jsx'
import PaymentModal from '../components/PaymentModal.jsx'

export default function Dashboard() {
  const [collaborativeNeeds, setCollaborativeNeeds] = useState(getCollaborativeNeeds())
  const [giftNeeds, setGiftNeeds] = useState(getGiftNeeds())
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedNeed, setSelectedNeed] = useState(null)

  // Filter
  const filteredCollaborative = activeFilter === 'all'
    ? collaborativeNeeds
    : collaborativeNeeds.filter(n => n.category === activeFilter)

  const filteredGifts = activeFilter === 'all'
    ? giftNeeds
    : giftNeeds.filter(n => n.category === activeFilter)

  // Sort collaborative: urgent first, then by progress ascending, completed last
  const sortedCollaborative = [...filteredCollaborative].sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1
    if (!a.isUrgent && b.isUrgent) return 1
    const pctA = a.currentAmount / a.goalAmount
    const pctB = b.currentAmount / b.goalAmount
    if (pctA >= 1 && pctB < 1) return 1
    if (pctB >= 1 && pctA < 1) return -1
    return pctA - pctB
  })

  // Sort gifts: urgent first, completed last
  const sortedGifts = [...filteredGifts].sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1
    if (!a.isUrgent && b.isUrgent) return 1
    const doneA = a.unitsDonated >= a.totalUnits
    const doneB = b.unitsDonated >= b.totalUnits
    if (doneA && !doneB) return 1
    if (doneB && !doneA) return -1
    return 0
  })

  function handleDonate(need) {
    setSelectedNeed(need)
  }

  function handleDonationComplete(updatedNeed) {
    if (updatedNeed.type === 'collaborative') {
      setCollaborativeNeeds(prev =>
        prev.map(n => (n.id === updatedNeed.id ? updatedNeed : n))
      )
    } else {
      setGiftNeeds(prev =>
        prev.map(n => (n.id === updatedNeed.id ? updatedNeed : n))
      )
    }
  }

  function handleCloseModal() {
    setSelectedNeed(null)
  }

  return (
    <main className="dashboard" id="dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard__header">
          <h1 className="dashboard__title">
            Catálogo de{' '}
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

        {/* SECTION 1: Collaborative Needs */}
        {sortedCollaborative.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">
                🤲 Necesidades Colaborativas
                <span className="section-count">
                  — Dona lo que quieras para llenar la meta
                </span>
              </h2>
            </div>
            <div className="cards-grid">
              {sortedCollaborative.map(need => (
                <NeedCard key={need.id} need={need} onDonate={handleDonate} />
              ))}
            </div>
          </>
        )}

        {/* SECTION 2: Gift Needs */}
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

        {/* Empty state */}
        {sortedCollaborative.length === 0 && sortedGifts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#9E9E9E' }}>
            <p style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</p>
            <p>No hay necesidades en esta categoría por ahora.</p>
          </div>
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
