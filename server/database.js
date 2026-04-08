// ================================================
// RonaldsCare — SQLite Database Setup
// ================================================
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'ronaldscare.db'));

// Performance optimizations
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ================================================
// SCHEMA
// ================================================
db.exec(`
  -- Usuarios Admin (con roles)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN','IDENTIFIER','FINANCE','COMMUNICATOR')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Fichas (todos los tipos)
  CREATE TABLE IF NOT EXISTS fichas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('collaborative','gift','donation','in_kind','sponsorship')),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    emoji TEXT DEFAULT '📦',

    -- Donation / Collaborative
    goal_amount REAL DEFAULT 0,
    current_amount REAL DEFAULT 0,
    donors_count INTEGER DEFAULT 0,

    -- Gift
    unit_price REAL DEFAULT 0,
    total_units INTEGER DEFAULT 0,
    units_donated INTEGER DEFAULT 0,
    unit_label TEXT DEFAULT 'unidades',

    -- Voluntariado
    event_date TEXT,
    event_location TEXT,
    max_capacity INTEGER DEFAULT 0,
    current_enrolled INTEGER DEFAULT 0,

    -- Apadrinamiento
    sponsorship_type TEXT,
    duration TEXT,
    beneficiary_info TEXT,
    requirements TEXT,

    -- Común
    is_urgent INTEGER DEFAULT 0,
    deadline TEXT,
    auto_generated INTEGER DEFAULT 0,
    auto_generated_item_id INTEGER,

    -- Sponsor (JSON)
    sponsor_json TEXT,

    status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','cancelled')),
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Pledges de donación en especie
  CREATE TABLE IF NOT EXISTS in_kind_pledges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pledge_code TEXT UNIQUE NOT NULL,
    donor_name TEXT NOT NULL,
    donor_email TEXT,
    donor_phone TEXT,
    category TEXT NOT NULL,
    item_description TEXT NOT NULL,
    estimated_quantity TEXT,
    estimated_value REAL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','delivered','validated','invoiced','cancelled')),
    validated_by TEXT,
    validated_at DATETIME,
    inventory_item_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Inventario
  CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    current_stock REAL DEFAULT 0,
    unit TEXT DEFAULT 'unidades',
    min_level REAL DEFAULT 5,
    estimated_unit_price REAL DEFAULT 0,
    location TEXT DEFAULT 'Casa Ronald Principal',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Movimientos de inventario
  CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('in','out')),
    quantity REAL NOT NULL,
    reason TEXT,
    related_pledge_code TEXT,
    performed_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id)
  );

  -- Donaciones monetarias
  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ficha_id INTEGER,
    amount REAL NOT NULL,
    donor_name TEXT DEFAULT 'Anónimo',
    donor_email TEXT,
    donation_type TEXT DEFAULT 'monetary',
    wants_invoice INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ficha_id) REFERENCES fichas(id)
  );

  -- Datos fiscales
  CREATE TABLE IF NOT EXISTS fiscal_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donation_id INTEGER,
    pledge_id INTEGER,
    rfc TEXT NOT NULL,
    razon_social TEXT NOT NULL,
    regimen_fiscal TEXT,
    uso_cfdi TEXT DEFAULT 'D04',
    codigo_postal TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id)
  );

  -- Facturas CFDI
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donation_id INTEGER,
    pledge_id INTEGER,
    fiscal_data_id INTEGER,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','no_fiscal_data','fiscal_data_captured','cfdi_generated','cfdi_sent')),
    cfdi_uuid TEXT,
    cfdi_xml_path TEXT,
    cfdi_pdf_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id),
    FOREIGN KEY (fiscal_data_id) REFERENCES fiscal_data(id)
  );

  -- Solicitudes de apadrinamiento
  CREATE TABLE IF NOT EXISTS sponsorship_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ficha_id INTEGER,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_phone TEXT,
    sponsorship_type TEXT NOT NULL,
    offer_description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','active','completed')),
    admin_notes TEXT,
    reviewed_by TEXT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ficha_id) REFERENCES fichas(id)
  );

  -- Comunicaciones (correos de agradecimiento)
  CREATE TABLE IF NOT EXISTS communications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ficha_id INTEGER,
    donation_id INTEGER,
    type TEXT DEFAULT 'thank_you',
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    photo_proof TEXT,
    sent_to TEXT,
    sent_by TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','sent')),
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ficha_id) REFERENCES fichas(id)
  );

  -- Registro de voluntarios
  CREATE TABLE IF NOT EXISTS volunteer_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ficha_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    age INTEGER,
    motivation TEXT,
    reg_type TEXT DEFAULT 'individual' CHECK(reg_type IN ('individual','empresarial')),
    company_name TEXT,
    slots INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ficha_id) REFERENCES fichas(id)
  );
`);

// ================================================
// SEED: Usuarios Admin por defecto
// ================================================
const seedUsers = db.prepare(`INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?,?,?,?)`);
seedUsers.run('admin@ronald.com', 'admin123', 'Super Administrador', 'ADMIN');
seedUsers.run('identificador@ronald.com', 'id123', 'María García', 'IDENTIFIER');
seedUsers.run('finanzas@ronald.com', 'fin123', 'Carlos López', 'FINANCE');
seedUsers.run('comunicacion@ronald.com', 'com123', 'Ana Martínez', 'COMMUNICATOR');

module.exports = db;
