import { useCallback, useEffect, useState } from 'react'

import { DEFAULT_RATES, getRates } from '../services/settings.js'

/**
 * Tasas de cambio de la tienda.
 * Se leen una vez y se comparten: las consultan la portada, cada tarjeta de
 * producto, la ficha y la cesta, así que no tiene sentido pedirlas de nuevo.
 */
let cache = null
let inFlight = null

function load() {
  if (cache) return Promise.resolve(cache)
  inFlight ??= getRates()
    .then((rates) => {
      cache = rates
      inFlight = null
      return rates
    })
    .catch((err) => {
      inFlight = null
      throw err
    })
  return inFlight
}

/** Invalida la caché tras guardar las tasas en el panel. */
export function invalidateRates() {
  cache = null
  inFlight = null
}

export function useRates() {
  const [rates, setRates] = useState(cache ?? DEFAULT_RATES)
  const [loading, setLoading] = useState(!cache)

  const refresh = useCallback(() => {
    let active = true
    load()
      .then((value) => active && setRates(value))
      .catch((err) => console.error('No se pudieron cargar las tasas:', err))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => refresh(), [refresh])

  return { rates, loading, refresh }
}
