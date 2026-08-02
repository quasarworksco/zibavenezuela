import { useState } from 'react'
import { Link } from 'react-router-dom'

import Icon from '../ui/Icon.jsx'
import { LogoStacked } from '../ui/Logo.jsx'
import { SECTIONS, STORE } from '../../lib/constants.js'
import { subscribe } from '../../services/newsletter.js'
import { useUI } from '../../context/UIContext.jsx'

function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const { toast } = useUI()

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      await subscribe(email)
      setStatus('done')
      setEmail('')
      toast('Suscripción confirmada')
    } catch (err) {
      setStatus('idle')
      setError(err.message ?? 'No pudimos completar la suscripción.')
    }
  }

  return (
    <section className="newsletter">
      <div className="newsletter__inner">
        <p className="section__title">Newsletter</p>
        <p className="u-muted" style={{ marginTop: '0.75rem' }}>
          Recibe antes que nadie las nuevas colecciones y las rebajas.
        </p>

        {status === 'done' ? (
          <p style={{ marginTop: '1.5rem' }}>
            <Icon name="check" size={16} /> Gracias por suscribirte.
          </p>
        ) : (
          <form className="newsletter__form" onSubmit={onSubmit}>
            <label className="u-sr" htmlFor="newsletter-email">
              Correo electrónico
            </label>
            <input
              id="newsletter-email"
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
            />
            <button type="submit" className="btn" disabled={status === 'sending'}>
              {status === 'sending' ? 'Enviando…' : 'Suscribirme'}
            </button>
          </form>
        )}

        {error ? (
          <p className="field__error" style={{ textAlign: 'left', marginTop: '0.75rem' }}>
            {error}
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <>
      <Newsletter />

      <footer className="footer">
        <div className="footer__grid">
          <div>
            <p className="footer__col-title">Tienda</p>
            <div className="footer__links">
              {SECTIONS.map((s) => (
                <Link key={s.slug} to={`/${s.slug}`}>
                  {s.name}
                </Link>
              ))}
              <Link to="/novedades">Novedades</Link>
            </div>
          </div>

          <div>
            <p className="footer__col-title">Ayuda</p>
            <div className="footer__links">
              <Link to="/info/envios">Envíos y entregas</Link>
              <Link to="/info/cambios">Cambios y devoluciones</Link>
              <Link to="/info/tallas">Guía de tallas</Link>
              <Link to="/info/pagos">Formas de pago</Link>
            </div>
          </div>

          <div>
            <p className="footer__col-title">ZIBA</p>
            <div className="footer__links">
              <Link to="/info/nosotros">Quiénes somos</Link>
              <Link to="/info/contacto">Contacto</Link>
              <Link to="/info/privacidad">Privacidad</Link>
              <Link to="/info/terminos">Términos y condiciones</Link>
            </div>
          </div>

          <div>
            <p className="footer__col-title">Síguenos</p>
            <div className="footer__links">
              <a
                href={`https://instagram.com/${STORE.instagram}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Icon name="instagram" size={14} /> Instagram
              </a>
              <a
                href={`https://wa.me/${STORE.whatsapp}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Icon name="whatsapp" size={14} /> WhatsApp
              </a>
              <a href={`mailto:${STORE.email}`}>
                <Icon name="mail" size={14} /> {STORE.email}
              </a>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <LogoStacked className="footer__logo" />
          <span>© {year} ZIBA Venezuela · Todos los derechos reservados</span>
          <span>Hecho en Venezuela</span>
        </div>
      </footer>
    </>
  )
}
