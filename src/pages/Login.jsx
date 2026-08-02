import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import Icon from '../components/ui/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'

/** Acceso al panel de administración. La tienda no tiene cuentas de cliente. */
export default function Login() {
  const { isAdmin, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const destination = location.state?.from?.pathname ?? '/admin'

  if (isAdmin) return <Navigate to={destination} replace />

  const onSubmit = (e) => {
    e.preventDefault()
    setError('')
    try {
      login({ username, password })
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth">
      <h1 className="auth__title">Acceso</h1>

      <form onSubmit={onSubmit} noValidate>
        <label className="field">
          <span className="field__label">Usuario</span>
          <input
            className="field__control"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
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

        <button type="submit" className="btn btn--block" style={{ marginTop: '1.5rem' }}>
          Entrar
        </button>
      </form>

      <p className="field__hint" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <Icon name="lock" size={13} /> Zona reservada al equipo de ZIBA.
      </p>
    </div>
  )
}
