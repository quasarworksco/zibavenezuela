import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { Loader } from './ui/State.jsx'
import { useAuth } from '../context/AuthContext.jsx'

/** Exige sesión iniciada; recuerda a dónde iba el visitante. */
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loader label="Comprobando tu sesión" />
  if (!user) return <Navigate to="/entrar" state={{ from: location }} replace />

  return <Outlet />
}

/**
 * Exige rol de administrador.
 * El rol se lee del perfil en Firestore y se respalda con las reglas de
 * seguridad: ocultar la ruta es sólo la primera capa.
 */
export function RequireAdmin() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loader label="Comprobando permisos" />
  if (!user) return <Navigate to="/entrar" state={{ from: location }} replace />

  // Cuando `loading` es falso el perfil ya está resuelto: si falta, es que no
  // se pudo leer, y sin perfil no hay forma de acreditar el rol.
  if (profile?.role !== 'admin') return <Navigate to="/" replace />

  return <Outlet />
}
