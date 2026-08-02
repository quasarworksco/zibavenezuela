/**
 * Acceso al panel de administración.
 *
 * La tienda no usa Firebase Authentication: la sesión se resuelve en el
 * navegador contra las credenciales de abajo y se recuerda en localStorage.
 *
 * Ten presente que estas credenciales viajan en el JavaScript de la página y
 * son legibles por cualquiera que abra las herramientas de desarrollo. Para
 * cambiarlas hay que editar este archivo y volver a desplegar.
 */

export const ADMIN_USERNAME = 'adminziba'
export const ADMIN_PASSWORD = 'Quasar123.'

const STORAGE_KEY = 'ziba.admin.v1'

/** Comprueba las credenciales escritas en el formulario. */
export function checkCredentials(username, password) {
  return String(username ?? '').trim().toLowerCase() === ADMIN_USERNAME
    && String(password ?? '') === ADMIN_PASSWORD
}

/** ¿Hay sesión de administrador abierta en este navegador? */
export function readSession() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function openSession() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Modo incógnito: la sesión durará lo que dure la pestaña
  }
}

export function closeSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nada que limpiar
  }
}
