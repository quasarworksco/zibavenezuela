/**
 * Marca ZIBA.
 *
 * Letras serif condensadas y superpuestas, en la línea de las casas de moda:
 * el trazo se dibuja con `currentColor`, de modo que el logo se vuelve blanco
 * al ir sobre una fotografía y negro sobre fondo claro.
 */
export default function Logo({ className = '', title = 'ZIBA' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 68"
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <text
        x="110"
        y="54"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="'Didot','Bodoni MT',Georgia,'Times New Roman',serif"
        fontSize="66"
        fontWeight="400"
        letterSpacing="-7"
        textLength="204"
        lengthAdjust="spacingAndGlyphs"
      >
        ZIBA
      </text>
    </svg>
  )
}

/** Variante con el país debajo, para el pie de página y la confirmación. */
export function LogoStacked({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 96"
      role="img"
      aria-label="ZIBA Venezuela"
      preserveAspectRatio="xMidYMid meet"
    >
      <text
        x="110"
        y="54"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="'Didot','Bodoni MT',Georgia,'Times New Roman',serif"
        fontSize="66"
        letterSpacing="-7"
        textLength="204"
        lengthAdjust="spacingAndGlyphs"
      >
        ZIBA
      </text>
      <text
        x="110"
        y="80"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Helvetica,Arial,sans-serif"
        fontSize="12"
        letterSpacing="7"
      >
        VENEZUELA
      </text>
    </svg>
  )
}
