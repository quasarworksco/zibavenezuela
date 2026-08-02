import { useState } from 'react'

import { ESTADOS_VE } from '../lib/constants.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useUI } from '../context/UIContext.jsx'

/** Datos personales y dirección guardada del cliente. */
export default function AccountProfile() {
  const { user, profile, saveProfile } = useAuth()
  const { toast } = useUI()

  const [form, setForm] = useState({
    displayName: profile?.displayName ?? user?.displayName ?? '',
    phone: profile?.phone ?? '',
    address: profile?.address?.address ?? '',
    city: profile?.address?.city ?? '',
    state: profile?.address?.state ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await saveProfile({
        displayName: form.displayName.trim(),
        phone: form.phone.trim(),
        address: {
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state,
        },
      })
      toast('Datos guardados')
    } catch (err) {
      console.error('No se pudieron guardar los datos:', err)
      setError('No pudimos guardar los cambios. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 520 }}>
      <p className="page__subtitle">Datos personales</p>

      <label className="field">
        <span className="field__label">Nombre y apellido</span>
        <input className="field__control" value={form.displayName} onChange={update('displayName')} />
      </label>

      <label className="field">
        <span className="field__label">Correo electrónico</span>
        <input className="field__control" value={user?.email ?? ''} disabled />
        <span className="field__hint">El correo no se puede cambiar desde aquí.</span>
      </label>

      <label className="field">
        <span className="field__label">Teléfono / WhatsApp</span>
        <input className="field__control" type="tel" value={form.phone} onChange={update('phone')} />
      </label>

      <p className="page__subtitle" style={{ marginTop: '2.5rem' }}>
        Dirección de envío
      </p>

      <label className="field">
        <span className="field__label">Dirección</span>
        <input
          className="field__control"
          value={form.address}
          onChange={update('address')}
          placeholder="Calle, edificio, piso, referencia"
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span className="field__label">Ciudad</span>
          <input className="field__control" value={form.city} onChange={update('city')} />
        </label>

        <label className="field">
          <span className="field__label">Estado</span>
          <select className="field__control" value={form.state} onChange={update('state')}>
            <option value="">Selecciona…</option>
            {ESTADOS_VE.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p className="alert alert--error" style={{ marginTop: '1rem' }}>
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn" disabled={busy} style={{ marginTop: '1.5rem' }}>
        {busy ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
