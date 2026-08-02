import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { COL, db } from '../lib/firebase.js'
import { slugify } from '../lib/format.js'

const categoriesRef = collection(db, COL.categories)

function mapCategory(snap) {
  const data = snap.data() ?? {}
  return {
    id: snap.id,
    name: data.name ?? '',
    slug: data.slug ?? snap.id,
    section: data.section ?? '',
    description: data.description ?? '',
    image: data.image ?? null,
    order: Number(data.order ?? 0),
    active: data.active !== false,
  }
}

/** Todas las categorías visibles, ordenadas por posición y nombre. */
export async function listCategories({ section, includeHidden = false } = {}) {
  const clauses = []
  if (section) clauses.push(where('section', '==', section))
  if (!includeHidden) clauses.push(where('active', '==', true))

  const snap = await getDocs(clauses.length ? query(categoriesRef, ...clauses) : categoriesRef)
  return snap.docs
    .map(mapCategory)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'es'))
}

export async function getCategoryBySlug(slug) {
  const snap = await getDocs(query(categoriesRef, where('slug', '==', slug)))
  return snap.empty ? null : mapCategory(snap.docs[0])
}

/** Agrupa las categorías por sección: { mujer: [...], hombre: [...] } */
export function groupBySection(categories) {
  return categories.reduce((acc, cat) => {
    ;(acc[cat.section] ??= []).push(cat)
    return acc
  }, {})
}

function toDocument(input) {
  const name = String(input.name ?? '').trim()
  return {
    name,
    slug: input.slug ? slugify(input.slug) : slugify(name),
    section: input.section ?? '',
    description: String(input.description ?? '').trim(),
    image: input.image ?? null,
    order: Number(input.order ?? 0),
    active: input.active !== false,
  }
}

export async function createCategory(input) {
  const ref = await addDoc(categoriesRef, {
    ...toDocument(input),
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateCategory(id, input) {
  await updateDoc(doc(db, COL.categories, id), {
    ...toDocument(input),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCategory(id) {
  await deleteDoc(doc(db, COL.categories, id))
}
