import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="nf">
      <p className="nf__code">404</p>
      <h1 className="page__subtitle" style={{ margin: 0 }}>
        Esta página no existe
      </h1>
      <p className="u-muted">Puede que el enlace haya cambiado o que la prenda ya no esté.</p>
      <div
        style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}
      >
        <Link to="/" className="btn">
          Ir al inicio
        </Link>
        <Link to="/novedades" className="btn btn--ghost">
          Ver novedades
        </Link>
      </div>
    </div>
  )
}
