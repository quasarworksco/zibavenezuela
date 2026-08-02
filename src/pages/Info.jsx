import { Link, useParams } from 'react-router-dom'

import Icon from '../components/ui/Icon.jsx'
import { STORE } from '../lib/constants.js'
import NotFound from './NotFound.jsx'

/** Contenido estático de atención al cliente, en un solo sitio. */
const PAGES = {
  envios: {
    title: 'Envíos y entregas',
    body: (
      <>
        <p>
          Preparamos los pedidos de lunes a viernes. Todo pedido confirmado antes de las 2:00 p. m.
          sale el mismo día hábil.
        </p>

        <h2>Envío nacional</h2>
        <p>
          Trabajamos con Zoom y MRW a toda Venezuela. El tiempo estimado es de 2 a 5 días hábiles
          según el destino. Costo: $5.
        </p>

        <h2>Delivery en Caracas</h2>
        <p>Entrega en 24 a 48 horas dentro del área metropolitana. Costo: $3.</p>

        <h2>Retiro en tienda</h2>
        <p>Sin costo. Te avisamos por WhatsApp cuando tu pedido esté listo.</p>

        <h2>Seguimiento</h2>
        <p>
          Te escribimos por WhatsApp en cada paso: cuando verificamos el pago, cuando despachamos
          y cuando el pedido llega a destino.
        </p>
      </>
    ),
  },

  cambios: {
    title: 'Cambios y devoluciones',
    body: (
      <>
        <p>
          Dispones de 30 días desde que recibes tu pedido para solicitar un cambio o una
          devolución.
        </p>

        <h2>Condiciones</h2>
        <ul>
          <li>La prenda debe estar sin usar, sin lavar y con su etiqueta original.</li>
          <li>Debe conservarse el empaque en buen estado.</li>
          <li>La ropa interior y los accesorios de baño no admiten cambio por higiene.</li>
          <li>Los artículos rebajados sólo admiten cambio por otra talla.</li>
        </ul>

        <h2>Cómo solicitarlo</h2>
        <p>
          Escríbenos por WhatsApp con tu número de pedido y te indicamos los pasos. El costo del
          envío de retorno corre por cuenta del cliente salvo que la prenda tenga un defecto.
        </p>
      </>
    ),
  },

  tallas: {
    title: 'Guía de tallas',
    body: (
      <>
        <p>Las medidas están en centímetros y corresponden al cuerpo, no a la prenda.</p>

        <h2>Mujer</h2>
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Talla</th>
                <th>Pecho</th>
                <th>Cintura</th>
                <th>Cadera</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>XS</td>
                <td>82-85</td>
                <td>63-66</td>
                <td>89-92</td>
              </tr>
              <tr>
                <td>S</td>
                <td>86-89</td>
                <td>67-70</td>
                <td>93-96</td>
              </tr>
              <tr>
                <td>M</td>
                <td>90-93</td>
                <td>71-75</td>
                <td>97-100</td>
              </tr>
              <tr>
                <td>L</td>
                <td>94-98</td>
                <td>76-80</td>
                <td>101-105</td>
              </tr>
              <tr>
                <td>XL</td>
                <td>99-104</td>
                <td>81-86</td>
                <td>106-111</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Hombre</h2>
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Talla</th>
                <th>Pecho</th>
                <th>Cintura</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>S</td>
                <td>92-96</td>
                <td>78-82</td>
              </tr>
              <tr>
                <td>M</td>
                <td>97-101</td>
                <td>83-87</td>
              </tr>
              <tr>
                <td>L</td>
                <td>102-107</td>
                <td>88-93</td>
              </tr>
              <tr>
                <td>XL</td>
                <td>108-113</td>
                <td>94-99</td>
              </tr>
              <tr>
                <td>XXL</td>
                <td>114-120</td>
                <td>100-106</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>¿Entre dos tallas?</h2>
        <p>
          Recomendamos elegir la mayor si prefieres una caída holgada. Ante la duda, escríbenos y
          te asesoramos.
        </p>
      </>
    ),
  },

  pagos: {
    title: 'Formas de pago',
    body: (
      <>
        <p>
          Al confirmar tu pedido te enviamos por WhatsApp los datos para completar el pago. No
          almacenamos información bancaria en la tienda.
        </p>

        <h2>Métodos disponibles</h2>
        <ul>
          <li>Pago móvil (bancos nacionales).</li>
          <li>Transferencia bancaria en bolívares al cambio del día.</li>
          <li>Zelle en dólares.</li>
          <li>Efectivo contra entrega, sólo en el área metropolitana de Caracas.</li>
        </ul>

        <h2>Verificación</h2>
        <p>
          Una vez recibido el comprobante verificamos el pago y preparamos tu pedido. Te avisamos
          en cada paso por WhatsApp.
        </p>
      </>
    ),
  },

  nosotros: {
    title: 'Quiénes somos',
    body: (
      <>
        <p>
          ZIBA es una tienda venezolana de ropa para mujer, hombre y niños. Buscamos lo que se
          está usando, lo traemos y lo ponemos a buen precio.
        </p>

        <h2>Al detal y al mayor</h2>
        <p>
          Puedes llevarte una sola pieza o surtir tu negocio. A partir de cierta cantidad
          manejamos precios especiales: escríbenos por WhatsApp y te pasamos la lista.
        </p>

        <h2>Cómo trabajamos</h2>
        <p>
          No vamos por temporadas. Reponemos según lo que se vende, así que el catálogo cambia
          seguido. Si algo te gustó y se agotó, avísanos y te escribimos cuando vuelva.
        </p>

        <h2>Dónde estamos</h2>
        <p>
          Operamos en línea para toda Venezuela desde Caracas. Escríbenos por WhatsApp o Instagram
          cuando lo necesites.
        </p>
      </>
    ),
  },

  contacto: {
    title: 'Contacto',
    body: (
      <>
        <p>Atendemos de lunes a viernes de 9:00 a. m. a 6:00 p. m.</p>

        <h2>Escríbenos</h2>
        <ul>
          <li>
            WhatsApp:{' '}
            <a
              className="u-link"
              href={`https://wa.me/${STORE.whatsapp}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              +{STORE.whatsapp}
            </a>
          </li>
          <li>
            Correo:{' '}
            <a className="u-link" href={`mailto:${STORE.email}`}>
              {STORE.email}
            </a>
          </li>
          <li>
            Instagram:{' '}
            <a
              className="u-link"
              href={`https://instagram.com/${STORE.instagram}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              @{STORE.instagram}
            </a>
          </li>
        </ul>

        <h2>Pedidos en curso</h2>
        <p>
          Ten a mano tu número de pedido (empieza por ZB-) para que podamos ayudarte más rápido.
        </p>
      </>
    ),
  },

  privacidad: {
    title: 'Política de privacidad',
    body: (
      <>
        <p>
          En ZIBA tratamos tus datos con el único fin de gestionar tus pedidos y mantener el
          contacto contigo.
        </p>

        <h2>Qué datos guardamos</h2>
        <ul>
          <li>Nombre, correo, teléfono y dirección de envío.</li>
          <li>Historial de pedidos asociado a tu cuenta.</li>
          <li>Tu correo, si te suscribes al newsletter.</li>
        </ul>

        <h2>Qué no guardamos</h2>
        <p>
          Ningún dato bancario. Los pagos se coordinan fuera de la tienda y los comprobantes se
          verifican manualmente.
        </p>

        <h2>Tus derechos</h2>
        <p>
          Puedes pedirnos en cualquier momento acceder, corregir o eliminar tus datos escribiendo a{' '}
          <a className="u-link" href={`mailto:${STORE.email}`}>
            {STORE.email}
          </a>
          .
        </p>
      </>
    ),
  },

  terminos: {
    title: 'Términos y condiciones',
    body: (
      <>
        <h2>Precios</h2>
        <p>
          Todos los precios se expresan en dólares estadounidenses. Los pagos en bolívares se
          calculan a la tasa vigente el día de la transacción.
        </p>

        <h2>Disponibilidad</h2>
        <p>
          El stock se actualiza de forma continua. Si una prenda se agota tras confirmar tu pedido
          te lo comunicamos y te ofrecemos el cambio o el reembolso.
        </p>

        <h2>Confirmación del pedido</h2>
        <p>
          Un pedido se considera confirmado cuando verificamos el pago. Hasta ese momento no se
          reserva la mercancía.
        </p>

        <h2>Fotografías</h2>
        <p>
          Cuidamos que las imágenes reflejen el producto real, aunque el color puede variar
          ligeramente según la pantalla.
        </p>
      </>
    ),
  },
}

export default function Info() {
  const { page } = useParams()
  const content = PAGES[page]

  if (!content) return <NotFound />

  return (
    <div className="page page--narrow">
      <nav className="crumbs" style={{ marginBottom: '1.5rem' }}>
        <Link to="/">Inicio</Link>
        <span>/</span>
        <span>{content.title}</span>
      </nav>

      <h1 className="page__title">{content.title}</h1>

      <div className="prose">{content.body}</div>

      <div className="glass-card" style={{ marginTop: '3rem' }}>
        <p className="section__title" style={{ marginBottom: '0.75rem' }}>
          ¿Te queda alguna duda?
        </p>
        <p className="u-muted">Escríbenos por WhatsApp y te respondemos enseguida.</p>
        <a
          className="btn"
          style={{ marginTop: '1.25rem' }}
          href={`https://wa.me/${STORE.whatsapp}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          <Icon name="whatsapp" size={15} /> Abrir WhatsApp
        </a>
      </div>
    </div>
  )
}
