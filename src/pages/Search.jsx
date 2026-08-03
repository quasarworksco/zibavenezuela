import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import ProductGrid from '../components/product/ProductGrid.jsx'
import { searchProducts } from '../services/products.js'

/** Resultados de búsqueda por prefijo sobre el nombre y las etiquetas. */
export default function Search() {
  const [params] = useSearchParams()
  const term = params.get('q') ?? ''

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(Boolean(term))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!term) {
      setProducts([])
      setLoading(false)
      return undefined
    }

    let active = true
    setLoading(true)
    setError('')

    searchProducts(term)
      .then((items) => active && setProducts(items))
      .catch((err) => {
        // Antes se tragaba el fallo y la página decía «sin resultados», que es
        // justo lo que no hay que enseñar cuando la consulta no llegó a correr.
        console.error('La búsqueda falló:', err)
        if (!active) return
        setProducts([])
        setError('No pudimos completar la búsqueda. Revisa tu conexión e inténtalo de nuevo.')
      })
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [term])

  return (
    <>
      <div className="listing__head">
        <h1 className="listing__title">
          {term ? `Resultados para «${term}»` : 'Buscar'}
        </h1>
        <p className="listing__count">
          {loading
            ? 'Buscando…'
            : error
              ? 'No se pudo buscar'
              : term
                ? `${products.length} artículo${products.length === 1 ? '' : 's'}`
                : 'Escribe qué prenda buscas en el buscador de la cabecera.'}
        </p>
      </div>

      {error ? (
        <div className="empty">
          <p className="empty__title">Algo salió mal</p>
          <p>{error}</p>
        </div>
      ) : term ? (
        <ProductGrid
          products={products}
          loading={loading}
          emptyTitle="Sin resultados"
          emptyText="Prueba con otra palabra, o con parte del nombre: baggy, jean, vestido…"
        />
      ) : null}
    </>
  )
}
