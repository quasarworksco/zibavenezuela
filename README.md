# ZIBA VENEZUELA

Tienda online de ropa. Catálogo por categorías, carrito, compra y panel de
administración. Estética en blanco y negro con superficies de vidrio
(*glassmorphism*) en los elementos flotantes.

**Stack:** React 19 · Vite 7 · React Router 7 · Firestore (base de datos) ·
Cloudinary (imágenes) · CSS propio, sin framework.

No hay cuentas de cliente: se compra como invitado. El único acceso es el del
panel de administración.

---

## Puesta en marcha

```bash
npm install
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

### 1. Firestore

El proyecto ya apunta a `zibavenezuela-fa1e3`. Queda por activar en la consola:

1. **Firestore Database:** crea la base de datos.
2. **Reglas de seguridad:** publica las de este repositorio.

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use zibavenezuela-fa1e3
   firebase deploy --only firestore:rules,firestore:indexes
   ```

   Sin este paso el catálogo se ve vacío: Firestore rechaza todas las lecturas
   por defecto.

No hace falta activar Authentication: la tienda no lo usa.

### 2. Acceso al panel

Usuario `adminziba`, definido en `src/lib/auth.js` junto a la contraseña. Se
entra por `/entrar` y la sesión se recuerda en `localStorage`.

> **Ten esto presente.** Las credenciales viajan en el JavaScript de la página:
> cualquiera que abra las herramientas de desarrollo puede leerlas. Y como
> Firestore no recibe ninguna identidad, sus reglas no pueden distinguir al
> administrador de un visitante, así que la escritura del catálogo queda
> abierta a quien conozca el id del proyecto. Si más adelante quieres cerrarlo,
> el camino es Firebase Authentication y reglas basadas en `request.auth`.

### 3. Cloudinary

Ya está configurado y no hace falta tocar nada:

```
VITE_CLOUDINARY_CLOUD_NAME=jtdqewim
VITE_CLOUDINARY_UPLOAD_PRESET=zibave
VITE_CLOUDINARY_FOLDER=ziba
```

Ambos valores están como respaldo en `src/lib/cloudinary.js`, así que la subida
de fotos funciona sin crear `.env`. El preset debe seguir en **Signing Mode:
Unsigned**; si se cambia a *Signed*, las subidas desde el panel fallarán.

Las fotos se suben desde el panel y en Firestore sólo se guarda su `publicId`.
Las miniaturas, el `srcset` y el formato (WebP/AVIF) los resuelve Cloudinary al
vuelo desde `src/lib/cloudinary.js`.

### 4. Datos de ejemplo (opcional)

Con las reglas ya publicadas, ejecuta `npm run seed`. Crea 14 categorías y 12
productos sin fotografías, listos para completarlos desde el panel.

---

## Estructura

```
src/
├── lib/            firebase, cloudinary, formato, constantes de negocio
├── services/       acceso a Firestore (products, categories, orders…)
├── context/        Auth (admin), Cart, Wishlist, UI (paneles y avisos)
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
| `/favoritos`           | Lista de deseos (en este navegador)    |
| `/entrar`              | Acceso del equipo                      |
| `/info/:pagina`        | Envíos, cambios, tallas, contacto…     |
| `/admin`               | Panel *(requiere sesión de admin)*     |

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

**`orders/{id}`** — `items[], customer, shipping, payment, subtotal,
shippingCost, total, status, note, createdAt`

Estados: `pendiente → pagado → preparando → enviado → entregado` (+ `cancelado`).

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
- **Sin cuentas de cliente.** Se compra como invitado. El enlace de
  confirmación (`/pedido/:id`) es la forma de volver a consultar un pedido, así
  que conviene guardarlo. El seguimiento se coordina por WhatsApp.
- **Acceso de admin en el navegador.** La sesión no la valida ningún servidor:
  `RequireAdmin` sólo esconde la sección. Las reglas de Firestore, sin identidad
  que comprobar, dejan la escritura abierta.
- **Carrito y favoritos.** Viven en `localStorage`, atados al navegador.
- **Precios en dólares.** Es la referencia habitual del comercio local. El pago
  en bolívares se acuerda a la tasa del día.

---

## Despliegue

Se publica solo en **GitHub Pages**: cada push a `main` o a la rama de trabajo
dispara el workflow `.github/workflows/deploy.yml`, que compila y publica. No
hace falta ejecutar nada en local.

**Una vez, para activarlo:** en el repositorio, *Settings → Pages → Build and
deployment → Source*, elige **GitHub Actions**.

El sitio queda en **https://zibave.dgp-link.com**.

El dominio se declara en `public/CNAME`, que el build copia a la raíz del
sitio; GitHub Pages lo lee de ahí. En el DNS hace falta un registro:

```
CNAME   zibave   quasarworksco.github.io
```

### Detalles que hacen falta bajo GitHub Pages

- **Ruta base.** Con dominio propio el sitio sirve desde la raíz, así que
  `vite.config.js` detecta `public/CNAME` y usa `base: '/'`. Si se quitara el
  dominio, volvería solo a `/zibavenezuela/`, que es la subcarpeta que usa
  GitHub Pages sin dominio.
- **Rutas internas.** GitHub Pages no reescribe URLs, de modo que entrar directo
  a `/mujer` daría 404. El build copia `index.html` como `404.html`: Pages lo
  sirve, la aplicación arranca y el router resuelve la ruta.
- **`.nojekyll`.** Se genera en el build para que Pages no ignore ficheros que
  empiezan por guión bajo.

### Reglas de Firestore

Esto no va por Pages, se publica aparte contra Firebase:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

O pegando el contenido de `firestore.rules` en la consola de Firebase.
