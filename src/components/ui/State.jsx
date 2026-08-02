import { Link } from 'react-router-dom'

/** Indicador de carga centrado. */
export function Loader({ label = 'Cargando' }) {
  return (
    <div role="status" aria-label={label}>
      <div className="spinner spinner--center" />
      <span className="u-sr">{label}</span>
    </div>
  )
}

/** Rejilla de esqueletos mientras llegan los productos. */
export function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--line" style={{ width: '70%' }} />
          <div className="skeleton skeleton--line" style={{ width: '35%' }} />
        </div>
      ))}
    </div>
  )
}

/** Estado vacío reutilizable, con acción opcional. */
export function Empty({ title, text, actionTo, actionLabel }) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {text ? <p>{text}</p> : null}
      {actionTo ? (
        <Link to={actionTo} className="btn" style={{ marginTop: '1.5rem' }}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}

/** Mensaje de error con opción de reintentar. */
export function ErrorState({ message = 'No pudimos cargar el contenido.', onRetry }) {
  return (
    <div className="empty">
      <p className="empty__title">Algo salió mal</p>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="btn" style={{ marginTop: '1.5rem' }} onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  )
}
