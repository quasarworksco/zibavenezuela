import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { COL, db } from '../lib/firebase.js'
import { lineIsWholesale, linePrice, realUsd, toBs } from '../lib/pricing.js'
import { invalidateCatalog } from './products.js'

const ordersRef = collection(db, COL.orders)

/** Error de existencias, para que la página de tramitación pueda distinguirlo. */
function sinStock(mensaje) {
  const err = new Error(mensaje)
  err.code = 'sin-stock'
  return err
}

/** Agrupa las líneas de un pedido por producto y talla. */
function porProductoYTalla(lines) {
  const mapa = new Map()
  for (const l of lines) {
    if (!l.productId) continue
    const tallas = mapa.get(l.productId) ?? new Map()
    const talla = String(l.size ?? '')
    tallas.set(talla, (tallas.get(talla) ?? 0) + Number(l.quantity ?? 0))
    mapa.set(l.productId, tallas)
  }
  return mapa
}

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

  const documento = {
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
  }

  const orderRef = doc(ordersRef)

  // El pedido y el descuento de existencias van en la misma transacción: si dos
  // personas compran a la vez la última talla M, sólo una de las dos pasa.
  await runTransaction(db, async (tx) => {
    const pedido = porProductoYTalla(lines)
    const ids = [...pedido.keys()]

    // Firestore exige que todas las lecturas precedan a cualquier escritura
    const snaps = await Promise.all(ids.map((id) => tx.get(doc(db, COL.products, id))))

    const cambios = []
    for (let i = 0; i < ids.length; i += 1) {
      const snap = snaps[i]
      if (!snap.exists()) throw sinStock('Una de las prendas ya no está disponible.')

      const producto = snap.data()
      const tallas = Array.isArray(producto.sizes) ? producto.sizes.map((s) => ({ ...s })) : []
      // Prenda sin tallas declaradas: no hay existencias que llevar
      if (!tallas.length) continue

      let tocado = false
      for (const [talla, cantidad] of pedido.get(ids[i])) {
        const fila = tallas.find((s) => String(s.size) === talla)
        // Si la talla ya no figura (la prenda se editó), no se bloquea la venta
        if (!fila) continue

        const hay = Number(fila.stock ?? 0)
        if (hay < cantidad) {
          throw sinStock(
            `Nos quedamos sin «${producto.name}»${talla ? ` en talla ${talla}` : ''}: ` +
              `${hay === 0 ? 'no queda ninguna' : `sólo quedan ${hay}`} y pediste ${cantidad}.`,
          )
        }
        fila.stock = hay - cantidad
        tocado = true
      }

      if (tocado) cambios.push({ ref: snap.ref, sizes: tallas })
    }

    for (const c of cambios) tx.update(c.ref, { sizes: c.sizes, updatedAt: serverTimestamp() })
    tx.set(orderRef, documento)
  })

  invalidateCatalog()
  return orderRef.id
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

/**
 * Mueve el estado de un pedido.
 *
 * Al cancelar se devuelven las existencias. Es idempotente: si el pedido ya
 * estaba cancelado no se toca nada, así que cancelar dos veces no infla el
 * inventario. No hace falta guardar ninguna marca extra en el pedido, lo que
 * evita tener que tocar las reglas de Firestore: el propio estado la hace.
 */
export async function updateOrderStatus(id, status) {
  const orderRef = doc(db, COL.orders, id)

  if (status !== 'cancelado') {
    await updateDoc(orderRef, { status, updatedAt: serverTimestamp() })
    return
  }

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(orderRef)
    if (!snap.exists()) throw new Error('El pedido ya no existe.')

    const pedido = snap.data()
    if (pedido.status === 'cancelado') return

    const porProducto = porProductoYTalla(pedido.items ?? [])
    const ids = [...porProducto.keys()]
    const productos = await Promise.all(ids.map((pid) => tx.get(doc(db, COL.products, pid))))

    const cambios = []
    for (let i = 0; i < ids.length; i += 1) {
      const prod = productos[i]
      // Si la prenda ya no existe no hay dónde devolver: se sigue sin fallar
      if (!prod.exists()) continue

      const tallas = Array.isArray(prod.data().sizes) ? prod.data().sizes.map((s) => ({ ...s })) : []
      let tocado = false
      for (const [talla, cantidad] of porProducto.get(ids[i])) {
        const fila = tallas.find((s) => String(s.size) === talla)
        if (!fila) continue
        fila.stock = Number(fila.stock ?? 0) + cantidad
        tocado = true
      }
      if (tocado) cambios.push({ ref: prod.ref, sizes: tallas })
    }

    for (const c of cambios) tx.update(c.ref, { sizes: c.sizes, updatedAt: serverTimestamp() })
    tx.update(orderRef, { status, updatedAt: serverTimestamp() })
  })

  invalidateCatalog()
}

/** Mensaje de WhatsApp con el resumen del pedido, para coordinar el pago. */
export function whatsappMessage(order, ref) {
  const lines = order.items
    .map((i) => `• ${i.name}${i.size ? ` · Talla ${i.size}` : ''} x${i.quantity}`)
    .join('\n')

  const bs = Number(order.rates?.totalBs ?? 0)

  return encodeURIComponent(
    `Hola ZIBA, acabo de hacer el pedido ${ref}.\n\n${lines}\n\n` +
      `Total: $${order.total.toFixed(2)}\n` +
      (bs > 0 ? `Total en bolívares: Bs ${bs.toFixed(2)}\n` : '') +
      `Método de pago: ${order.payment?.methodName ?? '—'}\n\n` +
      'Quedo atento(a) a los datos para completar el pago.',
  )
}
