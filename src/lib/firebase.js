import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Los valores viven en `.env` (ver `.env.example`). Se dejan los del proyecto
// como respaldo para que un clon recién hecho arranque sin configurar nada.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDe3IKcZS0fFm0ttM1Zo1ZlR2vhpNzGGCs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'zibavenezuela-fa1e3.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'zibavenezuela-fa1e3',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'zibavenezuela-fa1e3.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '1051007117204',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:1051007117204:web:37173534f0021f49da5181',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

/** Nombres de las colecciones de Firestore, en un solo sitio. */
export const COL = {
  products: 'products',
  categories: 'categories',
  orders: 'orders',
  users: 'users',
  newsletter: 'newsletter',
}
