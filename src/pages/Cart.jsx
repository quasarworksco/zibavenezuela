import { Link } from 'react-router-dom'

import Icon from '../components/ui/Icon.jsx'
import { Empty } from '../components/ui/State.jsx'
import { cldUrl } from '../lib/cloudinary.js'
import { formatBs, formatPrice } from '../lib/format.js'
import { lineIsWholesale, linePrice, ratesReady, toBs } from '../lib/pricing.js'
import { useRates } from '../hooks/useRates.js'
import { useCart } from '../context/CartContext.jsx'

/** Página de la cesta, con el resumen fijo a un lado. */
export default function Cart() {
  const { items, count, subtotal, setQuantity, removeItem } = useCart()
  const { rates } = useRates()

  if (!items.length) {
    return (
      <div className="page">
        <h1 className="page__title">Cesta</h1>
        <Empty
          title="Tu cesta está vacía"
          text="Cuando añadas prendas aparecerán aquí."
          actionTo="/novedades"
          actionLabel="Ver novedades"
        />
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page__title">Cesta ({count})</h1>

      <div className="two-col">
        <div>
          <ul>
            {items.map((line) => (
              <li key={line.key} className="line">
                <Link to={`/producto/${line.slug}`} className="line__media">
                  <img src={cldUrl(line.image, { w: 240 })} alt={line.name} loading="lazy" />
                </Link>

                <div className="line__body">
                  <div className="line__top">
                    <Link to={`/producto/${line.slug}`} className="line__name">
                      {line.name}
                    </Link>
                    <span>{formatPrice(linePrice(line) * line.quantity)}</span>
                  </div>

                  <p className="line__meta">
                    {[line.size && `Talla ${line.size}`, line.color].filter(Boolean).join(' · ') ||
                      'Talla única'}
                  </p>
                  <p className="line__meta">
                    {formatPrice(linePrice(line))} / unidad
                    {lineIsWholesale(line) ? ' · precio al mayor' : ''}
                  </p>
                  {!lineIsWholesale(line) && line.wholesalePrice ? (
                    <div className="upsell">
                      <p className="upsell__text">
                        Te {line.wholesaleFrom - line.quantity === 1 ? 'falta' : 'faltan'}{' '}
                        <strong>
                          {line.wholesaleFrom - line.quantity}{' '}
                          {line.wholesaleFrom - line.quantity === 1 ? 'unidad' : 'unidades'}
                        </strong>{' '}
                        para el precio al mayor: {formatPrice(line.wholesalePrice)} cada una en vez
                        de {formatPrice(line.price)}. Ahorras{' '}
                        {formatPrice((line.price - line.wholesalePrice) * line.wholesaleFrom)}.
                      </p>
                      <button
                        type="button"
                        className="btn btn--sm"
                        onClick={() => setQuantity(line.key, line.wholesaleFrom)}
                        disabled={line.wholesaleFrom > (line.maxQuantity ?? 99)}
                      >
                        Llevar {line.wholesaleFrom}
                      </button>
                      {line.wholesaleFrom > (line.maxQuantity ?? 99) ? (
                        <p className="upsell__text u-muted">
                          Ahora mismo sólo quedan {line.maxQuantity} de esta talla.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

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
                      className="btn btn--link"
                      onClick={() => removeItem(line.key)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link to="/novedades" className="btn btn--link" style={{ marginTop: '1.5rem' }}>
            ← Seguir comprando
          </Link>
        </div>

        <aside className="summary">
          <p className="summary__title">Resumen</p>

          <div className="totals">
            <div className="totals__row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="totals__row">
              <span>Envío</span>
              <span>Se calcula al tramitar</span>
            </div>
            <div className="totals__row totals__row--total">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {ratesReady(rates) ? (
              <div className="totals__row">
                <span>En bolívares</span>
                <span>{formatBs(toBs(subtotal, rates.store))}</span>
              </div>
            ) : null}
          </div>

          <p className="field__hint" style={{ marginTop: '1rem' }}>
            Eliges la forma de entrega en el siguiente paso. El retiro en tienda no tiene costo.
          </p>

          <Link to="/comprar" className="btn btn--block" style={{ marginTop: '1.5rem' }}>
            Tramitar pedido
          </Link>

          <p className="field__hint" style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Icon name="lock" size={13} /> Compra protegida
          </p>
        </aside>
      </div>
    </div>
  )
}
