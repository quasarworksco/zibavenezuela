import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { COL, db } from '../lib/firebase.js'
import { lineIsWholesale, linePrice, realUsd, toBs } from '../lib/pricing.js'

const ordersRef = collection(db, COL.orders)

function mapOrder(snap) {
  const data = snap.data() ?? {}
  return {
    id: snap.id,
    items: Array.isArray(data.items) ? data.items : [],
    customer: data.customer ?? {},
    shipping: data.shipping ?? {},
    payment: data.payment ?? {},
    subtotal: Number(data.subtotal ?? 0),
    shippingCost: Number(data.shippingCost ?? 0),
    total: Number(data.total ?? 0),
    rates: data.rates ?? null,
    status: data.status ?? 'pendiente',
    note: data.note ?? '',
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

/**
 * Registra un pedido. Los importes se recalculan aquí a partir de las líneas
 * para que el documento guardado sea coherente consigo mismo.
 */
export async function createOrder({
  items,
  customer,
  shipping,
  payment,
  shippingCost = 0,
  note = '',
  rates = null,
}) {
  const lines = items.map((item) => ({
    productId: item.productId,
    name: item.name,
    slug: item.slug ?? '',
    image: item.image ?? '',
    size: item.size ?? '',
    color: item.color ?? '',
    price: linePrice(item),
    listPrice: Number(item.price ?? 0),
    wholesale: lineIsWholesale(item),
    quantity: Number(item.quantity ?? 1),
  }))

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
  const cost = Number(shippingCost ?? 0)

  const ref = await addDoc(ordersRef, {
    items: lines,
    customer,
    shipping,
    payment,
    subtotal,
    shippingCost: cost,
    total: subtotal + cost,
    // Se congelan las tasas del momento: un pedido viejo debe poder
    // reconstruirse aunque después cambien
    rates: rates
      ? {
          store: Number(rates.store ?? 0),
          bcv: Number(rates.bcv ?? 0),
          totalBs: toBs(subtotal + cost, rates.store),
          totalRealUsd: realUsd(subtotal + cost, rates.store, rates.bcv),
        }
      : null,
    status: 'pendiente',
    note,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return ref.id
}

export async function getOrder(id) {
  const snap = await getDoc(doc(db, COL.orders, id))
  return snap.exists() ? mapOrder(snap) : null
}

/** Todos los pedidos, para el panel. */
export async function listOrdersAdmin({ status, max = 100 } = {}) {
  const clauses = []
  if (status) clauses.push(where('status', '==', status))
  clauses.push(orderBy('createdAt', 'desc'), fbLimit(max))

  const snap = await getDocs(query(ordersRef, ...clauses))
  return snap.docs.map(mapOrder)
}

export async function updateOrderStatus(id, status) {
  await updateDoc(doc(db, COL.orders, id), { status, updatedAt: serverTimestamp() })
}

/** Mensaje de WhatsApp con el resumen del pedido, para coordinar el pago. */
export function whatsappMessage(order, ref) {
  const lines = order.items
    .map((i) => `• ${i.name}${i.size ? ` · Talla ${i.size}` : ''} x${i.quantity}`)
    .join('\n')

  return encodeURIComponent(
    `Hola ZIBA, acabo de hacer el pedido ${ref}.\n\n${lines}\n\n` +
      `Total: $${order.total.toFixed(2)}\n` +
      `Método de pago: ${order.payment?.methodName ?? '—'}\n\n` +
      'Quedo atento(a) a los datos para completar el pago.',
  )
}
