import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import Icon from './Icon.jsx'

/**
 * Panel lateral de vidrio. Se renderiza en un portal para que quede por encima
 * de cualquier contenido y atrapa el foco mientras está abierto.
 */
export default function Drawer({ open, onClose, side = 'right', title, children, footer }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const panel = panelRef.current
    const previous = document.activeElement

    // Lleva el foco al panel al abrir
    panel?.focus()

    const onKeyDown = (e) => {
      if (e.key !== 'Tab' || !panel) return
      const focusables = panel.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    panel?.addEventListener('keydown', onKeyDown)
    return () => {
      panel?.removeEventListener('keydown', onKeyDown)
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <aside
        ref={panelRef}
        className={`drawer drawer--${side}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="drawer__head">
          <span className="drawer__title">{title}</span>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="drawer__body">{children}</div>

        {footer ? <footer className="drawer__foot">{footer}</footer> : null}
      </aside>
    </>,
    document.body,
  )
}
