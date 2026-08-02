/**
 * Tasa oficial del BCV, consultada a DolarAPI.
 *
 * El BCV no publica una API pensada para el navegador, así que se usa este
 * servicio de terceros. Como puede caerse, cambiar de formato o tardar, todo
 * lo de aquí falla en silencio: si algo sale mal se devuelve null y la tienda
 * sigue con la tasa de respaldo que se guardó a mano en el panel.
 */

const ENDPOINT = 'https://ve.dolarapi.com/v1/dolares/oficial'
const TIMEOUT_MS = 6000

/**
 * @returns {Promise<{rate:number, updatedAt:string|null}|null>}
 *   null si la consulta falla o la respuesta no trae una tasa usable.
 */
export async function fetchBcvRate() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(ENDPOINT, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
    if (!res.ok) return null

    const data = await res.json()

    // El campo cambia según el endpoint: se acepta el primero que sirva
    const rate = Number(data?.promedio ?? data?.venta ?? data?.compra ?? 0)
    if (!Number.isFinite(rate) || rate <= 0) return null

    return { rate, updatedAt: data?.fechaActualizacion ?? null }
  } catch {
    // Sin red, CORS, timeout o JSON inesperado: se usa el respaldo
    return null
  } finally {
    clearTimeout(timer)
  }
}
