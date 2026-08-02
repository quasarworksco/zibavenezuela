/**
 * Iconografía de trazo fino, coherente con la tipografía de la tienda.
 * Todos comparten caja de 24 y heredan el color con `currentColor`.
 */

const PATHS = {
  search: <circle cx="11" cy="11" r="6.5" />,
  searchTail: <path d="M15.8 15.8 21 21" />,
  bag: (
    <>
      <path d="M4 7.5h16l-1.2 13H5.2z" />
      <path d="M8.7 9.5V6.6a3.3 3.3 0 0 1 6.6 0v2.9" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.7-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.3 12 20 12 20Z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8.2" r="3.7" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  arrowRight: <path d="M4 12h15m-6-6 6 6-6 6" />,
  arrowLeft: <path d="M20 12H5m6 6-6-6 6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  filter: <path d="M4 7h16M7 12h10M10 17h4" />,
  truck: (
    <>
      <path d="M2.5 6.5h11v9h-11z" />
      <path d="M13.5 10h4l3 3v2.5h-7z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  refresh: <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5" />,
  lock: (
    <>
      <rect x="4.8" y="10.5" width="14.4" height="9.5" />
      <path d="M8.4 10.5V7.8a3.6 3.6 0 0 1 7.2 0v2.7" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M20 12a8 8 0 0 1-11.9 7L4 20l1.1-4A8 8 0 1 1 20 12Z" />
      <path d="M9.3 9.4c.3-.7.6-.7.9-.7h.6c.2 0 .4.1.6.6l.6 1.4c.1.2 0 .4-.1.5l-.4.5c-.1.2-.2.3 0 .6a6 6 0 0 0 2.6 2.2c.3.1.4 0 .5-.1l.6-.6c.2-.2.3-.2.5-.1l1.4.7c.2.1.4.2.4.4a1.9 1.9 0 0 1-1.4 1.6c-.5.1-1.2.2-3.5-.9a8.4 8.4 0 0 1-3.5-3.6c-.5-1-.5-1.8-.4-2.2Z" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.4" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="16.8" cy="7.2" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" />
      <path d="m3 6.5 9 6.5 9-6.5" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5h15M9.5 6.5V4.8h5v1.7" />
      <path d="M6.5 6.5 7.6 20h8.8l1.1-13.5" />
    </>
  ),
  edit: <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />,
  image: (
    <>
      <rect x="3.5" y="5" width="17" height="14" />
      <path d="m4.5 16 4.2-4.4 3.1 3 3-2.7 4.2 4.1" />
      <circle cx="9" cy="9.4" r="1.3" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" />
    </>
  ),
  box: (
    <>
      <path d="M12 3.5 20.5 8v8L12 20.5 3.5 16V8Z" />
      <path d="M3.5 8 12 12.5 20.5 8M12 12.5v8" />
    </>
  ),
  tag: (
    <>
      <path d="M11.4 3.5H20V12l-8.6 8.6L3 12.1Z" />
      <circle cx="16.2" cy="7.8" r="1.4" />
    </>
  ),
  chart: <path d="M4 20V9m5 11V4m5 16v-7m5 7V7" />,
  logout: <path d="M14 8V5.5H5v13h9V16M10.5 12H21m-4-3.5 3.5 3.5-3.5 3.5" />,
  zoom: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M15.8 15.8 21 21M8.6 11h4.8M11 8.6v4.8" />
    </>
  ),
}

export default function Icon({ name, size = 18, strokeWidth = 1.1, className = '', ...rest }) {
  const content = PATHS[name]
  if (!content) return null

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {content}
      {name === 'search' ? PATHS.searchTail : null}
    </svg>
  )
}

/** Corazón relleno para el estado activo de favoritos. */
export function HeartFilled({ size = 18, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 20.4s-8-5-8-10.2a4.7 4.7 0 0 1 8-3.1 4.7 4.7 0 0 1 8 3.1c0 5.2-8 10.2-8 10.2Z" />
    </svg>
  )
}
