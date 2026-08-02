import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useUI } from './UIContext.jsx'

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

/** Favoritos guardados en el navegador de cada visitante. */
export function WishlistProvider({ children }) {
  const { toast } = useUI()
  const [ids, setIds] = useState([])

  useEffect(() => {
    setIds(readStorage())
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // Sin almacenamiento la lista sigue viva en memoria
    }
  }, [ids])

  const has = useCallback((productId) => ids.includes(productId), [ids])

  const toggle = useCallback(
    (productId) => {
      const isOn = ids.includes(productId)
      setIds((list) => (isOn ? list.filter((id) => id !== productId) : [...list, productId]))
      toast(isOn ? 'Quitado de favoritos' : 'Guardado en favoritos')
    },
    [ids, toast],
  )

  const value = useMemo(() => ({ ids, has, toggle, count: ids.length }), [ids, has, toggle])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist debe usarse dentro de <WishlistProvider>')
  return ctx
}
