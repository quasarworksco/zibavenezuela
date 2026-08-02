import { useEffect, useState } from 'react'

import { Loader } from '../../components/ui/State.jsx'
import { formatBs, formatDateTime, formatPrice } from '../../lib/format.js'
import { realUsd, toBs } from '../../lib/pricing.js'
import { getRates, saveRates } from '../../services/settings.js'
import { invalidateRates } from '../../hooks/useRates.js'
import { useUI } from '../../context/UIContext.jsx'

/** Días tras los cuales conviene revisar la tasa del BCV. */
const STALE_DAYS = 2

/** Tasas de cambio de la tienda. */
export default function Rates() {
  const [form, setForm] = useState({ store: '', bcv: '' })
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useUI()

  useEffect(() => {
    let active = true
    getRates()
      .then((rates) => {
        if (!active) return
        setForm({
          store: rates.store ? String(rates.store) : '',
          bcv: rates.bcv ? String(rates.bcv) : '',
        })
        setUpdatedAt(rates.updatedAt)
      })
      .catch((err) => console.error('No se pudieron cargar las tasas:', err))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const store = Number(form.store) || 0
  const bcv = Number(form.bcv) || 0

  // Ejemplo en vivo para comprobar de un vistazo que las tasas están bien
  const ejemplo = 25
  const enBs = toBs(ejemplo, store)
  const real = realUsd(ejemplo, store, bcv)

  const stale = (() => {
    const d = updatedAt?.toDate?.() ?? (updatedAt ? new Date(updatedAt) : null)
    if (!d) return false
    return (Date.now() - d.getTime()) / 86400000 > STALE_DAYS
  })()

  const onSubmit = async (e) => {
    e.preventDefault()
    if (store <= 0) {
      toast('La tasa de la tienda debe ser mayor que cero')
      return
    }
    setSaving(true)
    try {
      await saveRates({ store, bcv })
      invalidateRates()
      setUpdatedAt(new Date())
      toast('Tasas guardadas')
    } catch (err) {
      console.error('No se pudieron guardar las tasas:', err)
      toast('No se pudieron guardar las tasas')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader label="Cargando tasas" />

  return (
    <>
      <div className="admin__head">
        <h1 className="admin__title">Tasas de cambio</h1>
      </div>

      <div className="admin-form">
        <form onSubmit={onSubmit}>
          <section className="panel">
            <p className="panel__title">Tasas</p>

            <label className="field">
              <span className="field__label">Tasa ZIBA (Bs por dólar)</span>
              <input
                className="field__control"
                type="number"
                min="0"
                step="0.01"
                value={form.store}
                onChange={(e) => setForm((f) => ({ ...f, store: e.target.value }))}
                placeholder="900"
              />
              <span className="field__hint">
                Es la que convierte los precios a bolívares. Se aplica a todo el catálogo.
              </span>
            </label>

            <label className="field">
              <span className="field__label">Tasa BCV (Bs por dólar)</span>
              <input
                className="field__control"
                type="number"
                min="0"
                step="0.01"
                value={form.bcv}
                onChange={(e) => setForm((f) => ({ ...f, bcv: e.target.value }))}
                placeholder="750"
              />
              <span className="field__hint">
                Sólo se usa para mostrar la equivalencia en dólares. Actualízala cuando cambie.
              </span>
            </label>

            {updatedAt ? (
              <p className={stale ? 'alert alert--error' : 'field__hint'} style={{ marginTop: '1rem' }}>
                Última actualización: {formatDateTime(updatedAt)}
                {stale ? ' — conviene revisarla.' : ''}
              </p>
            ) : null}

            <button type="submit" className="btn" disabled={saving} style={{ marginTop: '1.5rem' }}>
              {saving ? 'Guardando…' : 'Guardar tasas'}
            </button>
          </section>
        </form>

        <aside>
          <section className="panel panel--sticky">
            <p className="panel__title">Cómo queda un producto de $25</p>

            {store > 0 ? (
              <div className="totals">
                <div className="totals__row">
                  <span>Precio en divisas</span>
                  <span>{formatPrice(ejemplo)}</span>
                </div>
                <div className="totals__row">
                  <span>En bolívares</span>
                  <span>{formatBs(enBs)}</span>
                </div>
                <div className="totals__row totals__row--total">
                  <span>Precio real</span>
                  <span>{bcv > 0 ? formatPrice(real) : '—'}</span>
                </div>
              </div>
            ) : (
              <p className="u-muted">Escribe la tasa ZIBA para ver el ejemplo.</p>
            )}

            <p className="field__hint" style={{ marginTop: '1.5rem' }}>
              El precio en bolívares sale de multiplicar por la tasa ZIBA. El precio real es ese
              monto dividido entre la tasa BCV, así que se mueve solo cuando el BCV cambia.
            </p>

            {store > 0 && bcv > 0 && store < bcv ? (
              <p className="alert alert--error" style={{ marginTop: '1rem' }}>
                La tasa ZIBA es menor que la del BCV: el precio real quedaría por debajo del precio
                en divisas. Revisa que sea lo que quieres.
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </>
  )
}
