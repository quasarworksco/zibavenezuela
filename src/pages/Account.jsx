import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../context/AuthContext.jsx'

/** Contenedor de la zona privada del cliente. */
export default function Account() {
  const { user, profile, logout } = useAuth()
  const name = profile?.displayName || user?.displayName || user?.email

  return (
    <div className="page">
      <h1 className="page__title">Mi cuenta</h1>
      <p className="u-muted" style={{ marginTop: '-1.5rem', marginBottom: '2rem' }}>
        Hola, {name}
      </p>

      <div className="account">
        <nav className="account__nav">
          <NavLink to="/cuenta" end className={({ isActive }) => (isActive ? 'is-active' : '')}>
            Mis datos
          </NavLink>
          <NavLink
            to="/cuenta/pedidos"
            className={({ isActive }) => (isActive ? 'is-active' : '')}
          >
            Mis pedidos
          </NavLink>
          <NavLink to="/favoritos" className={({ isActive }) => (isActive ? 'is-active' : '')}>
            Favoritos
          </NavLink>
          <button type="button" className="account__logout" onClick={logout}>
            Cerrar sesión
          </button>
        </nav>

        <div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
