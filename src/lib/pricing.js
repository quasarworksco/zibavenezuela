/**
 * Reglas de precio: detal y mayor.
 *
 * Módulo sin dependencias a propósito. Es el único sitio donde se decide
 * cuánto cuesta una unidad, de modo que la ficha, la cesta, la compra y el
 * pedido guardado no puedan discrepar entre sí.
 */

/** Mínimo absoluto de unidades para que un precio al mayor tenga sentido. */
const MIN_QTY = 2

/** ¿Este producto tiene precio al mayor configurado? */
export function hasWholesale(product) {
  return Boolean(product?.wholesalePrice && Number(product.wholesalePrice) > 0)
}

/** Unidades a partir de las cuales se aplica el precio al mayor. */
export function wholesaleFrom(product) {
  if (!hasWholesale(product)) return 0
  return Math.max(MIN_QTY, Number(product.wholesaleMinQty ?? 0) || MIN_QTY)
}

/** Precio por unidad de un producto según la cantidad que se lleve. */
export function unitPriceFor(product, quantity = 1) {
  if (hasWholesale(product) && quantity >= wholesaleFrom(product)) {
    return Number(product.wholesalePrice)
  }
  return Number(product?.price ?? 0)
}

/**
 * Lo mismo para una línea de la cesta, que ya lleva copiados el precio al
 * mayor y su cantidad mínima al añadirse.
 */
export function linePrice(line) {
  if (line?.wholesalePrice && line.quantity >= (line.wholesaleFrom ?? Infinity)) {
    return Number(line.wholesalePrice)
  }
  return Number(line?.price ?? 0)
}

/** ¿A esta línea ya se le está aplicando el precio al mayor? */
export function lineIsWholesale(line) {
  return Boolean(line?.wholesalePrice && line.quantity >= (line.wholesaleFrom ?? Infinity))
}

/* --------------------------------------------------------------------------
 * Bolívares
 *
 * El precio de un producto se carga en divisas. A partir de ahí:
 *
 *   bolívares      = precio en divisas × tasa de la tienda
 *   precio real $  = bolívares ÷ tasa del BCV
 *
 * Sólo se controlan dos números: el precio en divisas y la tasa de la tienda.
 * La tasa del BCV se usa nada más para expresar la equivalencia, así que el
 * precio real en dólares se mueve solo cuando el BCV cambia.
 * ------------------------------------------------------------------------ */

/** Monto en bolívares de un precio en divisas. */
export function toBs(usd, storeRate) {
  const rate = Number(storeRate ?? 0)
  if (!rate || rate <= 0) return 0
  return Number(usd ?? 0) * rate
}

/** Equivalente en dólares al cambio oficial de ese monto en bolívares. */
export function bsToUsd(bs, bcvRate) {
  const rate = Number(bcvRate ?? 0)
  if (!rate || rate <= 0) return 0
  return Number(bs ?? 0) / rate
}

/** Precio real en dólares: bolívares del producto ÷ tasa del BCV. */
export function realUsd(usd, storeRate, bcvRate) {
  const bs = toBs(usd, storeRate)
  if (!bs) return Number(usd ?? 0)
  return bsToUsd(bs, bcvRate) || Number(usd ?? 0)
}

/** ¿Hay tasas suficientes para mostrar precios en bolívares? */
export function ratesReady(rates) {
  return Boolean(rates?.store && rates.store > 0)
}
