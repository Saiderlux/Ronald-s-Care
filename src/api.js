// ================================================
// API Helper — Comunicación con el backend
// ================================================
const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('ronaldscare_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de conexión' }));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

// CRUD helpers
export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
  del: (path) => request(path, { method: 'DELETE' }),
};

// ============================
// AUTH
// ============================
export async function loginApi(email, password) {
  const result = await api.post('/auth/login', { email, password });
  if (result.token) {
    localStorage.setItem('ronaldscare_token', result.token);
  }
  return result;
}

export function logoutApi() {
  localStorage.removeItem('ronaldscare_token');
}

export function getStoredToken() {
  return localStorage.getItem('ronaldscare_token');
}

export function parseToken() {
  const token = getStoredToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

// ============================
// FICHAS
// ============================
export const fichasApi = {
  getAll: () => api.get('/fichas'),
  getById: (id) => api.get(`/fichas/${id}`),
  create: (data) => api.post('/fichas', data),
  update: (id, data) => api.put(`/fichas/${id}`, data),
  delete: (id) => api.del(`/fichas/${id}`),
  donate: (id, data) => api.post(`/fichas/${id}/donate`, data),
};

// ============================
// DONACIONES EN ESPECIE
// ============================
export const inKindApi = {
  getAll: () => api.get('/in-kind'),
  create: (data) => api.post('/in-kind', data),
  validate: (id, data) => api.put(`/in-kind/${id}/validate`, data),
  cancel: (id) => api.put(`/in-kind/${id}/cancel`, {}),
};

// ============================
// INVENTARIO
// ============================
export const inventoryApi = {
  getAll: () => api.get('/inventory'),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.del(`/inventory/${id}`),
  addMovement: (data) => api.post('/inventory/movement', data),
  getMovements: (itemId) => api.get(`/inventory/${itemId}/movements`),
  getAlerts: () => api.get('/inventory/alerts'),
  getAutoFichas: () => api.get('/inventory/auto-fichas'),
};

// ============================
// FACTURACIÓN
// ============================
export const invoiceApi = {
  getAll: () => api.get('/invoices'),
  captureFiscalData: (donationId, data) => api.post(`/invoices/${donationId}/fiscal-data`, data),
  generateCFDI: (id) => api.post(`/invoices/${id}/generate`, {}),
  sendCFDI: (id) => api.post(`/invoices/${id}/send`, {}),
};

// ============================
// APADRINAMIENTO
// ============================
export const sponsorshipApi = {
  getAll: () => api.get('/sponsorship'),
  getPublic: () => api.get('/sponsorship/opportunities'),
  create: (data) => api.post('/sponsorship', data),
  review: (id, data) => api.put(`/sponsorship/${id}/review`, data),
};

// ============================
// COMUNICACIONES
// ============================
export const communicationsApi = {
  getAll: () => api.get('/communications'),
  create: (data) => api.post('/communications', data),
  send: (id) => api.put(`/communications/${id}/send`, {}),
  getPending: () => api.get('/communications/pending'),
};

// ============================
// VOLUNTARIOS
// ============================
export const volunteersApi = {
  getAll: () => api.get('/volunteers'),
  register: (data) => api.post('/volunteers', data),
  review: (id, data) => api.put(`/volunteers/${id}/review`, data),
};

// ============================
// DONATIONS
// ============================
export const donationsApi = {
  getAll: () => api.get('/donations'),
  getByFicha: (fichaId) => api.get(`/donations/ficha/${fichaId}`),
};
