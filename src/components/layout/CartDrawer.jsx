import { Link } from 'react-router-dom'

import Drawer from '../ui/Drawer.jsx'
import Icon from '../ui/Icon.jsx'
import { cldUrl } from '../../lib/cloudinary.js'
import { formatPrice } from '../../lib/format.js'
import { FREE_SHIPPING_THRESHOLD } from '../../lib/constants.js'
import { useCart } from '../../context/CartContext.jsx'
import { useUI } from '../../context/UIContext.jsx'

/** Cesta lateral con edición de cantidades y acceso a la compra. */
export default function CartDrawer() {
  const { panel, closePanel } = useUI()
  const { items, count, subtotal, setQuantity, removeItem } = useCart()

  const missing = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  const footer =
    items.length > 0 ? (
      <>
        <div className="totals" style={{ marginBottom: '1rem' }}>
          <div className="totals__row totals__row--total">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
        </div>
        <Link to="/cesta" className="btn btn--block" onClick={closePanel}>
          Ver la cesta
        </Link>
        <Link
          to="/comprar"
          className="btn btn--ghost btn--block"
          onClick={closePanel}
          style={{ marginTop: '0.5rem' }}
        >
          Tramitar pedido
        </Link>
      </>
    ) : null

  return (
    <Drawer
      open={panel === 'cart'}
      onClose={closePanel}
      side="right"
      title={`Cesta (${count})`}
      footer={footer}
    >
      {items.length === 0 ? (
        <div className="empty">
          <p className="empty__title">Tu cesta está vacía</p>
          <p>Añade prendas para continuar con tu compra.</p>
          <Link to="/mujer" className="btn" style={{ marginTop: '1.5rem' }} onClick={closePanel}>
            Ver novedades
          </Link>
        </div>
      ) : (
        <>
          {missing > 0 ? (
            <p className="alert" style={{ marginBottom: '1rem' }}>
              Te faltan <strong>{formatPrice(missing)}</strong> para el envío gratis.
            </p>
          ) : (
            <p className="alert" style={{ marginBottom: '1rem' }}>
              <Icon name="truck" size={14} /> Tu pedido tiene envío gratis.
            </p>
          )}

          <ul>
            {items.map((line) => (
              <li key={line.key} className="line">
                <Link to={`/producto/${line.slug}`} className="line__media" onClick={closePanel}>
                  <img src={cldUrl(line.image, { w: 180 })} alt={line.name} loading="lazy" />
                </Link>

                <div className="line__body">
                  <div className="line__top">
                    <Link to={`/producto/${line.slug}`} className="line__name" onClick={closePanel}>
                      {line.name}
                    </Link>
                    <span>{formatPrice(line.price * line.quantity)}</span>
                  </div>

                  <p className="line__meta">
                    {[line.size && `Talla ${line.size}`, line.color].filter(Boolean).join(' · ') ||
                      'Talla única'}
                  </p>

                  <div className="line__foot">
                    <div className="qty">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.key, line.quantity - 1)}
                        disabled={line.quantity <= 1}
                        aria-label="Quitar una unidad"
                      >
                        <Icon name="minus" size={13} />
                      </button>
                      <span className="qty__value">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.key, line.quantity + 1)}
                        disabled={line.quantity >= (line.maxQuantity ?? 99)}
                        aria-label="Añadir una unidad"
                      >
                        <Icon name="plus" size={13} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(line.key)}
                      aria-label={`Eliminar ${line.name}`}
                      className="u-muted"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Drawer>
  )
}
