import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Icon from '../../components/ui/Icon.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { Loader } from '../../components/ui/State.jsx'
import { cldUrl, imageSrc } from '../../lib/cloudinary.js'
import { formatPrice } from '../../lib/format.js'
import { SECTIONS, SECTION_NAMES } from '../../lib/constants.js'
import {
  deleteProduct,
  listProductsAdmin,
  setProductActive,
  totalStock,
} from '../../services/products.js'
import { useUI } from '../../context/UIContext.jsx'

/** Listado del catálogo con acciones rápidas. */
export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [term, setTerm] = useState('')
  const [section, setSection] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const { toast } = useUI()

  const load = () => {
    setLoading(true)
    listProductsAdmin({ max: 300 })
      .then(({ items }) => {
        setProducts(items)
        setError('')
      })
      .catch((err) => {
        console.error('No se pudo cargar el catálogo:', err)
        setError('No pudimos cargar los productos.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase()
    return products.filter((p) => {
      if (section && p.section !== section) return false
      if (!needle) return true
      return (
        p.name.toLowerCase().includes(needle) ||
        p.sku.toLowerCase().includes(needle) ||
        p.categoryName.toLowerCase().includes(needle)
      )
    })
  }, [products, term, section])

  const toggleActive = async (product) => {
    // Optimista: si falla se revierte al recargar
    setProducts((list) =>
      list.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)),
    )
    try {
      await setProductActive(product.id, !product.active)
      toast(product.active ? 'Producto oculto' : 'Producto publicado')
    } catch (err) {
      console.error('No se pudo cambiar la visibilidad:', err)
      toast('No se pudo guardar el cambio')
      load()
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setBusy(true)
    try {
      await deleteProduct(pendingDelete.id)
      setProducts((list) => list.filter((p) => p.id !== pendingDelete.id))
      toast('Producto eliminado')
      setPendingDelete(null)
    } catch (err) {
      console.error('No se pudo eliminar:', err)
      toast('No se pudo eliminar el producto')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="admin__head">
        <h1 className="admin__title">Productos ({products.length})</h1>
        <Link to="/admin/productos/nuevo" className="btn btn--sm">
          Nuevo producto
        </Link>
      </div>

      <div className="admin-filters">
        <input
          className="field__control"
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por nombre, referencia o categoría"
          style={{ minWidth: 260 }}
        />
        <select
          className="field__control"
          value={section}
          onChange={(e) => setSection(e.target.value)}
        >
          <option value="">Todas las secciones</option>
          {SECTIONS.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader label="Cargando productos" />
      ) : error ? (
        <p className="alert alert--error">{error}</p>
      ) : !filtered.length ? (
        <p className="u-muted">
          {products.length
            ? 'Ningún producto coincide con la búsqueda.'
            : 'Todavía no has creado productos.'}
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th />
                <th>Producto</th>
                <th>Sección</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const stock = totalStock(product)
                return (
                  <tr key={product.id}>
                    <td data-label="">
                      <img
                        className="table__thumb"
                        src={cldUrl(imageSrc(product.images?.[0]), { w: 90 })}
                        alt=""
                        loading="lazy"
                      />
                    </td>
                    <td data-label="Producto">
                      <Link to={`/admin/productos/${product.id}`}>{product.name}</Link>
                      {product.sku ? (
                        <span className="line__meta" style={{ display: 'block' }}>
                          {product.sku}
                        </span>
                      ) : null}
                    </td>
                    <td data-label="Sección">{SECTION_NAMES[product.section] ?? '—'}</td>
                    <td data-label="Categoría">{product.categoryName || '—'}</td>
                    <td data-label="Precio">{formatPrice(product.price)}</td>
                    <td data-label="Stock" className={stock <= 0 ? 'u-muted' : ''}>{stock}</td>
                    <td data-label="Estado">
                      <span className={`badge ${product.active ? 'badge--solid' : ''}`}>
                        {product.active ? 'Publicado' : 'Oculto'}
                      </span>
                    </td>
                    <td data-label="">
                      <div className="table__actions">
                        <button
                          type="button"
                          className="btn btn--link"
                          onClick={() => toggleActive(product)}
                        >
                          {product.active ? 'Ocultar' : 'Publicar'}
                        </button>
                        <Link to={`/admin/productos/${product.id}`} aria-label="Editar">
                          <Icon name="edit" size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(product)}
                          aria-label="Eliminar"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Eliminar producto"
      >
        <p className="u-muted">
          ¿Seguro que quieres eliminar <strong>{pendingDelete?.name}</strong>? Esta acción no se
          puede deshacer. Si sólo quieres retirarlo de la tienda, usa «Ocultar».
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
          <button type="button" className="btn btn--block" onClick={confirmDelete} disabled={busy}>
            {busy ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => setPendingDelete(null)}
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </>
  )
}
