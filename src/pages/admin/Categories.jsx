import { useEffect, useState } from 'react'

import ImageUploader from '../../components/admin/ImageUploader.jsx'
import Icon from '../../components/ui/Icon.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { Loader } from '../../components/ui/State.jsx'
import { cldUrl, imageSrc } from '../../lib/cloudinary.js'
import { slugify } from '../../lib/format.js'
import { SECTIONS, SECTION_NAMES } from '../../lib/constants.js'
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../../services/categories.js'
import { invalidateCategories } from '../../hooks/useCategories.js'
import { useUI } from '../../context/UIContext.jsx'

const EMPTY = {
  name: '',
  slug: '',
  section: SECTIONS[0].slug,
  description: '',
  image: null,
  order: 0,
  active: true,
}

/** Gestión de las categorías del catálogo. */
export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useUI()

  const load = () => {
    setLoading(true)
    listCategories({ includeHidden: true })
      .then(setCategories)
      .catch((err) => {
        console.error('No se pudieron cargar las categorías:', err)
        toast('No se pudieron cargar las categorías')
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const save = async (e) => {
    e.preventDefault()
    if (!editing.name.trim()) {
      toast('La categoría necesita un nombre')
      return
    }

    setSaving(true)
    try {
      if (editing.id) {
        await updateCategory(editing.id, editing)
        toast('Categoría actualizada')
      } else {
        await createCategory(editing)
        toast('Categoría creada')
      }
      invalidateCategories()
      setEditing(null)
      load()
    } catch (err) {
      console.error('No se pudo guardar la categoría:', err)
      toast('No se pudo guardar la categoría')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    setSaving(true)
    try {
      await deleteCategory(pendingDelete.id)
      invalidateCategories()
      setCategories((list) => list.filter((c) => c.id !== pendingDelete.id))
      setPendingDelete(null)
      toast('Categoría eliminada')
    } catch (err) {
      console.error('No se pudo eliminar la categoría:', err)
      toast('No se pudo eliminar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="admin__head">
        <h1 className="admin__title">Categorías ({categories.length})</h1>
        <button type="button" className="btn btn--sm" onClick={() => setEditing({ ...EMPTY })}>
          Nueva categoría
        </button>
      </div>

      {loading ? (
        <Loader label="Cargando categorías" />
      ) : !categories.length ? (
        <p className="u-muted">
          Todavía no hay categorías. Crea las primeras (Camisas, Vestidos, Pantalones…) para
          organizar el catálogo.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th />
                <th>Categoría</th>
                <th>Sección</th>
                <th>URL</th>
                <th>Orden</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td data-label="">
                    <img
                      className="table__thumb"
                      src={cldUrl(imageSrc(cat.image), { w: 90 })}
                      alt=""
                      loading="lazy"
                    />
                  </td>
                  <td data-label="Categoría">{cat.name}</td>
                  <td data-label="Sección">{SECTION_NAMES[cat.section] ?? cat.section}</td>
                  <td data-label="URL" className="u-muted">
                    /{cat.section}/{cat.slug}
                  </td>
                  <td data-label="Orden">{cat.order}</td>
                  <td data-label="Estado">
                    <span className={`badge ${cat.active ? 'badge--solid' : ''}`}>
                      {cat.active ? 'Visible' : 'Oculta'}
                    </span>
                  </td>
                  <td data-label="">
                    <div className="table__actions">
                      <button type="button" onClick={() => setEditing(cat)} aria-label="Editar">
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(cat)}
                        aria-label="Eliminar"
                      >
                        <Icon name="trash" size={16} />
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
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Editar categoría' : 'Nueva categoría'}
      >
        {editing ? (
          <form onSubmit={save}>
            <label className="field">
              <span className="field__label">Nombre</span>
              <input
                className="field__control"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Camisas y blusas"
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field__label">Sección</span>
                <select
                  className="field__control"
                  value={editing.section}
                  onChange={(e) => setEditing({ ...editing, section: e.target.value })}
                >
                  {SECTIONS.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field__label">Orden</span>
                <input
                  className="field__control"
                  type="number"
                  value={editing.order}
                  onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
                />
              </label>
            </div>

            <label className="field">
              <span className="field__label">URL (slug)</span>
              <input
                className="field__control"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                placeholder={slugify(editing.name) || 'se-genera-solo'}
              />
            </label>

            <label className="field">
              <span className="field__label">Descripción</span>
              <textarea
                className="field__control"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                style={{ minHeight: 80 }}
              />
            </label>

            <div className="field">
              <span className="field__label">Imagen de portada</span>
              <ImageUploader
                images={editing.image ? [editing.image] : []}
                alt={editing.name}
                onChange={(images) => setEditing({ ...editing, image: images.at(-1) ?? null })}
              />
            </div>

            <label className="checkbox" style={{ marginTop: '1rem' }}>
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              />
              <span>Visible en el menú de la tienda</span>
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
              <button type="submit" className="btn btn--block" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--block"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Eliminar categoría"
      >
        <p className="u-muted">
          ¿Eliminar <strong>{pendingDelete?.name}</strong>? Los productos que la usan seguirán
          existiendo, pero se quedarán sin categoría.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
          <button type="button" className="btn btn--block" onClick={confirmDelete} disabled={saving}>
            {saving ? 'Eliminando…' : 'Sí, eliminar'}
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
