import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { Loader } from '../components/ui/State.jsx'
import { authErrorMessage } from '../lib/format.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useUI } from '../context/UIContext.jsx'

export default function Login() {
  const { user, loading, login, loginWithGoogle, resetPassword } = useAuth()
  const { toast } = useUI()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const destination = location.state?.from?.pathname ?? '/cuenta'

  if (loading) return <Loader />
  if (user) return <Navigate to={destination} replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login({ email: email.trim(), password })
      navigate(destination, { replace: true })
    } catch (err) {
      setError(authErrorMessage(err.code))
      setBusy(false)
    }
  }

  const onGoogle = async () => {
    setError('')
    setBusy(true)
    try {
      await loginWithGoogle()
      navigate(destination, { replace: true })
    } catch (err) {
      setError(authErrorMessage(err.code))
      setBusy(false)
    }
  }

  const onReset = async () => {
    if (!email.trim()) {
      setError('Escribe tu correo para enviarte el enlace de recuperación.')
      return
    }
    try {
      await resetPassword(email.trim())
      toast('Te enviamos un correo para restablecer la contraseña')
    } catch (err) {
      setError(authErrorMessage(err.code))
    }
  }

  return (
    <div className="auth">
      <h1 className="auth__title">Iniciar sesión</h1>

      <form onSubmit={onSubmit} noValidate>
        <label className="field">
          <span className="field__label">Correo electrónico</span>
          <input
            className="field__control"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="field">
          <span className="field__label">Contraseña</span>
          <input
            className="field__control"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error ? (
          <p className="alert alert--error" style={{ marginTop: '1rem' }}>
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn--block" disabled={busy} style={{ marginTop: '1.5rem' }}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <button
        type="button"
        className="btn btn--ghost btn--block"
        onClick={onGoogle}
        disabled={busy}
        style={{ marginTop: '0.5rem' }}
      >
        Continuar con Google
      </button>

      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--link" onClick={onReset}>
          ¿Olvidaste tu contraseña?
        </button>
      </p>

      <div className="auth__alt">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/registro" className="u-link">
          Regístrate
        </Link>
      </div>
    </div>
  )
}
