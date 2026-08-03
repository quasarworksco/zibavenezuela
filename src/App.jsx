import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import Layout from './components/layout/Layout.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import { RequireAdmin } from './components/RouteGuards.jsx'
import { Loader } from './components/ui/State.jsx'

import Home from './pages/Home.jsx'
import Category from './pages/Category.jsx'
import Product from './pages/Product.jsx'
import Search from './pages/Search.jsx'
import Cart from './pages/Cart.jsx'
import NotFound from './pages/NotFound.jsx'

// El resto se carga bajo demanda: la portada y el catálogo son lo que más pesa
const Checkout = lazy(() => import('./pages/Checkout.jsx'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'))
const Info = lazy(() => import('./pages/Info.jsx'))

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'))
const AdminProducts = lazy(() => import('./pages/admin/Products.jsx'))
const AdminProductForm = lazy(() => import('./pages/admin/ProductForm.jsx'))
const AdminCategories = lazy(() => import('./pages/admin/Categories.jsx'))
const AdminOrders = lazy(() => import('./pages/admin/Orders.jsx'))
const AdminRates = lazy(() => import('./pages/admin/Rates.jsx'))
const AdminBulk = lazy(() => import('./pages/admin/Bulk.jsx'))

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Suspense fallback={<Loader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />

            {/* Catálogo */}
            <Route path="novedades" element={<Category mode="novedades" />} />
            <Route path="mayor" element={<Category mode="mayor" />} />
            <Route path="buscar" element={<Search />} />
            <Route path="producto/:slug" element={<Product />} />
            <Route path=":section" element={<Category />} />
            <Route path=":section/:category" element={<Category />} />

            {/* Compra, siempre como invitado */}
            <Route path="cesta" element={<Cart />} />
            <Route path="comprar" element={<Checkout />} />
            <Route path="pedido/:id" element={<OrderConfirmation />} />
            <Route path="favoritos" element={<Wishlist />} />

            {/* Acceso del equipo */}
            <Route path="entrar" element={<Login />} />

            {/* Contenido estático */}
            <Route path="info/:page" element={<Info />} />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Administración: fuera del layout de tienda */}
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="productos" element={<AdminProducts />} />
              <Route path="productos/nuevo" element={<AdminProductForm />} />
              <Route path="carga" element={<AdminBulk />} />
              <Route path="productos/:id" element={<AdminProductForm />} />
              <Route path="categorias" element={<AdminCategories />} />
              <Route path="pedidos" element={<AdminOrders />} />
              <Route path="tasas" element={<AdminRates />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
