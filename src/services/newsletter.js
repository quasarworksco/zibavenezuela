import { doc, serverTimestamp, setDoc } from 'firebase/firestore'

import { COL, db } from '../lib/firebase.js'

/**
 * Guarda un correo en la lista. Usa el correo como id del documento para que
 * volver a suscribirse no genere duplicados.
 */
export async function subscribe(email) {
  const clean = String(email ?? '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    throw new Error('Escribe un correo válido.')
  }

  await setDoc(
    doc(db, COL.newsletter, clean),
    { email: clean, createdAt: serverTimestamp() },
    { merge: true },
  )

  return clean
}
