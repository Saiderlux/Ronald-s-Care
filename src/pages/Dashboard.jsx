import { useEffect, useState } from 'react'
import { useFichas, VOLUNTEER_CATEGORIES } from '../context/FichasContext.jsx'
import NeedCard from '../components/NeedCard.jsx'
import PaymentModal from '../components/PaymentModal.jsx'
import DonacionEspecie from './DonacionEspecie.jsx'
import Voluntariado from './Voluntariado.jsx'

const CATEGORIES = [
  { id: 'all', label: '🏠 Todas', emoji: '🏠' },
  { id: 'transporte', label: '🚐 Transporte', emoji: '🚐' },
  { id: 'alimentacion', label: '🍕 Alimentación', emoji: '🍕' },
  { id: 'higiene', label: '🧴 Higiene', emoji: '🧴' },
  { id: 'bienestar', label: '💛 Bienestar', emoji: '💛' },
  { id: 'educacion', label: '📚 Educación', emoji: '📚' },
  { id: 'salud', label: '🏥 Salud', emoji: '🏥' },
  ...VOLUNTEER_CATEGORIES.map(cat => ({ id: cat.id, label: cat.label, emoji: cat.emoji })),
]

const QUICK_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'urgent', label: 'Urgentes' },
  { id: 'low_progress', label: 'Por completar' },
  { id: 'near_goal', label: 'Casi logradas' },
  { id: 'completed', label: 'Completadas' },
]

export default function Dashboard() {
  const { getDonationNeeds, getGiftNeeds, getCollaborativeNeeds, loading } = useFichas()
  const [activeQuickFilter, setActiveQuickFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showCategoryFilters, setShowCategoryFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('urgent_desc')
  const [selectedNeed, setSelectedNeed] = useState(null)
  const [, forceUpdate] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 450)
    window.addEventListener('scroll', onScroll)
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const giftNeeds = getGiftNeeds()
  const donationNeeds = getDonationNeeds()
  const collaborativeNeeds = getCollaborativeNeeds()

  const allNeeds = [
    ...donationNeeds.map(item => ({ ...item, _kind: 'donation' })),
    ...giftNeeds.map(item => ({ ...item, _kind: 'gift' })),
    ...collaborativeNeeds.map(item => ({ ...item, _kind: 'volunteer' })),
  ]

  function getProgress(item) {
    if (item._kind === 'gift') {
      if (!item.total_units) return 0
      return (item.units_donated || 0) / item.total_units
    }
    if (item._kind === 'volunteer') {
      if (!item.max_capacity) return 0
      return (item.current_enrolled || 0) / item.max_capacity
    }
    if (!item.goal_amount) return 0
    return (item.current_amount || 0) / item.goal_amount
  }

  function isCompleted(item) {
    return getProgress(item) >= 1 || item.status === 'completed'
  }

  function matchesQuickFilter(item, filterId) {
    const progress = getProgress(item)
    switch (filterId) {
      case 'urgent':
        return Boolean(item.is_urgent)
      case 'low_progress':
        return !isCompleted(item) && progress < 0.35
      case 'near_goal':
        return !isCompleted(item) && progress >= 0.7
      case 'completed':
        return isCompleted(item)
      case 'all':
      default:
        return true
    }
  }

  function matchesSearch(item) {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return true
    const haystack = `${item.title || ''} ${item.description || ''}`.toLowerCase()
    return haystack.includes(normalized)
  }

  const narrowedNeeds = allNeeds.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesCategory && matchesSearch(item)
  })

  const quickFilterCounts = QUICK_FILTERS.reduce((acc, filter) => {
    acc[filter.id] = narrowedNeeds.filter(item => matchesQuickFilter(item, filter.id)).length
    return acc
  }, {})

  const filteredNeeds = narrowedNeeds.filter(item => matchesQuickFilter(item, activeQuickFilter))

  function getImpactScore(item) {
    if (item._kind === 'gift') {
      const remainingUnits = Math.max((item.total_units || 0) - (item.units_donated || 0), 0)
      return (item.unit_price || 0) * remainingUnits
    }
    if (item._kind === 'volunteer') {
      return Math.max((item.max_capacity || 0) - (item.current_enrolled || 0), 0)
    }
    const remainingAmount = Math.max((item.goal_amount || 0) - (item.current_amount || 0), 0)
    return remainingAmount
  }

  function sortNeeds(items) {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'progress_asc':
          return getProgress(a) - getProgress(b)
        case 'impact_desc':
          return getImpactScore(b) - getImpactScore(a)
        case 'newest_desc': {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
          return dateB - dateA || (b.id || 0) - (a.id || 0)
        }
        case 'urgent_desc':
        default:
          if (Boolean(a.is_urgent) !== Boolean(b.is_urgent)) return Boolean(b.is_urgent) - Boolean(a.is_urgent)
          if (isCompleted(a) !== isCompleted(b)) return Number(isCompleted(a)) - Number(isCompleted(b))
          return getProgress(a) - getProgress(b)
      }
    })
  }

  const filteredGifts = sortNeeds(filteredNeeds.filter(item => item._kind === 'gift'))
  const filteredDonations = sortNeeds(filteredNeeds.filter(item => item._kind === 'donation'))
  const filteredVolunteerEvents = sortNeeds(filteredNeeds.filter(item => item._kind === 'volunteer'))

  function handleDonate(need) {
    setSelectedNeed(need)
  }

  function handleDonationComplete() {
    forceUpdate(n => n + 1)
  }

  function handleCloseModal() {
    setSelectedNeed(null)
  }

  function handleScrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalFichas = filteredGifts.length + filteredDonations.length + filteredVolunteerEvents.length

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
            Centro de{' '}
            <span className="text-gradient">Necesidades</span>
          </h1>
          <p className="dashboard__subtitle">
            Aquí puedes navegar entre todas las formas de apoyar:
            iniciativas, donación en especie y voluntariado.
          </p>
        </div>

        <nav className="donaciones-subnav" aria-label="Tipos de donación">
          <a href="#donaciones-section" className="donaciones-subnav__link">Donaciones</a>
          <a href="#regalos-section" className="donaciones-subnav__link">Regalos Directos</a>
          <a href="#voluntariado-section" className="donaciones-subnav__link">Voluntariado</a>
          <a href="#especie-section" className="donaciones-subnav__link">En Especie</a>
        </nav>

        <section id="iniciativas-section" className="donaciones-section-anchor">

        {/* Smart Filters */}
        <div className="dashboard__smart-filters" id="filters">
          <div className="dashboard__smart-tabs">
            {QUICK_FILTERS.map(filter => (
              <button
                key={filter.id}
                className={`smart-tab ${activeQuickFilter === filter.id ? 'active' : ''}`}
                onClick={() => setActiveQuickFilter(filter.id)}
              >
                {filter.label}
                <span className="smart-tab__count">{quickFilterCounts[filter.id] || 0}</span>
              </button>
            ))}
          </div>

          <div className="dashboard__smart-tools">
            <input
              type="text"
              className="dashboard__search-input"
              placeholder="Buscar en donaciones, regalos y voluntariado..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />

            <select className="dashboard__sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="urgent_desc">Más urgentes</option>
              <option value="progress_asc">Menor avance</option>
              <option value="impact_desc">Mayor impacto estimado</option>
              <option value="newest_desc">Más recientes</option>
            </select>

            <button
              type="button"
              className={`dashboard__more-filters-btn ${showCategoryFilters ? 'active' : ''}`}
              onClick={() => setShowCategoryFilters(prev => !prev)}
            >
              Más filtros {showCategoryFilters ? '▲' : '▼'}
            </button>
          </div>

          {showCategoryFilters && (
            <div className="dashboard__filters" id="category-filters">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`filter-btn ${categoryFilter === cat.id ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
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

        {/* Donation Needs */}
        {filteredDonations.length > 0 && (
          <div id="donaciones-section" className="donaciones-subsection-card">
            <div className="section-header">
              <h2 className="section-title">
                💰 Donaciones
                <span className="section-count">
                  — Aporta libremente a una causa
                </span>
              </h2>
            </div>
            <div className="cards-grid">
              {filteredDonations.map(need => (
                <NeedCard key={need.id} need={need} onDonate={handleDonate} />
              ))}
            </div>
          </div>
        )}

        {/* Gift Needs */}
        {filteredGifts.length > 0 && (
          <div id="regalos-section" className="donaciones-subsection-card">
            <div className="section-header">
              <h2 className="section-title">
                🎁 Regalos Directos
                <span className="section-count">
                  — Dona un monto fijo y regala algo concreto
                </span>
              </h2>
            </div>
            <div className="cards-grid">
              {filteredGifts.map(need => (
                <NeedCard key={need.id} need={need} onDonate={handleDonate} />
              ))}
            </div>
          </div>
        )}
        </section>

        <section id="voluntariado-section" className="donaciones-section-anchor">
          <div className="section-header">
            <h2 className="section-title">🙋 Voluntariado</h2>
          </div>
          <Voluntariado embedded eventsOverride={filteredVolunteerEvents} />
        </section>

        <section id="especie-section" className="donaciones-section-anchor">
          <div className="section-header">
            <h2 className="section-title">📦 Donación en Especie</h2>
          </div>
          <DonacionEspecie embedded />
        </section>
      </div>

      {/* Payment Modal */}
      {selectedNeed && (
        <PaymentModal
          need={selectedNeed}
          onClose={handleCloseModal}
          onDonationComplete={handleDonationComplete}
        />
      )}

      {showBackToTop && (
        <button className="back-to-top" onClick={handleScrollToTop} aria-label="Volver arriba">
          ↑
        </button>
      )}
    </main>
  )
}
