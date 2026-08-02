import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { checkCredentials, closeSession, openSession, readSession } from '../lib/auth.js'

const AuthContext = createContext(null)

/**
 * Sesión del administrador, resuelta en el navegador.
 * La tienda no tiene cuentas de cliente: se compra como invitado.
 */
export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Rehidrata la sesión guardada al arrancar
  useEffect(() => {
    setIsAdmin(readSession())
    setLoading(false)
  }, [])

  // Si se cierra sesión en otra pestaña, esta se entera
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'ziba.admin.v1') setIsAdmin(readSession())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback(({ username, password }) => {
    if (!checkCredentials(username, password)) {
      const error = new Error('Usuario o contraseña incorrectos.')
      error.code = 'auth/invalid-credential'
      throw error
    }
    openSession()
    setIsAdmin(true)
  }, [])

  const logout = useCallback(() => {
    closeSession()
    setIsAdmin(false)
  }, [])

  const value = useMemo(() => ({ isAdmin, loading, login, logout }), [isAdmin, loading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
