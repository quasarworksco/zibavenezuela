import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import Icon from '../../components/ui/Icon.jsx'
import {
  CLOUD_NAME,
  UPLOAD_PRESET,
  cldUrl,
  isCloudinaryReady,
  uploadImage,
} from '../../lib/cloudinary.js'
import { formatPrice } from '../../lib/format.js'
import { mapLimit, nameFromFilename } from '../../lib/batch.js'
import { SECTIONS, SIZE_PRESETS } from '../../lib/constants.js'
import { createProduct } from '../../services/products.js'
import { useCategories } from '../../hooks/useCategories.js'
import { useUI } from '../../context/UIContext.jsx'

/** Fotos subidas a la vez. Cuatro va rápido sin saturar la conexión. */
const SUBIDAS_A_LA_VEZ = 4

/** Productos creados a la vez en Firestore. */
const CREACIONES_A_LA_VEZ = 5

const DEFECTOS = {
  section: SECTIONS[0].slug,
  categorySlug: '',
  price: '',
  wholesalePrice: '',
  wholesaleMinQty: '6',
  sizePreset: 'ropa',
  stock: '5',
  active: true,
  isNew: true,
}

/**
 * Carga masiva: subir muchas fotos y convertirlas en productos.
 * Cada foto es un producto; lo que se repite (sección, categoría, tallas,
 * precios) se define una vez arriba y se aplica a todos.
 */
export default function Bulk() {
  const [borradores, setBorradores] = useState([])
  const [defectos, setDefectos] = useState(DEFECTOS)
  const [subiendo, setSubiendo] = useState(null)
  const [creando, setCreando] = useState(null)
  const [resumen, setResumen] = useState(null)
  const [errores, setErrores] = useState([])
  const inputRef = useRef(null)
  const { categories } = useCategories()
  const { toast } = useUI()

  const categoriasDeSeccion = categories.filter((c) => c.section === defectos.section)

  // --- Subida ---------------------------------------------------------------

  const subirFotos = async (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'))
    if (!files.length) return

    if (!isCloudinaryReady) {
      toast('Configura Cloudinary antes de subir fotos')
      return
    }

    setResumen(null)
    setErrores([])
    setSubiendo({ hechas: 0, total: files.length })

    const resultados = await mapLimit(files, SUBIDAS_A_LA_VEZ, async (file) => {
      const subida = await uploadImage(file)
      setSubiendo((s) => ({ ...s, hechas: s.hechas + 1 }))
      return { subida, file }
    })

    const nuevos = resultados
      .filter((r) => r.ok)
      .map((r, i) => ({
        key: `${Date.now()}-${i}-${r.value.subida.publicId}`,
        image: { publicId: r.value.subida.publicId, url: r.value.subida.url, alt: '' },
        name: nameFromFilename(r.value.file.name),
        price: '',
      }))

    const fallidas = resultados.filter((r) => !r.ok)

    setBorradores((list) => [...list, ...nuevos])
    setSubiendo(null)

    if (fallidas.length) {
      // Sin el motivo no hay forma de saber qué corregir
      fallidas.forEach((r) => console.error('Cloudinary rechazó la subida:', r.error))
      setErrores([...new Set(fallidas.map((r) => r.error?.message ?? 'Error desconocido'))])
      toast(`${nuevos.length} subidas, ${fallidas.length} fallaron`)
    } else {
      toast(`${nuevos.length} foto${nuevos.length === 1 ? '' : 's'} lista${nuevos.length === 1 ? '' : 's'}`)
    }
  }

  // --- Edición de borradores ------------------------------------------------

  const actualizar = (key, campo, valor) => {
    setBorradores((list) => list.map((d) => (d.key === key ? { ...d, [campo]: valor } : d)))
  }

  const quitar = (key) => setBorradores((list) => list.filter((d) => d.key !== key))

  /** Copia el precio de la primera fila a todas las que estén vacías. */
  const rellenarPrecios = () => {
    const precio = defectos.price
    if (!precio) {
      toast('Escribe primero el precio por defecto')
      return
    }
    setBorradores((list) => list.map((d) => (d.price ? d : { ...d, price: precio })))
    toast('Precios rellenados')
  }

  // --- Creación -------------------------------------------------------------

  // Sin precio no se puede vender, así que ese producto nace oculto
  const sinPrecio = borradores.filter((d) => !(Number(d.price) > 0))

  const crearTodos = async () => {
    if (!borradores.length) return

    const categoria = categories.find((c) => c.slug === defectos.categorySlug)
    const tallas = (SIZE_PRESETS[defectos.sizePreset] ?? []).map((size) => ({
      size,
      stock: Number(defectos.stock) || 0,
    }))

    setResumen(null)
    setCreando({ hechas: 0, total: borradores.length })

    const resultados = await mapLimit(borradores, CREACIONES_A_LA_VEZ, async (d) => {
      const precio = Number(d.price) || 0
      const id = await createProduct({
        name: d.name.trim() || 'Sin nombre',
        price: precio,
        section: defectos.section,
        categorySlug: defectos.categorySlug,
        categoryName: categoria?.name ?? '',
        wholesalePrice: defectos.wholesalePrice ? Number(defectos.wholesalePrice) : null,
        wholesaleMinQty: defectos.wholesalePrice ? Number(defectos.wholesaleMinQty) : null,
        images: [{ ...d.image, alt: d.name.trim() }],
        sizes: tallas,
        // Un producto sin precio nunca se publica, aunque la casilla lo pida
        active: defectos.active && precio > 0,
        isNew: defectos.isNew,
      })
      setCreando((c) => ({ ...c, hechas: c.hechas + 1 }))
      return id
    })

    const ok = resultados.filter((r) => r.ok)
    const fallidos = resultados.filter((r) => !r.ok)

    setCreando(null)
    // Sólo se quitan de la lista los que sí se crearon: los fallidos quedan
    // para poder reintentarlos sin volver a subir la foto
    setBorradores(fallidos.map((r) => r.item))
    setResumen({
      creados: ok.length,
      fallidos: fallidos.length,
      ocultos: borradores.filter((d) => !(Number(d.price) > 0)).length - fallidos.length,
    })

    toast(fallidos.length ? `${ok.length} guardados, ${fallidos.length} fallaron` : `${ok.length} productos guardados`)
  }

  const ocupado = Boolean(subiendo || creando)

  return (
    <>
      <div className="admin__head">
        <h1 className="admin__title">Carga masiva</h1>
        <Link to="/admin/productos" className="btn btn--link">
          Ver catálogo
        </Link>
      </div>

      {!isCloudinaryReady ? (
        <p className="alert alert--error" style={{ marginBottom: '1.5rem' }}>
          Cloudinary no está configurado.
        </p>
      ) : null}

      {/* Paso 1 — fotos */}
      <section className="panel">
        <p className="panel__title">1 · Fotos</p>

        <button
          type="button"
          className="uploader__drop"
          style={{ aspectRatio: 'auto', padding: 'var(--sp-6)' }}
          onClick={() => inputRef.current?.click()}
          disabled={ocupado}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (!ocupado) subirFotos(e.dataTransfer.files)
          }}
        >
          <Icon name="image" size={26} />
          <span>Selecciona o arrastra todas tus fotos</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            subirFotos(e.target.files)
            e.target.value = ''
          }}
        />

        {errores.length ? (
          <div className="alert alert--error" style={{ marginTop: 'var(--sp-4)' }}>
            <strong>Cloudinary rechazó las fotos.</strong>
            <ul style={{ marginTop: '0.5rem' }}>
              {errores.map((e) => (
                <li key={e} style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)' }}>
                  {e}
                </li>
              ))}
            </ul>
            <p className="field__hint">
              Lo más habitual es que el upload preset «{UPLOAD_PRESET}» no esté en modo
              <strong> Unsigned</strong>, o que el cloud «{CLOUD_NAME}» no coincida. Se revisa en
              Cloudinary → Settings → Upload → Upload presets.
            </p>
          </div>
        ) : null}

        {subiendo ? (
          <>
            <p className="field__hint">
              Subiendo {subiendo.hechas} de {subiendo.total}…
            </p>
            <div className="progress">
              <span style={{ width: `${(subiendo.hechas / subiendo.total) * 100}%` }} />
            </div>
          </>
        ) : (
          <p className="field__hint">
            Cada foto será un producto. El nombre se toma del archivo. Puedes subirlas todas ahora
            y ponerles nombre, precio y categoría más tarde.
          </p>
        )}
      </section>

      {/* Paso 2 — datos comunes */}
      <section className="panel">
        <p className="panel__title">2 · Datos para todos (opcional)</p>

        <p className="field__hint" style={{ marginTop: 0, marginBottom: 'var(--sp-4)' }}>
          Puedes dejarlo como está y completarlo más tarde desde cada producto.
        </p>

        <div className="field-row">
          <label className="field">
            <span className="field__label">Sección</span>
            <select
              className="field__control"
              value={defectos.section}
              onChange={(e) => setDefectos({ ...defectos, section: e.target.value, categorySlug: '' })}
            >
              {SECTIONS.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Categoría</span>
            <select
              className="field__control"
              value={defectos.categorySlug}
              onChange={(e) => setDefectos({ ...defectos, categorySlug: e.target.value })}
            >
              <option value="">Sin categoría</option>
              {categoriasDeSeccion.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field__label">Precio por defecto ($)</span>
            <input
              className="field__control"
              type="number"
              min="0"
              step="0.01"
              value={defectos.price}
              onChange={(e) => setDefectos({ ...defectos, price: e.target.value })}
            />
          </label>

          <label className="field">
            <span className="field__label">Stock por talla</span>
            <input
              className="field__control"
              type="number"
              min="0"
              value={defectos.stock}
              onChange={(e) => setDefectos({ ...defectos, stock: e.target.value })}
            />
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
              value={defectos.wholesalePrice}
              onChange={(e) => setDefectos({ ...defectos, wholesalePrice: e.target.value })}
              placeholder="Opcional"
            />
          </label>

          <label className="field">
            <span className="field__label">Desde (unidades)</span>
            <input
              className="field__control"
              type="number"
              min="2"
              value={defectos.wholesaleMinQty}
              onChange={(e) => setDefectos({ ...defectos, wholesaleMinQty: e.target.value })}
              disabled={!defectos.wholesalePrice}
            />
          </label>
        </div>

        <label className="field">
          <span className="field__label">Tallas</span>
          <select
            className="field__control"
            value={defectos.sizePreset}
            onChange={(e) => setDefectos({ ...defectos, sizePreset: e.target.value })}
          >
            {Object.entries(SIZE_PRESETS).map(([clave, tallas]) => (
              <option key={clave} value={clave}>
                {clave} — {tallas.join(', ')}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1.5rem' }}>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={defectos.active}
              onChange={(e) => setDefectos({ ...defectos, active: e.target.checked })}
            />
            <span>Publicar en la tienda</span>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={defectos.isNew}
              onChange={(e) => setDefectos({ ...defectos, isNew: e.target.checked })}
            />
            <span>Marcar como novedad</span>
          </label>
        </div>
      </section>

      {/* Paso 3 — nombre y precio de cada uno */}
      {borradores.length ? (
        <section className="panel">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--sp-4)',
            }}
          >
            <p className="panel__title" style={{ margin: 0, border: 0, padding: 0 }}>
              3 · {borradores.length} foto{borradores.length === 1 ? '' : 's'} lista
              {borradores.length === 1 ? '' : 's'}
            </p>
            <button type="button" className="btn btn--ghost btn--sm" onClick={rellenarPrecios}>
              Poner el precio por defecto a los vacíos
            </button>
          </div>

          <div className="bulk">
            {borradores.map((d) => {
              const falta = !d.name.trim() || !(Number(d.price) > 0)
              return (
                <div key={d.key} className={`bulk__item ${falta ? 'bulk__item--falta' : ''}`}>
                  <img
                    className="bulk__thumb"
                    src={cldUrl(d.image.publicId, { w: 120 })}
                    alt=""
                    loading="lazy"
                  />

                  <div className="bulk__campos">
                    <input
                      className="field__control"
                      value={d.name}
                      onChange={(e) => actualizar(d.key, 'name', e.target.value)}
                      placeholder="Nombre del producto"
                      aria-label="Nombre"
                    />
                    <input
                      className="field__control"
                      type="number"
                      min="0"
                      step="0.01"
                      value={d.price}
                      onChange={(e) => actualizar(d.key, 'price', e.target.value)}
                      placeholder="Precio"
                      aria-label="Precio"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => quitar(d.key)}
                    aria-label={`Quitar ${d.name || 'producto'}`}
                    disabled={ocupado}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 'var(--sp-5)' }}>
            {sinPrecio.length ? (
              <p className="field__hint">
                {sinPrecio.length} sin precio: se guardan ocultos y no aparecen en la tienda hasta
                que les pongas uno.
              </p>
            ) : null}

            {creando ? (
              <>
                <p className="field__hint">
                  Creando {creando.hechas} de {creando.total}…
                </p>
                <div className="progress">
                  <span style={{ width: `${(creando.hechas / creando.total) * 100}%` }} />
                </div>
              </>
            ) : (
              <button
                type="button"
                className="btn"
                onClick={crearTodos}
                disabled={ocupado}
              >
                Guardar {borradores.length} producto{borradores.length === 1 ? '' : 's'}
                {defectos.price ? ` · ${formatPrice(Number(defectos.price) || 0)}` : ''}
              </button>
            )}
          </div>
        </section>
      ) : null}

      {resumen ? (
        <section className="panel">
          <p className="panel__title">Resultado</p>
          <p>
            {resumen.creados} producto{resumen.creados === 1 ? '' : 's'} guardado
            {resumen.creados === 1 ? '' : 's'}.
            {resumen.ocultos > 0
              ? ` ${resumen.ocultos} quedaron ocultos por no tener precio: complétalos desde el catálogo filtrando por «Sin completar».`
              : ''}
            {resumen.fallidos
              ? ` ${resumen.fallidos} fallaron y siguen en la lista para reintentar.`
              : ''}
          </p>
          <Link to="/admin/productos" className="btn btn--sm" style={{ marginTop: '1rem' }}>
            Ver el catálogo
          </Link>
        </section>
      ) : null}
    </>
  )
}
