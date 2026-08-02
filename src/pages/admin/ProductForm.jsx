import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import ImageUploader from '../../components/admin/ImageUploader.jsx'
import Icon from '../../components/ui/Icon.jsx'
import { Loader } from '../../components/ui/State.jsx'
import { slugify } from '../../lib/format.js'
import { COLOR_PRESETS, SECTIONS, SIZE_PRESETS } from '../../lib/constants.js'
import { createProduct, getProductById, updateProduct } from '../../services/products.js'
import { useCategories } from '../../hooks/useCategories.js'
import { useUI } from '../../context/UIContext.jsx'

const EMPTY = {
  name: '',
  slug: '',
  sku: '',
  description: '',
  composition: '',
  care: '',
  price: '',
  compareAtPrice: '',
  wholesalePrice: '',
  wholesaleMinQty: '6',
  section: SECTIONS[0].slug,
  categorySlug: '',
  images: [],
  sizes: [],
  colors: [],
  tags: '',
  featured: false,
  isNew: true,
  active: true,
}

/** Alta y edición de producto. */
export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categories } = useCategories()
  const { toast } = useUI()

  const isEdit = Boolean(id)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isEdit) return undefined
    let active = true

    getProductById(id)
      .then((product) => {
        if (!active) return
        if (!product) {
          toast('Producto no encontrado')
          navigate('/admin/productos', { replace: true })
          return
        }
        setForm({
          ...product,
          price: String(product.price ?? ''),
          compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
          wholesalePrice: product.wholesalePrice ? String(product.wholesalePrice) : '',
          wholesaleMinQty: String(product.wholesaleMinQty ?? 6),
          tags: (product.tags ?? []).join(', '),
        })
      })
      .catch((err) => {
        console.error('No se pudo cargar el producto:', err)
        toast('No se pudo cargar el producto')
      })
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [id, isEdit, navigate, toast])

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const sectionCategories = categories.filter((c) => c.section === form.section)

  // --- Tallas -------------------------------------------------------------

  const addSizePreset = (preset) => {
    const existing = new Set(form.sizes.map((s) => s.size))
    const added = SIZE_PRESETS[preset]
      .filter((size) => !existing.has(size))
      .map((size) => ({ size, stock: 0 }))
    setForm((f) => ({ ...f, sizes: [...f.sizes, ...added] }))
  }

  const updateSize = (index, field, value) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }))
  }

  const removeSize = (index) => {
    setForm((f) => ({ ...f, sizes: f.sizes.filter((_, i) => i !== index) }))
  }

  // --- Colores ------------------------------------------------------------

  const toggleColor = (color) => {
    setForm((f) => {
      const exists = f.colors.some((c) => c.name === color.name)
      return {
        ...f,
        colors: exists ? f.colors.filter((c) => c.name !== color.name) : [...f.colors, color],
      }
    })
  }

  // --- Guardado -----------------------------------------------------------

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'El producto necesita un nombre.'
    if (!form.price || Number(form.price) <= 0) next.price = 'Escribe un precio mayor que cero.'
    if (!form.section) next.section = 'Selecciona una sección.'
    if (form.compareAtPrice && Number(form.compareAtPrice) <= Number(form.price)) {
      next.compareAtPrice = 'El precio anterior debe ser mayor que el actual.'
    }
    if (form.wholesalePrice && Number(form.wholesalePrice) >= Number(form.price)) {
      next.wholesalePrice = 'El precio al mayor debe ser menor que el del detal.'
    }
    if (form.wholesalePrice && Number(form.wholesaleMinQty) < 2) {
      next.wholesaleMinQty = 'La cantidad mínima debe ser 2 o más.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast('Revisa los campos marcados')
      return
    }

    setSaving(true)
    const category = categories.find((c) => c.slug === form.categorySlug)

    const payload = {
      ...form,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      wholesalePrice: form.wholesalePrice ? Number(form.wholesalePrice) : null,
      wholesaleMinQty: form.wholesaleMinQty ? Number(form.wholesaleMinQty) : null,
      categoryName: category?.name ?? '',
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }

    try {
      if (isEdit) {
        await updateProduct(id, payload)
        toast('Producto actualizado')
      } else {
        await createProduct(payload)
        toast('Producto creado')
      }
      navigate('/admin/productos')
    } catch (err) {
      console.error('No se pudo guardar el producto:', err)
      toast('No se pudo guardar. Revisa tu conexión.')
      setSaving(false)
    }
  }

  if (loading) return <Loader label="Cargando producto" />

  return (
    <>
      <div className="admin__head">
        <h1 className="admin__title">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h1>
        <Link to="/admin/productos" className="btn btn--link">
          ← Volver
        </Link>
      </div>

      <form className="admin-form" onSubmit={onSubmit} noValidate>
        <div>
          <section className="panel">
            <p className="panel__title">Información</p>

            <label className="field">
              <span className="field__label">Nombre</span>
              <input
                className="field__control"
                value={form.name}
                onChange={update('name')}
                placeholder="Camisa fluida de lino"
              />
              {errors.name ? <span className="field__error">{errors.name}</span> : null}
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field__label">URL (slug)</span>
                <input
                  className="field__control"
                  value={form.slug}
                  onChange={update('slug')}
                  placeholder={slugify(form.name) || 'se-genera-solo'}
                />
                <span className="field__hint">Si lo dejas vacío se genera a partir del nombre.</span>
              </label>

              <label className="field">
                <span className="field__label">Referencia (SKU)</span>
                <input className="field__control" value={form.sku} onChange={update('sku')} />
              </label>
            </div>

            <label className="field">
              <span className="field__label">Descripción</span>
              <textarea
                className="field__control"
                value={form.description}
                onChange={update('description')}
                placeholder="Cuenta cómo es la prenda, su caída y con qué combinarla."
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field__label">Composición</span>
                <input
                  className="field__control"
                  value={form.composition}
                  onChange={update('composition')}
                  placeholder="100% lino"
                />
              </label>

              <label className="field">
                <span className="field__label">Cuidados</span>
                <input
                  className="field__control"
                  value={form.care}
                  onChange={update('care')}
                  placeholder="Lavar a máquina a 30°"
                />
              </label>
            </div>
          </section>

          <section className="panel">
            <p className="panel__title">Fotografías</p>
            <ImageUploader
              images={form.images}
              alt={form.name}
              onChange={(images) => setForm((f) => ({ ...f, images }))}
            />
          </section>

          <section className="panel">
            <p className="panel__title">Tallas y stock</p>

            <div className="chips" style={{ marginBottom: '1rem' }}>
              {Object.keys(SIZE_PRESETS).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="chip"
                  onClick={() => addSizePreset(preset)}
                >
                  + {preset}
                </button>
              ))}
            </div>

            {form.sizes.length ? (
              <div className="sizes-editor">
                {form.sizes.map((s, i) => (
                  <div key={i} className="sizes-editor__row">
                    <input
                      className="field__control"
                      value={s.size}
                      onChange={(e) => updateSize(i, 'size', e.target.value)}
                      placeholder="Talla"
                    />
                    <input
                      className="field__control"
                      type="number"
                      min="0"
                      value={s.stock}
                      onChange={(e) => updateSize(i, 'stock', Number(e.target.value))}
                      placeholder="Stock"
                    />
                    <button type="button" onClick={() => removeSize(i)} aria-label="Quitar talla">
                      <Icon name="close" size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="u-muted">
                Añade tallas con los atajos de arriba. Sin tallas, el producto se vende como pieza
                única.
              </p>
            )}

            <button
              type="button"
              className="btn btn--link"
              style={{ marginTop: '1rem' }}
              onClick={() => setForm((f) => ({ ...f, sizes: [...f.sizes, { size: '', stock: 0 }] }))}
            >
              + Añadir talla suelta
            </button>
          </section>

          <section className="panel">
            <p className="panel__title">Colores</p>
            <div className="chips">
              {COLOR_PRESETS.map((color) => {
                const active = form.colors.some((c) => c.name === color.name)
                return (
                  <button
                    key={color.name}
                    type="button"
                    className={`chip ${active ? 'is-active' : ''}`}
                    onClick={() => toggleColor(color)}
                    aria-pressed={active}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: color.hex,
                        border: '1px solid rgba(0,0,0,.2)',
                        marginRight: 6,
                        verticalAlign: 'middle',
                      }}
                    />
                    {color.name}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <aside>
          <section className="panel panel--sticky">
            <p className="panel__title">Publicación</p>

            <label className="field">
              <span className="field__label">Sección</span>
              <select className="field__control" value={form.section} onChange={update('section')}>
                {SECTIONS.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.section ? <span className="field__error">{errors.section}</span> : null}
            </label>

            <label className="field">
              <span className="field__label">Categoría</span>
              <select
                className="field__control"
                value={form.categorySlug}
                onChange={update('categorySlug')}
              >
                <option value="">Sin categoría</option>
                {sectionCategories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              {!sectionCategories.length ? (
                <span className="field__hint">
                  No hay categorías en esta sección.{' '}
                  <Link to="/admin/categorias" className="u-link">
                    Crear una
                  </Link>
                </span>
              ) : null}
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field__label">Precio ($)</span>
                <input
                  className="field__control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={update('price')}
                />
                {errors.price ? <span className="field__error">{errors.price}</span> : null}
              </label>

              <label className="field">
                <span className="field__label">Precio anterior</span>
                <input
                  className="field__control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.compareAtPrice}
                  onChange={update('compareAtPrice')}
                />
                {errors.compareAtPrice ? (
                  <span className="field__error">{errors.compareAtPrice}</span>
                ) : null}
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span className="field__label">Precio al mayor ($)</span>
                <input
                  className="field__control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.wholesalePrice}
                  onChange={update('wholesalePrice')}
                  placeholder="Opcional"
                />
                {errors.wholesalePrice ? (
                  <span className="field__error">{errors.wholesalePrice}</span>
                ) : null}
              </label>

              <label className="field">
                <span className="field__label">Desde (unidades)</span>
                <input
                  className="field__control"
                  type="number"
                  min="2"
                  step="1"
                  value={form.wholesaleMinQty}
                  onChange={update('wholesaleMinQty')}
                  disabled={!form.wholesalePrice}
                />
                {errors.wholesaleMinQty ? (
                  <span className="field__error">{errors.wholesaleMinQty}</span>
                ) : null}
              </label>
            </div>

            <p className="field__hint" style={{ marginTop: '-0.5rem' }}>
              Si lo dejas vacío, el producto se vende sólo al detal. Con precio al mayor, la
              tienda lo aplica sola cuando el cliente llega a esa cantidad.
            </p>

            <label className="field">
              <span className="field__label">Etiquetas</span>
              <input
                className="field__control"
                value={form.tags}
                onChange={update('tags')}
                placeholder="lino, verano, oficina"
              />
              <span className="field__hint">Separadas por comas. Ayudan en la búsqueda.</span>
            </label>

            <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1.5rem' }}>
              <label className="checkbox">
                <input type="checkbox" checked={form.active} onChange={update('active')} />
                <span>Visible en la tienda</span>
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={form.featured} onChange={update('featured')} />
                <span>Destacar en la portada</span>
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={form.isNew} onChange={update('isNew')} />
                <span>Marcar como novedad</span>
              </label>
            </div>

            <button type="submit" className="btn btn--block" disabled={saving} style={{ marginTop: '1.5rem' }}>
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </section>
        </aside>
      </form>
    </>
  )
}
