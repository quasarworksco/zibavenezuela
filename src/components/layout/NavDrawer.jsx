import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import Drawer from '../ui/Drawer.jsx'
import Icon from '../ui/Icon.jsx'
import { SECTIONS } from '../../lib/constants.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useUI } from '../../context/UIContext.jsx'
import { useCategories } from '../../hooks/useCategories.js'

/** Menú lateral: secciones arriba, categorías de la sección activa debajo. */
export default function NavDrawer() {
  const { panel, closePanel } = useUI()
  const { isAdmin, logout } = useAuth()
  const location = useLocation()
  const { bySection, loading } = useCategories()

  // Arranca en la sección de la página actual
  const initial = SECTIONS.find((s) => location.pathname.startsWith(`/${s.slug}`))?.slug
  const [section, setSection] = useState(initial ?? SECTIONS[0].slug)

  const categories = bySection[section] ?? []

  return (
    <Drawer open={panel === 'nav'} onClose={closePanel} side="left" title="Menú">
      <nav>
        <div className="nav__sections">
          {SECTIONS.map((s) => (
            <button
              key={s.slug}
              type="button"
              className={`nav__section ${section === s.slug ? 'is-active' : ''}`}
              onClick={() => setSection(s.slug)}
            >
              {s.name}
            </button>
          ))}
        </div>

        <ul className="nav__list">
          <li>
            <NavLink
              to={`/${section}`}
              className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
              onClick={closePanel}
              end
            >
              Ver todo
            </NavLink>
          </li>

          {loading ? (
            <li className="nav__link u-muted">Cargando…</li>
          ) : (
            categories.map((cat) => (
              <li key={cat.id}>
                <NavLink
                  to={`/${section}/${cat.slug}`}
                  className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
                  onClick={closePanel}
                >
                  {cat.name}
                </NavLink>
              </li>
            ))
          )}

          {!loading && !categories.length ? (
            <li className="nav__link u-muted">Muy pronto</li>
          ) : null}
        </ul>

        <p className="nav__group-title">Tu selección</p>
        <ul className="nav__list">
          <li>
            <Link to="/favoritos" className="nav__link" onClick={closePanel}>
              Favoritos
            </Link>
          </li>
          <li>
            <Link to="/cesta" className="nav__link" onClick={closePanel}>
              Cesta
            </Link>
          </li>
          {isAdmin ? (
            <>
              <li>
                <Link to="/admin" className="nav__link" onClick={closePanel}>
                  Administración
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="nav__link"
                  onClick={() => {
                    logout()
                    closePanel()
                  }}
                >
                  Cerrar sesión
                </button>
              </li>
            </>
          ) : null}
        </ul>

        <p className="nav__group-title">Ayuda</p>
        <ul className="nav__list">
          <li>
            <Link to="/info/envios" className="nav__link" onClick={closePanel}>
              Envíos y entregas
            </Link>
          </li>
          <li>
            <Link to="/info/cambios" className="nav__link" onClick={closePanel}>
              Cambios y devoluciones
            </Link>
          </li>
          <li>
            <Link to="/info/tallas" className="nav__link" onClick={closePanel}>
              Guía de tallas
            </Link>
          </li>
          <li>
            <Link to="/info/contacto" className="nav__link" onClick={closePanel}>
              Contacto
            </Link>
          </li>
        </ul>

        <div className="nav__meta" style={{ marginTop: '2rem' }}>
          <span>
            <Icon name="truck" size={14} /> Envíos a toda Venezuela
          </span>
          <span>
            <Icon name="lock" size={14} /> Compra protegida
          </span>
        </div>
      </nav>
    </Drawer>
  )
}
