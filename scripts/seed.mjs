/**
 * Semilla de datos para ZIBA Venezuela.
 *
 * Crea las categorías base y un catálogo de ejemplo para poder ver la tienda
 * funcionando antes de cargar el inventario real.
 *
 *   1. Crea en Firebase Authentication un usuario con correo y contraseña.
 *   2. En Firestore, en `users/<uid>`, pon el campo `role` a "admin".
 *   3. Copia ese correo y contraseña en `.env` (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD).
 *   4. Ejecuta:  npm run seed
 *
 * El script escribe autenticado como ese administrador, de modo que respeta
 * las mismas reglas de seguridad que la aplicación.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Lector mínimo de `.env`: evita añadir una dependencia sólo para esto. */
function loadEnv() {
  const env = { ...process.env }
  try {
    const raw = readFileSync(resolve(root, '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!(key in process.env)) env[key] = value
    }
  } catch {
    console.warn('No se encontró .env; se usarán los valores por defecto.\n')
  }
  return env
}

const env = loadEnv()

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDe3IKcZS0fFm0ttM1Zo1ZlR2vhpNzGGCs',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? 'zibavenezuela-fa1e3.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? 'zibavenezuela-fa1e3',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? 'zibavenezuela-fa1e3.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '1051007117204',
  appId: env.VITE_FIREBASE_APP_ID ?? '1:1051007117204:web:37173534f0021f49da5181',
}

// --- Utilidades compartidas con la aplicación -------------------------------

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function searchTokens(...values) {
  const words = values
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1)

  const tokens = new Set()
  for (const word of words) {
    for (let i = 2; i <= Math.min(word.length, 12); i += 1) tokens.add(word.slice(0, i))
  }
  return [...tokens].slice(0, 200)
}

// --- Datos ------------------------------------------------------------------

const CATEGORIES = [
  { name: 'Camisas y blusas', section: 'mujer', order: 1 },
  { name: 'Vestidos', section: 'mujer', order: 2 },
  { name: 'Pantalones', section: 'mujer', order: 3 },
  { name: 'Abrigos y chaquetas', section: 'mujer', order: 4 },
  { name: 'Punto', section: 'mujer', order: 5 },
  { name: 'Accesorios', section: 'mujer', order: 6 },

  { name: 'Camisas', section: 'hombre', order: 1 },
  { name: 'Camisetas', section: 'hombre', order: 2 },
  { name: 'Pantalones', section: 'hombre', order: 3 },
  { name: 'Abrigos y chaquetas', section: 'hombre', order: 4 },
  { name: 'Punto', section: 'hombre', order: 5 },

  { name: 'Niña', section: 'ninos', order: 1 },
  { name: 'Niño', section: 'ninos', order: 2 },
  { name: 'Bebé', section: 'ninos', order: 3 },
]

const ROPA = ['XS', 'S', 'M', 'L', 'XL']
const NINOS = ['2-3A', '4-5A', '6-7A', '8-9A', '10-11A']

const withStock = (sizes, stock = 8) => sizes.map((size) => ({ size, stock }))

const NEGRO = { name: 'Negro', hex: '#000000' }
const BLANCO = { name: 'Blanco', hex: '#FFFFFF' }
const CRUDO = { name: 'Crudo', hex: '#F1EBE1' }
const GRIS = { name: 'Gris', hex: '#8A8A8A' }

const PRODUCTS = [
  {
    name: 'Camisa fluida de lino',
    section: 'mujer',
    category: 'Camisas y blusas',
    price: 39.9,
    description:
      'Camisa de lino con cuello solapa, manga larga y caída suelta. Cierre frontal de botones.',
    composition: '100% lino',
    care: 'Lavar a máquina a 30°. No usar lejía.',
    sizes: withStock(ROPA),
    colors: [BLANCO, NEGRO, CRUDO],
    tags: ['lino', 'camisa', 'verano'],
    featured: true,
  },
  {
    name: 'Vestido midi plisado',
    section: 'mujer',
    category: 'Vestidos',
    price: 59.9,
    compareAtPrice: 79.9,
    description: 'Vestido midi de tejido plisado con cuello redondo y manga larga.',
    composition: '96% poliéster, 4% elastano',
    care: 'Lavar a mano en agua fría.',
    sizes: withStock(ROPA, 5),
    colors: [NEGRO, CRUDO],
    tags: ['vestido', 'midi', 'fiesta'],
    featured: true,
  },
  {
    name: 'Pantalón recto de tiro alto',
    section: 'mujer',
    category: 'Pantalones',
    price: 45,
    description: 'Pantalón de tiro alto con pierna recta, bolsillos laterales y cierre de cremallera.',
    composition: '63% poliéster, 33% viscosa, 4% elastano',
    sizes: withStock(ROPA),
    colors: [NEGRO, GRIS],
    tags: ['pantalon', 'oficina'],
  },
  {
    name: 'Abrigo largo de paño',
    section: 'mujer',
    category: 'Abrigos y chaquetas',
    price: 129,
    description: 'Abrigo largo con cuello solapa, hombreras y cierre cruzado de botones.',
    composition: '70% lana, 30% poliéster',
    sizes: withStock(['S', 'M', 'L'], 4),
    colors: [NEGRO, CRUDO],
    tags: ['abrigo', 'invierno', 'lana'],
    featured: true,
  },
  {
    name: 'Jersey de punto fino',
    section: 'mujer',
    category: 'Punto',
    price: 34.9,
    description: 'Jersey de punto fino con cuello redondo y puños acanalados.',
    composition: '50% algodón, 50% acrílico',
    sizes: withStock(ROPA),
    colors: [CRUDO, NEGRO, GRIS],
    tags: ['punto', 'jersey'],
  },
  {
    name: 'Bolso tote de piel sintética',
    section: 'mujer',
    category: 'Accesorios',
    price: 49.9,
    description: 'Bolso tote de gran capacidad con asas al hombro y bolsillo interior.',
    composition: 'Exterior 100% poliuretano',
    sizes: [{ size: 'ÚNICA', stock: 12 }],
    colors: [NEGRO],
    tags: ['bolso', 'accesorio'],
  },

  {
    name: 'Camisa oxford slim',
    section: 'hombre',
    category: 'Camisas',
    price: 42,
    description: 'Camisa de algodón oxford con cuello button-down y corte entallado.',
    composition: '100% algodón',
    sizes: withStock(['S', 'M', 'L', 'XL']),
    colors: [BLANCO, NEGRO],
    tags: ['camisa', 'oxford', 'oficina'],
    featured: true,
  },
  {
    name: 'Camiseta de algodón pesado',
    section: 'hombre',
    category: 'Camisetas',
    price: 19.9,
    description: 'Camiseta de cuello redondo en algodón de gramaje alto y caída recta.',
    composition: '100% algodón',
    sizes: withStock(['S', 'M', 'L', 'XL', 'XXL'], 15),
    colors: [BLANCO, NEGRO, GRIS],
    tags: ['camiseta', 'basico'],
  },
  {
    name: 'Pantalón chino recto',
    section: 'hombre',
    category: 'Pantalones',
    price: 49.9,
    description: 'Pantalón chino de algodón elástico con pierna recta y bolsillos laterales.',
    composition: '98% algodón, 2% elastano',
    sizes: withStock(['30', '32', '34', '36', '38']),
    colors: [NEGRO, CRUDO],
    tags: ['pantalon', 'chino'],
  },
  {
    name: 'Chaqueta bomber',
    section: 'hombre',
    category: 'Abrigos y chaquetas',
    price: 89,
    compareAtPrice: 110,
    description: 'Chaqueta bomber con cuello acanalado, bolsillos laterales y cierre de cremallera.',
    composition: '100% poliéster',
    sizes: withStock(['S', 'M', 'L', 'XL'], 6),
    colors: [NEGRO],
    tags: ['chaqueta', 'bomber'],
    featured: true,
  },

  {
    name: 'Vestido niña de algodón',
    section: 'ninos',
    category: 'Niña',
    price: 24.9,
    description: 'Vestido de algodón con manga corta y falda con vuelo.',
    composition: '100% algodón',
    sizes: withStock(NINOS),
    colors: [BLANCO, NEGRO],
    tags: ['vestido', 'nina'],
  },
  {
    name: 'Sudadera niño con capucha',
    section: 'ninos',
    category: 'Niño',
    price: 27.9,
    description: 'Sudadera de felpa con capucha, bolsillo canguro y puños acanalados.',
    composition: '80% algodón, 20% poliéster',
    sizes: withStock(NINOS),
    colors: [GRIS, NEGRO],
    tags: ['sudadera', 'nino'],
  },
]

// --- Ejecución --------------------------------------------------------------

async function main() {
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  const email = env.SEED_ADMIN_EMAIL
  const password = env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    console.error(
      'Faltan SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en el archivo .env.\n' +
        'Crea un usuario administrador en Firebase Authentication y ponle role="admin"\n' +
        'en su documento de la colección `users`.',
    )
    process.exit(1)
  }

  console.log(`Entrando como ${email}…`)
  await signInWithEmailAndPassword(auth, email, password)

  // --- Categorías -----------------------------------------------------------

  console.log('\nCreando categorías…')
  const categorySlugs = new Map()

  for (const cat of CATEGORIES) {
    const slug = slugify(cat.name)
    const id = `${cat.section}-${slug}`
    categorySlugs.set(`${cat.section}::${cat.name}`, slug)

    await setDoc(
      doc(db, 'categories', id),
      {
        name: cat.name,
        slug,
        section: cat.section,
        description: '',
        image: null,
        order: cat.order,
        active: true,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    )
    console.log(`  · ${cat.section}/${slug}`)
  }

  // --- Productos ------------------------------------------------------------

  console.log('\nCreando productos…')
  for (const product of PRODUCTS) {
    const slug = slugify(product.name)
    const categorySlug = categorySlugs.get(`${product.section}::${product.category}`) ?? ''

    await setDoc(
      doc(db, 'products', slug),
      {
        name: product.name,
        slug,
        description: product.description ?? '',
        composition: product.composition ?? '',
        care: product.care ?? '',
        sku: `ZB-${slug.slice(0, 6).toUpperCase()}`,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        section: product.section,
        categorySlug,
        categoryName: product.category,
        // Sin fotos todavía: se suben desde el panel (Cloudinary)
        images: [],
        sizes: product.sizes,
        colors: product.colors ?? [],
        tags: product.tags ?? [],
        featured: Boolean(product.featured),
        isNew: true,
        active: true,
        searchTokens: searchTokens(
          product.name,
          product.category,
          product.section,
          (product.tags ?? []).join(' '),
        ),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    console.log(`  · ${slug}`)
  }

  // --- Comprobación ---------------------------------------------------------

  const check = await getDocs(query(collection(db, 'products'), where('active', '==', true)))
  console.log(`\nListo. La tienda tiene ${check.size} productos publicados.`)
  console.log('Sube las fotografías desde /admin/productos para completarlos.')
  process.exit(0)
}

main().catch((err) => {
  console.error('\nLa semilla falló:', err.message ?? err)
  if (err.code === 'permission-denied') {
    console.error('El usuario no tiene role="admin" en su documento de `users`.')
  }
  process.exit(1)
})
