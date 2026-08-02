import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'

import { useUI } from './UIContext.jsx'
import { imageSrc } from '../lib/cloudinary.js'
import { hasWholesale, linePrice, wholesaleFrom } from '../lib/pricing.js'

const CartContext = createContext(null)
const STORAGE_KEY = 'ziba.cart.v1'

/** Cada combinación producto + talla + color es una línea distinta. */
function lineKey(productId, size, color) {
  return `${productId}::${size ?? ''}::${color ?? ''}`
}

function reducer(state, action) {
  switch (action.type) {
    case 'load':
      return action.items

    case 'add': {
      const { line } = action
      const existing = state.find((l) => l.key === line.key)
      if (existing) {
        return state.map((l) =>
          l.key === line.key
            ? { ...l, quantity: Math.min(l.quantity + line.quantity, l.maxQuantity ?? 99) }
            : l,
        )
      }
      return [...state, line]
    }

    case 'setQuantity':
      return state.map((l) =>
        l.key === action.key
          ? { ...l, quantity: Math.max(1, Math.min(action.quantity, l.maxQuantity ?? 99)) }
          : l,
      )

    case 'remove':
      return state.filter((l) => l.key !== action.key)

    case 'clear':
      return []

    default:
      return state
  }
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, [])
  const { toast, openPanel } = useUI()

  // Rehidrata desde localStorage al montar
  useEffect(() => {
    dispatch({ type: 'load', items: readStorage() })
  }, [])

  // Persiste en cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Modo incógnito o almacenamiento lleno: el carrito vive sólo en memoria
    }
  }, [items])

  /**
   * Añade un producto al carrito.
   * @param {object} product producto completo
   * @param {object} opts    { size, color, quantity, silent }
   */
  const addItem = useCallback(
    (product, { size = '', color = '', quantity = 1, silent = false } = {}) => {
      const stockForSize = product.sizes?.find((s) => s.size === size)?.stock
      const line = {
        key: lineKey(product.id, size, color),
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: imageSrc(product.images?.[0]),
        price: Number(product.price ?? 0),
        // Se guardan en la línea para que el carrito calcule sin releer el producto
        wholesalePrice: hasWholesale(product) ? Number(product.wholesalePrice) : null,
        wholesaleFrom: hasWholesale(product) ? wholesaleFrom(product) : null,
        size,
        color,
        quantity: Math.max(1, quantity),
        maxQuantity: Number.isFinite(stockForSize) && stockForSize > 0 ? stockForSize : 99,
      }

      dispatch({ type: 'add', line })

      if (!silent) {
        toast('Añadido a la cesta')
        openPanel('cart')
      }
    },
    [toast, openPanel],
  )

  const setQuantity = useCallback((key, quantity) => {
    dispatch({ type: 'setQuantity', key, quantity })
  }, [])

  const removeItem = useCallback(
    (key) => {
      dispatch({ type: 'remove', key })
      toast('Producto eliminado')
    },
    [toast],
  )

  const clear = useCallback(() => dispatch({ type: 'clear' }), [])

  const { count, subtotal } = useMemo(
    () =>
      items.reduce(
        (acc, l) => ({
          count: acc.count + l.quantity,
          subtotal: acc.subtotal + linePrice(l) * l.quantity,
        }),
        { count: 0, subtotal: 0 },
      ),
    [items],
  )

  const value = useMemo(
    () => ({ items, count, subtotal, addItem, setQuantity, removeItem, clear }),
    [items, count, subtotal, addItem, setQuantity, removeItem, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
