import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { Loader } from '../components/ui/State.jsx'
import { authErrorMessage } from '../lib/format.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useUI } from '../context/UIContext.jsx'

export default function Register() {
  const { user, loading, register } = useAuth()
  const { toast } = useUI()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <Loader />
  if (user) return <Navigate to="/cuenta" replace />

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setBusy(true)
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        displayName: form.name.trim(),
        phone: form.phone.trim(),
      })
      toast('¡Bienvenida a ZIBA!')
      navigate('/cuenta', { replace: true })
    } catch (err) {
      setError(authErrorMessage(err.code))
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <h1 className="auth__title">Crear cuenta</h1>

      <form onSubmit={onSubmit} noValidate>
        <label className="field">
          <span className="field__label">Nombre y apellido</span>
          <input
            className="field__control"
            value={form.name}
            onChange={update('name')}
            autoComplete="name"
            required
          />
        </label>

        <label className="field">
          <span className="field__label">Correo electrónico</span>
          <input
            className="field__control"
            type="email"
            value={form.email}
            onChange={update('email')}
            autoComplete="email"
            required
          />
        </label>

        <label className="field">
          <span className="field__label">Teléfono / WhatsApp</span>
          <input
            className="field__control"
            type="tel"
            value={form.phone}
            onChange={update('phone')}
            placeholder="0412 000 0000"
            autoComplete="tel"
          />
        </label>

        <label className="field">
          <span className="field__label">Contraseña</span>
          <input
            className="field__control"
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete="new-password"
            required
          />
          <span className="field__hint">Mínimo 6 caracteres.</span>
        </label>

        <label className="field">
          <span className="field__label">Repetir contraseña</span>
          <input
            className="field__control"
            type="password"
            value={form.confirm}
            onChange={update('confirm')}
            autoComplete="new-password"
            required
          />
        </label>

        {error ? (
          <p className="alert alert--error" style={{ marginTop: '1rem' }}>
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn--block" disabled={busy} style={{ marginTop: '1.5rem' }}>
          {busy ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <div className="auth__alt">
        ¿Ya tienes cuenta?{' '}
        <Link to="/entrar" className="u-link">
          Inicia sesión
        </Link>
      </div>
    </div>
  )
}
