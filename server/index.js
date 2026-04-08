// ================================================
// RonaldsCare — Express API Server
// ================================================
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ================================================
// MIDDLEWARE: Auth simple (token = base64 JSON)
// ================================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const user = JSON.parse(Buffer.from(token, 'base64').toString());
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ message: 'Sin permisos para esta acción' });
    }
    next();
  };
}

// ================================================
// AUTH
// ================================================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
  if (!user) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }
  const tokenPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
  const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
  res.json({ token, user: tokenPayload });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

app.get('/api/auth/users', authMiddleware, requireRole('ADMIN'), (req, res) => {
  const users = db.prepare('SELECT id, email, name, role, created_at FROM users').all();
  res.json(users);
});

// ================================================
// FICHAS (CRUD + Donación)
// ================================================
app.get('/api/fichas', (req, res) => {
  const { type, status, category } = req.query;
  let query = 'SELECT * FROM fichas WHERE 1=1';
  const params = [];
  if (type) { query += ' AND type = ?'; params.push(type); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  query += ' ORDER BY is_urgent DESC, created_at DESC';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/fichas/:id', (req, res) => {
  const ficha = db.prepare('SELECT * FROM fichas WHERE id = ?').get(req.params.id);
  if (!ficha) return res.status(404).json({ message: 'Ficha no encontrada' });
  res.json(ficha);
});

app.post('/api/fichas', authMiddleware, requireRole('IDENTIFIER'), (req, res) => {
  const {
    type, title, description, category, emoji,
    goal_amount, unit_price, total_units, unit_label,
    event_date, event_location, max_capacity,
    sponsorship_type, duration, beneficiary_info, requirements,
    is_urgent, deadline, sponsor_json,
    auto_generated, auto_generated_item_id,
  } = req.body;

  const result = db.prepare(`
    INSERT INTO fichas (type, title, description, category, emoji,
      goal_amount, unit_price, total_units, unit_label,
      event_date, event_location, max_capacity,
      sponsorship_type, duration, beneficiary_info, requirements,
      is_urgent, deadline, sponsor_json,
      auto_generated, auto_generated_item_id, created_by)
    VALUES (?,?,?,?,?, ?,?,?,?, ?,?,?, ?,?,?,?, ?,?,?, ?,?,?)
  `).run(
    type, title, description, category, emoji || '📦',
    goal_amount || 0, unit_price || 0, total_units || 0, unit_label || 'unidades',
    event_date || null, event_location || null, max_capacity || 0,
    sponsorship_type || null, duration || null, beneficiary_info || null, requirements || null,
    is_urgent ? 1 : 0, deadline || null, sponsor_json || null,
    auto_generated ? 1 : 0, auto_generated_item_id || null, req.user.name
  );

  const newFicha = db.prepare('SELECT * FROM fichas WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newFicha);
});

app.put('/api/fichas/:id', authMiddleware, (req, res) => {
  const ficha = db.prepare('SELECT * FROM fichas WHERE id = ?').get(req.params.id);
  if (!ficha) return res.status(404).json({ message: 'Ficha no encontrada' });

  const updates = req.body;
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length === 0) return res.json(ficha);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);

  db.prepare(`UPDATE fichas SET ${setClause} WHERE id = ?`).run(...values, req.params.id);
  res.json(db.prepare('SELECT * FROM fichas WHERE id = ?').get(req.params.id));
});

app.delete('/api/fichas/:id', authMiddleware, requireRole('IDENTIFIER'), (req, res) => {
  db.prepare('DELETE FROM fichas WHERE id = ?').run(req.params.id);
  res.json({ message: 'Ficha eliminada' });
});

// Donar a una ficha (público)
app.post('/api/fichas/:id/donate', (req, res) => {
  const ficha = db.prepare('SELECT * FROM fichas WHERE id = ?').get(req.params.id);
  if (!ficha) return res.status(404).json({ message: 'Ficha no encontrada' });

  const { amount, quantity, donor_name, donor_email, wants_invoice } = req.body;

  if (ficha.type === 'gift') {
    const qty = quantity || 1;
    const newDonated = Math.min(ficha.units_donated + qty, ficha.total_units);
    const donationAmount = ficha.unit_price * qty;
    db.prepare('UPDATE fichas SET units_donated = ?, donors_count = donors_count + 1 WHERE id = ?')
      .run(newDonated, ficha.id);

    // Check if completed
    if (newDonated >= ficha.total_units) {
      db.prepare("UPDATE fichas SET status = 'completed' WHERE id = ?").run(ficha.id);
    }

    // Register donation
    const donResult = db.prepare(
      'INSERT INTO donations (ficha_id, amount, donor_name, donor_email, wants_invoice) VALUES (?,?,?,?,?)'
    ).run(ficha.id, donationAmount, donor_name || 'Anónimo', donor_email || null, wants_invoice ? 1 : 0);

    // Create invoice record
    createInvoiceForDonation(donResult.lastInsertRowid, donationAmount, wants_invoice);

  } else if (ficha.type === 'donation' || ficha.type === 'collaborative') {
    const sponsor = ficha.sponsor_json ? JSON.parse(ficha.sponsor_json) : null;
    const effectiveAmount = sponsor?.type === 'matching' ? amount * 2 : amount;
    const newAmount = Math.min(ficha.current_amount + effectiveAmount, ficha.goal_amount || Infinity);

    db.prepare('UPDATE fichas SET current_amount = ?, donors_count = donors_count + 1 WHERE id = ?')
      .run(newAmount, ficha.id);

    if (ficha.goal_amount > 0 && newAmount >= ficha.goal_amount) {
      db.prepare("UPDATE fichas SET status = 'completed' WHERE id = ?").run(ficha.id);
    }

    const donResult = db.prepare(
      'INSERT INTO donations (ficha_id, amount, donor_name, donor_email, wants_invoice) VALUES (?,?,?,?,?)'
    ).run(ficha.id, amount, donor_name || 'Anónimo', donor_email || null, wants_invoice ? 1 : 0);

    createInvoiceForDonation(donResult.lastInsertRowid, amount, wants_invoice);
  }

  // Inscripción a voluntariado (Se registra como pendiente, no descuenta cupo todavía)
  if (ficha.type === 'collaborative' && req.body.volunteer_data) {
    const vd = req.body.volunteer_data;
    const slots = vd.slots || 1;

    db.prepare(`INSERT INTO volunteer_registrations (ficha_id, name, email, phone, age, motivation, reg_type, company_name, slots)
      VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(ficha.id, vd.name || vd.nombre || 'Anónimo', vd.email, vd.phone || null, vd.age || null, vd.motivation || null,
        vd.type || 'individual', vd.company_name || null, slots);
  }

  const updated = db.prepare('SELECT * FROM fichas WHERE id = ?').get(ficha.id);
  res.json(updated);
});

function createInvoiceForDonation(donationId, amount, wantsInvoice) {
  db.prepare(
    'INSERT INTO invoices (donation_id, amount, status) VALUES (?,?,?)'
  ).run(donationId, amount, wantsInvoice ? 'pending' : 'no_fiscal_data');
}

// ================================================
// DONACIONES EN ESPECIE (IN-KIND)
// ================================================
app.get('/api/in-kind', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM in_kind_pledges WHERE 1=1';
  const params = [];
  if (status) { query += ' AND status = ?'; params.push(status); }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

app.post('/api/in-kind', (req, res) => {
  const { donor_name, donor_email, donor_phone, category, item_description, estimated_quantity, estimated_value } = req.body;
  const pledgeCode = `ESP-${new Date().getFullYear()}-${uuidv4().substring(0, 6).toUpperCase()}`;

  const result = db.prepare(`
    INSERT INTO in_kind_pledges (pledge_code, donor_name, donor_email, donor_phone, category, item_description, estimated_quantity, estimated_value)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(pledgeCode, donor_name, donor_email || null, donor_phone || null, category, item_description, estimated_quantity || null, estimated_value || 0);

  const pledge = db.prepare('SELECT * FROM in_kind_pledges WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(pledge);
});

app.put('/api/in-kind/:id/validate', authMiddleware, requireRole('FINANCE'), (req, res) => {
  const pledge = db.prepare('SELECT * FROM in_kind_pledges WHERE id = ?').get(req.params.id);
  if (!pledge) return res.status(404).json({ message: 'Pledge no encontrado' });

  const { inventory_item_id, actual_quantity, notes } = req.body;

  db.prepare(`
    UPDATE in_kind_pledges SET status = 'validated', validated_by = ?, validated_at = CURRENT_TIMESTAMP,
    inventory_item_id = ?, notes = ? WHERE id = ?
  `).run(req.user.name, inventory_item_id || null, notes || null, pledge.id);

  // Si hay item de inventario, registrar entrada
  if (inventory_item_id) {
    const qty = actual_quantity || parseFloat(pledge.estimated_quantity) || 1;
    db.prepare(`
      INSERT INTO inventory_movements (item_id, type, quantity, reason, related_pledge_code, performed_by)
      VALUES (?, 'in', ?, 'Donación en especie validada', ?, ?)
    `).run(inventory_item_id, qty, pledge.pledge_code, req.user.name);

    db.prepare('UPDATE inventory_items SET current_stock = current_stock + ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?')
      .run(qty, inventory_item_id);
  }

  // Crear registro de factura para la donación en especie
  db.prepare(
    "INSERT INTO invoices (pledge_id, amount, status) VALUES (?, ?, 'pending')"
  ).run(pledge.id, pledge.estimated_value || 0);

  const updated = db.prepare('SELECT * FROM in_kind_pledges WHERE id = ?').get(pledge.id);
  res.json(updated);
});

app.put('/api/in-kind/:id/cancel', (req, res) => {
  db.prepare("UPDATE in_kind_pledges SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  const updated = db.prepare('SELECT * FROM in_kind_pledges WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// ================================================
// INVENTARIO
// ================================================
app.get('/api/inventory', (req, res) => {
  const items = db.prepare('SELECT * FROM inventory_items ORDER BY category, name').all();
  res.json(items);
});

app.post('/api/inventory', authMiddleware, requireRole('IDENTIFIER'), (req, res) => {
  const { name, category, current_stock, unit, min_level, estimated_unit_price, location } = req.body;
  const result = db.prepare(`
    INSERT INTO inventory_items (name, category, current_stock, unit, min_level, estimated_unit_price, location)
    VALUES (?,?,?,?,?,?,?)
  `).run(name, category, current_stock || 0, unit || 'unidades', min_level || 5, estimated_unit_price || 0, location || 'Casa Ronald Principal');

  res.status(201).json(db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/inventory/:id', authMiddleware, requireRole('IDENTIFIER'), (req, res) => {
  const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item no encontrado' });

  const updates = req.body;
  const fields = Object.keys(updates).filter(k => k !== 'id');
  if (fields.length === 0) return res.json(item);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);

  db.prepare(`UPDATE inventory_items SET ${setClause}, last_updated = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...values, req.params.id);

  res.json(db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(req.params.id));
});

app.delete('/api/inventory/:id', authMiddleware, requireRole('IDENTIFIER'), (req, res) => {
  db.prepare('DELETE FROM inventory_items WHERE id = ?').run(req.params.id);
  res.json({ message: 'Item eliminado' });
});

// Registrar movimiento de inventario
app.post('/api/inventory/movement', authMiddleware, (req, res) => {
  const { item_id, type, quantity, reason, related_pledge_code } = req.body;

  const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(item_id);
  if (!item) return res.status(404).json({ message: 'Item no encontrado' });

  db.prepare(`
    INSERT INTO inventory_movements (item_id, type, quantity, reason, related_pledge_code, performed_by)
    VALUES (?,?,?,?,?,?)
  `).run(item_id, type, quantity, reason || null, related_pledge_code || null, req.user.name);

  const stockChange = type === 'in' ? quantity : -quantity;
  const newStock = Math.max(0, item.current_stock + stockChange);
  db.prepare('UPDATE inventory_items SET current_stock = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newStock, item_id);

  // Verificar si necesita auto-ficha después de una salida
  if (type === 'out') {
    checkAndAutoGenerateFicha(item_id);
  }

  const updated = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(item_id);
  res.json(updated);
});

// Obtener movimientos de un item
app.get('/api/inventory/:id/movements', (req, res) => {
  const movements = db.prepare(
    'SELECT * FROM inventory_movements WHERE item_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.params.id);
  res.json(movements);
});

// Obtener alertas de stock bajo
app.get('/api/inventory/alerts', (req, res) => {
  const alerts = db.prepare(
    'SELECT * FROM inventory_items WHERE current_stock <= min_level ORDER BY (current_stock * 1.0 / CASE WHEN min_level > 0 THEN min_level ELSE 1 END) ASC'
  ).all();
  res.json(alerts);
});

// Auto-fichas generadas por inventario bajo
app.get('/api/inventory/auto-fichas', (req, res) => {
  const fichas = db.prepare(
    "SELECT * FROM fichas WHERE auto_generated = 1 AND status = 'active' ORDER BY created_at DESC"
  ).all();
  res.json(fichas);
});

function checkAndAutoGenerateFicha(itemId) {
  const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(itemId);
  if (!item || item.current_stock > item.min_level) return;

  // Verificar si ya existe una ficha auto-generada activa para este item
  const existing = db.prepare(
    "SELECT * FROM fichas WHERE auto_generated = 1 AND auto_generated_item_id = ? AND status = 'active'"
  ).get(itemId);
  if (existing) return;

  // Calcular monto necesario
  const deficit = item.min_level - item.current_stock;
  const goalAmount = deficit * (item.estimated_unit_price || 50);

  // Mapear categoría de inventario a emoji
  const categoryEmojis = {
    alimentos: '🍕', higiene: '🧴', ropa: '👕', medicamentos: '💊',
    educacion: '📚', limpieza: '🧹', otros: '📦',
    alimentacion: '🍕', salud: '🏥',
  };

  db.prepare(`
    INSERT INTO fichas (type, title, description, category, emoji, goal_amount, is_urgent, auto_generated, auto_generated_item_id, created_by)
    VALUES ('donation', ?, ?, ?, ?, ?, 1, 1, ?, '🤖 Sistema de Inventario')
  `).run(
    `Se necesita: ${item.name}`,
    `⚠️ Auto-generada por inventario bajo. El stock de "${item.name}" está en ${item.current_stock} ${item.unit} (mínimo: ${item.min_level}). Se necesitan ${deficit} ${item.unit} adicionales.`,
    item.category,
    categoryEmojis[item.category] || '📦',
    goalAmount,
    itemId
  );
}

// ================================================
// FACTURACIÓN / CFDI
// ================================================
app.get('/api/invoices', authMiddleware, requireRole('FINANCE'), (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT i.*, d.donor_name, d.donor_email, d.ficha_id,
      fd.rfc, fd.razon_social, fd.regimen_fiscal, fd.uso_cfdi, fd.codigo_postal,
      p.pledge_code, p.donor_name as pledge_donor_name, p.item_description
    FROM invoices i
    LEFT JOIN donations d ON i.donation_id = d.id
    LEFT JOIN fiscal_data fd ON i.fiscal_data_id = fd.id
    LEFT JOIN in_kind_pledges p ON i.pledge_id = p.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND i.status = ?'; params.push(status); }
  query += ' ORDER BY i.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

app.post('/api/invoices/:donationId/fiscal-data', (req, res) => {
  const { rfc, razon_social, regimen_fiscal, uso_cfdi, codigo_postal, email } = req.body;

  const result = db.prepare(`
    INSERT INTO fiscal_data (donation_id, rfc, razon_social, regimen_fiscal, uso_cfdi, codigo_postal, email)
    VALUES (?,?,?,?,?,?,?)
  `).run(req.params.donationId, rfc, razon_social, regimen_fiscal || null, uso_cfdi || 'D04', codigo_postal || null, email || null);

  // Actualizar factura
  db.prepare(`
    UPDATE invoices SET status = 'fiscal_data_captured', fiscal_data_id = ? WHERE donation_id = ?
  `).run(result.lastInsertRowid, req.params.donationId);

  res.json({ message: 'Datos fiscales capturados', fiscal_data_id: result.lastInsertRowid });
});

app.post('/api/invoices/:id/generate', authMiddleware, requireRole('FINANCE'), (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });

  // Simular generación CFDI
  const cfdiUuid = uuidv4().toUpperCase();
  db.prepare(`
    UPDATE invoices SET status = 'cfdi_generated', cfdi_uuid = ?,
    cfdi_xml_path = ?, cfdi_pdf_path = ? WHERE id = ?
  `).run(
    cfdiUuid,
    `/cfdi/${cfdiUuid}.xml`,
    `/cfdi/${cfdiUuid}.pdf`,
    invoice.id
  );

  res.json({
    message: 'CFDI generado exitosamente (simulado)',
    cfdi_uuid: cfdiUuid,
    invoice: db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice.id),
  });
});

app.post('/api/invoices/:id/send', authMiddleware, requireRole('FINANCE'), (req, res) => {
  db.prepare("UPDATE invoices SET status = 'cfdi_sent' WHERE id = ?").run(req.params.id);
  res.json({
    message: 'CFDI enviado al donante (simulado)',
    invoice: db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id),
  });
});

// ================================================
// APADRINAMIENTO
// ================================================
app.get('/api/sponsorship', authMiddleware, (req, res) => {
  const requests = db.prepare(`
    SELECT sr.*, f.title as ficha_title, f.emoji as ficha_emoji
    FROM sponsorship_requests sr
    LEFT JOIN fichas f ON sr.ficha_id = f.id
    ORDER BY sr.created_at DESC
  `).all();
  res.json(requests);
});

app.get('/api/sponsorship/opportunities', (req, res) => {
  const fichas = db.prepare(
    "SELECT * FROM fichas WHERE type = 'sponsorship' AND status = 'active' ORDER BY created_at DESC"
  ).all();
  res.json(fichas);
});

app.post('/api/sponsorship', (req, res) => {
  const { ficha_id, requester_name, requester_email, requester_phone, sponsorship_type, offer_description } = req.body;

  const result = db.prepare(`
    INSERT INTO sponsorship_requests (ficha_id, requester_name, requester_email, requester_phone, sponsorship_type, offer_description)
    VALUES (?,?,?,?,?,?)
  `).run(ficha_id || null, requester_name, requester_email, requester_phone || null, sponsorship_type, offer_description || null);

  res.status(201).json(db.prepare('SELECT * FROM sponsorship_requests WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/sponsorship/:id/review', authMiddleware, requireRole('IDENTIFIER'), (req, res) => {
  const { status, admin_notes } = req.body;
  db.prepare(`
    UPDATE sponsorship_requests SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, admin_notes || null, req.user.name, req.params.id);

  res.json(db.prepare('SELECT * FROM sponsorship_requests WHERE id = ?').get(req.params.id));
});

// ================================================
// COMUNICACIONES
// ================================================
app.get('/api/communications', authMiddleware, (req, res) => {
  const comms = db.prepare(`
    SELECT c.*, f.title as ficha_title, f.emoji as ficha_emoji
    FROM communications c
    LEFT JOIN fichas f ON c.ficha_id = f.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(comms);
});

app.get('/api/communications/pending', authMiddleware, requireRole('COMMUNICATOR'), (req, res) => {
  // Fichas completadas sin comunicación enviada
  const pending = db.prepare(`
    SELECT f.* FROM fichas f
    WHERE f.status = 'completed'
    AND f.id NOT IN (SELECT ficha_id FROM communications WHERE status = 'sent' AND ficha_id IS NOT NULL)
    ORDER BY f.created_at DESC
  `).all();
  res.json(pending);
});

app.post('/api/communications', authMiddleware, requireRole('COMMUNICATOR'), (req, res) => {
  const { ficha_id, donation_id, subject, body, photo_proof, sent_to } = req.body;

  const result = db.prepare(`
    INSERT INTO communications (ficha_id, donation_id, subject, body, photo_proof, sent_to, sent_by)
    VALUES (?,?,?,?,?,?,?)
  `).run(ficha_id || null, donation_id || null, subject, body, photo_proof || null, sent_to || null, req.user.name);

  res.status(201).json(db.prepare('SELECT * FROM communications WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/communications/:id/send', authMiddleware, requireRole('COMMUNICATOR'), (req, res) => {
  db.prepare("UPDATE communications SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(req.params.id);
  res.json({
    message: 'Correo enviado (simulado)',
    communication: db.prepare('SELECT * FROM communications WHERE id = ?').get(req.params.id),
  });
});

// ================================================
// VOLUNTARIOS
// ================================================
app.get('/api/volunteers', authMiddleware, (req, res) => {
  const { ficha_id, status } = req.query;
  let query = `
    SELECT vr.*, f.title as ficha_title, f.emoji as ficha_emoji
    FROM volunteer_registrations vr
    LEFT JOIN fichas f ON vr.ficha_id = f.id
    WHERE 1=1
  `;
  const params = [];
  if (ficha_id) { query += ' AND vr.ficha_id = ?'; params.push(ficha_id); }
  if (status) { query += ' AND vr.status = ?'; params.push(status); }
  query += ' ORDER BY vr.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

app.post('/api/volunteers', (req, res) => {
  const { ficha_id, name, nombre, email, phone, age, motivation, reg_type, company_name, slots } = req.body;
  
  // Soporte para ambos nombres de campo desde el frontend
  const finalName = name || nombre;
  if (!finalName) {
    console.warn('⚠️ Se recibió un registro de voluntario sin nombre:', req.body);
  }

  const slotsToUse = slots || 1;

  // Ya no inscribimos en la ficha aquí, se hará al aprobar.

  const result = db.prepare(`
    INSERT INTO volunteer_registrations (ficha_id, name, email, phone, age, motivation, reg_type, company_name, slots)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(ficha_id, finalName || 'Anónimo', email, phone || null, age || null, motivation || null,
    reg_type || 'individual', company_name || null, slotsToUse);

  res.status(201).json(db.prepare('SELECT * FROM volunteer_registrations WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/volunteers/:id/review', authMiddleware, requireRole('IDENTIFIER'), (req, res) => {
  const { status } = req.body;
  const registration = db.prepare('SELECT * FROM volunteer_registrations WHERE id = ?').get(req.params.id);
  
  if (!registration) return res.status(404).json({ message: 'Registro no encontrado' });

  // Si estamos pasando a aprobado y antes no lo estaba
  if (status === 'approved' && registration.status !== 'approved') {
    db.prepare('UPDATE fichas SET current_enrolled = MIN(current_enrolled + ?, max_capacity) WHERE id = ?')
      .run(registration.slots || 1, registration.ficha_id);
  } 
  // Si estamos quitando el aprobado (rechazando a alguien ya aprobado)
  else if (status !== 'approved' && registration.status === 'approved') {
    db.prepare('UPDATE fichas SET current_enrolled = MAX(current_enrolled - ?, 0) WHERE id = ?')
      .run(registration.slots || 1, registration.ficha_id);
  }

  db.prepare('UPDATE volunteer_registrations SET status = ? WHERE id = ?').run(status, req.params.id);

  // Si fue aprobado, crear borrador de comunicación para que el equipo lo envíe
  if (status === 'approved') {
    const ficha = db.prepare('SELECT * FROM fichas WHERE id = ?').get(registration.ficha_id);
    const subject = `¡Felicidades ${registration.name}! Fuiste aceptado como voluntario`;
    const body = `Hola ${registration.name},\n\n¡Excelentes noticias! Nos complace informarte que tu solicitud para participar como voluntario en la iniciativa "${ficha?.title || 'nuestro evento'}" ha sido APROBADA.\n\n📅 Fecha: ${ficha?.event_date || 'Por confirmar'}\n📍 Lugar: ${ficha?.event_location || 'Casa Ronald McDonald'}\n\nEl equipo coordinador se pondrá en contacto contigo próximamente con los detalles de horario y actividades.\n\n¡Gracias por tu generosidad y tiempo!\n\nEquipo Casa Ronald McDonald`;
    db.prepare(`INSERT INTO communications (sent_to, subject, body, status) VALUES (?,?,?,'draft')`)
      .run(registration.email, subject, body);
  }

  const updatedFicha = db.prepare('SELECT * FROM fichas WHERE id = ?').get(registration.ficha_id);
  res.json({ registration: db.prepare('SELECT * FROM volunteer_registrations WHERE id = ?').get(req.params.id), ficha: updatedFicha });
});

// ================================================
// DONACIONES (listado)
// ================================================
app.get('/api/donations', authMiddleware, (req, res) => {
  const donations = db.prepare(`
    SELECT d.*, f.title as ficha_title, f.emoji as ficha_emoji
    FROM donations d
    LEFT JOIN fichas f ON d.ficha_id = f.id
    ORDER BY d.created_at DESC
  `).all();
  res.json(donations);
});

app.get('/api/donations/ficha/:fichaId', (req, res) => {
  const donations = db.prepare('SELECT * FROM donations WHERE ficha_id = ? ORDER BY created_at DESC')
    .all(req.params.fichaId);
  res.json(donations);
});

// ================================================
// STATS / DASHBOARD
// ================================================
app.get('/api/stats', authMiddleware, (req, res) => {
  const totalDonations = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM donations').get().total;
  const totalDonors = db.prepare('SELECT COUNT(DISTINCT donor_name) as total FROM donations').get().total;
  const activeFichas = db.prepare("SELECT COUNT(*) as total FROM fichas WHERE status = 'active'").get().total;
  const completedFichas = db.prepare("SELECT COUNT(*) as total FROM fichas WHERE status = 'completed'").get().total;
  const pendingPledges = db.prepare("SELECT COUNT(*) as total FROM in_kind_pledges WHERE status = 'pending'").get().total;
  const lowStockItems = db.prepare('SELECT COUNT(*) as total FROM inventory_items WHERE current_stock <= min_level').get().total;
  const pendingInvoices = db.prepare("SELECT COUNT(*) as total FROM invoices WHERE status IN ('pending','fiscal_data_captured')").get().total;
  const pendingComms = db.prepare(`
    SELECT COUNT(*) as total FROM fichas
    WHERE status = 'completed'
    AND id NOT IN (SELECT ficha_id FROM communications WHERE status = 'sent' AND ficha_id IS NOT NULL)
  `).get().total;
  const pendingSponsorships = db.prepare("SELECT COUNT(*) as total FROM sponsorship_requests WHERE status = 'pending'").get().total;

  res.json({
    totalDonations, totalDonors, activeFichas, completedFichas,
    pendingPledges, lowStockItems, pendingInvoices, pendingComms, pendingSponsorships,
  });
});

// ================================================
// START SERVER
// ================================================
app.listen(PORT, () => {
  console.log(`\n🏠 RonaldsCare API Server corriendo en http://localhost:${PORT}`);
  console.log('📊 Endpoints disponibles:');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/fichas');
  console.log('   GET  /api/inventory');
  console.log('   GET  /api/in-kind');
  console.log('   GET  /api/invoices');
  console.log('   GET  /api/stats');
  console.log('\n👥 Usuarios de prueba:');
  console.log('   admin@ronald.com / admin123 (Super Admin)');
  console.log('   identificador@ronald.com / id123 (Identificador)');
  console.log('   finanzas@ronald.com / fin123 (Finanzas)');
  console.log('   comunicacion@ronald.com / com123 (Comunicador)\n');
});
