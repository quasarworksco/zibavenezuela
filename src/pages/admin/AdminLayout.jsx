import { Link, NavLink, Outlet } from 'react-router-dom'

import Logo from '../../components/ui/Logo.jsx'
import Icon from '../../components/ui/Icon.jsx'
import Toasts from '../../components/ui/Toasts.jsx'
import { isCloudinaryReady } from '../../lib/cloudinary.js'
import { useAuth } from '../../context/AuthContext.jsx'

const LINKS = [
  { to: '/admin', label: 'Resumen', icon: 'chart', end: true },
  { to: '/admin/productos', label: 'Productos', icon: 'tag' },
  { to: '/admin/categorias', label: 'Categorías', icon: 'grid' },
  { to: '/admin/pedidos', label: 'Pedidos', icon: 'box' },
  { to: '/admin/tasas', label: 'Tasas', icon: 'chart' },
]

/** Marco del panel: cabecera propia, navegación lateral y contenido. */
export default function AdminLayout() {
  const { logout } = useAuth()

  return (
    <div className="app">
      <header className="header header--glass">
        <div className="header__left">
          <Link to="/" className="header__action">
            ← Ver tienda
          </Link>
        </div>

        <Link to="/admin" className="header__brand" aria-label="Panel ZIBA">
          <Logo className="header__logo" />
        </Link>

        <div className="header__right">
          <span className="header__action header__action--hide-sm u-muted">adminziba</span>
          <button type="button" className="header__action" onClick={logout} aria-label="Salir">
            <Icon name="logout" size={16} />
          </button>
        </div>
      </header>

      <div className="admin">
        <aside className="admin__side">
          <p className="admin__brand">Administración</p>
          <nav className="admin__nav">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'is-active' : '')}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="admin__main">
          {!isCloudinaryReady ? (
            <p className="alert alert--error" style={{ marginBottom: '1.5rem' }}>
              Cloudinary no está configurado: define <code>VITE_CLOUDINARY_CLOUD_NAME</code> en el
              archivo <code>.env</code> para poder subir fotografías.
            </p>
          ) : null}

          <Outlet />
        </main>
      </div>

      <Toasts />
    </div>
  )
}
