import { Outlet } from 'react-router-dom'

import Header from './Header.jsx'
import Footer from './Footer.jsx'
import NavDrawer from './NavDrawer.jsx'
import CartDrawer from './CartDrawer.jsx'
import Toasts from '../ui/Toasts.jsx'

/**
 * Esqueleto de la tienda: barra de anuncios, cabecera, contenido y pie.
 * La portada decide si la cabecera se dibuja transparente (ver UIContext).
 */
export default function Layout() {
  return (
    <div className="app">
      <p className="announce">Envío gratis en compras superiores a $80 · Envíos a toda Venezuela</p>

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
