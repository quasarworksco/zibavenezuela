import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import ProductImage from '../components/product/ProductImage.jsx'
import ProductGrid from '../components/product/ProductGrid.jsx'
import Icon, { HeartFilled } from '../components/ui/Icon.jsx'
import { Loader } from '../components/ui/State.jsx'
import { cldUrl, imageSrc } from '../lib/cloudinary.js'
import { formatPrice } from '../lib/format.js'
import { SECTION_NAMES, STORE } from '../lib/constants.js'
import { getProductBySlug, isSoldOut, listRelated } from '../services/products.js'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useUI } from '../context/UIContext.jsx'
import NotFound from './NotFound.jsx'

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="acc">
      <button
        type="button"
        className="acc__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {title}
        <Icon name="plus" size={14} className="acc__icon" />
      </button>
      {open ? <div className="acc__panel">{children}</div> : null}
    </div>
  )
}

/** Ficha de producto: galería, selección de talla y compra. */
export default function Product() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [size, setSize] = useState('')
  const [colorIndex, setColorIndex] = useState(0)
  const [sizeError, setSizeError] = useState(false)
  const [zoom, setZoom] = useState(null)

  const { addItem } = useCart()
  const wishlist = useWishlist()
  const { toast } = useUI()

  useEffect(() => {
    let active = true
    setLoading(true)
    setProduct(null)
    setSize('')
    setSizeError(false)

    getProductBySlug(slug)
      .then((found) => {
        if (!active) return
        setProduct(found)
        if (found) {
          // Preselecciona la talla si sólo hay una disponible
          const available = found.sizes.filter((s) => Number(s.stock) > 0)
          if (available.length === 1) setSize(available[0].size)
          listRelated(found).then((items) => active && setRelated(items))
        }
      })
      .catch((err) => console.error('No se pudo cargar el producto:', err))
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [slug])

  // Título de la pestaña acorde a la prenda
  useEffect(() => {
    if (!product) return undefined
    const previous = document.title
    document.title = `${product.name} · ZIBA VENEZUELA`
    return () => {
      document.title = previous
    }
  }, [product])

  if (loading) return <Loader label="Cargando producto" />
  if (!product) return <NotFound />

  const soldOut = isSoldOut(product)
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price
  const isFavourite = wishlist.has(product.id)
  const images = product.images?.length ? product.images : [null]

  const handleAdd = () => {
    const needsSize = product.sizes.length > 0
    if (needsSize && !size) {
      setSizeError(true)
      toast('Selecciona una talla')
      return
    }
    addItem(product, { size, color: product.colors?.[colorIndex]?.name ?? '' })
  }

  return (
    <>
      <div style={{ padding: '1rem var(--gutter) 0' }}>
        <nav className="crumbs" aria-label="Ruta de navegación">
          <Link to="/">Inicio</Link>
          <span>/</span>
          <Link to={`/${product.section}`}>{SECTION_NAMES[product.section] ?? product.section}</Link>
          {product.categorySlug ? (
            <>
              <span>/</span>
              <Link to={`/${product.section}/${product.categorySlug}`}>{product.categoryName}</Link>
            </>
          ) : null}
        </nav>
      </div>

      <div className="pdp">
        {/* Escritorio: mosaico. Móvil: carrusel deslizable (se alternan por CSS) */}
        <div className="pdp__gallery">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              className="pdp__shot"
              onClick={() => setZoom(imageSrc(img))}
              aria-label={`Ampliar imagen ${i + 1}`}
            >
              <ProductImage
                image={img}
                alt={`${product.name} — imagen ${i + 1}`}
                width={900}
                sizes="(min-width: 1024px) 40vw, 100vw"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : undefined}
              />
            </button>
          ))}
        </div>

        <div className="pdp__slider">
          {images.map((img, i) => (
            <div key={i} className="pdp__slide">
              <ProductImage
                image={img}
                alt={`${product.name} — imagen ${i + 1}`}
                width={900}
                sizes="100vw"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        <div className="pdp__panel">
          <h1 className="pdp__name">{product.name}</h1>

          <p className="pdp__price">
            <span>{formatPrice(product.price)}</span>
            {onSale ? <del>{formatPrice(product.compareAtPrice)}</del> : null}
            {soldOut ? <span className="badge">Agotado</span> : null}
          </p>

          {product.sku ? <p className="listing__count">Ref. {product.sku}</p> : null}

          {product.colors?.length ? (
            <div>
              <p className="filters__title">
                Color: {product.colors[colorIndex]?.name}
              </p>
              <div className="chips">
                {product.colors.map((c, i) => (
                  <button
                    key={`${c.name}-${i}`}
                    type="button"
                    className={`swatch ${i === colorIndex ? 'is-active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setColorIndex(i)}
                    aria-label={`Color ${c.name}`}
                    aria-pressed={i === colorIndex}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {product.sizes?.length ? (
            <div>
              <div className="pdp__row">
                <span className="filters__title" style={{ margin: 0 }}>
                  Talla
                </span>
                <Link to="/info/tallas" className="u-link" style={{ fontSize: 'var(--fs-2xs)' }}>
                  Guía de tallas
                </Link>
              </div>

              <div className="chips" style={{ marginTop: '0.75rem' }}>
                {product.sizes.map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    className={`chip ${size === s.size ? 'is-active' : ''}`}
                    onClick={() => {
                      setSize(s.size)
                      setSizeError(false)
                    }}
                    disabled={Number(s.stock) <= 0}
                    aria-pressed={size === s.size}
                  >
                    {s.size}
                  </button>
                ))}
              </div>

              {sizeError ? <p className="field__error">Selecciona una talla para continuar.</p> : null}

              {size && Number(product.sizes.find((s) => s.size === size)?.stock) <= 3 ? (
                <p className="field__hint">Últimas unidades en talla {size}.</p>
              ) : null}
            </div>
          ) : null}

          <div className="pdp__actions" style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn--block"
              onClick={handleAdd}
              disabled={soldOut}
            >
              {soldOut ? 'Agotado' : 'Añadir a la cesta'}
            </button>

            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => wishlist.toggle(product.id)}
              aria-pressed={isFavourite}
              aria-label={isFavourite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              style={{ flex: '0 0 auto', paddingInline: '1rem' }}
            >
              {isFavourite ? <HeartFilled size={16} /> : <Icon name="heart" size={16} />}
            </button>
          </div>

          {product.description ? <p className="pdp__desc">{product.description}</p> : null}

          <div style={{ marginTop: '1rem' }}>
            {product.composition ? (
              <Accordion title="Composición y cuidados">
                <p>{product.composition}</p>
                {product.care ? <p style={{ marginTop: '0.5rem' }}>{product.care}</p> : null}
              </Accordion>
            ) : null}

            <Accordion title="Envíos y devoluciones">
              <p>
                Envíos a toda Venezuela por Zoom y MRW en 2 a 5 días hábiles. Delivery en Caracas
                en 24-48 horas. El retiro en tienda no tiene costo.
              </p>
              <p>Dispones de 30 días para cambiar tu prenda sin usar y con su etiqueta.</p>
            </Accordion>

            <Accordion title="¿Necesitas ayuda?">
              <p>
                Escríbenos por WhatsApp y te asesoramos con la talla o el pago.{' '}
                <a
                  className="u-link"
                  href={`https://wa.me/${STORE.whatsapp}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Abrir WhatsApp
                </a>
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      {related.length ? (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">También te puede gustar</h2>
          </div>
          <ProductGrid products={related} />
        </section>
      ) : null}

      {/* Barra fija de compra en móvil */}
      <div className="buybar">
        <span style={{ display: 'grid', alignContent: 'center', fontSize: 'var(--fs-sm)' }}>
          {formatPrice(product.price)}
        </span>
        <button type="button" className="btn btn--block" onClick={handleAdd} disabled={soldOut}>
          {soldOut ? 'Agotado' : 'Añadir'}
        </button>
      </div>

      {zoom ? (
        <div className="lightbox" onClick={() => setZoom(null)} role="dialog" aria-modal="true">
          <button type="button" className="lightbox__close" aria-label="Cerrar">
            <Icon name="close" size={24} />
          </button>
          <img src={cldUrl(zoom, { w: 1600, crop: 'limit' })} alt={product.name} />
        </div>
      ) : null}
    </>
  )
}
