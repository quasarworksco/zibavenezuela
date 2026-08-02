import { useCallback, useEffect, useMemo, useState } from 'react'

import { groupBySection, listCategories } from '../services/categories.js'

/**
 * Carga el árbol de categorías una vez y lo comparte.
 * El menú y la portada lo consultan en cada render, así que se cachea en
 * memoria del módulo para no repetir la lectura en Firestore.
 */
let cache = null
let inFlight = null

function load() {
  if (cache) return Promise.resolve(cache)
  inFlight ??= listCategories()
    .then((items) => {
      cache = items
      inFlight = null
      return items
    })
    .catch((err) => {
      inFlight = null
      throw err
    })
  return inFlight
}

/** Invalida la caché tras editar categorías en el panel. */
export function invalidateCategories() {
  cache = null
  inFlight = null
}

export function useCategories() {
  const [categories, setCategories] = useState(cache ?? [])
  const [loading, setLoading] = useState(!cache)
  const [error, setError] = useState(null)

  const refresh = useCallback(() => {
    let active = true
    setLoading(true)
    load()
      .then((items) => {
        if (!active) return
        setCategories(items)
        setError(null)
      })
      .catch((err) => {
        if (!active) return
        console.error('No se pudieron cargar las categorías:', err)
        setError(err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => refresh(), [refresh])

  const bySection = useMemo(() => groupBySection(categories), [categories])

  return { categories, bySection, loading, error, refresh }
}
