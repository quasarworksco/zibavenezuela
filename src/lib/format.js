/** Utilidades de formato y texto. */

const money = new Intl.NumberFormat('es-VE', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formatea un precio en dólares, la moneda de referencia de la tienda. */
export function formatPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return money.format(0)
  return money.format(n)
}

const dateFmt = new Intl.DateTimeFormat('es-VE', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const dateTimeFmt = new Intl.DateTimeFormat('es-VE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** Acepta Timestamp de Firestore, Date, número o cadena ISO. */
export function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (value instanceof Date) return value
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatDate(value) {
  const d = toDate(value)
  return d ? dateFmt.format(d) : '—'
}

export function formatDateTime(value) {
  const d = toDate(value)
  return d ? dateTimeFmt.format(d) : '—'
}

/** Convierte un texto en un slug apto para URL. */
export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Tokens de búsqueda para poder filtrar en Firestore con `array-contains`.
 * Guarda prefijos de cada palabra: "camisa" -> ca, cam, cami…
 */
export function searchTokens(...values) {
  const words = values
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1)

  const tokens = new Set()
  for (const word of words) {
    for (let i = 2; i <= Math.min(word.length, 12); i += 1) {
      tokens.add(word.slice(0, i))
    }
  }
  // Firestore limita los arrays; 200 prefijos sobran para un nombre de producto
  return [...tokens].slice(0, 200)
}

/** Recorta un texto sin partir palabras. */
export function truncate(text, max = 120) {
  const s = String(text ?? '')
  if (s.length <= max) return s
  return `${s.slice(0, s.lastIndexOf(' ', max))}…`
}

/** Número de referencia legible para un pedido. */
export function orderRef(id) {
  return `ZB-${String(id ?? '').slice(0, 8).toUpperCase()}`
}

/** Traduce los errores de Firebase Auth a mensajes en español. */
export function authErrorMessage(code) {
  const map = {
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/user-disabled': 'Esta cuenta está deshabilitada.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde.',
    'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
    'auth/popup-closed-by-user': 'Se cerró la ventana antes de terminar.',
    'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión.',
  }
  return map[code] ?? 'Ocurrió un error. Inténtalo de nuevo.'
}
