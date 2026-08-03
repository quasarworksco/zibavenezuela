/** Utilidades para procesar muchos elementos sin saturar la red. */

/**
 * Recorre una lista ejecutando `fn` sobre cada elemento, con un máximo de
 * tareas simultáneas. Subir ochenta fotos de golpe satura la conexión y
 * Cloudinary empieza a rechazar; de cuatro en cuatro va rápido y estable.
 *
 * No se detiene ante un fallo: cada resultado indica si salió bien, de modo
 * que al final se puede decir exactamente qué falló.
 *
 * @param {Array} items
 * @param {number} limit tareas simultáneas
 * @param {(item:any, index:number) => Promise<any>} fn
 * @returns {Promise<Array<{ok:boolean, value?:any, error?:Error, item:any}>>}
 */
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0

  const worker = async () => {
    while (next < items.length) {
      const index = next++
      try {
        results[index] = { ok: true, value: await fn(items[index], index), item: items[index] }
      } catch (error) {
        results[index] = { ok: false, error, item: items[index] }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/**
 * Convierte el nombre de un archivo en un nombre de producto presentable.
 *   "vestido-midi_negro 02.jpg"  ->  "Vestido midi negro 02"
 */
export function nameFromFilename(filename) {
  const base = String(filename ?? '')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!base) return ''
  return base.charAt(0).toUpperCase() + base.slice(1)
}
