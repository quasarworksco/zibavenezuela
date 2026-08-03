import { useEffect, useState } from 'react'

import { cldSrcSetRatio, cldUrl } from '../../lib/cloudinary.js'

/** Cada cuánto cambia la foto de la portada. */
const ROTACION_MS = 6000

/**
 * Fondo de la portada: va rotando entre las fotos de los productos.
 *
 * La foto ocupa la pantalla completa, así que se sirve recortada a la forma
 * de la pantalla —vertical en el móvil, apaisada en el escritorio— y con
 * varios anchos. Pedir una sola versión apaisada obligaba al navegador a
 * ampliar una franja estrecha para cubrir un móvil vertical, y por eso se
 * veía borrosa.
 */
export default function HeroSlides({ images }) {
  // Se guarda también la foto anterior: durante el cambio se queda debajo, a
  // plena opacidad, y la nueva se funde encima. Si en vez de eso se apagara la
  // saliente a la vez que enciende la entrante, a mitad de camino ninguna de
  // las dos sería opaca y la portada parecería irse a negro un instante.
  const [slide, setSlide] = useState({ index: 0, prev: 0 })
  // Sólo se descarga la foto que ya tuvo su turno
  const [shown, setShown] = useState(() => new Set([0]))

  // El catálogo se carga una vez; basta con reaccionar al tamaño del grupo
  useEffect(() => {
    setSlide({ index: 0, prev: 0 })
    setShown(new Set([0]))
  }, [images.length])

  useEffect(() => {
    if (images.length < 2) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    const id = setInterval(
      () => setSlide(({ index }) => ({ index: (index + 1) % images.length, prev: index })),
      ROTACION_MS,
    )
    return () => clearInterval(id)
  }, [images.length])

  useEffect(() => {
    setShown((antes) => (antes.has(slide.index) ? antes : new Set(antes).add(slide.index)))
  }, [slide.index])

  return (
    <div className="hero__media">
      {images.map((src, i) => {
        if (!shown.has(i)) return null
        // La entrante arriba, la saliente justo debajo, el resto al fondo
        const capa = i === slide.index ? 3 : i === slide.prev ? 2 : 1

        return (
          <picture
            key={src}
            className={`hero__layer ${i === slide.index ? 'is-on' : ''}`}
            style={{ zIndex: capa }}
          >
            {/* Móvil vertical */}
            <source
              media="(max-width: 767px)"
              srcSet={cldSrcSetRatio(src, [540, 720, 900, 1080], 0.46)}
              sizes="100vw"
            />
            {/* Tableta en vertical */}
            <source
              media="(orientation: portrait)"
              srcSet={cldSrcSetRatio(src, [768, 1024, 1280], 0.75)}
              sizes="100vw"
            />
            <img
              src={cldUrl(src, { w: 1920, h: 1200, dpr: null })}
              srcSet={cldSrcSetRatio(src, [1024, 1440, 1920, 2400], 1.6)}
              sizes="100vw"
              alt=""
              decoding="async"
              fetchPriority={i === 0 ? 'high' : undefined}
            />
          </picture>
        )
      })}
    </div>
  )
}
