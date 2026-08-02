import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

import { COL, db } from '../lib/firebase.js'

/**
 * Crea el perfil del usuario si aún no existe.
 * El campo `role` sólo se escribe en la creación y siempre como 'cliente':
 * elevar a 'admin' se hace a mano desde la consola de Firebase.
 */
export async function ensureUserProfile(user, extra = {}) {
  const ref = doc(db, COL.users, user.uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const profile = {
      email: user.email ?? '',
      displayName: extra.displayName ?? user.displayName ?? '',
      phone: extra.phone ?? '',
      role: 'cliente',
      wishlist: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await setDoc(ref, profile)
    return { id: user.uid, ...profile }
  }

  return { id: snap.id, ...snap.data() }
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, COL.users, uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/** Actualiza los datos que el cliente puede editar desde su cuenta. */
export async function updateUserProfile(uid, data) {
  const allowed = {
    displayName: data.displayName ?? '',
    phone: data.phone ?? '',
    address: data.address ?? null,
    updatedAt: serverTimestamp(),
  }
  await updateDoc(doc(db, COL.users, uid), allowed)
}

export async function addToWishlist(uid, productId) {
  await updateDoc(doc(db, COL.users, uid), { wishlist: arrayUnion(productId) })
}

export async function removeFromWishlist(uid, productId) {
  await updateDoc(doc(db, COL.users, uid), { wishlist: arrayRemove(productId) })
}
