import { cldSrcSet, cldUrl, imageSrc } from '../../lib/cloudinary.js'

/**
 * Imagen servida desde Cloudinary con `srcset` responsivo.
 * Acepta tanto el objeto guardado en Firestore como un publicId o una URL.
 */
export default function ProductImage({
  image,
  alt = '',
  width = 600,
  sizes = '(min-width: 1200px) 25vw, (min-width: 768px) 33vw, 50vw',
  className = '',
  loading = 'lazy',
  fetchPriority,
  widths,
}) {
  const src = imageSrc(image)
  const alternative = typeof image === 'object' && image?.alt ? image.alt : alt

  return (
    <img
      className={className}
      src={cldUrl(src, { w: width })}
      srcSet={cldSrcSet(src, widths)}
      sizes={sizes}
      alt={alternative}
      width={width}
      height={Math.round((width * 3) / 2)}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
    />
  )
}
