// ========================================
// Mock Data - Conexión Tangible
// Dos tipos de fichas + Sponsors + Emails
// ========================================

export const CATEGORIES = [
  { id: 'all', label: '🏠 Todas', emoji: '🏠' },
  { id: 'transporte', label: '🚐 Transporte', emoji: '🚐' },
  { id: 'alimentacion', label: '🍕 Alimentación', emoji: '🍕' },
  { id: 'higiene', label: '🧴 Higiene', emoji: '🧴' },
  { id: 'bienestar', label: '💛 Bienestar', emoji: '💛' },
  { id: 'educacion', label: '📚 Educación', emoji: '📚' },
];

export const DONATION_AMOUNTS = [
  { value: 20, label: '1 pasaje' },
  { value: 50, label: '1 kit' },
  { value: 100, label: '5 comidas' },
  { value: 200, label: '1 tanque' },
  { value: 500, label: '1 semana' },
  { value: 1000, label: 'Padrino ⭐' },
];

// =============================================
// FICHAS TIPO 1: COLABORATIVAS (con barra de progreso)
// Donas lo que quieras para llenar la barra
// =============================================
let collaborativeNeeds = [
  {
    id: 1,
    type: 'collaborative',
    title: 'Gasolina para traslados seguros al hospital',
    description: 'La camioneta de la Casa Ronald necesita tanque lleno para trasladar a 8 familias a sus citas médicas esta semana. Sin gasolina, los niños no llegan a sus terapias.',
    category: 'transporte',
    emoji: '⛽',
    image: '/images/transporte.jpg',
    goalAmount: 1200,
    currentAmount: 780,
    donorsCount: 18,
    isUrgent: true,
    deadline: '12 horas',
    sponsor: {
      name: 'McDonald\'s',
      logo: '/images/sponsors/mcdonalds.png',
      type: 'matching', // Por cada peso, la empresa dona otro
      emoji: '🍟',
    },
  },
  {
    id: 2,
    type: 'collaborative',
    title: 'Cena especial de viernes para 20 familias',
    description: 'Cada viernes, las familias de la Casa se reúnen para una cena especial. Es el único momento de normalidad en semanas de hospital. Ayúdanos a hacer este viernes inolvidable.',
    category: 'alimentacion',
    emoji: '🍕',
    image: '/images/alimentacion.jpg',
    goalAmount: 1500,
    currentAmount: 1350, // ¡Faltan solo 150 para completar!
    donorsCount: 19,
    isUrgent: false,
    deadline: '3 días',
    sponsor: null,
  },
  {
    id: 3,
    type: 'collaborative',
    title: 'Tarde de cine para los niños de la Casa',
    description: 'Palomitas, cobijas y una película. Para un niño en tratamiento, una tarde así es una ventana de alegría pura y olvido temporal del hospital.',
    category: 'bienestar',
    emoji: '🎬',
    image: '/images/bienestar.jpg',
    goalAmount: 600,
    currentAmount: 150,
    donorsCount: 5,
    isUrgent: false,
    deadline: '7 días',
    sponsor: null,
  },
  {
    id: 4,
    type: 'collaborative',
    title: 'Desayunos nutritivos de emergencia',
    description: 'Llegaron 5 familias nuevas esta semana y la despensa se acabó antes de lo previsto. Necesitamos cubrir desayunos para los próximos 4 días.',
    category: 'alimentacion',
    emoji: '🥣',
    image: '/images/desayuno.jpg',
    goalAmount: 2000,
    currentAmount: 320,
    donorsCount: 7,
    isUrgent: true,
    deadline: '24 horas',
    sponsor: null,
  },
  {
    id: 5,
    type: 'collaborative',
    title: 'Material escolar para no perder el año',
    description: 'Los niños en tratamiento llevan meses fuera de la escuela. Con cuadernos, colores y material didáctico, los voluntarios les ayudan a no quedarse atrás.',
    category: 'educacion',
    emoji: '📚',
    image: '/images/educacion.jpg',
    goalAmount: 950,
    currentAmount: 950,
    donorsCount: 22,
    isUrgent: false,
    deadline: 'Completada',
    sponsor: {
      name: 'Bimbo',
      logo: '/images/sponsors/bimbo.png',
      type: 'full', // La empresa llenó toda la ficha
      emoji: '🐻',
    },
  },
];

// =============================================
// FICHAS TIPO 2: REGALO (monto fijo, sin barra)
// Donas una cantidad exacta por unidad. Puedes donar 1 o más.
// =============================================
let giftNeeds = [
  {
    id: 101,
    type: 'gift',
    title: 'Kit de higiene personal para un niño',
    description: 'Shampoo, jabón, cepillo de dientes, pasta dental y crema. Un kit completo para que cada niño de la Casa tenga lo básico para sentirse digno.',
    category: 'higiene',
    emoji: '🧴',
    image: '/images/kit-higiene.jpg',
    unitPrice: 150,
    totalUnits: 10,
    unitsDonated: 3,
    donorsCount: 3,
    isUrgent: false,
    unitLabel: 'kits',
    sponsor: null,
  },
  {
    id: 102,
    type: 'gift',
    title: 'Cobija calientita para una mamá cuidadora',
    description: 'Las noches en el hospital son largas y frías. Una cobija suave le dice a una mamá: "alguien pensó en ti". Dona una cobija para una mamá que lo necesita.',
    category: 'bienestar',
    emoji: '🛏️',
    image: '/images/cobija.jpg',
    unitPrice: 250,
    totalUnits: 8,
    unitsDonated: 2,
    donorsCount: 2,
    isUrgent: false,
    unitLabel: 'cobijas',
    sponsor: {
      name: 'Liverpool',
      logo: '/images/sponsors/liverpool.png',
      type: 'matching',
      emoji: '🏬',
    },
  },
  {
    id: 103,
    type: 'gift',
    title: 'Lonchera nutritiva para un día de hospital',
    description: 'Un sándwich, fruta, jugo y una galleta. Todo lo que un niño necesita para no pasar hambre en un día largo de estudios médicos.',
    category: 'alimentacion',
    emoji: '🥪',
    image: '/images/lonchera.jpg',
    unitPrice: 80,
    totalUnits: 15,
    unitsDonated: 6,
    donorsCount: 6,
    isUrgent: true,
    unitLabel: 'loncheras',
    sponsor: null,
  },
  {
    id: 104,
    type: 'gift',
    title: 'Juguete educativo para la sala de juegos',
    description: 'Rompecabezas, bloques de construcción o un libro interactivo. Para que la sala de juegos de la Casa siempre tenga algo nuevo que descubrir.',
    category: 'educacion',
    emoji: '🧩',
    image: '/images/juguete.jpg',
    unitPrice: 200,
    totalUnits: 6,
    unitsDonated: 6,
    donorsCount: 8,
    isUrgent: false,
    unitLabel: 'juguetes',
    sponsor: {
      name: 'Mattel',
      logo: '/images/sponsors/mattel.png',
      type: 'full',
      emoji: '🎮',
    },
  },
];

// =============================================
// STATE MANAGEMENT (simula la DB)
// =============================================
export function getCollaborativeNeeds() {
  return [...collaborativeNeeds];
}

export function getGiftNeeds() {
  return [...giftNeeds];
}

export function getAllNeeds() {
  return [...collaborativeNeeds, ...giftNeeds];
}

export function getNeedById(id) {
  return [...collaborativeNeeds, ...giftNeeds].find(n => n.id === id);
}

export function donateToCollaborative(id, amount) {
  let hitGoal = false;
  
  collaborativeNeeds = collaborativeNeeds.map(need => {
    if (need.id === id) {
      const effectiveAmount = need.sponsor?.type === 'matching'
        ? amount * 2
        : amount;
      const newAmount = Math.min(need.currentAmount + effectiveAmount, need.goalAmount);
      
      if (newAmount >= need.goalAmount && need.currentAmount < need.goalAmount) {
        hitGoal = true;
      }
      
      return {
        ...need,
        currentAmount: newAmount,
        donorsCount: need.donorsCount + 1,
      };
    }
    return need;
  });
  
  // Lógica específica para la demostración del MVP (Ficha 2)
  if (id === 2 && hitGoal) {
    SIMULATED_EMAILS = [{
      id: Date.now(),
      subject: '🍕 ¡Meta cumplida! Las familias ya están cenando gracias a ti',
      preview: 'El director de la Casa nos acaba de mandar esta foto del comedor. Misión cumplida...',
      from: 'Conexión Tangible',
      time: 'Ahora',
      unread: true,
      emoji: '🍕',
      fullBody: `¡Hola!

No tenemos palabras para agradecerte. Acabas de aportar los últimos $150 MXN necesarios para completar la meta "Cena especial de viernes para 20 familias".

🍕 Gracias a ti y otros 19 donantes, recaudamos los $1,500 MXN exactos.
❤️ Impacto: Un momento de alivio, comunidad y normalidad para papás, mamás y niños que hoy están luchando juntos.

El Director de la Casa Ronald McDonald acaba de tomar esta foto directamente desde el comedor para ustedes:`,
      images: ['/images/comedor_cena.png'],
      postImagesText: `En Conexión Tangible tu dinero tiene destino directo. Aquí tienes el ticket de compra de las pizzas de hoy, transparente y claro:`,
      receiptImage: '/images/ticket_pizzeria.png'
    }, ...SIMULATED_EMAILS];
  }
  
  return getNeedById(id);
}

export function donateToGift(id, quantity) {
  giftNeeds = giftNeeds.map(need => {
    if (need.id === id) {
      const newDonated = Math.min(need.unitsDonated + quantity, need.totalUnits);
      return {
        ...need,
        unitsDonated: newDonated,
        donorsCount: need.donorsCount + 1,
      };
    }
    return need;
  });
  return getNeedById(id);
}

// =============================================
// IMPACT NOTIFICATIONS
// =============================================
export const IMPACT_NOTIFICATIONS = [
  {
    id: 1,
    type: 'completed',
    emoji: '📚',
    title: '¡Meta completada! Material escolar listo',
    message: 'Gracias a tus $50 pesos y a otros 21 donantes, hoy 12 niños de la Casa Ronald recibieron su kit escolar completo. Los voluntarios ya están dando clases de refuerzo.',
    time: 'Hace 2 horas',
    highlight: '12 niños no perderán el año escolar',
  },
  {
    id: 2,
    type: 'progress',
    emoji: '⛽',
    title: 'Tu aportación fue registrada — x2 por McDonald\'s',
    message: 'Aportaste $100 a "Gasolina para traslados seguros" y McDonald\'s igualó tu donación. ¡$200 reales de impacto! La meta va al 65%.',
    time: 'Hace 5 horas',
    highlight: 'McDonald\'s duplicó tu donación 🍟',
  },
  {
    id: 3,
    type: 'gift',
    emoji: '🧴',
    title: 'Kit de higiene entregado',
    message: 'El kit de higiene que donaste ($150) ya fue entregado a Sofía, de 8 años. Su mamá nos dijo: "No tenía cómo comprarle ni un cepillo de dientes. Gracias."',
    time: 'Hace 1 día',
    highlight: 'Storytelling ético verificado ✓',
  },
  {
    id: 4,
    type: 'sponsor',
    emoji: '🏬',
    title: 'Liverpool se unió como padrino',
    message: 'Liverpool apadrinó la ficha "Cobija para mamás cuidadoras" con matching 1:1. Por cada cobija que tú dones, Liverpool dona otra.',
    time: 'Hace 2 días',
    highlight: 'Apadrinamiento empresarial activo',
  },
];

// =============================================
// SIMULATED EMAILS
// =============================================
export let SIMULATED_EMAILS = [
  {
    id: 1,
    subject: '🎉 ¡Meta cumplida! Gracias a ti, 8 niños llegaron al hospital',
    preview: 'Tu donación de $100 para gasolina ayudó a completar la meta. McDonald\'s igualó cada peso...',
    from: 'Conexión Tangible',
    time: '10:32 AM',
    unread: true,
    emoji: '⛽',
    fullBody: `¡Hola!

Queremos compartirte una gran noticia: la meta "Gasolina para traslados seguros al hospital" se completó gracias a 19 donantes como tú.

💰 Tu aportación: $100 MXN
🍟 McDonald's igualó: +$100 MXN
📊 Total recaudado: $1,200 MXN

🚐 Resultado: La camioneta de la Casa Ronald tiene tanque lleno. Hoy, 8 niños llegaron seguros a sus terapias de quimioterapia en el Hospital Infantil.

Gracias por ser parte de esta comunidad.

Con cariño,
Equipo Conexión Tangible 🏠`,
  },
  {
    id: 2,
    subject: '🧴 Kit entregado: Sofía ya tiene su kit de higiene',
    preview: 'El kit que donaste fue entregado esta mañana. La mamá de Sofía nos dijo...',
    from: 'Conexión Tangible',
    time: '8:15 AM',
    unread: true,
    emoji: '🧴',
    fullBody: `¡Hola!

El kit de higiene personal que donaste ($150 MXN) fue entregado esta mañana a Sofía, de 8 años.

🧴 Contenido: Shampoo, jabón, cepillo dental, pasta y crema
👧 Beneficiaria: Sofía, 8 años (Casa Ronald McDonald CDMX)

La mamá de Sofía nos compartió:
"Llevaba 2 semanas sin poder comprarle un cepillo de dientes. Todo era para el tratamiento. Cuando le dieron el kit, me abrazó y me dijo que olía bonito."

Tu donación no fue un número. Fue dignidad.

Con gratitud,
Equipo Conexión Tangible 🏠`,
  },
  {
    id: 3,
    subject: '📊 Tu resumen semanal de impacto',
    preview: 'Esta semana donaste 2 veces y ayudaste a 3 familias directamente...',
    from: 'Conexión Tangible',
    time: 'Ayer',
    unread: false,
    emoji: '📊',
    fullBody: `¡Hola!

Aquí va tu resumen semanal:

📊 Donaciones esta semana: 2
💰 Total aportado: $250 MXN
👨‍👩‍👧‍👦 Familias impactadas: 3
🎯 Metas completadas con tu apoyo: 1

¡Sigue así! Cada peso cuenta.

Equipo Conexión Tangible 🏠`,
  },
  {
    id: 4,
    subject: '🏬 ¡Liverpool apadrina cobijas! Tu donación vale x2',
    preview: 'Liverpool se unió como padrino de la ficha "Cobija para mamás cuidadoras"...',
    from: 'Conexión Tangible',
    time: 'Lun',
    unread: false,
    emoji: '🏬',
    fullBody: `¡Hola!

Tenemos una noticia increíble: Liverpool se unió como padrino empresarial de la ficha "Cobija calientita para mamás cuidadoras".

🏬 Esto significa que por cada cobija que tú dones ($250), Liverpool dona otra cobija.
🛏️ Ya van 2 cobijas donadas → 4 con el matching de Liverpool

¿Quieres aprovechar el matching? Tu donación vale el doble ahora.

Equipo Conexión Tangible 🏠`,
  },
];
