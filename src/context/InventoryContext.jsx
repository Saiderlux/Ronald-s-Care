import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { inventoryApi } from '../api.js'

const InventoryContext = createContext(null)

export function InventoryProvider({ children }) {
  const [items, setItems] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    try {
      const data = await inventoryApi.getAll()
      setItems(data)
    } catch (err) {
      console.error('Error cargando inventario:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await inventoryApi.getAlerts()
      setAlerts(data)
    } catch (err) {
      console.error('Error cargando alertas:', err)
    }
  }, [])

  useEffect(() => {
    fetchItems()
    fetchAlerts()
  }, [fetchItems, fetchAlerts])

  async function addItem(itemData) {
    const newItem = await inventoryApi.create(itemData)
    setItems(prev => [...prev, newItem])
    return newItem
  }

  async function updateItem(id, data) {
    const updated = await inventoryApi.update(id, data)
    setItems(prev => prev.map(i => (i.id === id ? updated : i)))
    return updated
  }

  async function deleteItem(id) {
    await inventoryApi.delete(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function addMovement(movementData) {
    const updatedItem = await inventoryApi.addMovement(movementData)
    setItems(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)))
    // Re-fetch alerts after movement
    fetchAlerts()
    return updatedItem
  }

  async function getMovements(itemId) {
    return await inventoryApi.getMovements(itemId)
  }

  function getItemsByCategory(category) {
    return items.filter(i => i.category === category)
  }

  function getLowStockItems() {
    return items.filter(i => i.current_stock <= i.min_level)
  }

  function getStockLevel(item) {
    if (item.min_level <= 0) return 'normal'
    const ratio = item.current_stock / item.min_level
    if (ratio <= 0.3) return 'critical'
    if (ratio <= 1) return 'warning'
    return 'normal'
  }

  return (
    <InventoryContext.Provider
      value={{
        items,
        alerts,
        loading,
        refreshInventory: fetchItems,
        refreshAlerts: fetchAlerts,
        addItem,
        updateItem,
        deleteItem,
        addMovement,
        getMovements,
        getItemsByCategory,
        getLowStockItems,
        getStockLevel,
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error('useInventory debe usarse dentro de un InventoryProvider')
  }
  return context
}
