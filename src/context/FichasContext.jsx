import { createContext, useContext, useState, useEffect } from 'react'

const FichasContext = createContext(null)

// Categorías para fichas de Donación y Regalo
export const FICHA_CATEGORIES = [
  { id: 'transporte', label: '🚐 Transporte', emoji: '🚐' },
  { id: 'alimentacion', label: '🍕 Alimentación', emoji: '🍕' },
  { id: 'higiene', label: '🧴 Higiene', emoji: '🧴' },
  { id: 'bienestar', label: '💛 Bienestar', emoji: '💛' },
  { id: 'educacion', label: '📚 Educación', emoji: '📚' },
  { id: 'salud', label: '🏥 Salud', emoji: '🏥' },
]

// Categorías específicas para fichas de Voluntariado (Colaborativa)
export const VOLUNTEER_CATEGORIES = [
  { id: 'mantenimiento', label: '🔧 Mantenimiento', emoji: '🔧' },
  { id: 'pintura', label: '🎨 Pintura', emoji: '🎨' },
  { id: 'limpieza', label: '🧹 Limpieza', emoji: '🧹' },
  { id: 'cocina', label: '🍳 Cocina', emoji: '🍳' },
  { id: 'recreacion', label: '🎉 Recreación', emoji: '🎉' },
  { id: 'educacion_vol', label: '📖 Educación', emoji: '📖' },
  { id: 'acompanamiento', label: '🤝 Acompañamiento', emoji: '🤝' },
]

// Tipos de ficha soportados
export const FICHA_TYPES = [
  { id: 'collaborative', label: '🤲 Voluntariado', description: 'Evento de voluntariado con cupos' },
  { id: 'gift', label: '🎁 Regalo', description: 'Monto fijo por unidad' },
  { id: 'donation', label: '💰 Donación', description: 'Donación libre hacia una meta' },
]

// Leer fichas del localStorage al inicio
function loadFichas() {
  try {
    const saved = localStorage.getItem('ronaldscare_fichas')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function loadNextId() {
  try {
    const saved = localStorage.getItem('ronaldscare_nextId')
    return saved ? parseInt(saved, 10) : 1
  } catch {
    return 1
  }
}

export function FichasProvider({ children }) {
  const [fichas, setFichas] = useState(loadFichas)
  const [nextId, setNextId] = useState(loadNextId)

  // Persistir en localStorage cada vez que cambien las fichas
  useEffect(() => {
    localStorage.setItem('ronaldscare_fichas', JSON.stringify(fichas))
  }, [fichas])

  useEffect(() => {
    localStorage.setItem('ronaldscare_nextId', String(nextId))
  }, [nextId])

  function addFicha(fichaData) {
    const newFicha = {
      ...fichaData,
      id: nextId,
      // Campos de donación
      currentAmount: 0,
      unitsDonated: 0,
      donorsCount: 0,
      // Campos de voluntariado
      currentEnrolled: fichaData.type === 'collaborative' ? 0 : undefined,
      createdAt: new Date().toISOString(),
    }
    setNextId(prev => prev + 1)
    setFichas(prev => [...prev, newFicha])
    return newFicha
  }

  function deleteFicha(id) {
    setFichas(prev => prev.filter(f => f.id !== id))
  }

  function updateFicha(id, data) {
    setFichas(prev => prev.map(f => (f.id === id ? { ...f, ...data } : f)))
  }

  // Funciones de donación
  function donateToFicha(id, amount) {
    setFichas(prev =>
      prev.map(f => {
        if (f.id !== id) return f
        if (f.type === 'gift') {
          const newDonated = Math.min(f.unitsDonated + amount, f.totalUnits)
          return { ...f, unitsDonated: newDonated, donorsCount: f.donorsCount + 1 }
        }
        // donation type
        const effectiveAmount =
          f.sponsor?.type === 'matching' ? amount * 2 : amount
        const goal = f.goalAmount || Infinity
        const newAmount = Math.min(f.currentAmount + effectiveAmount, goal)
        return { ...f, currentAmount: newAmount, donorsCount: f.donorsCount + 1 }
      })
    )
  }

  // Inscripción a voluntariado
  function enrollVolunteer(id, slots = 1) {
    setFichas(prev =>
      prev.map(f => {
        if (f.id !== id || f.type !== 'collaborative') return f
        const newEnrolled = Math.min(f.currentEnrolled + slots, f.maxCapacity)
        return { ...f, currentEnrolled: newEnrolled }
      })
    )
  }

  // Getters por tipo
  function getCollaborativeNeeds() {
    return fichas.filter(f => f.type === 'collaborative')
  }

  function getGiftNeeds() {
    return fichas.filter(f => f.type === 'gift')
  }

  function getDonationNeeds() {
    return fichas.filter(f => f.type === 'donation')
  }

  function getAllNeeds() {
    return [...fichas]
  }

  function getNeedById(id) {
    return fichas.find(f => f.id === id)
  }

  return (
    <FichasContext.Provider
      value={{
        fichas,
        addFicha,
        deleteFicha,
        updateFicha,
        donateToFicha,
        enrollVolunteer,
        getCollaborativeNeeds,
        getGiftNeeds,
        getDonationNeeds,
        getAllNeeds,
        getNeedById,
      }}
    >
      {children}
    </FichasContext.Provider>
  )
}

export function useFichas() {
  const context = useContext(FichasContext)
  if (!context) {
    throw new Error('useFichas debe usarse dentro de un FichasProvider')
  }
  return context
}
