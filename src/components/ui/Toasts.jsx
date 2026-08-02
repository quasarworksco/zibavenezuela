import { createPortal } from 'react-dom'

import Icon from './Icon.jsx'
import { useUI } from '../../context/UIContext.jsx'

/** Avisos flotantes de vidrio oscuro, anclados al pie de la ventana. */
export default function Toasts() {
  const { toasts, dismissToast } = useUI()

  if (!toasts.length) return null

  return createPortal(
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <Icon name="check" size={15} />
          <span>{t.message}</span>
          <button
            type="button"
            className="toast__close"
            onClick={() => dismissToast(t.id)}
            aria-label="Cerrar aviso"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
