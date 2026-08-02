import { useEffect } from 'react'
import { createPortal } from 'react-dom'

import Icon from './Icon.jsx'

/** Ventana modal sobre superficie de vidrio. */
export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.body.classList.add('is-locked')
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('is-locked')
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div className="modal__panel">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{ position: 'absolute', top: 16, right: 16 }}
        >
          <Icon name="close" size={18} />
        </button>
        {title ? <h2 className="modal__title">{title}</h2> : null}
        {children}
      </div>
    </div>,
    document.body,
  )
}
