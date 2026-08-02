import { useRef, useState } from 'react'

import Icon from '../ui/Icon.jsx'
import { cldUrl, isCloudinaryReady, uploadImage } from '../../lib/cloudinary.js'
import { useUI } from '../../context/UIContext.jsx'

/**
 * Subida de fotografías a Cloudinary con reordenación.
 * La primera imagen es la principal: es la que se ve en la rejilla del catálogo.
 */
export default function ImageUploader({ images = [], onChange, alt = '' }) {
  const [uploading, setUploading] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [link, setLink] = useState('')
  const inputRef = useRef(null)
  const { toast } = useUI()

  /**
   * Añade una foto por enlace, sin pasar por Cloudinary. Útil para reutilizar
   * imágenes que ya están publicadas en otro sitio.
   */
  const addByLink = () => {
    const url = link.trim()
    if (!url) return
    if (!/^https?:\/\/\S+$/i.test(url)) {
      toast('El enlace debe empezar por http:// o https://')
      return
    }
    onChange([...images, { publicId: '', url, alt }])
    setLink('')
    toast('Imagen añadida')
  }

  const handleFiles = async (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'))
    if (!files.length) return

    if (!isCloudinaryReady) {
      toast('Configura Cloudinary antes de subir fotos')
      return
    }

    // Cada archivo lleva su propia barra de progreso
    const jobs = files.map((file) => ({ id: `${file.name}-${Date.now()}`, progress: 0 }))
    setUploading(jobs)

    const uploaded = []
    for (const [i, file] of files.entries()) {
      try {
        const result = await uploadImage(file, {
          onProgress: (pct) =>
            setUploading((list) =>
              list.map((j, index) => (index === i ? { ...j, progress: pct } : j)),
            ),
        })
        uploaded.push({ publicId: result.publicId, url: result.url, alt })
      } catch (err) {
        console.error('Fallo al subir la imagen:', err)
        toast(err.message ?? 'No se pudo subir la imagen')
      }
    }

    setUploading([])
    if (uploaded.length) {
      onChange([...images, ...uploaded])
      toast(`${uploaded.length} imagen${uploaded.length === 1 ? '' : 'es'} subida${uploaded.length === 1 ? '' : 's'}`)
    }
  }

  const move = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const remove = (index) => onChange(images.filter((_, i) => i !== index))

  return (
    <>
      <div className="uploader">
        {images.map((img, i) => (
          <div key={`${img.publicId || img.url}-${i}`} className="uploader__item">
            <img src={cldUrl(img.publicId || img.url, { w: 240 })} alt="" loading="lazy" />

            <div className="uploader__tools">
              <button
                type="button"
                className="uploader__btn"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Mover antes"
              >
                ←
              </button>
              <button
                type="button"
                className="uploader__btn"
                onClick={() => remove(i)}
                aria-label="Eliminar imagen"
              >
                <Icon name="close" size={12} />
              </button>
              <button
                type="button"
                className="uploader__btn"
                onClick={() => move(i, 1)}
                disabled={i === images.length - 1}
                aria-label="Mover después"
              >
                →
              </button>
            </div>

            {i === 0 ? <span className="uploader__main-flag">Principal</span> : null}
          </div>
        ))}

        {uploading.map((job) => (
          <div key={job.id} className="uploader__item skeleton">
            <span className="uploader__bar" style={{ width: `${job.progress}%` }} />
          </div>
        ))}

        <button
          type="button"
          className={`uploader__drop ${dragOver ? 'is-over' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
        >
          <Icon name="image" size={22} />
          <span>Añadir fotos</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <p className="field__hint">
        Arrastra las fotos o haz clic. La primera es la principal; usa las flechas para reordenar.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <label className="u-sr" htmlFor="image-link">
          Enlace de la imagen
        </label>
        <input
          id="image-link"
          className="field__control"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addByLink()
            }
          }}
          placeholder="…o pega el enlace de una foto"
          style={{ minHeight: 38, fontSize: 'var(--fs-sm)' }}
        />
        <button type="button" className="btn btn--sm" onClick={addByLink} disabled={!link.trim()}>
          Añadir
        </button>
      </div>

      <p className="field__hint">
        Las fotos por enlace se muestran desde su servidor original: si allí se borran, aquí
        dejan de verse. Subirlas queda más seguro.
      </p>
    </>
  )
}
