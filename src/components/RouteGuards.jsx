import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { Loader } from './ui/State.jsx'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Protege el panel de administración.
 *
 * Es una barrera de interfaz: evita que la sección aparezca sin haber entrado,
 * pero la sesión se resuelve en el navegador, así que no sustituye a un
 * control en el servidor.
 */
export function RequireAdmin() {
  const { isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loader label="Comprobando acceso" />
  if (!isAdmin) return <Navigate to="/entrar" state={{ from: location }} replace />

  return <Outlet />
}
