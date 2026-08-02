import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import Layout from './components/layout/Layout.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import { RequireAdmin, RequireAuth } from './components/RouteGuards.jsx'
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
const Register = lazy(() => import('./pages/Register.jsx'))
const Account = lazy(() => import('./pages/Account.jsx'))
const AccountProfile = lazy(() => import('./pages/AccountProfile.jsx'))
const AccountOrders = lazy(() => import('./pages/AccountOrders.jsx'))
const OrderDetail = lazy(() => import('./pages/OrderDetail.jsx'))
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'))
const Info = lazy(() => import('./pages/Info.jsx'))

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'))
const AdminProducts = lazy(() => import('./pages/admin/Products.jsx'))
const AdminProductForm = lazy(() => import('./pages/admin/ProductForm.jsx'))
const AdminCategories = lazy(() => import('./pages/admin/Categories.jsx'))
const AdminOrders = lazy(() => import('./pages/admin/Orders.jsx'))

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
            <Route path="buscar" element={<Search />} />
            <Route path="producto/:slug" element={<Product />} />
            <Route path=":section" element={<Category />} />
            <Route path=":section/:category" element={<Category />} />

            {/* Compra */}
            <Route path="cesta" element={<Cart />} />
            <Route path="comprar" element={<Checkout />} />
            <Route path="pedido/:id" element={<OrderConfirmation />} />

            {/* Cuenta */}
            <Route path="entrar" element={<Login />} />
            <Route path="registro" element={<Register />} />
            <Route path="favoritos" element={<Wishlist />} />

            <Route element={<RequireAuth />}>
              <Route path="cuenta" element={<Account />}>
                <Route index element={<AccountProfile />} />
                <Route path="pedidos" element={<AccountOrders />} />
                <Route path="pedidos/:id" element={<OrderDetail />} />
              </Route>
            </Route>

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
              <Route path="productos/:id" element={<AdminProductForm />} />
              <Route path="categorias" element={<AdminCategories />} />
              <Route path="pedidos" element={<AdminOrders />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
