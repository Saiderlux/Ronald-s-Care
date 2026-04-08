import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLE_INFO } from '../context/AuthContext.jsx'
import { useFichas, FICHA_CATEGORIES, VOLUNTEER_CATEGORIES, FICHA_TYPES, INSUMO_CATEGORIES } from '../context/FichasContext.jsx'
import { useInventory } from '../context/InventoryContext.jsx'
import { useInvoices } from '../context/InvoiceContext.jsx'
import { inKindApi, communicationsApi, sponsorshipApi, volunteersApi, api } from '../api.js'
import { generarCorreoAgradecimiento, analizarCandidatoAdmin } from '../services/aiService.js'

// ============================
// EMPTY FORM TEMPLATES
// ============================
const EMPTY_FICHA_FORM = {
  type: 'donation', title: '', description: '', category: 'alimentacion', emoji: '🍕',
  goal_amount: '', unit_price: '', total_units: '', unit_label: '',
  event_date: '', event_location: '', max_capacity: '',
  sponsorship_type: '', duration: '', beneficiary_info: '', requirements: '',
  is_urgent: false, deadline: '',
}

const EMPTY_INVENTORY_FORM = {
  name: '', category: 'alimentos', current_stock: '', unit: '',
  min_level: '', estimated_unit_price: '', location: 'Casa Ronald Principal',
}

const EMOJI_OPTIONS = ['⛽', '🍕', '🥣', '🎬', '📚', '🧴', '🛏️', '🥪', '🧩', '💊', '🎨', '🏥', '🚐', '💛', '🎁', '🏠', '📦', '👕', '🧹']

export default function AdminDashboard() {
  const { user, logout, hasRole } = useAuth()
  const { fichas, addFicha, deleteFicha, refreshFichas, loading: fichasLoading } = useFichas()
  const { items: inventoryItems, addItem, deleteItem, addMovement, refreshInventory, refreshAlerts, alerts, getLowStockItems, getStockLevel } = useInventory()
  const { invoices, refreshInvoices, generateCFDI, sendCFDI } = useInvoices()
  const navigate = useNavigate()

  // Pipeline data
  const [inKindPledges, setInKindPledges] = useState([])
  const [communications, setCommunications] = useState([])
  const [sponsorships, setSponsorships] = useState([])
  const [stats, setStats] = useState({})
  const [volunteers, setVolunteers] = useState([])

  // UI state
  const [activePanel, setActivePanel] = useState(
    hasRole('IDENTIFIER') ? 'identifier' :
    hasRole('FINANCE') ? 'finance' :
    hasRole('COMMUNICATOR') ? 'communicator' : 'identifier'
  )
  const [showFichaForm, setShowFichaForm] = useState(false)
  const [showInventoryForm, setShowInventoryForm] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(null)
  const [showCommForm, setShowCommForm] = useState(null)
  const [fichaForm, setFichaForm] = useState({ ...EMPTY_FICHA_FORM })
  const [inventoryForm, setInventoryForm] = useState({ ...EMPTY_INVENTORY_FORM })
  const [movementForm, setMovementForm] = useState({ type: 'out', quantity: '', reason: '' })
  const [showValidateModal, setShowValidateModal] = useState(null)
  const [validateForm, setValidateForm] = useState({ code: '', inventoryOption: 'existing', inventoryItemId: '', newName: '', newCategory: 'alimentos', newUnit: '', actualQuantity: '', notes: '' })
  const [commForm, setCommForm] = useState({ subject: '', body: '', photo_proof: '', sent_to: '' })
  const [successMsg, setSuccessMsg] = useState('')
  
  // AI Email state
  const [aiContext, setAiContext] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)

  // AI Volunteer state
  const [volunteerDeckIndex, setVolunteerDeckIndex] = useState(0)
  const [volunteerAiSummary, setVolunteerAiSummary] = useState('')
  const [isVolunteerAiLoading, setIsVolunteerAiLoading] = useState(false)

  // Load pipeline data
  useEffect(() => {
    loadPipelineData()
  }, [])

  async function loadPipelineData() {
    try {
      await refreshFichas()
      const [pledges, comms, sponsorData, statsData, volData] = await Promise.all([
        inKindApi.getAll().catch(() => []),
        communicationsApi.getAll().catch(() => []),
        sponsorshipApi.getAll().catch(() => []),
        api.get('/stats').catch(() => ({})),
        volunteersApi.getAll().catch(() => []),
      ])
      setInKindPledges(pledges)
      setCommunications(comms)
      setSponsorships(sponsorData)
      setStats(statsData)
      setVolunteers(volData)
    } catch (err) {
      console.error('Error loading pipeline:', err)
    }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  function handleLogout() { logout(); navigate('/') }

  // ============================
  // FICHA FORM HANDLERS
  // ============================
  async function handleCreateFicha(e) {
    e.preventDefault()
    const data = { ...fichaForm, is_urgent: fichaForm.is_urgent ? 1 : 0 }
    if (data.type === 'donation') data.goal_amount = parseFloat(data.goal_amount) || 0
    if (data.type === 'gift') {
      data.unit_price = parseFloat(data.unit_price) || 0
      data.total_units = parseInt(data.total_units) || 0
    }
    if (data.type === 'collaborative') data.max_capacity = parseInt(data.max_capacity) || 0

    await addFicha(data)
    setFichaForm({ ...EMPTY_FICHA_FORM })
    setShowFichaForm(false)
    showSuccess(`✅ Ficha "${data.title}" creada`)
    loadPipelineData()
  }

  // ============================
  // INVENTORY HANDLERS
  // ============================
  async function handleCreateInventory(e) {
    e.preventDefault()
    await addItem({
      ...inventoryForm,
      current_stock: parseFloat(inventoryForm.current_stock) || 0,
      min_level: parseFloat(inventoryForm.min_level) || 5,
      estimated_unit_price: parseFloat(inventoryForm.estimated_unit_price) || 0,
    })
    setInventoryForm({ ...EMPTY_INVENTORY_FORM })
    setShowInventoryForm(false)
    showSuccess('✅ Item de inventario creado')
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
    setMovementForm({ type: 'out', quantity: '', reason: '' })
    showSuccess(`✅ Movimiento registrado`)
    refreshFichas()
    loadPipelineData()
  }

  function handleValidatePledge(pledge) {
    setShowValidateModal(pledge)
    setValidateForm({
      code: '', inventoryOption: 'existing', inventoryItemId: '',
      newName: pledge.item_description || '', newCategory: 'alimentos', newUnit: '',
      actualQuantity: pledge.estimated_quantity || '', notes: ''
    })
  }

  async function handleValidateModalSubmit(e) {
    e.preventDefault()
    if (validateForm.code !== showValidateModal.pledge_code) {
      alert('La clave ingresada no coincide. Operación cancelada.')
      return
    }

    let finalInventoryId = validateForm.inventoryItemId

    if (validateForm.inventoryOption === 'new') {
      const newItem = await addItem({
        name: validateForm.newName,
        category: validateForm.newCategory,
        unit: validateForm.newUnit,
        current_stock: 0,
        min_level: 0,
        estimated_unit_price: 0,
        location: 'Casa Ronald Principal'
      })
      finalInventoryId = newItem.id
    }

    await inKindApi.validate(showValidateModal.id, {
      inventory_item_id: finalInventoryId ? parseInt(finalInventoryId) : null,
      actual_quantity: validateForm.actualQuantity ? parseFloat(validateForm.actualQuantity) : null,
      notes: validateForm.notes || null,
    })
    
    setShowValidateModal(null)
    showSuccess(`✅ Donación ${showValidateModal.pledge_code} validada`)
    refreshInventory()
    refreshAlerts()
    loadPipelineData()
  }

  async function handleDeleteInventory(id, name) {
    if (confirm(`¿Estás seguro de eliminar el ítem "${name}"? Esta acción no se puede deshacer.`)) {
      await deleteItem(id)
      showSuccess(`✅ Ítem "${name}" eliminado correctamente`)
      refreshInventory()
      refreshAlerts()
      loadPipelineData()
    }
  }

  // ============================
  // INVOICE HANDLERS
  // ============================
  async function handleGenerateCFDI(invoice) {
    await generateCFDI(invoice.id)
    showSuccess(`✅ CFDI generado: ${invoice.id}`)
  }

  async function handleSendCFDI(invoice) {
    await sendCFDI(invoice.id)
    showSuccess(`✅ CFDI enviado al donante`)
  }

  // ============================
  // COMMUNICATION HANDLERS
  // ============================
  async function handleCreateComm(e) {
    e.preventDefault()
    await communicationsApi.create({
      ficha_id: showCommForm.id,
      subject: commForm.subject,
      body: commForm.body,
      photo_proof: commForm.photo_proof,
      sent_to: commForm.sent_to,
    })
    setShowCommForm(null)
    setCommForm({ subject: '', body: '', photo_proof: '', sent_to: '' })
    showSuccess('✅ Comunicación creada')
    loadPipelineData()
  }

  async function handleSendComm(commId) {
    await communicationsApi.send(commId)
    showSuccess('📧 Correo enviado (simulado)')
    loadPipelineData()
  }

  async function handleGenerateAI() {
    setIsAiLoading(true)
    setCommForm(p => ({ ...p, body: '' })) // Limpiar campo antes de empezar
    try {
      const contextText = aiContext || `Agradecimiento por completar la iniciativa "${showCommForm.title}"`;
      
      await generarCorreoAgradecimiento(
        "Donante", 
        "Comunidad", 
        contextText,
        (textChunk) => {
          setCommForm(p => ({ ...p, body: textChunk }))
        }
      );
    } catch (error) {
      alert("Error al autocompletar con IA: " + error.message)
    } finally {
      setIsAiLoading(false)
    }
  }

  // ============================
  // VOLUNTEER REVIEW HANDLERS
  // ============================
  const pendingVolunteers = volunteers.filter(v => v.status === 'pending')

  async function handleReviewVolunteer(volId, newStatus) {
    try {
      await volunteersApi.review(volId, { status: newStatus })
      showSuccess(`✅ Voluntario ${newStatus === 'approved' ? 'Aprobado — se creará borrador de correo' : 'Rechazado'}`)
      setVolunteerAiSummary('') // Reset summary for next candidate
      await refreshFichas() // Refrescar cupos inmediatamente
      await loadPipelineData()
    } catch (error) {
      const msg = error?.message || 'Error desconocido'
      if (msg.includes('Token') || msg.includes('401') || msg.includes('403')) {
        alert('🔒 Sesión caducada. Por favor inicia sesión de nuevo.')
      } else {
        alert(`Error al evaluar voluntario: ${msg}`)
      }
    }
  }

  async function handleGenerateVolunteerSummary(volunteer) {
    if (!volunteer) return;
    setIsVolunteerAiLoading(true)
    setVolunteerAiSummary('')
    try {
      const parentFicha = fichas.find(f => f.id === volunteer.ficha_id)
      await analizarCandidatoAdmin(volunteer, parentFicha?.title || 'General', (chunk) => {
        setVolunteerAiSummary(chunk)
      });
    } catch (error) {
      setVolunteerAiSummary('⚠️ IA no disponible en este momento. Puedes revisar el perfil manualmente y tomar tu decisión.')
    } finally {
      setIsVolunteerAiLoading(false)
    }
  }

  // ============================
  // SPONSORSHIP REVIEW
  // ============================
  async function handleReviewSponsorship(id, status) {
    const notes = status === 'rejected' ? prompt('Motivo del rechazo:') : prompt('Notas (opcional):')
    await sponsorshipApi.review(id, { status, admin_notes: notes || '' })
    showSuccess(`✅ Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'}`)
    loadPipelineData()
  }

  // ============================
  // RENDER
  // ============================
  const pendingPledges = inKindPledges.filter(p => p.status === 'pending')
  const validatedPledges = inKindPledges.filter(p => p.status === 'validated')
  const pendingSponsorships = sponsorships.filter(s => s.status === 'pending')
  const completedFichas = fichas.filter(f => f.status === 'completed')
  const sentComms = communications.filter(c => c.status === 'sent')
  const draftComms = communications.filter(c => c.status === 'draft')
  const lowStockItems = getLowStockItems()
  const autoFichas = fichas.filter(f => f.auto_generated === 1 && f.status === 'active')
  const pendingInvoices = invoices.filter(i => ['pending', 'fiscal_data_captured'].includes(i.status))

  // Fichas que necesitan comunicación (completadas sin comm enviada)
  const fichasNeedingComm = completedFichas.filter(f =>
    !communications.some(c => c.ficha_id === f.id && c.status === 'sent')
  )

  const roleInfo = ROLE_INFO[user?.role] || ROLE_INFO.ADMIN

  if (!user) return <div className="admin-dash" style={{ padding: '50px', textAlign: 'center' }}>Cargando sesión...</div>

  return (
    <main className="admin-dash" id="admin-dashboard">
      {/* Top Bar */}
      <header className="admin-dash__topbar">
        <div className="container admin-dash__topbar-inner">
          <div className="admin-dash__brand">
            <span className="admin-dash__brand-icon">⚙️</span>
            <span>Panel Admin — <strong>Conexión Tangible</strong></span>
          </div>
          <div className="admin-dash__user-info">
            {hasRole('IDENTIFIER') && (
              <button className="btn-sm" 
                style={{ background: '#E3F2FD', color: '#1976D2', border: 'none', marginRight: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}
                onClick={() => navigate('/admin/inventario')}>
                📦 Inventario
              </button>
            )}
            <span className="admin-dash__role-badge" style={{ background: roleInfo.color }}>
              {roleInfo.label}
            </span>
            <span className="admin-dash__user-name">👤 {user?.name}</span>
            <button className="admin-dash__logout" onClick={handleLogout}>Cerrar Sesión</button>
          </div>
        </div>
      </header>

      <div className="container admin-dash__content">
        {/* Success */}
        {successMsg && <div className="admin-dash__success">{successMsg}</div>}

        {/* Stats Overview */}
        <div className="admin-dash__stats">
          <div className="admin-dash__stat-card">
            <span className="admin-dash__stat-number">{stats.activeFichas || 0}</span>
            <span className="admin-dash__stat-label">Fichas Activas</span>
          </div>
          <div className="admin-dash__stat-card">
            <span className="admin-dash__stat-number">${(stats.totalDonations || 0).toLocaleString()}</span>
            <span className="admin-dash__stat-label">Total Recaudado</span>
          </div>
          <div className="admin-dash__stat-card" style={{ borderColor: pendingPledges.length > 0 ? '#FF6F00' : undefined }}>
            <span className="admin-dash__stat-number">{pendingPledges.length}</span>
            <span className="admin-dash__stat-label">Especie Pendiente</span>
          </div>
          <div className="admin-dash__stat-card" style={{ borderColor: lowStockItems.length > 0 ? '#DA291C' : undefined }}>
            <span className="admin-dash__stat-number">{lowStockItems.length}</span>
            <span className="admin-dash__stat-label">⚠️ Stock Bajo</span>
          </div>
          <div className="admin-dash__stat-card">
            <span className="admin-dash__stat-number">{pendingInvoices.length}</span>
            <span className="admin-dash__stat-label">Facturas Pend.</span>
          </div>
          <div className="admin-dash__stat-card">
            <span className="admin-dash__stat-number">{fichasNeedingComm.length}</span>
            <span className="admin-dash__stat-label">🔔 Comms Pend.</span>
          </div>
        </div>

        {/* Pipeline Tab Selector */}
        <div className="pipeline-tabs">
          <button className={`pipeline-tab ${activePanel === 'identifier' ? 'active' : ''}`}
            onClick={() => setActivePanel('identifier')}
            style={{ '--tab-color': '#2196F3' }}>
            🔍 Identificación
            {(autoFichas.length + pendingSponsorships.length) > 0 &&
              <span className="pipeline-tab__badge">{autoFichas.length + pendingSponsorships.length}</span>}
          </button>
          <span className="pipeline-arrow">→</span>
          <button className={`pipeline-tab ${activePanel === 'finance' ? 'active' : ''}`}
            onClick={() => setActivePanel('finance')}
            style={{ '--tab-color': '#27AA5E' }}>
            💰 Finanzas
            {(pendingPledges.length + pendingInvoices.length) > 0 &&
              <span className="pipeline-tab__badge">{pendingPledges.length + pendingInvoices.length}</span>}
          </button>
          <span className="pipeline-arrow">→</span>
          <button className={`pipeline-tab ${activePanel === 'communicator' ? 'active' : ''}`}
            onClick={() => setActivePanel('communicator')}
            style={{ '--tab-color': '#FF6F00' }}>
            📢 Comunicación
            {fichasNeedingComm.length > 0 &&
              <span className="pipeline-tab__badge">{fichasNeedingComm.length}</span>}
          </button>
        </div>

        {/* ================================================
            PANEL: IDENTIFICADOR
            ================================================ */}
        {activePanel === 'identifier' && (
          <div className="pipeline-panel">
            {/* Auto-Fichas Alert */}
            {autoFichas.length > 0 && (
              <div className="pipeline-alert pipeline-alert--warning">
                <strong>🤖 {autoFichas.length} ficha(s) auto-generada(s)</strong> por inventario bajo.
                Revisa el inventario y aprueba las fichas necesarias.
              </div>
            )}

            {/* VOLUNTEER TINDER DECK */}
            {pendingVolunteers.length > 0 && (
              <div className="pipeline-section" style={{ background: '#F8F9FA', padding: '20px', borderRadius: '15px' }}>
                <div className="pipeline-section__header">
                  <h3>🫂 Revisión de Voluntarios Pendientes ({pendingVolunteers.length})</h3>
                </div>
                
                {(() => {
                  const currentVol = pendingVolunteers[0];
                  const parentFicha = fichas.find(f => f.id === currentVol.ficha_id);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxWidth: '500px', margin: '0 auto' }}>
                      <span style={{ background: '#E3F2FD', color: '#1976D2', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '15px' }}>
                        Postulante a: {parentFicha?.title || 'Desconocido'}
                      </span>
                      
                      <h4 style={{ fontSize: '1.4rem', marginBottom: '5px', color: '#333' }}>{currentVol.name}</h4>
                      <div style={{ color: '#6B6B6B', fontSize: '0.9rem', marginBottom: '15px', display: 'flex', gap: '15px' }}>
                        <span>🎂 {currentVol.age || '?'} años</span>
                        <span>📧 {currentVol.email}</span>
                        <span>📱 {currentVol.phone || 'N/A'}</span>
                      </div>

                      <div style={{ background: '#F5F5F5', padding: '15px', borderRadius: '10px', width: '100%', marginBottom: '20px' }}>
                        <p style={{ margin: 0, fontStyle: 'italic', color: '#444' }}>"{currentVol.motivation || 'Sin motivación específica.'}"</p>
                      </div>

                      {/* AI Summary Box */}
                      <div style={{ width: '100%', marginBottom: '20px' }}>
                        {volunteerAiSummary ? (
                          <div style={{ background: '#FFF3E0', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #FF9800' }}>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#E65100', lineHeight: 1.5 }}>
                              <strong>🤖 Análisis con IA:</strong><br/>
                              {volunteerAiSummary}
                            </p>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleGenerateVolunteerSummary(currentVol)}
                            disabled={isVolunteerAiLoading}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px dashed #FFB74D', background: '#FFF8E1', color: '#F57C00', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            {isVolunteerAiLoading ? '⏳ Analizando perfil...' : '✨ Analizar candidato con IA'}
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                        <button 
                          onClick={() => handleReviewVolunteer(currentVol.id, 'rejected')}
                          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid #EAEAEA', background: 'white', color: '#D32F2F', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.background = '#FFEBEE'}
                          onMouseOut={e => e.currentTarget.style.background = 'white'}
                        >
                          ❌ Rechazar
                        </button>
                        <button 
                          onClick={() => handleReviewVolunteer(currentVol.id, 'approved')}
                          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#2E7D32', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.background = '#1B5E20'}
                          onMouseOut={e => e.currentTarget.style.background = '#2E7D32'}
                        >
                          ✅ Aprobar
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Fichas Section */}
            <div className="pipeline-section">
              <div className="pipeline-section__header">
                <h3>📋 Fichas de Necesidades ({fichas.filter(f => f.status === 'active').length} activas)</h3>
                {hasRole('IDENTIFIER') && (
                  <button className="admin-dash__create-btn" onClick={() => setShowFichaForm(!showFichaForm)}>
                    {showFichaForm ? '✕ Cancelar' : '＋ Nueva Ficha'}
                  </button>
                )}
              </div>

              {/* Create Ficha Form */}
              {showFichaForm && (
                <form className="admin-dash__form" onSubmit={handleCreateFicha}>
                  <h4 className="admin-dash__form-title">Nueva Ficha</h4>
                  <div className="admin-dash__type-selector">
                    {FICHA_TYPES.map(t => (
                      <button key={t.id} type="button"
                        className={`admin-dash__type-btn ${fichaForm.type === t.id ? 'active' : ''}`}
                        onClick={() => setFichaForm(prev => ({ ...prev, type: t.id }))}>
                        <span className="admin-dash__type-btn-label">{t.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="admin-dash__form-group">
                    <label className="admin-dash__form-label">Título *</label>
                    <input className="admin-dash__form-input" name="title" required
                      placeholder="Ej: Gasolina para traslados" value={fichaForm.title}
                      onChange={e => setFichaForm(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="admin-dash__form-group">
                    <label className="admin-dash__form-label">Descripción *</label>
                    <textarea className="admin-dash__form-textarea" name="description" rows={3} required
                      placeholder="Describe la necesidad..." value={fichaForm.description}
                      onChange={e => setFichaForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="admin-dash__form-group">
                    <label className="admin-dash__form-label">📍 Casa / Ubicación</label>
                    <input className="admin-dash__form-input" name="event_location"
                      placeholder="Ej: Casa Puebla, Casa CDMX, Casa Edo. Mex..."
                      value={fichaForm.event_location}
                      onChange={e => setFichaForm(p => ({ ...p, event_location: e.target.value }))} />
                  </div>
                  <div className="admin-dash__form-row">
                    <div className="admin-dash__form-group" style={{ flex: 1 }}>
                      <label className="admin-dash__form-label">Categoría</label>
                      <select className="admin-dash__form-select" value={fichaForm.category}
                        onChange={e => setFichaForm(p => ({ ...p, category: e.target.value }))}>
                        {(fichaForm.type === 'collaborative' ? VOLUNTEER_CATEGORIES : FICHA_CATEGORIES).map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-dash__form-group">
                      <label className="admin-dash__form-label">Emoji</label>
                      <div className="admin-dash__emoji-grid">
                        {EMOJI_OPTIONS.slice(0, 12).map(em => (
                          <button key={em} type="button"
                            className={`admin-dash__emoji-btn ${fichaForm.emoji === em ? 'active' : ''}`}
                            onClick={() => setFichaForm(p => ({ ...p, emoji: em }))}>{em}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {fichaForm.type === 'donation' && (
                    <div className="admin-dash__form-group">
                      <label className="admin-dash__form-label">💵 Meta (MXN) *</label>
                      <input className="admin-dash__form-input" type="number" min="1" required
                        value={fichaForm.goal_amount}
                        onChange={e => setFichaForm(p => ({ ...p, goal_amount: e.target.value }))} />
                    </div>
                  )}
                  {fichaForm.type === 'gift' && (
                    <div className="admin-dash__form-row">
                      <div className="admin-dash__form-group" style={{ flex: 1 }}>
                        <label className="admin-dash__form-label">Precio/unidad *</label>
                        <input className="admin-dash__form-input" type="number" min="1" required
                          value={fichaForm.unit_price}
                          onChange={e => setFichaForm(p => ({ ...p, unit_price: e.target.value }))} />
                      </div>
                      <div className="admin-dash__form-group" style={{ flex: 1 }}>
                        <label className="admin-dash__form-label">Total unidades *</label>
                        <input className="admin-dash__form-input" type="number" min="1" required
                          value={fichaForm.total_units}
                          onChange={e => setFichaForm(p => ({ ...p, total_units: e.target.value }))} />
                      </div>
                      <div className="admin-dash__form-group" style={{ flex: 1 }}>
                        <label className="admin-dash__form-label">Etiqueta</label>
                        <input className="admin-dash__form-input" placeholder="kits, cobijas..."
                          value={fichaForm.unit_label}
                          onChange={e => setFichaForm(p => ({ ...p, unit_label: e.target.value }))} />
                      </div>
                    </div>
                  )}
                  {fichaForm.type === 'collaborative' && (
                    <div className="admin-dash__form-row">
                      <div className="admin-dash__form-group" style={{ flex: 1 }}>
                        <label className="admin-dash__form-label">📅 Fecha *</label>
                        <input className="admin-dash__form-input" type="date" required
                          value={fichaForm.event_date}
                          onChange={e => setFichaForm(p => ({ ...p, event_date: e.target.value }))} />
                      </div>
                      <div className="admin-dash__form-group" style={{ flex: 1 }}>
                        <label className="admin-dash__form-label">👥 Cupos *</label>
                        <input className="admin-dash__form-input" type="number" min="1" required
                          value={fichaForm.max_capacity}
                          onChange={e => setFichaForm(p => ({ ...p, max_capacity: e.target.value }))} />
                      </div>
                    </div>
                  )}
                  {fichaForm.type === 'collaborative' && (
                    <div className="admin-dash__form-group">
                      <label className="admin-dash__form-label">📍 Ubicación *</label>
                      <input className="admin-dash__form-input" required placeholder="Casa Ronald McDonald..."
                        value={fichaForm.event_location}
                        onChange={e => setFichaForm(p => ({ ...p, event_location: e.target.value }))} />
                    </div>
                  )}
                  {fichaForm.type === 'sponsorship' && (
                    <>
                      <div className="admin-dash__form-group">
                        <label className="admin-dash__form-label">Tipo de apadrinamiento</label>
                        <input className="admin-dash__form-input" placeholder="Ej: Vivienda temporal"
                          value={fichaForm.sponsorship_type}
                          onChange={e => setFichaForm(p => ({ ...p, sponsorship_type: e.target.value }))} />
                      </div>
                      <div className="admin-dash__form-group">
                        <label className="admin-dash__form-label">Duración estimada</label>
                        <input className="admin-dash__form-input" placeholder="Ej: 6 meses"
                          value={fichaForm.duration}
                          onChange={e => setFichaForm(p => ({ ...p, duration: e.target.value }))} />
                      </div>
                    </>
                  )}
                  <div className="admin-dash__form-group">
                    <label className="admin-dash__form-checkbox-label">
                      <input type="checkbox" checked={fichaForm.is_urgent}
                        onChange={e => setFichaForm(p => ({ ...p, is_urgent: e.target.checked }))} />
                      <span>🔴 Urgente</span>
                    </label>
                    {fichaForm.is_urgent && (
                      <input className="admin-dash__form-input" placeholder="Ej: 12 horas" style={{ marginTop: 8 }}
                        value={fichaForm.deadline}
                        onChange={e => setFichaForm(p => ({ ...p, deadline: e.target.value }))} />
                    )}
                  </div>
                  <button type="submit" className="admin-dash__form-submit">Crear Ficha ✨</button>
                </form>
              )}

              {/* Fichas List */}
              <div className="admin-dash__fichas-grid">
                {fichas.filter(f => f.status === 'active').map(ficha => (
                  <div key={ficha.id} className={`admin-dash__ficha-card ${ficha.auto_generated ? 'auto-generated' : ''}`}>
                    {ficha.auto_generated === 1 && (
                      <div className="auto-generated-badge">🤖 Auto-generada por inventario bajo</div>
                    )}
                    <div className="admin-dash__ficha-header">
                      <span className="admin-dash__ficha-emoji">{ficha.emoji}</span>
                      <span className={`admin-dash__ficha-type type-${ficha.type}`}>
                        {ficha.type === 'collaborative' && '🤲 Voluntariado'}
                        {ficha.type === 'gift' && '🎁 Regalo'}
                        {ficha.type === 'donation' && '💰 Donación'}
                        {ficha.type === 'sponsorship' && '🤝 Apadrinamiento'}
                      </span>
                      {ficha.is_urgent === 1 && <span className="admin-dash__ficha-urgent">🔴</span>}
                    </div>
                    <h4 className="admin-dash__ficha-title">{ficha.title}</h4>
                    <p className="admin-dash__ficha-desc">{ficha.description}</p>
                    <div className="admin-dash__ficha-meta">
                      {ficha.type === 'donation' && <span>Meta: ${ficha.goal_amount?.toLocaleString()} · ${ficha.current_amount?.toLocaleString()} rec.</span>}
                      {ficha.type === 'gift' && <span>{ficha.units_donated}/{ficha.total_units} {ficha.unit_label}</span>}
                      {ficha.type === 'collaborative' && <span>{ficha.current_enrolled}/{ficha.max_capacity} inscritos</span>}
                    </div>
                    {hasRole('IDENTIFIER') && (
                      <div className="admin-dash__ficha-actions">
                        <button className="admin-dash__ficha-delete" onClick={() => {
                          if (confirm(`¿Eliminar "${ficha.title}"?`)) deleteFicha(ficha.id)
                        }}>🗑️</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN DE VOLUNTARIOS CONFIRMADOS */}
            <div className="pipeline-section">
              <div className="pipeline-section__header">
                <h3>🗓️ Voluntarios Confirmados y Seguimiento</h3>
              </div>
              
              {volunteers.filter(v => v.status === 'approved').length === 0 ? (
                <p className="pipeline-empty">No hay voluntarios confirmados todavía.</p>
              ) : (
                <div className="inventory-table-wrapper">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Voluntario</th>
                        <th>Habilidad / Info</th>
                        <th>Iniciativa</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volunteers.filter(v => v.status === 'approved').map(vol => {
                        const associatedFicha = fichas.find(f => f.id === vol.ficha_id);
                        return (
                          <tr key={vol.id}>
                            <td>
                              <strong>{vol.name}</strong><br/>
                              <small>{vol.email}</small>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.85rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {vol.motivation}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.85rem' }}>{associatedFicha?.emoji} {associatedFicha?.title}</span>
                            </td>
                            <td>
                              <button className="btn-sm" onClick={() => handleReviewVolunteer(vol.id, 'pending')}>
                                ↩️ Re-evaluar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Visibilidad de Inventario (Solo Lectura) */}
            <div className="pipeline-section">
              <div className="pipeline-section__header">
                <h3>📦 Resumen de Inventario ({inventoryItems.length} items)</h3>
                <div>
                  <span style={{fontSize: '0.85rem', color: '#6B6B6B', marginRight: '15px'}}>Vista rápida</span>
                </div>
              </div>
              {inventoryItems.length > 0 ? (
                <div className="inventory-table-wrapper" style={{maxHeight: '300px', overflowY: 'auto'}}>
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Categoría</th>
                        <th>Stock Actual</th>
                        <th>Mínimo Permitido</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryItems.map(item => {
                        const level = getStockLevel(item)
                        return (
                          <tr key={item.id} className={`stock-${level}`}>
                            <td><strong>{item.name}</strong></td>
                            <td>{INSUMO_CATEGORIES.find(c => c.id === item.category)?.emoji} {item.category}</td>
                            <td>{item.current_stock} {item.unit}</td>
                            <td>{item.min_level} {item.unit}</td>
                            <td>
                              <span className={`stock-badge stock-badge--${level}`}>
                                {level === 'critical' ? '🔴 Crítico' : level === 'warning' ? '🟡 Bajo' : '🟢 OK'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="pipeline-empty">El inventario está vacío.</p>
              )}
            </div>

            {/* Sponsorship Requests */}
            {pendingSponsorships.length > 0 && (
              <div className="pipeline-section">
                <div className="pipeline-section__header">
                  <h3>🤝 Solicitudes de Apadrinamiento ({pendingSponsorships.length} pendientes)</h3>
                </div>
                {pendingSponsorships.map(s => (
                  <div key={s.id} className="pipeline-item">
                    <div className="pipeline-item__info">
                      <strong>{s.requester_name}</strong> — {s.sponsorship_type}
                      <p>{s.offer_description}</p>
                      <span className="pipeline-item__meta">📧 {s.requester_email}</span>
                    </div>
                    <div className="pipeline-item__actions">
                      <button className="btn-sm btn-success" onClick={() => handleReviewSponsorship(s.id, 'approved')}>✅ Aprobar</button>
                      <button className="btn-sm btn-danger" onClick={() => handleReviewSponsorship(s.id, 'rejected')}>❌ Rechazar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



        {/* ================================================
            PANEL: FINANZAS
            ================================================ */}
        {activePanel === 'finance' && (
          <div className="pipeline-panel">
            {/* Pending In-Kind Validations */}
            <div className="pipeline-section">
              <div className="pipeline-section__header">
                <h3>📦 Donaciones en Especie Pendientes ({pendingPledges.length})</h3>
              </div>
              {pendingPledges.length === 0 ? (
                <p className="pipeline-empty">No hay donaciones en especie pendientes de validación.</p>
              ) : (
                pendingPledges.map(pledge => (
                  <div key={pledge.id} className="pipeline-item pipeline-item--highlight">
                    <div className="pipeline-item__info">
                      <div className="pipeline-item__code">{pledge.pledge_code}</div>
                      <strong>{pledge.donor_name}</strong>
                      <p>{pledge.item_description}</p>
                      <span className="pipeline-item__meta">
                        {pledge.category} · Valor estimado: ${pledge.estimated_value?.toLocaleString()} MXN
                        {pledge.estimated_quantity && ` · Qty: ${pledge.estimated_quantity}`}
                      </span>
                    </div>
                    {hasRole('FINANCE') && (
                      <div className="pipeline-item__actions">
                        <button className="btn-sm btn-success" onClick={() => handleValidatePledge(pledge)}>
                          ✅ Validar Entrega
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Invoices */}
            <div className="pipeline-section">
              <div className="pipeline-section__header">
                <h3>🧾 Facturación CFDI ({pendingInvoices.length} pendientes)</h3>
              </div>
              {invoices.length === 0 ? (
                <p className="pipeline-empty">No hay facturas registradas.</p>
              ) : (
                <div className="inventory-table-wrapper">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Donante</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>UUID</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingInvoices.map(inv => (
                        <tr key={inv.id}>
                          <td>#{inv.id}</td>
                          <td>{inv.donor_name || inv.pledge_donor_name || '—'}</td>
                          <td>${inv.amount?.toLocaleString()}</td>
                          <td>
                            <span className={`invoice-status invoice-status--${inv.status}`}>
                              {inv.status === 'no_fiscal_data' && '⚪ Sin datos'}
                              {inv.status === 'pending' && '🟡 Pendiente'}
                              {inv.status === 'fiscal_data_captured' && '🔵 Datos capturados'}
                              {inv.status === 'cfdi_generated' && '🟢 Generado'}
                              {inv.status === 'cfdi_sent' && '✅ Enviado'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            {inv.cfdi_uuid ? inv.cfdi_uuid.substring(0, 8) + '...' : '—'}
                          </td>
                          <td>
                            {inv.status === 'fiscal_data_captured' && hasRole('FINANCE') && (
                              <button className="btn-sm btn-success" onClick={() => handleGenerateCFDI(inv)}>
                                📄 Generar CFDI
                              </button>
                            )}
                            {inv.status === 'cfdi_generated' && hasRole('FINANCE') && (
                              <button className="btn-sm" onClick={() => handleSendCFDI(inv)}>
                                📧 Enviar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Validated Pledges */}
            {validatedPledges.length > 0 && (
              <div className="pipeline-section">
                <div className="pipeline-section__header">
                  <h3>✅ Donaciones Validadas ({validatedPledges.length})</h3>
                </div>
                {validatedPledges.map(p => (
                  <div key={p.id} className="pipeline-item">
                    <div className="pipeline-item__info">
                      <div className="pipeline-item__code">{p.pledge_code}</div>
                      <strong>{p.donor_name}</strong> — {p.item_description}
                      <span className="pipeline-item__meta">
                        Validado por {p.validated_by} el {new Date(p.validated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================
            PANEL: COMUNICACIÓN
            ================================================ */}
        {activePanel === 'communicator' && (
          <div className="pipeline-panel">
            {/* Fichas needing communication */}
            <div className="pipeline-section">
              <div className="pipeline-section__header">
                <h3>🔔 Fichas Completadas sin Comunicar ({fichasNeedingComm.length})</h3>
              </div>
              {fichasNeedingComm.length === 0 ? (
                <p className="pipeline-empty">¡Todo comunicado! No hay fichas completadas pendientes.</p>
              ) : (
                fichasNeedingComm.map(ficha => (
                  <div key={ficha.id} className="pipeline-item pipeline-item--highlight">
                    <div className="pipeline-item__info">
                      <span style={{ fontSize: '1.5rem' }}>{ficha.emoji}</span>
                      <strong>{ficha.title}</strong>
                      <p>{ficha.description?.substring(0, 100)}...</p>
                      <span className="pipeline-item__meta">
                        {ficha.donors_count} donantes · ${ficha.current_amount?.toLocaleString()} MXN
                      </span>
                    </div>
                    {hasRole('COMMUNICATOR') && (
                      <div className="pipeline-item__actions">
                        <button className="btn-lg btn-success" 
                          style={{ padding: '12px 24px', fontSize: '1.1rem', fontWeight: 'bold' }}
                          onClick={() => {
                          setShowCommForm(ficha)
                          setCommForm({
                            subject: `🎉 ¡Meta cumplida! "${ficha.title}"`,
                            body: `Gracias a tu donación, la meta "${ficha.title}" fue completada.\n\n${ficha.donors_count} donantes aportaron un total de $${ficha.current_amount?.toLocaleString()} MXN.\n\nAquí tienes la prueba de cómo se utilizaron los fondos:`,
                            photo_proof: '',
                            sent_to: '',
                          })
                          setAiContext('') // reset AI context
                        }}>
                          ✍️ Crear Comunicado
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Draft Communications */}
            {draftComms.length > 0 && (
              <div className="pipeline-section">
                <div className="pipeline-section__header">
                  <h3>📝 Borradores ({draftComms.length})</h3>
                </div>
                {draftComms.map(comm => (
                  <div key={comm.id} className="pipeline-item">
                    <div className="pipeline-item__info">
                      <strong>{comm.subject}</strong>
                      <p>{comm.body?.substring(0, 100)}...</p>
                      {comm.photo_proof && <span className="pipeline-item__meta">📸 Con foto adjunta</span>}
                    </div>
                    {hasRole('COMMUNICATOR') && (
                      <div className="pipeline-item__actions">
                        <button className="btn-sm" onClick={() => {
                          const associatedFicha = fichas.find(f => f.id === comm.ficha_id) || { title: 'Ficha Desconocida', current_amount: 0, donors_count: 0 };
                          setShowCommForm({ ...associatedFicha, comm_id: comm.id })
                          setCommForm({
                            subject: comm.subject || '',
                            body: comm.body || '',
                            photo_proof: comm.photo_proof || '',
                            sent_to: comm.sent_to || '',
                          })
                          setAiContext('')
                        }}>
                          ✏️ Editar
                        </button>
                        <button className="btn-sm btn-success" onClick={() => handleSendComm(comm.id)}>
                          📧 Enviar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sent Communications */}
            {sentComms.length > 0 && (
              <div className="pipeline-section">
                <div className="pipeline-section__header">
                  <h3>✅ Enviados ({sentComms.length})</h3>
                </div>
                {sentComms.map(comm => (
                  <div key={comm.id} className="pipeline-item" style={{ opacity: 0.7 }}>
                    <div className="pipeline-item__info">
                      <strong>{comm.subject}</strong>
                      <span className="pipeline-item__meta">
                        Enviado por {comm.sent_by} · {comm.sent_at ? new Date(comm.sent_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================================================
          MODALS
          ================================================ */}


      {/* Communication Form Modal */}
      {showCommForm && (
        <div className="modal-overlay" onClick={() => setShowCommForm(null)}>
          <div className="modal vol-modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">📧 Crear Comunicado</h2>
              <button className="modal__close" onClick={() => setShowCommForm(null)}>✕</button>
            </div>
            <div className="modal__body">
              <div className="modal__need-info">
                <div className="modal__need-emoji">{showCommForm.emoji || '📢'}</div>
                <div>
                  <p className="modal__need-title">{showCommForm.title || 'Iniciativa'}</p>
                  <p className="modal__need-remaining">{showCommForm.donors_count || 0} donantes · ${(showCommForm.current_amount || showCommForm.units_donated || 0).toLocaleString()}</p>
                </div>
              </div>
              <form className="vol-form" onSubmit={handleCreateComm}>
                <div className="vol-form__field">
                  <label>Asunto del correo *</label>
                  <input type="text" required value={commForm.subject}
                    onChange={e => setCommForm(p => ({ ...p, subject: e.target.value }))} />
                </div>
                <div className="vol-form__field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>Cuerpo del mensaje *</label>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input type="text" placeholder="Contexto para IA (ej: mencionar a Sofía)" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                      value={aiContext} onChange={e => setAiContext(e.target.value)} />
                    <button type="button" onClick={handleGenerateAI} disabled={isAiLoading} style={{ background: '#FFC72C', color: '#000', padding: '8px 16px', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                      {isAiLoading ? '⏳ Escribiendo...' : '✨ Redactar con IA'}
                    </button>
                  </div>
                  <textarea rows={6} required value={commForm.body}
                    onChange={e => setCommForm(p => ({ ...p, body: e.target.value }))} />
                </div>
                <div className="vol-form__field">
                  <label>📸 URL de foto de prueba</label>
                  <input type="text" placeholder="URL de la imagen de prueba"
                    value={commForm.photo_proof}
                    onChange={e => setCommForm(p => ({ ...p, photo_proof: e.target.value }))} />
                </div>
                <div className="vol-form__field">
                  <label>Enviar a (correos, separados por coma)</label>
                  <input type="text" placeholder="donante1@mail.com, donante2@mail.com"
                    value={commForm.sent_to}
                    onChange={e => setCommForm(p => ({ ...p, sent_to: e.target.value }))} />
                </div>
                <button type="submit" className="pay-btn volunteer-submit">
                  📧 Guardar y Enviar Comunicado
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Validate In-Kind Pledge Modal */}
      {showValidateModal && (
        <div className="modal-overlay" onClick={() => setShowValidateModal(null)}>
          <div className="modal vol-modal" style={{maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">📦 Validar Donación en Especie</h2>
              <button className="modal__close" onClick={() => setShowValidateModal(null)}>✕</button>
            </div>
            <div className="modal__body">
              <div className="modal__need-info" style={{marginBottom: 20}}>
                <div style={{fontSize: '2rem'}}>🎁</div>
                <div>
                  <p className="modal__need-title">{showValidateModal.item_description}</p>
                  <p className="modal__need-remaining">{showValidateModal.donor_name} · Promesado: {showValidateModal.estimated_quantity || 'N/A'}</p>
                </div>
              </div>
              <form className="vol-form" onSubmit={handleValidateModalSubmit}>
                <div className="vol-form__field">
                  <label>Clave de Seguimiento *</label>
                  <input type="text" required placeholder="Ej: ESP-2026-XXXXXX"
                    value={validateForm.code}
                    onChange={e => setValidateForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
                  <small style={{color: '#6B6B6B', fontSize: '0.8rem'}}>Verifica que la clave ({showValidateModal.pledge_code}) sea correcta.</small>
                </div>

                <div className="vol-form__field" style={{marginTop: 15, borderTop: '1px solid #EAEAEA', paddingTop: 15}}>
                  <label>Cantidad Real Recibida</label>
                  <input type="number" min="0" step="0.1" placeholder="Ej: 5"
                    value={validateForm.actualQuantity}
                    onChange={e => setValidateForm(p => ({ ...p, actualQuantity: e.target.value }))} />
                </div>

                <div className="vol-form__field">
                  <label style={{marginBottom: 10, display: 'block'}}>Conexión con Inventario *</label>
                  <div className="vol-tipo-selector" style={{ marginBottom: 12 }}>
                    <label className={`vol-tipo-option ${validateForm.inventoryOption === 'existing' ? 'active' : ''}`}>
                      <input type="radio" value="existing" checked={validateForm.inventoryOption === 'existing'}
                        onChange={() => setValidateForm(p => ({ ...p, inventoryOption: 'existing' }))} />
                      <span>Asociar a existente</span>
                    </label>
                    <label className={`vol-tipo-option ${validateForm.inventoryOption === 'new' ? 'active' : ''}`}>
                      <input type="radio" value="new" checked={validateForm.inventoryOption === 'new'}
                        onChange={() => setValidateForm(p => ({ ...p, inventoryOption: 'new' }))} />
                      <span>＋ Crear nuevo</span>
                    </label>
                  </div>

                  {validateForm.inventoryOption === 'existing' ? (
                    <select className="admin-dash__form-select" style={{width: '100%'}}
                      value={validateForm.inventoryItemId}
                      onChange={e => setValidateForm(p => ({ ...p, inventoryItemId: e.target.value }))}>
                      <option value="">-- No asociar al inventario --</option>
                      {inventoryItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.current_stock} {item.unit})</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{background: '#F9FAFB', padding: '15px', borderRadius: '8px', border: '1px solid #EAEAEA'}}>
                      <div className="vol-form__field">
                        <label>Nombre del Ítem *</label>
                        <input type="text" required placeholder="Ej: Paquetes de Arroz"
                          value={validateForm.newName}
                          onChange={e => setValidateForm(p => ({ ...p, newName: e.target.value }))} />
                      </div>
                      <div style={{display: 'flex', gap: '10px', marginTop: 10}}>
                        <div style={{flex: 1}}>
                          <label style={{fontSize: '0.85rem', fontWeight: 600, color: '#333'}}>Categoría</label>
                          <select className="admin-dash__form-select" style={{width: '100%'}}
                            value={validateForm.newCategory}
                            onChange={e => setValidateForm(p => ({ ...p, newCategory: e.target.value }))}>
                            {INSUMO_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                        </div>
                        <div style={{flex: 1}}>
                          <label style={{fontSize: '0.85rem', fontWeight: 600, color: '#333'}}>Unidad</label>
                          <input className="admin-dash__form-input" required placeholder="kg, litros..."
                            value={validateForm.newUnit}
                            onChange={e => setValidateForm(p => ({ ...p, newUnit: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="vol-form__field" style={{marginTop: 15}}>
                  <label>Notas Adicionales</label>
                  <textarea rows={2} placeholder="Estado de los productos, caducidad..."
                    value={validateForm.notes}
                    onChange={e => setValidateForm(p => ({ ...p, notes: e.target.value }))} />
                </div>

                <button type="submit" className="pay-btn volunteer-submit" style={{marginTop: 20}}>
                  ✅ Confirmar e Ingresar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
