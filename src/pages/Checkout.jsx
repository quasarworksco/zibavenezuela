import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import Icon from '../components/ui/Icon.jsx'
import { cldUrl } from '../lib/cloudinary.js'
import { formatPrice } from '../lib/format.js'
import {
  ESTADOS_VE,
  FREE_SHIPPING_THRESHOLD,
  PAYMENT_METHODS,
  SHIPPING_METHODS,
} from '../lib/constants.js'
import { createOrder } from '../services/orders.js'
import { useCart } from '../context/CartContext.jsx'
import { useUI } from '../context/UIContext.jsx'

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  idCard: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  note: '',
}

/** Tramitación del pedido: datos, envío y forma de pago en una sola página. */
export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const { toast } = useUI()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [shippingId, setShippingId] = useState(SHIPPING_METHODS[0].id)
  const [paymentId, setPaymentId] = useState(PAYMENT_METHODS[0].id)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState('')

  const shippingMethod = SHIPPING_METHODS.find((m) => m.id === shippingId)
  const paymentMethod = PAYMENT_METHODS.find((m) => m.id === paymentId)

  // El envío gratuito se aplica por importe, salvo el retiro que ya es gratis
  const shippingCost = useMemo(() => {
    if (!shippingMethod) return 0
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0
    return shippingMethod.price
  }, [shippingMethod, subtotal])

  const total = subtotal + shippingCost

  if (!items.length) return <Navigate to="/cesta" replace />

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const validate = () => {
    const next = {}
    if (!form.firstName.trim()) next.firstName = 'Escribe tu nombre.'
    if (!form.lastName.trim()) next.lastName = 'Escribe tu apellido.'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = 'Escribe un correo válido.'
    if (!/^[\d+\s()-]{7,}$/.test(form.phone)) next.phone = 'Escribe un teléfono válido.'

    // El retiro en tienda no necesita dirección
    if (shippingId !== 'retiro') {
      if (!form.address.trim()) next.address = 'Escribe la dirección de entrega.'
      if (!form.city.trim()) next.city = 'Escribe la ciudad.'
      if (!form.state) next.state = 'Selecciona el estado.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setFailure('')

    if (!validate()) {
      toast('Revisa los datos marcados')
      return
    }

    setSending(true)
    try {
      const id = await createOrder({
        items,
        customer: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          idCard: form.idCard.trim(),
        },
        shipping: {
          methodId: shippingId,
          methodName: shippingMethod.name,
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state,
          zip: form.zip.trim(),
        },
        payment: {
          methodId: paymentId,
          methodName: paymentMethod.name,
        },
        shippingCost,
        note: form.note.trim(),
      })

      clear()
      navigate(`/pedido/${id}`, { replace: true })
    } catch (err) {
      console.error('No se pudo registrar el pedido:', err)
      setFailure('No pudimos registrar tu pedido. Inténtalo de nuevo en unos segundos.')
      setSending(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page__title">Tramitar pedido</h1>

      <div className="steps">
        <span className="steps__item is-done">Cesta</span>
        <span>›</span>
        <span className="steps__item is-active">Datos y pago</span>
        <span>›</span>
        <span className="steps__item">Confirmación</span>
      </div>

      <form className="two-col" onSubmit={onSubmit} noValidate>
        <div>
          <p className="page__subtitle">Tus datos</p>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Nombre</span>
              <input
                className="field__control"
                value={form.firstName}
                onChange={update('firstName')}
                autoComplete="given-name"
              />
              {errors.firstName ? <span className="field__error">{errors.firstName}</span> : null}
            </label>

            <label className="field">
              <span className="field__label">Apellido</span>
              <input
                className="field__control"
                value={form.lastName}
                onChange={update('lastName')}
                autoComplete="family-name"
              />
              {errors.lastName ? <span className="field__error">{errors.lastName}</span> : null}
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Correo electrónico</span>
              <input
                className="field__control"
                type="email"
                value={form.email}
                onChange={update('email')}
                autoComplete="email"
              />
              {errors.email ? <span className="field__error">{errors.email}</span> : null}
            </label>

            <label className="field">
              <span className="field__label">Teléfono / WhatsApp</span>
              <input
                className="field__control"
                type="tel"
                value={form.phone}
                onChange={update('phone')}
                placeholder="0412 000 0000"
                autoComplete="tel"
              />
              {errors.phone ? <span className="field__error">{errors.phone}</span> : null}
            </label>
          </div>

          <label className="field">
            <span className="field__label">Cédula o RIF (opcional)</span>
            <input className="field__control" value={form.idCard} onChange={update('idCard')} />
          </label>

          <p className="page__subtitle" style={{ marginTop: '2.5rem' }}>
            Entrega
          </p>

          <div className="pay">
            {SHIPPING_METHODS.map((m) => (
              <label
                key={m.id}
                className={`pay__option ${shippingId === m.id ? 'is-active' : ''}`}
              >
                <input
                  type="radio"
                  name="shipping"
                  value={m.id}
                  checked={shippingId === m.id}
                  onChange={() => setShippingId(m.id)}
                />
                <span style={{ flex: 1 }}>
                  <span className="pay__name">{m.name}</span>
                  <span className="pay__desc">{m.description}</span>
                </span>
                <span className="pay__name">
                  {subtotal >= FREE_SHIPPING_THRESHOLD || m.price === 0
                    ? 'Gratis'
                    : formatPrice(m.price)}
                </span>
              </label>
            ))}
          </div>

          {shippingId !== 'retiro' ? (
            <>
              <label className="field" style={{ marginTop: '1.5rem' }}>
                <span className="field__label">Dirección</span>
                <input
                  className="field__control"
                  value={form.address}
                  onChange={update('address')}
                  placeholder="Calle, edificio, piso, referencia"
                  autoComplete="street-address"
                />
                {errors.address ? <span className="field__error">{errors.address}</span> : null}
              </label>

              <div className="field-row">
                <label className="field">
                  <span className="field__label">Ciudad</span>
                  <input
                    className="field__control"
                    value={form.city}
                    onChange={update('city')}
                    autoComplete="address-level2"
                  />
                  {errors.city ? <span className="field__error">{errors.city}</span> : null}
                </label>

                <label className="field">
                  <span className="field__label">Estado</span>
                  <select className="field__control" value={form.state} onChange={update('state')}>
                    <option value="">Selecciona…</option>
                    {ESTADOS_VE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.state ? <span className="field__error">{errors.state}</span> : null}
                </label>
              </div>

              <label className="field">
                <span className="field__label">Código postal (opcional)</span>
                <input
                  className="field__control"
                  value={form.zip}
                  onChange={update('zip')}
                  autoComplete="postal-code"
                />
              </label>
            </>
          ) : null}

          <p className="page__subtitle" style={{ marginTop: '2.5rem' }}>
            Forma de pago
          </p>

          <div className="pay">
            {PAYMENT_METHODS.map((m) => (
              <label key={m.id} className={`pay__option ${paymentId === m.id ? 'is-active' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value={m.id}
                  checked={paymentId === m.id}
                  onChange={() => setPaymentId(m.id)}
                />
                <span>
                  <span className="pay__name">{m.name}</span>
                  <span className="pay__desc">{m.description}</span>
                </span>
              </label>
            ))}
          </div>

          <label className="field" style={{ marginTop: '1.5rem' }}>
            <span className="field__label">Nota para el pedido (opcional)</span>
            <textarea
              className="field__control"
              value={form.note}
              onChange={update('note')}
              placeholder="Instrucciones de entrega, horario preferido…"
            />
          </label>
        </div>

        <aside className="summary">
          <p className="summary__title">Tu pedido</p>

          <ul style={{ marginBottom: '1.5rem' }}>
            {items.map((line) => (
              <li
                key={line.key}
                style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}
              >
                <img
                  src={cldUrl(line.image, { w: 120 })}
                  alt=""
                  width="48"
                  style={{ width: 48, aspectRatio: '2 / 3', objectFit: 'cover' }}
                  loading="lazy"
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="line__name" style={{ display: 'block' }}>
                    {line.name}
                  </span>
                  <span className="line__meta">
                    {[line.size && `Talla ${line.size}`, `x${line.quantity}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <span style={{ fontSize: 'var(--fs-sm)' }}>
                  {formatPrice(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="totals">
            <div className="totals__row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="totals__row">
              <span>Envío</span>
              <span>{shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}</span>
            </div>
            <div className="totals__row totals__row--total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {failure ? (
            <p className="alert alert--error" style={{ marginTop: '1rem' }}>
              {failure}
            </p>
          ) : null}

          <button type="submit" className="btn btn--block" disabled={sending} style={{ marginTop: '1.5rem' }}>
            {sending ? 'Registrando…' : 'Confirmar pedido'}
          </button>

          <p className="field__hint" style={{ marginTop: '1rem' }}>
            <Icon name="lock" size={13} /> Al confirmar te enviamos por WhatsApp los datos para
            completar el pago. No guardamos información bancaria.
          </p>

          <p className="field__hint" style={{ marginTop: '0.75rem' }}>
            Guarda el enlace de confirmación: es la forma de consultar tu pedido más adelante.
          </p>
        </aside>
      </form>
    </div>
  )
}
