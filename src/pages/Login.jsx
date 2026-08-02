import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { Loader } from '../components/ui/State.jsx'
import { authErrorMessage } from '../lib/format.js'
import { identifierToEmail } from '../lib/auth.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useUI } from '../context/UIContext.jsx'

/**
 * Acceso a la tienda. Admite tanto el usuario corto del personal
 * (`adminziba`) como el correo completo de un cliente.
 */
export default function Login() {
  const { user, loading, login, resetPassword } = useAuth()
  const { toast } = useUI()
  const navigate = useNavigate()
  const location = useLocation()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const destination = location.state?.from?.pathname ?? '/cuenta'

  if (loading) return <Loader />
  if (user) return <Navigate to={destination} replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const email = identifierToEmail(identifier)
    if (!email || !password) {
      setError('Escribe tu usuario y tu contraseña.')
      return
    }

    setBusy(true)
    try {
      await login({ email, password })
      navigate(destination, { replace: true })
    } catch (err) {
      setError(authErrorMessage(err.code))
      setBusy(false)
    }
  }

  const onReset = async () => {
    const email = identifierToEmail(identifier)
    if (!email) {
      setError('Escribe tu usuario para enviarte el enlace de recuperación.')
      return
    }
    try {
      await resetPassword(email)
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
          <span className="field__label">Usuario o correo</span>
          <input
            className="field__control"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="adminziba"
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

        <button
          type="submit"
          className="btn btn--block"
          disabled={busy}
          style={{ marginTop: '1.5rem' }}
        >
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--link" onClick={onReset}>
          ¿Olvidaste tu contraseña?
        </button>
      </p>

      <div className="auth__alt">
        ¿Eres cliente y aún no tienes cuenta?{' '}
        <Link to="/registro" className="u-link">
          Regístrate
        </Link>
      </div>
    </div>
  )
}
