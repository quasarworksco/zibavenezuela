import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import ProductGrid from '../components/product/ProductGrid.jsx'
import ProductImage from '../components/product/ProductImage.jsx'
import Icon from '../components/ui/Icon.jsx'
import { cldUrl, imageSrc } from '../lib/cloudinary.js'
import { SECTIONS } from '../lib/constants.js'
import { listProducts } from '../services/products.js'
import { useCategories } from '../hooks/useCategories.js'
import { useUI } from '../context/UIContext.jsx'

/** Portada: gran imagen editorial, accesos por sección y una selección. */
export default function Home() {
  const [featured, setFeatured] = useState([])
  const [latest, setLatest] = useState([])
  const [loading, setLoading] = useState(true)
  const { categories } = useCategories()
  const { setHeaderOverlay } = useUI()

  useEffect(() => {
    let active = true

    Promise.all([listProducts({ featured: true, max: 8 }), listProducts({ max: 8, sort: 'nuevo' })])
      .then(([f, l]) => {
        if (!active) return
        setFeatured(f)
        setLatest(l)
      })
      .catch((err) => console.error('No se pudo cargar la portada:', err))
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // La portada se ilustra con la primera pieza destacada que tenga fotografía
  const heroProduct = featured.find((p) => p.images?.length) ?? latest.find((p) => p.images?.length)
  const heroImage = heroProduct ? imageSrc(heroProduct.images[0]) : null

  // Con foto, la cabecera va en blanco sobre la imagen; sin foto, en negro
  // sobre el fondo claro. Se restablece al salir de la portada.
  useEffect(() => {
    setHeaderOverlay(heroImage ? 'dark' : 'light')
    return () => setHeaderOverlay(null)
  }, [heroImage, setHeaderOverlay])

  // Cuatro categorías con foto para el carrusel
  const railCategories = categories.filter((c) => c.image).slice(0, 8)

  return (
    <>
      {heroImage ? (
        <section className="hero">
          <div className="hero__media">
            <img
              src={cldUrl(heroImage, { w: 1800, h: 1200, gravity: 'auto' })}
              alt=""
              fetchPriority="high"
            />
          </div>

          <div className="hero__content">
            <p className="hero__eyebrow">Nueva colección</p>
            <h1 className="hero__title">
              Otoño
              <br />
              Invierno
            </h1>

            <div className="hero__actions">
              {SECTIONS.map((s) => (
                <Link key={s.slug} to={`/${s.slug}`} className="btn btn--glass">
                  {s.name}
                </Link>
              ))}
            </div>
          </div>

          <span className="hero__scroll">Descubrir</span>
        </section>
      ) : (
        /* Sin fotografía todavía: portada editorial en blanco */
        <section className="hero-plain">
          <p className="hero__eyebrow">Nueva colección</p>
          <h1 className="hero-plain__title">
            Otoño
            <br />
            Invierno
          </h1>
          <span className="hero-plain__rule" />
          <p className="hero-plain__text">
            Prendas de línea limpia, en blanco y negro. Hechas para durar más de una temporada.
          </p>

          <div className="hero__actions">
            {SECTIONS.map((s) => (
              <Link key={s.slug} to={`/${s.slug}`} className="btn btn--ghost">
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {railCategories.length ? (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Comprar por categoría</h2>
            <Link to="/mujer" className="section__link">
              Ver todo
            </Link>
          </div>

          <div className="rail">
            {railCategories.map((cat) => (
              <Link key={cat.id} to={`/${cat.section}/${cat.slug}`} className="rail__item">
                <div className="rail__media">
                  <img src={cldUrl(imageSrc(cat.image), { w: 480 })} alt="" loading="lazy" />
                </div>
                <p className="rail__name">{cat.name}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {featured.length >= 2 ? (
        <section className="split" style={{ marginTop: 'var(--sp-8)' }}>
          {featured.slice(0, 2).map((p) => (
            <Link key={p.id} to={`/producto/${p.slug}`} className="tile tile--tall">
              <ProductImage
                image={p.images?.[0]}
                alt={p.name}
                width={900}
                sizes="(min-width: 768px) 50vw, 100vw"
              />
              <div className="tile__overlay">
                <span className="tile__label">{p.name}</span>
              </div>
            </Link>
          ))}
        </section>
      ) : null}

      {/* Franja negra: corta el blanco y marca el carácter de la marca */}
      <section className="band">
        <p className="band__eyebrow">ZIBA Venezuela</p>
        <h2 className="band__title">Menos, pero mejor</h2>
        <p className="band__text">
          Colecciones cortas y materiales cuidados. Blanco, negro y los tonos que acompañan: lo
          demás lo pone quien las lleva.
        </p>
        <Link to="/info/nosotros" className="btn btn--light">
          Conocer ZIBA
        </Link>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Selección ZIBA</h2>
          <Link to="/novedades" className="section__link">
            Ver novedades
          </Link>
        </div>

        <ProductGrid
          products={featured.length ? featured : latest}
          loading={loading}
          emptyTitle="Muy pronto"
          emptyText="Estamos preparando la primera colección. Vuelve en unos días."
        />
      </section>

      <section className="perks">
        <div className="perk">
          <Icon name="truck" size={20} style={{ margin: '0 auto 0.75rem' }} />
          <p className="perk__title">Envíos a toda Venezuela</p>
          <p className="perk__text">Gratis en compras superiores a $80.</p>
        </div>
        <div className="perk">
          <Icon name="refresh" size={20} style={{ margin: '0 auto 0.75rem' }} />
          <p className="perk__title">Cambios sencillos</p>
          <p className="perk__text">30 días para cambiar tu prenda.</p>
        </div>
        <div className="perk">
          <Icon name="lock" size={20} style={{ margin: '0 auto 0.75rem' }} />
          <p className="perk__title">Compra protegida</p>
          <p className="perk__text">Pago móvil, transferencia y Zelle.</p>
        </div>
      </section>
    </>
  )
}
