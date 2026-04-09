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
  const normalizedEmail = (donor_email || '').trim().toLowerCase();

  if (ficha.type === 'gift') {
    if (!normalizedEmail) {
      return res.status(400).json({ message: 'El correo electrónico es obligatorio para registrar tu impacto.' });
    }

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
    ).run(ficha.id, donationAmount, donor_name || 'Anónimo', normalizedEmail, wants_invoice ? 1 : 0);

    // Create invoice record
    createInvoiceForDonation(donResult.lastInsertRowid, donationAmount, wants_invoice);

  } else if (ficha.type === 'donation' || ficha.type === 'collaborative') {
    if (ficha.type === 'donation' && !normalizedEmail) {
      return res.status(400).json({ message: 'El correo electrónico es obligatorio para registrar tu impacto.' });
    }

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
    ).run(ficha.id, amount, donor_name || 'Anónimo', normalizedEmail || null, wants_invoice ? 1 : 0);

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

function createCommunicationDraft({
  type,
  subject,
  body,
  sent_to,
  recipient_email,
  ficha_id = null,
  donation_id = null,
  reference_key = null,
}) {
  const normalizedRecipient = (recipient_email || sent_to || '').trim().toLowerCase();
  if (!normalizedRecipient) return;

  if (reference_key) {
    const existing = db.prepare('SELECT id FROM communications WHERE reference_key = ?').get(reference_key);
    if (existing) return;
  } else {
    const existing = db.prepare(`
      SELECT id
      FROM communications
      WHERE type = ?
        AND LOWER(COALESCE(recipient_email, sent_to, '')) = ?
        AND COALESCE(ficha_id, 0) = COALESCE(?, 0)
      LIMIT 1
    `).get(type, normalizedRecipient, ficha_id);
    if (existing) return;
  }

  db.prepare(`
    INSERT INTO communications (ficha_id, donation_id, type, recipient_email, reference_key, subject, body, sent_to, status)
    VALUES (?,?,?,?,?,?,?,?, 'draft')
  `).run(
    ficha_id,
    donation_id,
    type,
    normalizedRecipient,
    reference_key,
    subject,
    body,
    sent_to || normalizedRecipient
  );
}

function createCompletionDraftsForFicha(fichaId) {
  const ficha = db.prepare('SELECT * FROM fichas WHERE id = ?').get(fichaId);
  if (!ficha) return;

  const donors = db.prepare(`
    SELECT LOWER(donor_email) as donor_email, MAX(donor_name) as donor_name
    FROM donations
    WHERE ficha_id = ?
      AND donor_email IS NOT NULL
      AND TRIM(donor_email) <> ''
    GROUP BY LOWER(donor_email)
  `).all(fichaId);

  donors.forEach((donor) => {
    const donorName = donor.donor_name || 'donante';
    const isGift = ficha.type === 'gift';
    const subject = isGift
      ? `🎁 ¡Se completó el regalo "${ficha.title}" gracias a tu apoyo!`
      : `🎉 ¡Meta cumplida! "${ficha.title}" llegó al objetivo`;
    const body = isGift
      ? `Hola ${donorName},\n\n¡Gracias por tu regalo directo para "${ficha.title}"!\nLa ficha ya se completó y tu apoyo fue clave para lograrlo.\n\nSeguimos juntos construyendo bienestar para las familias de Casa Ronald.\n\nCon gratitud,\nEquipo Ronald's Care`
      : `Hola ${donorName},\n\n¡Gracias por apoyar "${ficha.title}"!\nLa meta de esta ficha se completó y tu aportación fue parte del resultado.\n\nTu apoyo se traduce en ayuda real para las familias de Casa Ronald.\n\nCon gratitud,\nEquipo Ronald's Care`;

    createCommunicationDraft({
      type: 'ficha_completed',
      subject,
      body,
      sent_to: donor.donor_email,
      recipient_email: donor.donor_email,
      ficha_id: ficha.id,
      reference_key: `ficha_completed:${ficha.id}:${donor.donor_email}`,
    });
  });
}

function createVolunteerApprovalDraftsForFicha(fichaId) {
  const ficha = db.prepare('SELECT * FROM fichas WHERE id = ?').get(fichaId);
  if (!ficha) return;

  const approved = db.prepare(`
    SELECT *
    FROM volunteer_registrations
    WHERE ficha_id = ?
      AND status = 'approved'
      AND email IS NOT NULL
      AND TRIM(email) <> ''
  `).all(fichaId);

  approved.forEach((registration) => {
    const recipient = registration.email.trim().toLowerCase();
    const subject = `🙌 ${registration.name}, tu participación en voluntariado fue aceptada`;
    const body = `Hola ${registration.name},\n\n¡Excelentes noticias! Tu participación para la actividad "${ficha.title}" fue aceptada.\n\n📅 Fecha: ${ficha.event_date || 'Por confirmar'}\n📍 Lugar: ${ficha.event_location || 'Casa Ronald'}\n\nGracias por donar tu tiempo y energía.\n\nCon gratitud,\nEquipo Ronald's Care`;

    createCommunicationDraft({
      type: 'volunteer_approved',
      subject,
      body,
      sent_to: recipient,
      recipient_email: recipient,
      ficha_id: ficha.id,
      reference_key: `volunteer_approved:${registration.id}`,
    });
  });
}

function createInKindValidatedDraft(pledge) {
  const recipient = (pledge.donor_email || '').trim().toLowerCase();
  if (!recipient) return;

  const subject = `📦 Donación en especie validada: ${pledge.item_description}`;
  const identifier = pledge.delivery_method === 'courier'
    ? `Tracking: ${pledge.tracking_id || 'N/A'}`
    : `Código: ${pledge.pledge_code}`;
  const body = `Hola ${pledge.donor_name || 'donante'},\n\nConfirmamos que tu donación en especie fue recibida y validada correctamente.\n\nDetalle: ${pledge.item_description}\n${identifier}\n\nGracias por apoyar de forma tangible a las familias de Casa Ronald.\n\nCon gratitud,\nEquipo Ronald's Care`;

  createCommunicationDraft({
    type: 'in_kind_validated',
    subject,
    body,
    sent_to: recipient,
    recipient_email: recipient,
    reference_key: `in_kind_validated:${pledge.id}`,
  });
}

function ensureSystemCommunicationDrafts() {
  const completedFichas = db.prepare("SELECT id FROM fichas WHERE status = 'completed' AND type IN ('donation','gift')").all();
  completedFichas.forEach(({ id }) => createCompletionDraftsForFicha(id));

  const volunteerFichas = db.prepare("SELECT DISTINCT ficha_id FROM volunteer_registrations WHERE status = 'approved'").all();
  volunteerFichas.forEach(({ ficha_id }) => {
    if (ficha_id) createVolunteerApprovalDraftsForFicha(ficha_id);
  });

  const validatedInKind = db.prepare("SELECT * FROM in_kind_pledges WHERE status IN ('validated','invoiced')").all();
  validatedInKind.forEach((pledge) => createInKindValidatedDraft(pledge));
}

// ================================================
// DONACIONES EN ESPECIE (IN-KIND)
// ================================================
function cleanupExpiredInKindPledges() {
  db.prepare(`
    DELETE FROM in_kind_pledges
    WHERE status IN ('pending', 'delivered')
      AND (
        (tentative_delivery_date IS NOT NULL AND datetime(tentative_delivery_date, '+30 days') < datetime('now'))
        OR
        (tentative_delivery_date IS NULL AND datetime(created_at, '+30 days') < datetime('now'))
      )
  `).run();
}

app.get('/api/in-kind', (req, res) => {
  cleanupExpiredInKindPledges();
  const { status } = req.query;
  let query = 'SELECT * FROM in_kind_pledges WHERE 1=1';
  const params = [];
  if (status) { query += ' AND status = ?'; params.push(status); }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

app.post('/api/in-kind', (req, res) => {
  cleanupExpiredInKindPledges();
  const {
    donor_name,
    donor_email,
    donor_phone,
    delivery_method,
    tentative_delivery_date,
    courier_provider,
    tracking_id,
    category,
    item_description,
    estimated_quantity,
    estimated_value,
  } = req.body;

  const method = delivery_method === 'courier' ? 'courier' : 'in_person';
  const normalizedDonorEmail = (donor_email || '').trim().toLowerCase();
  const normalizedTracking = tracking_id ? tracking_id.trim().toUpperCase() : null;

  if (!normalizedDonorEmail) {
    return res.status(400).json({ message: 'El correo electrónico es obligatorio para registrar el impacto de la donación en especie.' });
  }

  if (method === 'in_person' && !tentative_delivery_date) {
    return res.status(400).json({ message: 'La fecha tentativa de entrega es obligatoria para entrega física.' });
  }

  if (method === 'courier' && !normalizedTracking) {
    return res.status(400).json({ message: 'El ID de seguimiento es obligatorio para envíos por paquetería.' });
  }

  if (normalizedTracking) {
    const exists = db.prepare('SELECT id FROM in_kind_pledges WHERE tracking_id = ?').get(normalizedTracking);
    if (exists) {
      return res.status(400).json({ message: 'Este ID de seguimiento ya fue registrado.' });
    }
  }

  const pledgeCode = `ESP-${new Date().getFullYear()}-${uuidv4().substring(0, 6).toUpperCase()}`;

  const result = db.prepare(`
    INSERT INTO in_kind_pledges (
      pledge_code, donor_name, donor_email, donor_phone,
      delivery_method, tentative_delivery_date, courier_provider, tracking_id,
      category, item_description, estimated_quantity, estimated_value
    )
    VALUES (?,?,?,?, ?,?,?,?, ?,?,?,?)
  `).run(
    pledgeCode,
    donor_name,
    normalizedDonorEmail,
    donor_phone || null,
    method,
    tentative_delivery_date || null,
    courier_provider || null,
    normalizedTracking,
    category,
    item_description,
    estimated_quantity || null,
    estimated_value || 0
  );

  const pledge = db.prepare('SELECT * FROM in_kind_pledges WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(pledge);
});

app.put('/api/in-kind/:id/validate', authMiddleware, requireRole('FINANCE'), (req, res) => {
  cleanupExpiredInKindPledges();
  const pledge = db.prepare('SELECT * FROM in_kind_pledges WHERE id = ?').get(req.params.id);
  if (!pledge) return res.status(404).json({ message: 'Pledge no encontrado' });

  const { inventory_item_id, actual_quantity, notes, verification_code } = req.body;
  const expectedCode = pledge.delivery_method === 'courier'
    ? (pledge.tracking_id || '').trim().toUpperCase()
    : (pledge.pledge_code || '').trim().toUpperCase();

  const providedCode = verification_code ? verification_code.trim().toUpperCase() : '';
  if (expectedCode && providedCode && providedCode !== expectedCode) {
    return res.status(400).json({ message: 'La clave de verificación no coincide con el registro.' });
  }

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
  createInKindValidatedDraft(updated);
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
  ensureSystemCommunicationDrafts();
  const comms = db.prepare(`
    SELECT c.*, f.title as ficha_title, f.emoji as ficha_emoji
    FROM communications c
    LEFT JOIN fichas f ON c.ficha_id = f.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(comms);
});

app.get('/api/communications/pending', authMiddleware, requireRole('COMMUNICATOR'), (req, res) => {
  ensureSystemCommunicationDrafts();
  // Fichas completadas sin comunicación enviada
  const pending = db.prepare(`
    SELECT f.* FROM fichas f
    WHERE f.status = 'completed'
    AND f.id NOT IN (SELECT ficha_id FROM communications WHERE status = 'sent' AND ficha_id IS NOT NULL)
    ORDER BY f.created_at DESC
  `).all();
  res.json(pending);
});

app.get('/api/communications/simulated', (req, res) => {
  ensureSystemCommunicationDrafts();
  const email = (req.query.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'Debes proporcionar un correo para ver la bandeja simulada.' });
  }

  const comms = db.prepare(`
    SELECT c.*, f.title as ficha_title, f.emoji as ficha_emoji
    FROM communications c
    LEFT JOIN fichas f ON c.ficha_id = f.id
    WHERE LOWER(COALESCE(c.recipient_email, '')) = ?
       OR LOWER(COALESCE(c.sent_to, '')) = ?
       OR LOWER(COALESCE(c.sent_to, '')) LIKE ?
    ORDER BY datetime(COALESCE(c.sent_at, c.created_at)) DESC
  `).all(email, email, `%${email}%`);

  const emails = comms.map((c) => {
    const typeEmoji = {
      ficha_completed: '🎉',
      volunteer_approved: '🙌',
      in_kind_validated: '📦',
      thank_you: '💛',
    };

    return {
      id: c.id,
      from: 'Ronald\'s Care',
      subject: c.subject,
      preview: (c.body || '').replace(/\n/g, ' ').slice(0, 120),
      fullBody: c.body,
      time: c.sent_at || c.created_at,
      unread: c.status === 'draft',
      emoji: typeEmoji[c.type] || '📧',
      status: c.status,
      type: c.type,
    };
  });

  res.json(emails);
});

app.post('/api/communications', authMiddleware, requireRole('COMMUNICATOR'), (req, res) => {
  const { ficha_id, donation_id, subject, body, photo_proof, sent_to } = req.body;
  const normalizedRecipient = sent_to ? sent_to.split(',')[0].trim().toLowerCase() : null;

  const result = db.prepare(`
    INSERT INTO communications (ficha_id, donation_id, type, recipient_email, subject, body, photo_proof, sent_to, sent_by)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(
    ficha_id || null,
    donation_id || null,
    'thank_you',
    normalizedRecipient,
    subject,
    body,
    photo_proof || null,
    sent_to || null,
    req.user.name
  );

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

  // Si fue aprobado, generar borradores de todos los aprobados de esa ficha (batch)
  if (status === 'approved') {
    createVolunteerApprovalDraftsForFicha(registration.ficha_id);
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

app.get('/api/impact', (req, res) => {
  const email = (req.query.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'Debes proporcionar un correo electrónico.' });
  }

  const monetarySummary = db.prepare(`
    SELECT
      COUNT(*) as total_donations,
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(DISTINCT ficha_id) as unique_fichas,
      MAX(created_at) as last_donation_at
    FROM donations
    WHERE LOWER(donor_email) = ?
  `).get(email);

  const participations = db.prepare(`
    SELECT
      d.ficha_id,
      f.title as ficha_title,
      f.emoji as ficha_emoji,
      f.type as ficha_type,
      COUNT(d.id) as donations_count,
      COALESCE(SUM(d.amount), 0) as total_amount,
      MAX(d.created_at) as last_donation_at
    FROM donations d
    LEFT JOIN fichas f ON f.id = d.ficha_id
    WHERE LOWER(d.donor_email) = ?
    GROUP BY d.ficha_id, f.title, f.emoji, f.type
    ORDER BY last_donation_at DESC
  `).all(email);

  const volunteerParticipations = db.prepare(`
    SELECT
      vr.ficha_id,
      f.title as ficha_title,
      f.emoji as ficha_emoji,
      f.type as ficha_type,
      COUNT(vr.id) as participations_count,
      COALESCE(SUM(vr.slots), 0) as total_slots,
      MAX(vr.created_at) as last_participation_at
    FROM volunteer_registrations vr
    LEFT JOIN fichas f ON f.id = vr.ficha_id
    WHERE LOWER(vr.email) = ?
      AND vr.status = 'approved'
    GROUP BY vr.ficha_id, f.title, f.emoji, f.type
    ORDER BY last_participation_at DESC
  `).all(email);

  const inKindParticipations = db.prepare(`
    SELECT
      id,
      pledge_code,
      tracking_id,
      delivery_method,
      courier_provider,
      category,
      item_description,
      estimated_quantity,
      estimated_value,
      validated_at,
      status,
      created_at
    FROM in_kind_pledges
    WHERE LOWER(donor_email) = ?
      AND status IN ('validated', 'invoiced')
    ORDER BY COALESCE(validated_at, created_at) DESC
  `).all(email);

  const hasAnyActivity =
    (monetarySummary?.total_donations || 0) > 0 ||
    volunteerParticipations.length > 0 ||
    inKindParticipations.length > 0;

  if (!hasAnyActivity) {
    return res.json({
      email,
      total_donations: 0,
      volunteer_actions: 0,
      in_kind_actions: 0,
      total_actions: 0,
      support_score: 0,
      support_level: {
        key: 'sin-registros',
        title: 'Aún sin registro',
        message: 'No encontramos aportes con este correo todavía.',
      },
      participations: [],
      volunteer_participations: [],
      in_kind_participations: [],
    });
  }

  const completedSupported = db.prepare(`
    SELECT COUNT(DISTINCT d.ficha_id) as total
    FROM donations d
    INNER JOIN fichas f ON f.id = d.ficha_id
    WHERE LOWER(d.donor_email) = ?
      AND f.status = 'completed'
  `).get(email).total;

  const volunteerCompletedSupported = db.prepare(`
    SELECT COUNT(DISTINCT vr.ficha_id) as total
    FROM volunteer_registrations vr
    INNER JOIN fichas f ON f.id = vr.ficha_id
    WHERE LOWER(vr.email) = ?
      AND vr.status = 'approved'
      AND f.status = 'completed'
  `).get(email).total;

  const uniqueSupportedFichas = db.prepare(`
    SELECT COUNT(DISTINCT ficha_id) as total
    FROM (
      SELECT d.ficha_id as ficha_id
      FROM donations d
      WHERE LOWER(d.donor_email) = ?
      UNION ALL
      SELECT vr.ficha_id as ficha_id
      FROM volunteer_registrations vr
      WHERE LOWER(vr.email) = ?
        AND vr.status = 'approved'
    )
    WHERE ficha_id IS NOT NULL
  `).get(email, email).total;

  const volunteerActions = volunteerParticipations.reduce((acc, p) => acc + (p.participations_count || 0), 0);
  const inKindActions = inKindParticipations.length;
  const totalActions = (monetarySummary.total_donations || 0) + volunteerActions + inKindActions;

  const supportScore = Math.round(
    (monetarySummary.total_amount / 80) +
    ((monetarySummary.total_donations || 0) * 3) +
    (volunteerActions * 8) +
    (inKindActions * 7) +
    (uniqueSupportedFichas * 2) +
    ((completedSupported + volunteerCompletedSupported) * 4)
  );

  function getSupportLevel(score) {
    if (score >= 120) {
      return {
        key: 'transformador',
        title: 'Corazón Transformador',
        message: 'Tu apoyo constante está cambiando historias completas. Gracias por sostener esperanza real.',
      };
    }
    if (score >= 70) {
      return {
        key: 'impulsor',
        title: 'Impulsor de Esperanza',
        message: 'Tu ayuda mantiene en movimiento la red de apoyo para muchas familias.',
      };
    }
    if (score >= 30) {
      return {
        key: 'aliado',
        title: 'Aliado Solidario',
        message: 'Cada aporte tuyo suma acompañamiento real para quienes más lo necesitan.',
      };
    }
    return {
      key: 'semilla',
      title: 'Semilla de Apoyo',
      message: 'Tu generosidad ya está abriendo camino. Toda ayuda cuenta y la tuya ya empezó a hacer diferencia.',
    };
  }

  res.json({
    email,
    total_donations: monetarySummary.total_donations,
    total_amount: monetarySummary.total_amount,
    volunteer_actions: volunteerActions,
    in_kind_actions: inKindActions,
    total_actions: totalActions,
    unique_fichas: uniqueSupportedFichas,
    completed_supported: completedSupported + volunteerCompletedSupported,
    last_donation_at: monetarySummary.last_donation_at,
    support_score: supportScore,
    support_level: getSupportLevel(supportScore),
    participations,
    volunteer_participations: volunteerParticipations,
    in_kind_participations: inKindParticipations,
  });
});

// ================================================
// STATS / DASHBOARD
// ================================================
app.get('/api/stats', authMiddleware, (req, res) => {
  cleanupExpiredInKindPledges();
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
