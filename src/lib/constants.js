/** Constantes de negocio de la tienda. */

/** Secciones principales del catálogo. */
export const SECTIONS = [
  { slug: 'mujer', name: 'Mujer' },
  { slug: 'hombre', name: 'Hombre' },
  { slug: 'ninos', name: 'Niños' },
]

export const SECTION_NAMES = Object.fromEntries(SECTIONS.map((s) => [s.slug, s.name]))

/** Tallas sugeridas al crear un producto en el panel. */
export const SIZE_PRESETS = {
  ropa: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  numerica: ['34', '36', '38', '40', '42', '44', '46'],
  calzado: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'],
  ninos: ['2-3A', '4-5A', '6-7A', '8-9A', '10-11A', '12-13A'],
  unica: ['ÚNICA'],
}

/** Colores base, siempre en la paleta de la marca. */
export const COLOR_PRESETS = [
  { name: 'Negro', hex: '#000000' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Gris', hex: '#8A8A8A' },
  { name: 'Beige', hex: '#D8CEC1' },
  { name: 'Crudo', hex: '#F1EBE1' },
  { name: 'Azul', hex: '#243A5E' },
  { name: 'Marrón', hex: '#5B4636' },
  { name: 'Verde', hex: '#3C4B3A' },
]

/** Estados de un pedido, en orden de avance. */
export const ORDER_STATUS = {
  pendiente: 'Pendiente de pago',
  pagado: 'Pago verificado',
  preparando: 'Preparando envío',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const ORDER_STATUS_LIST = Object.keys(ORDER_STATUS)

/** Métodos de pago aceptados. */
export const PAYMENT_METHODS = [
  {
    id: 'pago-movil',
    name: 'Pago móvil',
    description: 'Te enviamos los datos por WhatsApp al confirmar el pedido.',
  },
  {
    id: 'transferencia',
    name: 'Transferencia bancaria',
    description: 'Bancos nacionales en bolívares al cambio del día.',
  },
  {
    id: 'zelle',
    name: 'Zelle',
    description: 'Pago en dólares. Datos por WhatsApp tras confirmar.',
  },
  {
    id: 'efectivo',
    name: 'Efectivo contra entrega',
    description: 'Solo para entregas dentro del área metropolitana de Caracas.',
  },
]

/** Opciones de envío. */
export const SHIPPING_METHODS = [
  {
    id: 'nacional',
    name: 'Envío nacional',
    description: 'Zoom / MRW. De 2 a 5 días hábiles.',
    price: 5,
  },
  {
    id: 'caracas',
    name: 'Delivery Caracas',
    description: 'Entrega en 24-48 horas.',
    price: 3,
  },
  {
    id: 'retiro',
    name: 'Retiro en tienda',
    description: 'Sin costo. Te avisamos cuando esté listo.',
    price: 0,
  },
]

/** Compra mínima para envío gratuito, en dólares. */
export const FREE_SHIPPING_THRESHOLD = 80

/** Estados de Venezuela para la dirección de envío. */
export const ESTADOS_VE = [
  'Amazonas',
  'Anzoátegui',
  'Apure',
  'Aragua',
  'Barinas',
  'Bolívar',
  'Carabobo',
  'Cojedes',
  'Delta Amacuro',
  'Distrito Capital',
  'Falcón',
  'Guárico',
  'La Guaira',
  'Lara',
  'Mérida',
  'Miranda',
  'Monagas',
  'Nueva Esparta',
  'Portuguesa',
  'Sucre',
  'Táchira',
  'Trujillo',
  'Yaracuy',
  'Zulia',
]

/** Criterios de ordenación del listado. */
export const SORT_OPTIONS = [
  { id: 'nuevo', label: 'Novedades' },
  { id: 'precio-asc', label: 'Precio: menor a mayor' },
  { id: 'precio-desc', label: 'Precio: mayor a menor' },
  { id: 'nombre', label: 'Nombre A-Z' },
]

/** Datos de contacto de la tienda. */
export const STORE = {
  name: 'ZIBA VENEZUELA',
  whatsapp: import.meta.env.VITE_STORE_WHATSAPP ?? '584120000000',
  email: import.meta.env.VITE_STORE_EMAIL ?? 'hola@zibavenezuela.com',
  instagram: import.meta.env.VITE_STORE_INSTAGRAM ?? 'zibavenezuela',
}
