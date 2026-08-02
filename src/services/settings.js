import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'

import { db } from '../lib/firebase.js'

/**
 * Ajustes de la tienda, en un único documento: `settings/rates`.
 *
 *   store → tasa que fija la tienda, la que convierte a bolívares
 *   bcv   → tasa oficial, sólo para expresar la equivalencia en dólares
 */
const ref = () => doc(db, 'settings', 'rates')

export const DEFAULT_RATES = { store: 0, bcv: 0, updatedAt: null }

export async function getRates() {
  const snap = await getDoc(ref())
  if (!snap.exists()) return { ...DEFAULT_RATES }

  const data = snap.data() ?? {}
  return {
    store: Number(data.store ?? 0) || 0,
    bcv: Number(data.bcv ?? 0) || 0,
    updatedAt: data.updatedAt ?? null,
  }
}

export async function saveRates({ store, bcv }) {
  await setDoc(
    ref(),
    {
      store: Number(store ?? 0) || 0,
      bcv: Number(bcv ?? 0) || 0,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
