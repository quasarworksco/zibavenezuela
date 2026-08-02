/**
 * Acceso por nombre de usuario.
 *
 * Firebase Auth trabaja con correos, pero en la tienda basta con escribir el
 * usuario: aquí se le añade el dominio interno. Así se entra con `adminziba`
 * y la contraseña la sigue verificando Firebase, no el navegador.
 */

/** Dominio que se añade cuando se escribe un usuario sin arroba. */
export const USERNAME_DOMAIN = 'zibavenezuela.com'

/** Usuario del administrador de la tienda. */
export const ADMIN_USERNAME = 'adminziba'

/** Correo real del administrador en Firebase Authentication. */
export const ADMIN_EMAIL = `${ADMIN_USERNAME}@${USERNAME_DOMAIN}`

/**
 * Convierte lo que se escribe en el campo de acceso en un correo válido.
 *
 *   adminziba            -> adminziba@zibavenezuela.com
 *   ana@gmail.com        -> ana@gmail.com
 */
export function identifierToEmail(identifier) {
  const value = String(identifier ?? '').trim().toLowerCase()
  if (!value) return ''
  return value.includes('@') ? value : `${value}@${USERNAME_DOMAIN}`
}
