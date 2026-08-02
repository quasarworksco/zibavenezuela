import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'

import { auth } from '../lib/firebase.js'
import { ensureUserProfile, getUserProfile, updateUserProfile } from '../services/users.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser)
      if (fbUser) {
        try {
          setProfile(await ensureUserProfile(fbUser))
        } catch (err) {
          // Sin perfil la tienda sigue funcionando: sólo se pierden los favoritos
          console.error('No se pudo cargar el perfil:', err)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return null
    const fresh = await getUserProfile(user.uid)
    setProfile(fresh)
    return fresh
  }, [user])

  const register = useCallback(async ({ email, password, displayName, phone }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) await updateProfile(cred.user, { displayName })
    const created = await ensureUserProfile(cred.user, { displayName, phone })
    setProfile(created)
    return cred.user
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }, [])

  const logout = useCallback(() => signOut(auth), [])

  const resetPassword = useCallback((email) => sendPasswordResetEmail(auth, email), [])

  const saveProfile = useCallback(
    async (data) => {
      if (!user) return
      await updateUserProfile(user.uid, data)
      if (data.displayName && data.displayName !== user.displayName) {
        await updateProfile(user, { displayName: data.displayName })
      }
      await refreshProfile()
    },
    [user, refreshProfile],
  )

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      register,
      login,
      logout,
      resetPassword,
      saveProfile,
      refreshProfile,
    }),
    [user, profile, loading, register, login, logout, resetPassword, saveProfile, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
