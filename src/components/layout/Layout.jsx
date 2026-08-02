import { Outlet, useLocation } from 'react-router-dom'

import Header from './Header.jsx'
import Footer from './Footer.jsx'
import NavDrawer from './NavDrawer.jsx'
import CartDrawer from './CartDrawer.jsx'
import Toasts from '../ui/Toasts.jsx'

/**
 * Esqueleto de la tienda: barra de anuncios, cabecera fija, contenido y pie.
 * En la portada la cabecera va sobre la fotografía; en el resto de páginas se
 * reserva su altura.
 */
export default function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className="app">
      <p className="announce">Envío gratis en compras superiores a $80 · Envíos a toda Venezuela</p>

      <Header transparent={isHome} />

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
