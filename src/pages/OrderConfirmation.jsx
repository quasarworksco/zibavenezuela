import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Icon from '../components/ui/Icon.jsx'
import { Loader } from '../components/ui/State.jsx'
import { LogoStacked } from '../components/ui/Logo.jsx'
import { formatPrice, orderRef } from '../lib/format.js'
import { STORE } from '../lib/constants.js'
import { getOrder, whatsappMessage } from '../services/orders.js'
import NotFound from './NotFound.jsx'

/** Confirmación tras registrar el pedido, con enlace directo a WhatsApp. */
export default function OrderConfirmation() {
  const { id } = useParams()
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

  if (loading) return <Loader label="Cargando tu pedido" />
  if (!order) return <NotFound />

  const ref = orderRef(order.id)

  return (
    <div className="confirm">
      <div className="confirm__mark">
        <Icon name="check" size={26} />
      </div>

      <h1 className="page__title" style={{ marginBottom: '0.5rem' }}>
        Pedido confirmado
      </h1>
      <p className="u-muted">
        Gracias, {order.customer?.firstName}. Tu pedido <strong>{ref}</strong> quedó registrado.
      </p>

      <div className="glass-card" style={{ marginTop: '2rem', textAlign: 'left' }}>
        <div className="totals">
          <div className="totals__row">
            <span>Artículos</span>
            <span>{order.items.reduce((n, i) => n + i.quantity, 0)}</span>
          </div>
          <div className="totals__row">
            <span>Entrega</span>
            <span>{order.shipping?.methodName ?? '—'}</span>
          </div>
          <div className="totals__row">
            <span>Pago</span>
            <span>{order.payment?.methodName ?? '—'}</span>
          </div>
          <div className="totals__row totals__row--total">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <p className="u-muted" style={{ marginTop: '2rem' }}>
        Escríbenos por WhatsApp para recibir los datos y completar el pago. Tu pedido se prepara en
        cuanto lo verificamos.
      </p>

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: '1.5rem',
        }}
      >
        <a
          className="btn"
          href={`https://wa.me/${STORE.whatsapp}?text=${whatsappMessage(order, ref)}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          <Icon name="whatsapp" size={15} /> Completar el pago
        </a>
        <Link to="/cuenta/pedidos" className="btn btn--ghost">
          Ver mis pedidos
        </Link>
      </div>

      <Link to="/" style={{ display: 'inline-block', marginTop: '3rem' }} aria-label="Ir al inicio">
        <LogoStacked className="footer__logo" />
      </Link>
    </div>
  )
}
