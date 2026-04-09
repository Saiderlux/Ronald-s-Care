import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLE_INFO } from '../context/AuthContext.jsx'
import { useInventory } from '../context/InventoryContext.jsx'
import { INSUMO_CATEGORIES } from '../context/FichasContext.jsx'

const EMPTY_INVENTORY_FORM = {
  name: '', category: 'alimentos', current_stock: '', unit: '',
  min_level: '', estimated_unit_price: '', location: 'Casa Ronald Principal',
}

export default function AdminInventory() {
  const { user, hasRole, logout } = useAuth()
  const navigate = useNavigate()
  const { 
    items: inventoryItems, 
    addItem, 
    deleteItem, 
    addMovement,
    getStockLevel 
  } = useInventory()

  const [showInventoryForm, setShowInventoryForm] = useState(false)
  const [inventoryForm, setInventoryForm] = useState({ ...EMPTY_INVENTORY_FORM })
  const [showMovementModal, setShowMovementModal] = useState(null)
  const [movementForm, setMovementForm] = useState({ type: 'in', quantity: '', reason: '' })
  const [successMsg, setSuccessMsg] = useState('')

  // Protección de Rol
  if (!hasRole('IDENTIFIER') && !hasRole('ADMIN')) {
    return (
      <div className="admin-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>🚫 Acceso Denegado</h2>
          <p>No tienes permisos para ver el inventario completo.</p>
          <button className="pay-btn" onClick={() => navigate('/admin/dashboard')} style={{ marginTop: 20 }}>Volver al Panel</button>
        </div>
      </div>
    )
  }

  function showSuccess(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  async function handleCreateInventory(e) {
    e.preventDefault()
    await addItem({
      ...inventoryForm,
      current_stock: parseFloat(inventoryForm.current_stock) || 0,
      min_level: parseFloat(inventoryForm.min_level) || 0,
      estimated_unit_price: parseFloat(inventoryForm.estimated_unit_price) || 0,
    })
    setInventoryForm({ ...EMPTY_INVENTORY_FORM })
    setShowInventoryForm(false)
    showSuccess('✅ Item de inventario creado')
  }

  async function handleDeleteInventory(id, name) {
    if (confirm(`¿Estás seguro de eliminar el ítem "${name}"? Esta acción no se puede deshacer.`)) {
      await deleteItem(id)
      showSuccess(`✅ Ítem "${name}" eliminado correctamente`)
    }
  }

  async function handleMovement(e) {
    e.preventDefault()
    await addMovement({
      item_id: showMovementModal.id,
      type: movementForm.type,
      quantity: parseFloat(movementForm.quantity) || 0,
      reason: movementForm.reason,
    })
    setShowMovementModal(null)
    setMovementForm({ type: 'in', quantity: '', reason: '' })
    showSuccess(`✅ Movimiento registrado`)
  }

  const roleInfo = ROLE_INFO[user?.role] || ROLE_INFO.ADMIN

  return (
    <main className="admin-dash" style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Top Bar */}
      <header className="admin-dash__topbar">
        <div className="container admin-dash__topbar-inner">
          <div className="admin-dash__brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard')}>
            <span className="admin-dash__brand-icon">⬅️</span>
            <span>Volver al <strong>Dashboard</strong></span>
          </div>
          <div className="admin-dash__user-info">
            <span className="admin-dash__role-badge" style={{ background: roleInfo.color }}>
              {roleInfo.label}
            </span>
            <span className="admin-dash__user-name">👤 {user?.name}</span>
            <button className="admin-dash__logout" onClick={() => { logout(); navigate('/') }}>Cerrar Sesión</button>
          </div>
        </div>
      </header>

      <div className="container admin-dash__content" style={{ marginTop: '30px' }}>
        {successMsg && <div className="admin-dash__success">{successMsg}</div>}
        
        <div className="pipeline-panel" style={{ display: 'block' }}>
          <div className="pipeline-section">
            <div className="pipeline-section__header">
              <h3>📦 Gestión Central de Inventario ({inventoryItems.length} items)</h3>
              <button className="admin-dash__create-btn" onClick={() => setShowInventoryForm(!showInventoryForm)}>
                {showInventoryForm ? '✕ Cancelar' : '＋ Nuevo Item'}
              </button>
            </div>

            {showInventoryForm && (
              <form className="admin-dash__form" onSubmit={handleCreateInventory}>
                <h4 className="admin-dash__form-title">Crear Nuevo Producto en Almacén</h4>
                <div className="admin-dash__form-row">
                  <div className="admin-dash__form-group" style={{ flex: 2 }}>
                    <label className="admin-dash__form-label">Nombre del Producto *</label>
                    <input className="admin-dash__form-input" required placeholder="Ej: Frijol en bolsa"
                      value={inventoryForm.name}
                      onChange={e => setInventoryForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="admin-dash__form-group" style={{ flex: 1 }}>
                    <label className="admin-dash__form-label">Categoría *</label>
                    <select className="admin-dash__form-select" value={inventoryForm.category}
                      onChange={e => setInventoryForm(p => ({ ...p, category: e.target.value }))}>
                      {INSUMO_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="admin-dash__form-row">
                  <div className="admin-dash__form-group" style={{ flex: 1 }}>
                    <label className="admin-dash__form-label">Stock de Entrada *</label>
                    <input className="admin-dash__form-input" type="number" min="0" step="0.1" required
                      value={inventoryForm.current_stock}
                      onChange={e => setInventoryForm(p => ({ ...p, current_stock: e.target.value }))} />
                  </div>
                  <div className="admin-dash__form-group" style={{ flex: 1 }}>
                    <label className="admin-dash__form-label">Unidad de Medida *</label>
                    <input className="admin-dash__form-input" required placeholder="kg, piezas, litros..."
                      value={inventoryForm.unit}
                      onChange={e => setInventoryForm(p => ({ ...p, unit: e.target.value }))} />
                  </div>
                  <div className="admin-dash__form-group" style={{ flex: 1 }}>
                    <label className="admin-dash__form-label">Nivel de Alerta Mínimo</label>
                    <input className="admin-dash__form-input" type="number" min="0" step="0.1"
                      value={inventoryForm.min_level}
                      onChange={e => setInventoryForm(p => ({ ...p, min_level: e.target.value }))} />
                  </div>
                  <div className="admin-dash__form-group" style={{ flex: 1 }}>
                    <label className="admin-dash__form-label">Costo por u. (MXN) Aprox.</label>
                    <input className="admin-dash__form-input" type="number" min="0" step="0.1"
                      value={inventoryForm.estimated_unit_price}
                      onChange={e => setInventoryForm(p => ({ ...p, estimated_unit_price: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" className="admin-dash__form-submit">Crear Producto 📦</button>
              </form>
            )}

            {/* Inventory Table with Edit/Delete */}
            {inventoryItems.length > 0 ? (
              <div className="inventory-table-wrapper" style={{ border: '1px solid #EAEAEA', borderRadius: '12px' }}>
                <table className="inventory-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Artículo</th>
                      <th>Cat.</th>
                      <th>Stock Actual</th>
                      <th>Límite Info</th>
                      <th>Estado</th>
                      <th>Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItems.map(item => {
                      const level = getStockLevel(item)
                      return (
                        <tr key={item.id} className={`stock-${level}`}>
                          <td><strong>{item.name}</strong></td>
                          <td>{INSUMO_CATEGORIES.find(c => c.id === item.category)?.emoji} {item.category}</td>
                          <td style={{ fontSize: '1.1rem', fontWeight: 600 }}>{item.current_stock} <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#6B6B6B' }}>{item.unit}</span></td>
                          <td>Mín {item.min_level}</td>
                          <td>
                            <span className={`stock-badge stock-badge--${level}`}>
                              {level === 'critical' ? '🔴 Crítico' : level === 'warning' ? '🟡 Bajo' : '🟢 OK'}
                            </span>
                          </td>
                          <td style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-sm" style={{ background: '#E3F2FD', color: '#1976D2', border: 'none' }} 
                                    onClick={() => { setShowMovementModal(item); setMovementForm({ type: 'in', quantity: '', reason: '' }) }}>
                              ± Entrada/Salida
                            </button>
                            <button className="btn-sm" style={{ background: '#FFEBEB', color: '#DA291C', border: 'none' }} 
                                    onClick={() => handleDeleteInventory(item.id, item.name)}>
                              🗑️ Eliminar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="pipeline-empty">No hay ítems en el almacén. Crea el primero arriba.</p>
            )}
          </div>
        </div>
      </div>

      {/* Movement Modal */}
      {showMovementModal && (
        <div className="modal-overlay" onClick={() => setShowMovementModal(null)}>
          <div className="modal movement-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Ajuste Manual de Inventario</h2>
              <button className="modal__close" onClick={() => setShowMovementModal(null)}>✕</button>
            </div>
            <div className="modal__body">
              <p>Producto: <strong>{showMovementModal.name}</strong> (Actual: {showMovementModal.current_stock} {showMovementModal.unit})</p>
              <form className="admin-dash__form" style={{ marginTop: '1rem', padding: 0, border: 'none', background: 'transparent' }} onSubmit={handleMovement}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <label style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="radio" value="in" name="mov_type" checked={movementForm.type === 'in'} onChange={() => setMovementForm(p => ({ ...p, type: 'in' }))} />
                    <span style={{ color: '#2E7D32', fontWeight: 600 }}>🟢 Entrada (Sumar)</span>
                  </label>
                  <label style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="radio" value="out" name="mov_type" checked={movementForm.type === 'out'} onChange={() => setMovementForm(p => ({ ...p, type: 'out' }))} />
                    <span style={{ color: '#C62828', fontWeight: 600 }}>🔴 Salida (Restar)</span>
                  </label>
                </div>
                <div className="admin-dash__form-group">
                  <label className="admin-dash__form-label">Cantidad a ajustar *</label>
                  <input className="admin-dash__form-input" type="number" min="0.1" step="0.1" required
                    value={movementForm.quantity} onChange={e => setMovementForm(p => ({ ...p, quantity: e.target.value }))} />
                </div>
                <div className="admin-dash__form-group">
                  <label className="admin-dash__form-label">Motivo (Opcional)</label>
                  <input className="admin-dash__form-input" placeholder="Ej: Merma, donativo directo..."
                    value={movementForm.reason} onChange={e => setMovementForm(p => ({ ...p, reason: e.target.value }))} />
                </div>
                <button type="submit" className="pay-btn" style={{ marginTop: 20 }}>Confirmar Movimiento</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
