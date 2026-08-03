import { Link, Outlet } from 'react-router-dom'

import Header from './Header.jsx'
import Footer from './Footer.jsx'
import NavDrawer from './NavDrawer.jsx'
import CartDrawer from './CartDrawer.jsx'
import Toasts from '../ui/Toasts.jsx'
import { ANNOUNCE, TIERS } from '../../lib/constants.js'

/**
 * Esqueleto de la tienda: barra de anuncios, cabecera, contenido y pie.
 * La portada decide si la cabecera se dibuja transparente (ver UIContext).
 */
export default function Layout() {
  return (
    <div className="app">
      {/* La barra superior es el sitio que siempre se ve: lleva al mayor */}
      <Link className="announce" to={TIERS.mayor.to}>
        {ANNOUNCE}
      </Link>

      <Header />

      <main className="app__main">
        <Outlet />
      </main>

      <Footer />

      <NavDrawer />
      <CartDrawer />
      <Toasts />
    </div>
  )
}
