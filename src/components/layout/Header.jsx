import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import Logo from '../ui/Logo.jsx'
import Icon from '../ui/Icon.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { useWishlist } from '../../context/WishlistContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useUI } from '../../context/UIContext.jsx'

/**
 * Cabecera fija. Sobre la portada es transparente y blanca; en cuanto se hace
 * scroll (o en cualquier otra página) adopta la superficie de vidrio.
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [term, setTerm] = useState('')
  const inputRef = useRef(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { count } = useCart()
  const wishlist = useWishlist()
  const { user, isAdmin } = useAuth()
  const { togglePanel, headerOverlay } = useUI()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cierra el buscador al cambiar de página
  useEffect(() => {
    setSearchOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  // Sobre la portada la cabecera es transparente; el color del texto depende
  // de si debajo hay una fotografía (blanco) o fondo claro (negro).
  const over = headerOverlay && !scrolled

  const handleSearch = (e) => {
    e.preventDefault()
    const q = term.trim()
    if (!q) return
    setSearchOpen(false)
    setTerm('')
    navigate(`/buscar?q=${encodeURIComponent(q)}`)
  }

  return (
    <header
      className={`header ${
        over ? `header--over header--over-${headerOverlay}` : 'header--glass'
      }`}
    >
      <div className="header__left">
        <button
          type="button"
          className="header__burger"
          onClick={() => togglePanel('nav')}
          aria-label="Abrir menú"
        >
          <span className="header__burger-line" />
          <span className="header__burger-line" />
        </button>

        <button
          type="button"
          className="header__action header__action--hide-sm"
          onClick={() => setSearchOpen(true)}
        >
          Buscar
        </button>
      </div>

      <Link to="/" className="header__brand" aria-label="ZIBA — Inicio">
        <Logo className="header__logo" />
      </Link>

      <div className="header__right">
        <button
          type="button"
          className="header__action header__action--icon header__action--only-sm"
          onClick={() => setSearchOpen(true)}
          aria-label="Buscar"
        >
          <Icon name="search" size={19} />
        </button>

        <Link
          to="/favoritos"
          className="header__action header__action--icon"
          aria-label={`Favoritos (${wishlist.count})`}
        >
          <Icon name="heart" size={19} />
          {wishlist.count > 0 ? <span className="header__count">{wishlist.count}</span> : null}
        </Link>

        <Link
          to={user ? '/cuenta' : '/entrar'}
          className="header__action header__action--hide-sm"
        >
          {user ? 'Mi cuenta' : 'Entrar'}
        </Link>

        {isAdmin ? (
          <Link to="/admin" className="header__action header__action--hide-sm">
            Admin
          </Link>
        ) : null}

        <button
          type="button"
          className="header__action header__action--icon"
          onClick={() => togglePanel('cart')}
          aria-label={`Cesta (${count})`}
        >
          <Icon name="bag" size={19} />
          {count > 0 ? <span className="header__count">{count}</span> : null}
        </button>
      </div>

      {searchOpen ? (
        <form className="header__search" onSubmit={handleSearch} role="search">
          <Icon name="search" size={19} />
          <input
            ref={inputRef}
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="¿Qué estás buscando?"
            aria-label="Buscar productos"
          />
          <button type="button" onClick={() => setSearchOpen(false)} aria-label="Cerrar búsqueda">
            <Icon name="close" size={20} />
          </button>
        </form>
      ) : null}
    </header>
  )
}
