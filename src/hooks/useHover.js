import { useEffect, useState } from 'react'

const QUERY = '(hover: hover) and (pointer: fine)'

/**
 * ¿El dispositivo apunta con un ratón?
 *
 * Se usa para no descargar la segunda fotografía de cada tarjeta en un móvil,
 * donde no hay forma de verla: en una rejilla de 40 prendas eso es la mitad de
 * las imágenes.
 */
export function useHoverCapable() {
  const [canHover, setCanHover] = useState(
    () => window.matchMedia?.(QUERY).matches ?? true,
  )

  useEffect(() => {
    const mq = window.matchMedia?.(QUERY)
    if (!mq) return undefined

    const onChange = () => setCanHover(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return canHover
}
