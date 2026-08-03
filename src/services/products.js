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
 * Corta una consulta que tarda demasiado.
 *
 * Con la red caída el SDK de Firestore reintenta durante mucho rato sin
 * rechazar, y la página se quedaba en «Buscando…» para siempre. Es preferible
 * fallar y decirlo.
 */
function conLimite(promise, ms = 12000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('La consulta tardó demasiado.')), ms),
    ),
  ])
}

/**
 * Distingue "no hay nada" de "no se pudo preguntar".
 *
 * Sin conexión el SDK no rechaza la consulta: responde con lo que tenga en su
 * caché local, que la primera vez está vacía. Eso llegaba a la tienda como un
 * catálogo vacío, y la página decía que no había prendas.
 */
function comprobarConexion(snap) {
  if (snap.empty && snap.metadata.fromCache) {
    throw new Error('No hay conexión con la base de datos.')
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
 * @param {boolean} [opts.wholesale]  sólo prendas con precio al mayor
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
    wholesale,
  } = opts

  const clauses = [where('active', '==', true)]
  if (section) clauses.push(where('section', '==', section))
  if (categorySlug) clauses.push(where('categorySlug', '==', categorySlug))
  if (featured) clauses.push(where('featured', '==', true))

  const snap = await conLimite(getDocs(query(productsRef, ...clauses, fbLimit(max * 2))))
  comprobarConexion(snap)
  let items = snap.docs.map(mapProduct)

  if (sizes?.length) {
    items = items.filter((p) =>
      p.sizes.some((s) => sizes.includes(s.size) && Number(s.stock ?? 0) > 0),
    )
  }
  // El precio al mayor se filtra en memoria: Firestore no ofrece "campo > 0"
  // combinado con el resto de cláusulas sin exigir un índice por combinación.
  if (wholesale) items = items.filter((p) => Number(p.wholesalePrice ?? 0) > 0)
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

/** Texto normalizado para comparar: sin tildes y en minúsculas. */
function normalizar(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** Todo el texto de un producto en el que tiene sentido buscar. */
function textoBuscable(p) {
  return normalizar(
    [p.name, p.categoryName, p.section, p.sku, p.description, (p.tags ?? []).join(' ')].join(' '),
  )
}

// El catálogo activo se guarda unos minutos: la búsqueda de reserva lo recorre
// en memoria y así no se repiten las lecturas en cada consulta.
const CATALOGO_MS = 5 * 60 * 1000
let catalogoCache = null
let catalogoEn = 0

/** Olvida el catálogo guardado. Se llama al tocar cualquier producto. */
export function invalidateCatalog() {
  catalogoCache = null
  catalogoEn = 0
}

async function catalogoActivo() {
  if (catalogoCache && Date.now() - catalogoEn < CATALOGO_MS) return catalogoCache

  const snap = await conLimite(
    getDocs(query(productsRef, where('active', '==', true), fbLimit(500))),
  )

  comprobarConexion(snap)

  catalogoCache = snap.docs.map(mapProduct)
  catalogoEn = Date.now()
  return catalogoCache
}

/**
 * Busca prendas por nombre, categoría, sección, referencia, etiquetas o
 * descripción.
 *
 * Primero se intenta la consulta por prefijos, que resuelve Firestore. Puede no
 * estar disponible: combinar `active` con `array-contains` exige un índice
 * compuesto que hay que desplegar aparte, y hasta que exista Firestore rechaza
 * la consulta. Por eso, si falla —o si no encuentra nada, porque algún producto
 * se guardara sin `searchTokens`— se recorre el catálogo en memoria.
 *
 * La reserva busca además por trozo de palabra y exige todas las palabras, así
 * que «baggy» encuentra «Jean baggy azul», y «jean baggy» también.
 */
export async function searchProducts(term, max = 40) {
  const limpio = normalizar(term).trim()
  const palabras = limpio.split(/\s+/).filter((w) => w.length > 1)
  if (!palabras.length) return []

  // 1) Consulta indexada: sólo sirve con una palabra y buscando por prefijo
  if (palabras.length === 1) {
    try {
      const snap = await conLimite(
        getDocs(
          query(
            productsRef,
            where('active', '==', true),
            where('searchTokens', 'array-contains', palabras[0].slice(0, 12)),
            fbLimit(max),
          ),
        ),
      )
      if (snap.docs.length) return snap.docs.map(mapProduct)
    } catch (err) {
      console.warn('Búsqueda indexada no disponible, se busca en memoria:', err?.code ?? err)
    }
  }

  // 2) Reserva en memoria; primero los que llevan el término en el nombre
  const catalogo = await catalogoActivo()
  return catalogo
    .filter((p) => palabras.every((w) => textoBuscable(p).includes(w)))
    .sort(
      (a, b) =>
        (normalizar(a.name).includes(limpio) ? 0 : 1) -
        (normalizar(b.name).includes(limpio) ? 0 : 1),
    )
    .slice(0, max)
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
  invalidateCatalog()
  return ref.id
}

export async function updateProduct(id, input) {
  await updateDoc(doc(db, COL.products, id), {
    ...toDocument(input),
    updatedAt: serverTimestamp(),
  })
  invalidateCatalog()
}

/** Cambia sólo la visibilidad, sin tocar el resto del documento. */
export async function setProductActive(id, active) {
  await updateDoc(doc(db, COL.products, id), { active, updatedAt: serverTimestamp() })
  invalidateCatalog()
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, COL.products, id))
  invalidateCatalog()
}
