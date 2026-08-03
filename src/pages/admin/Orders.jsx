import { useEffect, useState } from 'react'

import Modal from '../../components/ui/Modal.jsx'
import Icon from '../../components/ui/Icon.jsx'
import { Loader } from '../../components/ui/State.jsx'
import { cldUrl } from '../../lib/cloudinary.js'
import { formatBs, formatDateTime, formatPrice, orderRef } from '../../lib/format.js'
import { ORDER_STATUS, ORDER_STATUS_LIST, STORE } from '../../lib/constants.js'
import { listOrdersAdmin, updateOrderStatus, whatsappMessage } from '../../services/orders.js'
import { useUI } from '../../context/UIContext.jsx'

/** Gestión de pedidos: consulta, detalle y cambio de estado. */
export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const { toast } = useUI()

  useEffect(() => {
    let active = true
    setLoading(true)

    listOrdersAdmin({ max: 300 })
      .then((items) => {
        if (!active) return
        setOrders(items)
        setError('')
      })
      .catch((err) => {
        if (!active) return
        console.error('No se pudieron cargar los pedidos:', err)
        setError('No pudimos cargar los pedidos.')
      })
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [])

  const changeStatus = async (order, status) => {
    try {
      await updateOrderStatus(order.id, status)
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)))
      setSelected((current) => (current?.id === order.id ? { ...current, status } : current))
      toast(`Pedido marcado como «${ORDER_STATUS[status]}»`)
    } catch (err) {
      console.error('No se pudo cambiar el estado:', err)
      toast('No se pudo cambiar el estado')
    }
  }

  const filtered = statusFilter ? orders.filter((o) => o.status === statusFilter) : orders

  return (
    <>
      <div className="admin__head">
        <h1 className="admin__title">Pedidos ({orders.length})</h1>
      </div>

      <div className="admin-filters">
        <select
          className="field__control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {ORDER_STATUS_LIST.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS[s]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader label="Cargando pedidos" />
      ) : error ? (
        <p className="alert alert--error">{error}</p>
      ) : !filtered.length ? (
        <p className="u-muted">
          {orders.length ? 'No hay pedidos con ese estado.' : 'Todavía no hay pedidos.'}
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td data-label="Pedido">{orderRef(order.id)}</td>
                  <td data-label="Cliente">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </td>
                  <td data-label="Contacto" className="u-muted">{order.customer?.phone}</td>
                  <td data-label="Fecha">{formatDateTime(order.createdAt)}</td>
                  <td data-label="Total">{formatPrice(order.total)}</td>
                  <td data-label="Estado">
                    <select
                      className="toolbar__select"
                      value={order.status}
                      onChange={(e) => changeStatus(order, e.target.value)}
                      aria-label={`Estado del pedido ${orderRef(order.id)}`}
                    >
                      {ORDER_STATUS_LIST.map((s) => (
                        <option key={s} value={s}>
                          {ORDER_STATUS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="">
                    <div className="table__actions">
                      <button
                        type="button"
                        className="btn btn--link"
                        onClick={() => setSelected(order)}
                      >
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Pedido ${orderRef(selected.id)}` : ''}
      >
        {selected ? (
          <>
            <p className="u-muted" style={{ fontSize: 'var(--fs-sm)' }}>
              {formatDateTime(selected.createdAt)} · {ORDER_STATUS[selected.status]}
            </p>

            <p className="panel__title" style={{ marginTop: '1.5rem' }}>
              Cliente
            </p>
            <p style={{ fontSize: 'var(--fs-sm)' }}>
              {selected.customer?.firstName} {selected.customer?.lastName}
              <br />
              {selected.customer?.email}
              <br />
              {selected.customer?.phone}
              {selected.customer?.idCard ? (
                <>
                  <br />
                  C.I./RIF: {selected.customer.idCard}
                </>
              ) : null}
            </p>

            <p className="panel__title" style={{ marginTop: '1.5rem' }}>
              Entrega
            </p>
            <p style={{ fontSize: 'var(--fs-sm)' }}>
              {selected.shipping?.methodName}
              {selected.shipping?.address ? (
                <>
                  <br />
                  {selected.shipping.address}
                  <br />
                  {[selected.shipping.city, selected.shipping.state].filter(Boolean).join(', ')}
                </>
              ) : null}
            </p>

            <p className="panel__title" style={{ marginTop: '1.5rem' }}>
              Artículos
            </p>
            <ul>
              {selected.items.map((item, i) => (
                <li
                  key={`${item.productId}-${i}`}
                  style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}
                >
                  <img
                    src={cldUrl(item.image, { w: 90 })}
                    alt=""
                    style={{ width: 40, aspectRatio: '2 / 3', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <span style={{ flex: 1, fontSize: 'var(--fs-sm)' }}>
                    {item.name}
                    <br />
                    <span className="line__meta">
                      {[item.size && `Talla ${item.size}`, item.color, `x${item.quantity}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <span style={{ fontSize: 'var(--fs-sm)' }}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="totals" style={{ marginTop: '1.5rem' }}>
              <div className="totals__row">
                <span>Subtotal</span>
                <span>{formatPrice(selected.subtotal)}</span>
              </div>
              <div className="totals__row">
                <span>Envío</span>
                <span>
                  {selected.shippingCost === 0 ? 'Sin costo' : formatPrice(selected.shippingCost)}
                </span>
              </div>
              <div className="totals__row totals__row--total">
                <span>Total</span>
                <span>{formatPrice(selected.total)}</span>
              </div>

              {/* Las tasas quedaron congeladas al cerrar la venta: se muestran
                  las de ese momento, no las de hoy. */}
              {selected.rates ? (
                <>
                  <div className="totals__row">
                    <span>Total en bolívares</span>
                    <span>{formatBs(selected.rates.totalBs)}</span>
                  </div>
                  <div className="totals__row">
                    <span>Total real</span>
                    <span>{formatPrice(selected.rates.totalRealUsd)}</span>
                  </div>
                  <div className="totals__row u-muted" style={{ fontSize: 'var(--fs-xs)' }}>
                    <span>Tasas del pedido</span>
                    <span>
                      ZIBA {selected.rates.store} · BCV {selected.rates.bcv}
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            {selected.note ? (
              <>
                <p className="panel__title" style={{ marginTop: '1.5rem' }}>
                  Nota del cliente
                </p>
                <p style={{ fontSize: 'var(--fs-sm)' }}>{selected.note}</p>
              </>
            ) : null}

            <label className="field" style={{ marginTop: '1.5rem' }}>
              <span className="field__label">Cambiar estado</span>
              <select
                className="field__control"
                value={selected.status}
                onChange={(e) => changeStatus(selected, e.target.value)}
              >
                {ORDER_STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS[s]}
                  </option>
                ))}
              </select>
            </label>

            <a
              className="btn btn--block"
              style={{ marginTop: '1rem' }}
              href={`https://wa.me/${(selected.customer?.phone ?? STORE.whatsapp).replace(/\D/g, '')}?text=${whatsappMessage(
                selected,
                orderRef(selected.id),
              )}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Icon name="whatsapp" size={15} /> Escribir al cliente
            </a>
          </>
        ) : null}
      </Modal>
    </>
  )
}
