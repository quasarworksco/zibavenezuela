import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import ProductGrid from '../components/product/ProductGrid.jsx'
import Drawer from '../components/ui/Drawer.jsx'
import Icon from '../components/ui/Icon.jsx'
import { SECTIONS, SECTION_NAMES, SORT_OPTIONS, STORE, TIERS } from '../lib/constants.js'
import { listProducts } from '../services/products.js'
import { useCategories } from '../hooks/useCategories.js'
import { useUI } from '../context/UIContext.jsx'
import NotFound from './NotFound.jsx'

/**
 * Listado de catálogo. Cubre cuatro casos con la misma vista:
 *  - /novedades           (mode="novedades")
 *  - /mayor               (mode="mayor") sólo prendas con precio al mayor
 *  - /:section            todas las prendas de una sección
 *  - /:section/:category  una categoría concreta
 */
export default function Category({ mode }) {
  const { section, category } = useParams()
  const [params, setParams] = useSearchParams()
  const { bySection, categories } = useCategories()
  const { panel, openPanel, closePanel } = useUI()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const sort = params.get('orden') ?? 'nuevo'
  const sizeFilter = params.getAll('talla')
  const maxPrice = params.get('max') ? Number(params.get('max')) : undefined
  const inStock = params.get('stock') === '1'

  const isNews = mode === 'novedades'
  const isWholesale = mode === 'mayor'
  const isGlobal = isNews || isWholesale
  const validSection = isGlobal || SECTIONS.some((s) => s.slug === section)

  const currentCategory = useMemo(
    () => categories.find((c) => c.slug === category && c.section === section),
    [categories, category, section],
  )

  useEffect(() => {
    if (!validSection) return undefined
    let active = true
    setLoading(true)

    listProducts({
      section: isGlobal ? undefined : section,
      categorySlug: category,
      sort,
      sizes: sizeFilter.length ? sizeFilter : undefined,
      maxPrice,
      inStock,
      wholesale: isWholesale,
      max: 120,
    })
      .then((items) => {
        if (!active) return
        setProducts(items)
        setError(null)
      })
      .catch((err) => {
        if (!active) return
        console.error('No se pudo cargar el catálogo:', err)
        setError(err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
    // `sizeFilter` es un array nuevo en cada render: se compara serializado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    validSection,
    isGlobal,
    isWholesale,
    section,
    category,
    sort,
    sizeFilter.join(','),
    maxPrice,
    inStock,
  ])

  if (!validSection) return <NotFound />

  const title = isNews
    ? 'Novedades'
    : isWholesale
      ? 'Al mayor'
      : currentCategory?.name ?? SECTION_NAMES[section] ?? 'Catálogo'

  // Tallas presentes en el resultado, para ofrecer sólo filtros con sentido
  const availableSizes = [
    ...new Set(products.flatMap((p) => p.sizes.map((s) => s.size))),
  ].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value === undefined || value === null || value === '') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const toggleSize = (size) => {
    const next = new URLSearchParams(params)
    const current = next.getAll('talla')
    next.delete('talla')
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size]
    updated.forEach((s) => next.append('talla', s))
    setParams(next, { replace: true })
  }

  const clearFilters = () => setParams(new URLSearchParams(), { replace: true })

  const activeFilters = sizeFilter.length + (maxPrice ? 1 : 0) + (inStock ? 1 : 0)
  const siblings = section ? bySection[section] ?? [] : []

  return (
    <>
      <div className="listing__head">
        <nav className="crumbs" aria-label="Ruta de navegación">
          <Link to="/">Inicio</Link>
          <span>/</span>
          {isGlobal ? (
            <span>{title}</span>
          ) : (
            <>
              <Link to={`/${section}`}>{SECTION_NAMES[section]}</Link>
              {currentCategory ? (
                <>
                  <span>/</span>
                  <span>{currentCategory.name}</span>
                </>
              ) : null}
            </>
          )}
        </nav>

        <h1 className="listing__title">{title}</h1>
        {isWholesale ? (
          <>
            <p className="u-muted" style={{ maxWidth: '62ch' }}>
              {TIERS.mayor.text} El precio al mayor se aplica solo en la cesta, al llegar a la
              cantidad mínima de cada prenda. Enviamos a todo el país.
            </p>
            <a
              className="btn btn--sm"
              style={{ marginTop: 'var(--sp-3)', alignSelf: 'flex-start' }}
              href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(
                'Hola ZIBA, quiero información sobre los precios al mayor.',
              )}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Icon name="whatsapp" size={15} /> Hablar con ventas
            </a>
          </>
        ) : null}
        {currentCategory?.description ? (
          <p className="u-muted" style={{ maxWidth: '62ch' }}>
            {currentCategory.description}
          </p>
        ) : null}
        <p className="listing__count">
          {loading ? 'Cargando…' : `${products.length} artículo${products.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {siblings.length ? (
        <div className="rail" style={{ paddingBottom: '1rem' }}>
          <Link
            to={`/${section}`}
            className={`chip ${!category ? 'is-active' : ''}`}
            style={{ flex: '0 0 auto' }}
          >
            Todo
          </Link>
          {siblings.map((c) => (
            <Link
              key={c.id}
              to={`/${section}/${c.slug}`}
              className={`chip ${category === c.slug ? 'is-active' : ''}`}
              style={{ flex: '0 0 auto' }}
            >
              {c.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="toolbar">
        <button type="button" className="toolbar__btn" onClick={() => openPanel('filters')}>
          <Icon name="filter" size={15} />
          Filtrar{activeFilters ? ` (${activeFilters})` : ''}
        </button>

        <div className="toolbar__group">
          <label htmlFor="sort" className="u-sr">
            Ordenar por
          </label>
          <select
            id="sort"
            className="toolbar__select"
            value={sort}
            onChange={(e) => setParam('orden', e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="empty">
          <p className="empty__title">No pudimos cargar el catálogo</p>
          <p>Revisa tu conexión e inténtalo de nuevo.</p>
        </div>
      ) : (
        <ProductGrid
          products={products}
          loading={loading}
          emptyTitle="Sin resultados"
          emptyText={
            activeFilters
              ? 'Ningún artículo coincide con los filtros seleccionados.'
              : isWholesale
                ? 'Todavía no hay prendas con precio al mayor publicado. Escríbenos y te pasamos la lista.'
                : 'Todavía no hay prendas en esta categoría.'
          }
        />
      )}

      <Drawer
        open={panel === 'filters'}
        onClose={closePanel}
        side="right"
        title="Filtrar"
        footer={
          <>
            <button type="button" className="btn btn--block" onClick={closePanel}>
              Ver {products.length} artículos
            </button>
            {activeFilters ? (
              <button
                type="button"
                className="btn btn--link"
                onClick={clearFilters}
                style={{ marginTop: '0.75rem', width: '100%' }}
              >
                Quitar filtros
              </button>
            ) : null}
          </>
        }
      >
        {availableSizes.length ? (
          <div className="filters__block">
            <p className="filters__title">Talla</p>
            <div className="chips">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`chip ${sizeFilter.includes(size) ? 'is-active' : ''}`}
                  onClick={() => toggleSize(size)}
                  aria-pressed={sizeFilter.includes(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="filters__block">
          <p className="filters__title">Precio máximo</p>
          <div className="filters__range">
            <input
              type="range"
              min="10"
              max="300"
              step="10"
              value={maxPrice ?? 300}
              onChange={(e) =>
                setParam('max', e.target.value === '300' ? '' : e.target.value)
              }
              style={{ flex: 1, accentColor: '#000' }}
              aria-label="Precio máximo"
            />
            <span>{maxPrice ? `$${maxPrice}` : 'Sin límite'}</span>
          </div>
        </div>

        <div className="filters__block">
          <p className="filters__title">Disponibilidad</p>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setParam('stock', e.target.checked ? '1' : '')}
            />
            <span>Mostrar sólo artículos disponibles</span>
          </label>
        </div>
      </Drawer>
    </>
  )
}
