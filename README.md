# ZIBA VENEZUELA

Tienda online de ropa. Catálogo por categorías, carrito, compra y panel de
administración. Estética en blanco y negro con superficies de vidrio
(*glassmorphism*) en los elementos flotantes.

**Stack:** React 19 · Vite 7 · React Router 7 · Firebase (Auth + Firestore) ·
Cloudinary (imágenes) · CSS propio, sin framework.

---

## Puesta en marcha

```bash
npm install
cp .env.example .env      # completa los valores
npm run dev               # http://localhost:5173
```

| Comando           | Qué hace                               |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Servidor de desarrollo                 |
| `npm run build`   | Compila a `dist/`                      |
| `npm run preview` | Sirve el resultado de `build`          |
| `npm run lint`    | Pasa ESLint                            |
| `npm run seed`    | Carga categorías y catálogo de ejemplo |

---

## Configuración

### 1. Firebase

El proyecto ya apunta a `zibavenezuela-fa1e3`. Queda por activar en la consola:

1. **Authentication → Sign-in method:** habilita *Correo/contraseña* y, si lo
   quieres, *Google*.
2. **Firestore Database:** crea la base de datos.
3. **Reglas de seguridad:** publica las de este repositorio.

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use zibavenezuela-fa1e3
   firebase deploy --only firestore:rules,firestore:indexes
   ```

   Sin este paso el catálogo se ve vacío: Firestore rechaza todas las lecturas
   por defecto.

### 2. Crear el usuario administrador

1. En **Authentication** crea un usuario con correo y contraseña.
2. Entra una vez en la tienda con ese usuario: se crea su documento en
   `users/{uid}` con `role: "cliente"`.
3. En **Firestore**, cambia a mano ese campo a `role: "admin"`.

Es el único cambio manual del sistema, y a propósito: las reglas impiden que
nadie se ascienda a sí mismo.

### 3. Cloudinary

1. Crea una cuenta y copia el **Cloud name**.
2. En *Settings → Upload → Upload presets* crea un preset con
   **Signing Mode: Unsigned** (por ejemplo `ziba_unsigned`).
3. Rellena en `.env`:

   ```
   VITE_CLOUDINARY_CLOUD_NAME=tu-cloud
   VITE_CLOUDINARY_UPLOAD_PRESET=ziba_unsigned
   VITE_CLOUDINARY_FOLDER=ziba
   ```

Las fotos se suben desde el panel y en Firestore sólo se guarda su `publicId`.
Las miniaturas, el `srcset` y el formato (WebP/AVIF) los resuelve Cloudinary al
vuelo desde `src/lib/cloudinary.js`.

### 4. Datos de ejemplo (opcional)

Con el administrador ya creado, añade a `.env`:

```
SEED_ADMIN_EMAIL=tu@correo.com
SEED_ADMIN_PASSWORD=tu-contraseña
```

y ejecuta `npm run seed`. Crea 14 categorías y 12 productos sin fotografías,
listos para completarlos desde el panel.

---

## Estructura

```
src/
├── lib/            firebase, cloudinary, formato, constantes de negocio
├── services/       acceso a Firestore (products, categories, orders, users…)
├── context/        Auth, Cart, Wishlist, UI (paneles y avisos)
├── hooks/          useCategories (con caché en memoria)
├── components/
│   ├── layout/     Header, NavDrawer, CartDrawer, Footer, Layout
│   ├── product/    ProductCard, ProductGrid, ProductImage
│   ├── ui/         Drawer, Modal, Toasts, Icon, Logo, State
│   └── admin/      ImageUploader
├── pages/          páginas de la tienda
│   └── admin/      panel de administración
└── styles/         tokens → base → layout → components → pages → admin
```

### Rutas

| Ruta                   | Página                                 |
| ---------------------- | -------------------------------------- |
| `/`                    | Portada                                |
| `/:section`            | Catálogo de mujer, hombre o niños      |
| `/:section/:categoria` | Catálogo de una categoría              |
| `/novedades`           | Últimas incorporaciones                |
| `/producto/:slug`      | Ficha de producto                      |
| `/buscar?q=`           | Resultados de búsqueda                 |
| `/cesta`, `/comprar`   | Cesta y tramitación                    |
| `/pedido/:id`          | Confirmación                           |
| `/entrar`, `/registro` | Acceso                                 |
| `/cuenta`              | Datos, pedidos y favoritos *(privado)* |
| `/favoritos`           | Lista de deseos                        |
| `/info/:pagina`        | Envíos, cambios, tallas, contacto…     |
| `/admin`               | Panel *(sólo `role: admin`)*           |

---

## Modelo de datos

**`products/{id}`**

```js
{
  name, slug, description, composition, care, sku,
  price, compareAtPrice,          // en dólares
  section,                        // mujer | hombre | ninos
  categorySlug, categoryName,
  images: [{ publicId, url, alt }],
  sizes:  [{ size, stock }],
  colors: [{ name, hex }],
  tags: [], searchTokens: [],     // prefijos para la búsqueda
  featured, isNew, active,
  createdAt, updatedAt
}
```

**`categories/{id}`** — `name, slug, section, description, image, order, active`

**`orders/{id}`** — `userId, items[], customer, shipping, payment, subtotal,
shippingCost, total, status, note, createdAt`

Estados: `pendiente → pagado → preparando → enviado → entregado` (+ `cancelado`).

**`users/{uid}`** — `email, displayName, phone, role, address, wishlist[]`

**`newsletter/{email}`** — el correo es el id, así no hay duplicados.

---

## Decisiones que conviene conocer

- **Pagos fuera de la web.** No se pide ni se guarda ningún dato bancario. Al
  confirmar el pedido se abre WhatsApp con el resumen para coordinar pago móvil,
  transferencia o Zelle. Cambiarlo implicaría una pasarela y un backend.
- **Búsqueda por prefijos.** Firestore no hace búsqueda de texto completo, así
  que cada producto guarda un array `searchTokens` con los prefijos de su nombre,
  categoría y etiquetas. Suficiente para un catálogo de este tamaño; si crece
  mucho, el paso natural es Algolia o Typesense.
- **Filtros en memoria.** Talla, precio y disponibilidad se aplican en el
  cliente sobre el resultado de la consulta: Firestore no admite combinar varios
  rangos con `orderBy` sin multiplicar los índices.
- **Rol de administrador.** Ocultar `/admin` es sólo la primera capa; quien
  manda son las reglas de `firestore.rules`.
- **Carrito y favoritos sin sesión.** Viven en `localStorage`; al iniciar sesión
  los favoritos se fusionan con los del perfil.
- **Precios en dólares.** Es la referencia habitual del comercio local. El pago
  en bolívares se acuerda a la tasa del día.

---

## Despliegue

```bash
npm run build
firebase deploy --only hosting
```

`firebase.json` ya trae el *rewrite* a `index.html` (necesario para las rutas del
router) y el cacheado de `assets/`.

Sirve igual cualquier hosting estático (Vercel, Netlify): carpeta `dist`, con
todas las rutas redirigidas a `index.html` y las variables `VITE_*` definidas en
el panel del proveedor.
