import { useEffect, useState } from 'react'

import ProductGrid from '../components/product/ProductGrid.jsx'
import { getProductsByIds } from '../services/products.js'
import { useWishlist } from '../context/WishlistContext.jsx'

/** Prendas guardadas como favoritas. */
export default function Wishlist() {
  const { ids } = useWishlist()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    getProductsByIds(ids)
      .then((items) => {
        if (!active) return
        // Respeta el orden en que se fueron guardando
        const order = new Map(ids.map((id, i) => [id, i]))
        setProducts(items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)))
      })
      .catch((err) => console.error('No se pudieron cargar los favoritos:', err))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [ids])

  return (
    <div className="page">
      <h1 className="page__title">Favoritos</h1>

      <ProductGrid
        products={products}
        loading={loading}
        emptyTitle="No tienes favoritos"
        emptyText="Toca el corazón de una prenda para guardarla aquí."
      />
    </div>
  )
}
