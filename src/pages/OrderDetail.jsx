import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Icon from '../components/ui/Icon.jsx'
import { Empty, Loader } from '../components/ui/State.jsx'
import { cldUrl } from '../lib/cloudinary.js'
import { formatDateTime, formatPrice, orderRef } from '../lib/format.js'
import { ORDER_STATUS, ORDER_STATUS_LIST, STORE } from '../lib/constants.js'
import { getOrder, whatsappMessage } from '../services/orders.js'
import { useAuth } from '../context/AuthContext.jsx'

/** Detalle de un pedido del cliente, con su línea de tiempo. */
export default function OrderDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getOrder(id)
      .then((found) => active && setOrder(found))
      .catch((err) => console.error('No se pudo cargar el pedido:', err))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <Loader label="Cargando el pedido" />

  // Sólo el dueño del pedido puede verlo desde su cuenta
  if (!order || (order.userId && order.userId !== user?.uid)) {
    return (
      <Empty
        title="Pedido no encontrado"
        text="Puede que el enlace haya caducado."
        actionTo="/cuenta/pedidos"
        actionLabel="Ver mis pedidos"
      />
    )
  }

  const ref = orderRef(order.id)
  const stepIndex = ORDER_STATUS_LIST.indexOf(order.status)

  return (
    <>
      <Link to="/cuenta/pedidos" className="btn btn--link" style={{ marginBottom: '1.5rem' }}>
        ← Mis pedidos
      </Link>

      <p className="page__subtitle">Pedido {ref}</p>
      <p className="u-muted">Realizado el {formatDateTime(order.createdAt)}</p>

      <div className="steps" style={{ marginTop: '1.5rem' }}>
        {ORDER_STATUS_LIST.filter((s) => s !== 'cancelado').map((status, i) => (
          <span
            key={status}
            className={`steps__item ${
              order.status === status ? 'is-active' : i < stepIndex ? 'is-done' : ''
            }`}
          >
            {ORDER_STATUS[status]}
          </span>
        ))}
      </div>

      {order.status === 'cancelado' ? (
        <p className="alert alert--error" style={{ marginTop: '1rem' }}>
          Este pedido fue cancelado.
        </p>
      ) : null}

      <div className="two-col" style={{ marginTop: '2rem' }}>
        <div>
          <ul>
            {order.items.map((item, i) => (
              <li key={`${item.productId}-${i}`} className="line">
                <Link to={`/producto/${item.slug}`} className="line__media">
                  <img src={cldUrl(item.image, { w: 200 })} alt={item.name} loading="lazy" />
                </Link>

                <div className="line__body">
                  <div className="line__top">
                    <Link to={`/producto/${item.slug}`} className="line__name">
                      {item.name}
                    </Link>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                  <p className="line__meta">
                    {[item.size && `Talla ${item.size}`, item.color, `x${item.quantity}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="summary">
          <p className="summary__title">Resumen</p>

          <div className="totals">
            <div className="totals__row">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="totals__row">
              <span>Envío</span>
              <span>{order.shippingCost === 0 ? 'Gratis' : formatPrice(order.shippingCost)}</span>
            </div>
            <div className="totals__row totals__row--total">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          <p className="summary__title" style={{ marginTop: '2rem' }}>
            Entrega
          </p>
          <p className="u-muted" style={{ fontSize: 'var(--fs-sm)' }}>
            {order.shipping?.methodName}
            {order.shipping?.address ? (
              <>
                <br />
                {order.shipping.address}
                <br />
                {[order.shipping.city, order.shipping.state].filter(Boolean).join(', ')}
              </>
            ) : null}
          </p>

          <p className="summary__title" style={{ marginTop: '2rem' }}>
            Pago
          </p>
          <p className="u-muted" style={{ fontSize: 'var(--fs-sm)' }}>
            {order.payment?.methodName}
          </p>

          {order.status === 'pendiente' ? (
            <a
              className="btn btn--block"
              style={{ marginTop: '1.5rem' }}
              href={`https://wa.me/${STORE.whatsapp}?text=${whatsappMessage(order, ref)}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Icon name="whatsapp" size={15} /> Completar el pago
            </a>
          ) : null}
        </aside>
      </div>
    </>
  )
}
