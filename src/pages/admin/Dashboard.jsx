import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Loader } from '../../components/ui/State.jsx'
import { formatDate, formatPrice, orderRef } from '../../lib/format.js'
import { ORDER_STATUS } from '../../lib/constants.js'
import { listOrdersAdmin } from '../../services/orders.js'
import { listProductsAdmin, totalStock } from '../../services/products.js'

/** Resumen del negocio: ventas, catálogo y últimos pedidos. */
export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([listOrdersAdmin({ max: 200 }), listProductsAdmin({ max: 300 })])
      .then(([orders, products]) => {
        if (!active) return
        setData({ orders, products: products.items })
      })
      .catch((err) => {
        if (!active) return
        console.error('No se pudo cargar el resumen:', err)
        setError('No pudimos cargar los datos. Revisa las reglas de Firestore y tu conexión.')
      })
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [])

  if (loading) return <Loader label="Cargando el resumen" />
  if (error) return <p className="alert alert--error">{error}</p>

  const { orders, products } = data
  // Un pedido cancelado no cuenta como venta
  const valid = orders.filter((o) => o.status !== 'cancelado')
  const revenue = valid.reduce((sum, o) => sum + o.total, 0)
  const pending = orders.filter((o) => o.status === 'pendiente').length
  const outOfStock = products.filter((p) => totalStock(p) <= 0).length

  return (
    <>
      <div className="admin__head">
        <h1 className="admin__title">Resumen</h1>
        <Link to="/admin/productos/nuevo" className="btn btn--sm">
          Nuevo producto
        </Link>
      </div>

      <div className="stats">
        <div className="stat">
          <p className="stat__label">Ventas registradas</p>
          <p className="stat__value">{formatPrice(revenue)}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Pedidos</p>
          <p className="stat__value">{orders.length}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Pendientes de pago</p>
          <p className="stat__value">{pending}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Productos</p>
          <p className="stat__value">{products.length}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Agotados</p>
          <p className="stat__value">{outOfStock}</p>
        </div>
      </div>

      <div className="admin__head">
        <h2 className="admin__title">Últimos pedidos</h2>
        <Link to="/admin/pedidos" className="btn btn--link">
          Ver todos
        </Link>
      </div>

      {orders.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map((order) => (
                <tr key={order.id}>
                  <td>{orderRef(order.id)}</td>
                  <td>
                    {order.customer?.firstName} {order.customer?.lastName}
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <span className="badge">{ORDER_STATUS[order.status] ?? order.status}</span>
                  </td>
                  <td>{formatPrice(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="u-muted">Todavía no hay pedidos.</p>
      )}
    </>
  )
}
