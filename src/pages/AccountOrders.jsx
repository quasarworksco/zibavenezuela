import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Empty, Loader } from '../components/ui/State.jsx'
import { cldUrl } from '../lib/cloudinary.js'
import { formatDate, formatPrice, orderRef } from '../lib/format.js'
import { ORDER_STATUS } from '../lib/constants.js'
import { listOrdersByUser } from '../services/orders.js'
import { useAuth } from '../context/AuthContext.jsx'

/** Historial de pedidos del cliente. */
export default function AccountOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return undefined
    let active = true

    listOrdersByUser(user.uid)
      .then((items) => active && setOrders(items))
      .catch((err) => console.error('No se pudieron cargar los pedidos:', err))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [user])

  if (loading) return <Loader label="Cargando tus pedidos" />

  if (!orders.length) {
    return (
      <Empty
        title="Todavía no tienes pedidos"
        text="Cuando compres algo aparecerá aquí."
        actionTo="/novedades"
        actionLabel="Ver novedades"
      />
    )
  }

  return (
    <>
      <p className="page__subtitle">Mis pedidos</p>

      {orders.map((order) => (
        <article key={order.id} className="order">
          <header className="order__head">
            <span>{orderRef(order.id)}</span>
            <span className="u-muted">{formatDate(order.createdAt)}</span>
            <span className="badge">{ORDER_STATUS[order.status] ?? order.status}</span>
            <span>{formatPrice(order.total)}</span>
          </header>

          <div className="order__thumbs">
            {order.items.slice(0, 5).map((item, i) => (
              <img
                key={`${item.productId}-${i}`}
                className="order__thumb"
                src={cldUrl(item.image, { w: 120 })}
                alt={item.name}
                loading="lazy"
              />
            ))}
            {order.items.length > 5 ? (
              <span className="line__meta" style={{ alignSelf: 'center' }}>
                +{order.items.length - 5}
              </span>
            ) : null}
          </div>

          <Link
            to={`/cuenta/pedidos/${order.id}`}
            className="btn btn--link"
            style={{ marginTop: '1rem' }}
          >
            Ver detalle
          </Link>
        </article>
      ))}
    </>
  )
}
