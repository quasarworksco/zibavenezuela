/**
 * Cloudinary — subida sin firmar (unsigned) y construcción de URLs.
 *
 * La subida usa un *upload preset* sin firmar; nunca se expone el API secret
 * en el navegador. Configura el preset en:
 *   Cloudinary > Settings > Upload > Upload presets > Signing Mode: Unsigned
 */

// El nombre del cloud y el preset sin firmar son datos públicos por diseño:
// viajan en cada URL de imagen y en cada subida. Se dejan como valor por
// defecto para que la tienda funcione sin configurar nada.
export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? 'jtdqewim'
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? 'zibave'
export const UPLOAD_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER ?? 'ziba'

export const isCloudinaryReady = Boolean(CLOUD_NAME)

/** Imagen de reserva mientras no haya foto: un gris neutro en SVG. */
export const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900">
       <rect width="600" height="900" fill="#f4f4f4"/>
       <text x="300" y="460" text-anchor="middle" fill="#c9c9c9"
             font-family="Helvetica, Arial, sans-serif" font-size="26"
             letter-spacing="8">ZIBA</text>
     </svg>`,
  )

/**
 * Devuelve la URL de una imagen de Cloudinary con transformaciones.
 *
 * Acepta un `publicId` o una URL completa. Si recibe una URL que no es de
 * Cloudinary (por ejemplo una foto externa de prueba) la devuelve tal cual.
 *
 * @param {string} src        publicId o URL
 * @param {object} [opts]
 * @param {number} [opts.w]   ancho en píxeles
 * @param {number} [opts.h]   alto en píxeles
 * @param {string} [opts.crop] modo de recorte (fill, fit, limit…)
 * @param {string} [opts.gravity] punto de interés (auto, face…)
 * @param {number|'auto'} [opts.quality]
 */
export function cldUrl(src, opts = {}) {
  if (!src) return PLACEHOLDER
  if (src.startsWith('data:')) return src

  const {
    w,
    h,
    crop = 'fill',
    gravity = 'auto',
    quality = 'auto',
    format = 'auto',
    dpr = 'auto',
  } = opts

  const parts = [`f_${format}`, `q_${quality}`]
  if (w) parts.push(`w_${Math.round(w)}`)
  if (h) parts.push(`h_${Math.round(h)}`)
  if (w || h) parts.push(`c_${crop}`, `g_${gravity}`)
  if (w && dpr) parts.push(`dpr_${dpr}`)
  const tx = parts.join(',')

  // URL completa de Cloudinary: inyecta las transformaciones tras /upload/
  if (src.includes('res.cloudinary.com')) {
    return src.replace(/\/upload\/(?:v\d+\/)?/, (m) => `/upload/${tx}/${m.slice(8)}`)
  }

  // Cualquier otra URL absoluta se respeta sin tocar
  if (/^https?:\/\//.test(src)) return src

  if (!CLOUD_NAME) return PLACEHOLDER
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${tx}/${src}`
}

/**
 * `srcset` con una relación de aspecto fija: cada ancho lleva su alto.
 *
 * Se usa en la portada, donde la foto ocupa la pantalla completa. Pedir sólo
 * el ancho deja que Cloudinary conserve la forma original de la foto, y al
 * recortarla el navegador con `object-fit: cover` acaba ampliando muchísimo
 * una franja estrecha: eso es lo que se veía borroso en el móvil.
 *
 * `dpr_auto` se omite a propósito: Cloudinary sólo lo resuelve si el servidor
 * envía la cabecera `Accept-CH: DPR`, que GitHub Pages no manda, así que
 * siempre caía en dpr 1. Aquí la densidad la resuelve el navegador eligiendo
 * candidato del `srcset`.
 */
export function cldSrcSetRatio(src, widths, ratio, opts = {}) {
  if (!src || src.startsWith('data:')) return undefined
  if (/^https?:\/\//.test(src) && !src.includes('res.cloudinary.com')) return undefined
  if (!CLOUD_NAME && !src.includes('res.cloudinary.com')) return undefined
  return widths
    .map((w) => `${cldUrl(src, { ...opts, w, h: Math.round(w / ratio), dpr: null })} ${w}w`)
    .join(', ')
}

/** Genera un `srcset` responsivo para una imagen de producto. */
export function cldSrcSet(src, widths = [320, 480, 640, 900, 1200], opts = {}) {
  if (!src || src.startsWith('data:')) return undefined
  if (/^https?:\/\//.test(src) && !src.includes('res.cloudinary.com')) return undefined
  if (!CLOUD_NAME && !src.includes('res.cloudinary.com')) return undefined
  return widths.map((w) => `${cldUrl(src, { ...opts, w })} ${w}w`).join(', ')
}

/**
 * Sube un archivo a Cloudinary.
 *
 * @param {File} file
 * @param {object} [opts]
 * @param {(pct:number)=>void} [opts.onProgress] progreso 0-100
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{publicId:string,url:string,width:number,height:number,format:string}>}
 */
export function uploadImage(file, { onProgress, signal, folder = UPLOAD_FOLDER } = {}) {
  if (!CLOUD_NAME) {
    return Promise.reject(
      new Error('Falta VITE_CLOUDINARY_CLOUD_NAME. Revisa el archivo .env.'),
    )
  }

  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', UPLOAD_PRESET)
    if (folder) form.append('folder', folder)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      let data
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        reject(new Error('Respuesta inesperada de Cloudinary.'))
        return
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          publicId: data.public_id,
          url: data.secure_url,
          width: data.width,
          height: data.height,
          format: data.format,
        })
      } else {
        reject(new Error(data?.error?.message ?? 'No se pudo subir la imagen.'))
      }
    }

    xhr.onerror = () => reject(new Error('Fallo de red al subir la imagen.'))
    xhr.onabort = () => reject(new DOMException('Subida cancelada', 'AbortError'))

    signal?.addEventListener('abort', () => xhr.abort(), { once: true })

    xhr.send(form)
  })
}

/** Devuelve la mejor URL disponible de una imagen guardada en Firestore. */
export function imageSrc(image) {
  if (!image) return ''
  if (typeof image === 'string') return image
  return image.publicId || image.url || ''
}
