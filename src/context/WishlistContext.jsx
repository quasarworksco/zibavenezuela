import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useAuth } from './AuthContext.jsx'
import { useUI } from './UIContext.jsx'
import { addToWishlist, removeFromWishlist } from '../services/users.js'

const WishlistContext = createContext(null)
const STORAGE_KEY = 'ziba.wishlist.v1'

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Favoritos. Sin sesión viven en localStorage; al iniciar sesión se fusionan
 * con los que ya tenga el perfil en Firestore.
 */
export function WishlistProvider({ children }) {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useUI()
  const [ids, setIds] = useState([])

  useEffect(() => {
    setIds(readStorage())
  }, [])

  // Al entrar con sesión: une lo local con lo guardado en el perfil
  useEffect(() => {
    if (!user || !profile) return
    const remote = Array.isArray(profile.wishlist) ? profile.wishlist : []
    const local = readStorage()
    const merged = [...new Set([...remote, ...local])]
    setIds(merged)

    const missing = local.filter((id) => !remote.includes(id))
    if (missing.length) {
      Promise.all(missing.map((id) => addToWishlist(user.uid, id)))
        .then(refreshProfile)
        .catch((err) => console.error('No se pudieron sincronizar los favoritos:', err))
    }
  }, [user, profile, refreshProfile])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // Sin almacenamiento la lista sigue viva en memoria
    }
  }, [ids])

  const has = useCallback((productId) => ids.includes(productId), [ids])

  const toggle = useCallback(
    async (productId) => {
      const isOn = ids.includes(productId)
      setIds((list) => (isOn ? list.filter((id) => id !== productId) : [...list, productId]))
      toast(isOn ? 'Quitado de favoritos' : 'Guardado en favoritos')

      if (user) {
        try {
          await (isOn ? removeFromWishlist(user.uid, productId) : addToWishlist(user.uid, productId))
        } catch (err) {
          console.error('No se pudo guardar el favorito:', err)
        }
      }
    },
    [ids, user, toast],
  )

  const value = useMemo(() => ({ ids, has, toggle, count: ids.length }), [ids, has, toggle])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist debe usarse dentro de <WishlistProvider>')
  return ctx
}
