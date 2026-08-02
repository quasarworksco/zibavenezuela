import { useCallback, useEffect, useState } from 'react'

import { DEFAULT_RATES, getRates } from '../services/settings.js'
import { fetchBcvRate } from '../services/bcv.js'

/**
 * Tasas de cambio de la tienda.
 *
 * La tasa ZIBA se guarda en Firestore. La del BCV se intenta traer de
 * DolarAPI en cada carga y, si no responde, se usa la de respaldo guardada
 * en el panel. Se pide una sola vez y se comparte: la consultan la portada,
 * cada tarjeta, la ficha y la cesta.
 */
let cache = null
let inFlight = null

function load() {
  if (cache) return Promise.resolve(cache)

  inFlight ??= Promise.all([getRates(), fetchBcvRate()])
    .then(([stored, live]) => {
      cache = {
        ...stored,
        bcv: live?.rate ?? stored.bcv,
        bcvBackup: stored.bcv,
        bcvSource: live ? 'dolarapi' : 'manual',
        bcvUpdatedAt: live?.updatedAt ?? stored.updatedAt,
      }
      inFlight = null
      return cache
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
