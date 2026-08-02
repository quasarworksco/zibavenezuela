import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore'

import { COL, db } from '../lib/firebase.js'
import { searchTokens, slugify } from '../lib/format.js'

const productsRef = collection(db, COL.products)

/** Normaliza un documento de Firestore a la forma que usa la interfaz. */
function mapProduct(snap) {
  const data = snap.data() ?? {}
  return {
    id: snap.id,
    name: data.name ?? '',
    slug: data.slug ?? snap.id,
    description: data.description ?? '',
    composition: data.composition ?? '',
    care: data.care ?? '',
    sku: data.sku ?? '',
    price: Number(data.price ?? 0),
    compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : null,
    wholesalePrice: data.wholesalePrice ? Number(data.wholesalePrice) : null,
    wholesaleMinQty: Number(data.wholesaleMinQty ?? 0) || null,
    section: data.section ?? '',
    categorySlug: data.categorySlug ?? '',
    categoryName: data.categoryName ?? '',
    images: Array.isArray(data.images) ? data.images : [],
    sizes: Array.isArray(data.sizes) ? data.sizes : [],
    colors: Array.isArray(data.colors) ? data.colors : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    featured: Boolean(data.featured),
    isNew: Boolean(data.isNew),
    active: data.active !== false,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

/** Stock total sumando todas las tallas. */
export function totalStock(product) {
  return (product.sizes ?? []).reduce((sum, s) => sum + Number(s.stock ?? 0), 0)
}

export function isSoldOut(product) {
  return totalStock(product) <= 0
}

/** Ordena en memoria: Firestore no combina bien varios filtros con orderBy. */
function sortProducts(items, sort) {
  const list = [...items]
  switch (sort) {
    case 'precio-asc':
      return list.sort((a, b) => a.price - b.price)
    case 'precio-desc':
      return list.sort((a, b) => b.price - a.price)
    case 'nombre':
      return list.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    case 'nuevo':
    default:
      return list.sort((a, b) => {
        const da = a.createdAt?.seconds ?? 0
        const db_ = b.createdAt?.seconds ?? 0
        return db_ - da
      })
  }
}

/**
 * Lista productos del escaparate.
 *
 * @param {object} [opts]
 * @param {string} [opts.section]      mujer | hombre | ninos
 * @param {string} [opts.categorySlug]
 * @param {string} [opts.sort]
 * @param {number} [opts.max]
 * @param {boolean} [opts.featured]
 * @param {string[]} [opts.sizes]      filtra por tallas disponibles
 * @param {number} [opts.minPrice]
 * @param {number} [opts.maxPrice]
 * @param {boolean} [opts.inStock]
 */
export async function listProducts(opts = {}) {
  const {
    section,
    categorySlug,
    sort = 'nuevo',
    max = 60,
    featured,
    sizes,
    minPrice,
    maxPrice,
    inStock,
  } = opts

  const clauses = [where('active', '==', true)]
  if (section) clauses.push(where('section', '==', section))
  if (categorySlug) clauses.push(where('categorySlug', '==', categorySlug))
  if (featured) clauses.push(where('featured', '==', true))

  const snap = await getDocs(query(productsRef, ...clauses, fbLimit(max * 2)))
  let items = snap.docs.map(mapProduct)

  if (sizes?.length) {
    items = items.filter((p) =>
      p.sizes.some((s) => sizes.includes(s.size) && Number(s.stock ?? 0) > 0),
    )
  }
  if (Number.isFinite(minPrice)) items = items.filter((p) => p.price >= minPrice)
  if (Number.isFinite(maxPrice)) items = items.filter((p) => p.price <= maxPrice)
  if (inStock) items = items.filter((p) => !isSoldOut(p))

  return sortProducts(items, sort).slice(0, max)
}

/** Página de productos para el panel de administración (incluye inactivos). */
export async function listProductsAdmin({ max = 100, cursor = null } = {}) {
  const clauses = [orderBy('createdAt', 'desc'), fbLimit(max)]
  if (cursor) clauses.splice(1, 0, startAfter(cursor))

  const snap = await getDocs(query(productsRef, ...clauses))
  return {
    items: snap.docs.map(mapProduct),
    cursor: snap.docs.at(-1) ?? null,
    done: snap.docs.length < max,
  }
}

export async function getProductById(id) {
  const snap = await getDoc(doc(db, COL.products, id))
  return snap.exists() ? mapProduct(snap) : null
}

/** Busca por slug; si no aparece, prueba con el id (URLs antiguas). */
export async function getProductBySlug(slug) {
  const snap = await getDocs(query(productsRef, where('slug', '==', slug), fbLimit(1)))
  if (!snap.empty) return mapProduct(snap.docs[0])
  return getProductById(slug)
}

/** Productos relacionados: misma categoría, excluyendo el actual. */
export async function listRelated(product, max = 4) {
  if (!product?.categorySlug) return []
  const items = await listProducts({ categorySlug: product.categorySlug, max: max + 4 })
  return items.filter((p) => p.id !== product.id).slice(0, max)
}

/** Búsqueda por prefijo usando el array `searchTokens`. */
export async function searchProducts(term, max = 40) {
  const token = String(term ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)[0]

  if (!token || token.length < 2) return []

  const snap = await getDocs(
    query(
      productsRef,
      where('active', '==', true),
      where('searchTokens', 'array-contains', token.slice(0, 12)),
      fbLimit(max),
    ),
  )
  return snap.docs.map(mapProduct)
}

/** Recupera varios productos por id (para la lista de deseos). */
export async function getProductsByIds(ids = []) {
  const unique = [...new Set(ids)].filter(Boolean)
  if (!unique.length) return []

  // `in` admite hasta 30 valores por consulta
  const chunks = []
  for (let i = 0; i < unique.length; i += 30) chunks.push(unique.slice(i, i + 30))

  const results = await Promise.all(
    chunks.map((chunk) =>
      getDocs(query(productsRef, where('__name__', 'in', chunk))).then((s) =>
        s.docs.map(mapProduct),
      ),
    ),
  )
  return results.flat()
}

/** Construye el documento que se guarda en Firestore. */
function toDocument(input) {
  const name = String(input.name ?? '').trim()
  const slug = input.slug ? slugify(input.slug) : slugify(name)

  return {
    name,
    slug,
    description: String(input.description ?? '').trim(),
    composition: String(input.composition ?? '').trim(),
    care: String(input.care ?? '').trim(),
    sku: String(input.sku ?? '').trim(),
    price: Number(input.price ?? 0),
    compareAtPrice: input.compareAtPrice ? Number(input.compareAtPrice) : null,
    wholesalePrice: input.wholesalePrice ? Number(input.wholesalePrice) : null,
    wholesaleMinQty: input.wholesalePrice ? Number(input.wholesaleMinQty ?? 0) || null : null,
    section: input.section ?? '',
    categorySlug: input.categorySlug ?? '',
    categoryName: input.categoryName ?? '',
    images: (input.images ?? []).map((img) => ({
      publicId: img.publicId ?? '',
      url: img.url ?? '',
      alt: img.alt ?? name,
    })),
    sizes: (input.sizes ?? [])
      .filter((s) => s.size)
      .map((s) => ({ size: String(s.size).trim(), stock: Number(s.stock ?? 0) })),
    colors: input.colors ?? [],
    tags: input.tags ?? [],
    featured: Boolean(input.featured),
    isNew: Boolean(input.isNew),
    active: input.active !== false,
    searchTokens: searchTokens(name, input.categoryName, input.section, (input.tags ?? []).join(' ')),
  }
}

export async function createProduct(input) {
  const ref = await addDoc(productsRef, {
    ...toDocument(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateProduct(id, input) {
  await updateDoc(doc(db, COL.products, id), {
    ...toDocument(input),
    updatedAt: serverTimestamp(),
  })
}

/** Cambia sólo la visibilidad, sin tocar el resto del documento. */
export async function setProductActive(id, active) {
  await updateDoc(doc(db, COL.products, id), { active, updatedAt: serverTimestamp() })
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, COL.products, id))
}
