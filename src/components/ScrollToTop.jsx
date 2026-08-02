import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Devuelve el scroll al inicio en cada navegación. */
export default function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [pathname, search])

  return null
}
