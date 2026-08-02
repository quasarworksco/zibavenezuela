import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const UIContext = createContext(null)

/**
 * Estado de interfaz compartido: qué panel está abierto y los avisos flotantes.
 * Sólo puede haber un panel abierto a la vez ('nav' | 'cart' | 'filters' | null).
 */
export function UIProvider({ children }) {
  const [panel, setPanel] = useState(null)
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const openPanel = useCallback((name) => setPanel(name), [])
  const closePanel = useCallback(() => setPanel(null), [])
  const togglePanel = useCallback((name) => {
    setPanel((current) => (current === name ? null : name))
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (message, { duration = 3200 } = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((list) => [...list.slice(-2), { id, message }])
      timers.current.set(
        id,
        setTimeout(() => dismissToast(id), duration),
      )
      return id
    },
    [dismissToast],
  )

  // Bloquea el scroll del documento mientras hay un panel abierto
  useEffect(() => {
    document.body.classList.toggle('is-locked', panel !== null)
    return () => document.body.classList.remove('is-locked')
  }, [panel])

  // Cerrar con la tecla Escape
  useEffect(() => {
    if (!panel) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel, closePanel])

  // Limpia los temporizadores pendientes al desmontar
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  const value = useMemo(
    () => ({ panel, openPanel, closePanel, togglePanel, toasts, toast, dismissToast }),
    [panel, openPanel, closePanel, togglePanel, toasts, toast, dismissToast],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI debe usarse dentro de <UIProvider>')
  return ctx
}
