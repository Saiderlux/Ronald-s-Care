const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'ronaldscare.db'));

// Insert incomplete collaborative fichas
const stmtFicha = db.prepare(`
  INSERT INTO fichas (type, title, description, category, emoji, event_date, event_location, max_capacity, current_enrolled, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const ficha1 = stmtFicha.run(
  'collaborative',
  'Lectura de Cuentos Infantiles',
  'Acompáñanos a leer cuentos para los niños de la Casa Ronald McDonald antes de dormir.',
  'entretenimiento',
  '📚',
  '2026-05-10',
  'Casa CDMX',
  10,
  0,
  'active'
);

const ficha2 = stmtFicha.run(
  'collaborative',
  'Apoyo en Logística de Comedor',
  'Necesitamos voluntarios para ayudar a servir la comida y ordenar el comedor principal.',
  'alimentacion',
  '🍽️',
  '2026-05-12',
  'Casa Puebla',
  5,
  0,
  'active'
);

// Insert volunteers
const stmtVol = db.prepare(`
  INSERT INTO volunteer_registrations (ficha_id, name, email, phone, age, motivation, reg_type, slots, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

stmtVol.run(
  ficha1.lastInsertRowid,
  'Ana García',
  'ana.g@example.com',
  '5512345678',
  24,
  'Disponibilidad: manana | Voluntario antes: No | Le gustan los niños: Sí | Habilidad: empatia\nMotivación: Soy estudiante de pedagogía y me encantaría ayudar a los niños con historias.',
  'individual',
  1,
  'pending'
);

stmtVol.run(
  ficha1.lastInsertRowid,
  'Humberto Solís',
  'hum.sol@example.com',
  '5598765432',
  40,
  'Disponibilidad: fin_semana | Voluntario antes: Sí | Le gustan los niños: No | Habilidad: logistica\nMotivación: Sólo quiero horas comunitarias para mi empresa y no me gustan las manualidades.',
  'individual',
  1,
  'pending'
);

stmtVol.run(
  ficha2.lastInsertRowid,
  'Laura Martínez',
  'laura.m@example.com',
  '5544332211',
  35,
  'Disponibilidad: tarde | Voluntario antes: Sí | Le gustan los niños: Sí | Habilidad: fuerza\nMotivación: Trabajo en un restaurante y puedo ayudar super rápido a montar el comedor.',
  'individual',
  1,
  'pending'
);

console.log('Seed exitoso');
