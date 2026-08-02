import { Link } from 'react-router-dom'

import ProductImage from './ProductImage.jsx'
import Icon, { HeartFilled } from '../ui/Icon.jsx'
import { formatBs, formatPrice } from '../../lib/format.js'
import { isSoldOut } from '../../services/products.js'
import { ratesReady, toBs } from '../../lib/pricing.js'
import { useRates } from '../../hooks/useRates.js'
import { useCart } from '../../context/CartContext.jsx'
import { useWishlist } from '../../context/WishlistContext.jsx'

/**
 * Tarjeta de producto de la rejilla.
 * Al pasar el cursor cambia a la segunda fotografía y descubre el botón de
 * añadir rápido; en táctil ese botón se oculta y se entra a la ficha.
 */
export default function ProductCard({ product, priority = false }) {
  const { addItem } = useCart()
  const wishlist = useWishlist()
  const { rates } = useRates()

  const soldOut = isSoldOut(product)
  const hasAlt = product.images?.length > 1
  const isFavourite = wishlist.has(product.id)
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price

  // Con una sola talla se puede añadir directo; con varias, la ficha decide
  const availableSizes = (product.sizes ?? []).filter((s) => Number(s.stock ?? 0) > 0)
  const quickAdd = availableSizes.length === 1

  const handleQuickAdd = (e) => {
    e.preventDefault()
    addItem(product, { size: availableSizes[0].size })
  }

  const handleFavourite = (e) => {
    e.preventDefault()
    wishlist.toggle(product.id)
  }

  return (
    <article className="card">
      <Link to={`/producto/${product.slug}`} className="card__media">
        <ProductImage
          image={product.images?.[0]}
          alt={product.name}
          className={`card__img card__img--main ${hasAlt ? '' : 'card__img--solo'}`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
        />

        {hasAlt ? (
          <ProductImage
            image={product.images[1]}
            alt=""
            className="card__img card__img--alt"
          />
        ) : null}

        {soldOut ? (
          <span className="card__flag">Agotado</span>
        ) : onSale ? (
          <span className="card__flag">Rebajado</span>
        ) : product.isNew ? (
          <span className="card__flag">Nuevo</span>
        ) : null}

        {quickAdd && !soldOut ? (
          <div className="card__quick">
            <button type="button" className="btn btn--glass btn--sm btn--block" onClick={handleQuickAdd}>
              Añadir · {availableSizes[0].size}
            </button>
          </div>
        ) : null}
      </Link>

      <button
        type="button"
        className={`card__fav ${isFavourite ? 'is-on' : ''}`}
        onClick={handleFavourite}
        aria-pressed={isFavourite}
        aria-label={isFavourite ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`}
      >
        {isFavourite ? <HeartFilled size={15} /> : <Icon name="heart" size={15} />}
      </button>

      <div className="card__body">
        <Link to={`/producto/${product.slug}`} className="card__name">
          {product.name}
        </Link>

        <p className="card__price">
          <span>{formatPrice(product.price)}</span>
          {onSale ? <del>{formatPrice(product.compareAtPrice)}</del> : null}
        </p>

        {ratesReady(rates) ? (
          <p className="card__bs">{formatBs(toBs(product.price, rates.store))}</p>
        ) : null}

        {availableSizes.length > 1 ? (
          <p className="card__sizes">{availableSizes.map((s) => s.size).join(' · ')}</p>
        ) : null}
      </div>
    </article>
  )
}
