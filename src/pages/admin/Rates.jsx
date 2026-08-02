import { useCallback, useEffect, useState } from 'react'

import Icon from '../../components/ui/Icon.jsx'
import { Loader } from '../../components/ui/State.jsx'
import { formatBs, formatDateTime, formatPrice } from '../../lib/format.js'
import { realUsd, toBs } from '../../lib/pricing.js'
import { getRates, saveRates } from '../../services/settings.js'
import { fetchBcvRate } from '../../services/bcv.js'
import { invalidateRates } from '../../hooks/useRates.js'
import { useUI } from '../../context/UIContext.jsx'

/** Tasas de cambio de la tienda. */
export default function Rates() {
  const [form, setForm] = useState({ store: '', bcv: '' })
  const [savedAt, setSavedAt] = useState(null)
  const [live, setLive] = useState(null)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useUI()

  const consultarApi = useCallback(async ({ avisar = false } = {}) => {
    setChecking(true)
    const result = await fetchBcvRate()
    setLive(result)
    setChecking(false)
    if (avisar) {
      toast(result ? `Tasa BCV: ${result.rate}` : 'DolarAPI no respondió')
    }
    return result
  }, [toast])

  useEffect(() => {
    let active = true
    getRates()
      .then((rates) => {
        if (!active) return
        setForm({
          store: rates.store ? String(rates.store) : '',
          bcv: rates.bcv ? String(rates.bcv) : '',
        })
        setSavedAt(rates.updatedAt)
      })
      .catch((err) => console.error('No se pudieron cargar las tasas:', err))
      .finally(() => active && setLoading(false))

    consultarApi()
    return () => {
      active = false
    }
  }, [consultarApi])

  const store = Number(form.store) || 0
  const backup = Number(form.bcv) || 0
  // La que realmente se usa: la del API si respondió, si no la de respaldo
  const bcv = live?.rate ?? backup

  const ejemplo = 25
  const enBs = toBs(ejemplo, store)
  const real = realUsd(ejemplo, store, bcv)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (store <= 0) {
      toast('La tasa ZIBA debe ser mayor que cero')
      return
    }
    setSaving(true)
    try {
      await saveRates({ store, bcv: backup })
      invalidateRates()
      setSavedAt(new Date())
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
            <p className="panel__title">Tasa ZIBA</p>

            <label className="field">
              <span className="field__label">Bolívares por dólar</span>
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
          </section>

          <section className="panel">
            <p className="panel__title">Tasa BCV — automática</p>

            {checking ? (
              <p className="u-muted">Consultando DolarAPI…</p>
            ) : live ? (
              <>
                <p className="stat__value" style={{ marginTop: 0 }}>
                  {live.rate}
                </p>
                <p className="field__hint">
                  Desde DolarAPI
                  {live.updatedAt ? ` · actualizada ${formatDateTime(live.updatedAt)}` : ''}. Se
                  consulta sola cada vez que alguien abre la tienda.
                </p>
              </>
            ) : (
              <p className="alert alert--error">
                DolarAPI no respondió. La tienda está usando la tasa de respaldo de abajo.
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => consultarApi({ avisar: true })}
                disabled={checking}
              >
                <Icon name="refresh" size={14} /> Volver a consultar
              </button>
              {live ? (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setForm((f) => ({ ...f, bcv: String(live.rate) }))}
                >
                  Copiar al respaldo
                </button>
              ) : null}
            </div>
          </section>

          <section className="panel">
            <p className="panel__title">Tasa BCV — respaldo</p>

            <label className="field">
              <span className="field__label">Bolívares por dólar</span>
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
                Sólo se usa si DolarAPI no responde. Conviene dejarla parecida a la real para que
                los precios no se disparen si el servicio se cae.
              </span>
            </label>

            {savedAt ? (
              <p className="field__hint">Guardado por última vez: {formatDateTime(savedAt)}</p>
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
              Se calcula con la tasa BCV en uso ({bcv > 0 ? bcv : '—'}
              {live ? ', del API' : ', de respaldo'}).
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
