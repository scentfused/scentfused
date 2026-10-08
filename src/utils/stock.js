// Sold-out helpers. A size (variant) is sold out when its `soldOut` flag is
// true. A product counts as sold out only when every one of its sizes is.

export function isProductSoldOut(product) {
  const variants = (product && product.variants) || []
  return variants.length > 0 && variants.every((v) => v.soldOut)
}

export function hasSoldOutSize(product) {
  const variants = (product && product.variants) || []
  return variants.some((v) => v.soldOut)
}

// The size to pre-select: the first one still in stock, otherwise the first.
export function firstAvailableVariant(product) {
  const variants = (product && product.variants) || []
  return variants.find((v) => !v.soldOut) || variants[0] || null
}

// ---------- stock quantities ----------
// A size can have a stock number (variant.stock). Empty / missing = not
// tracked. A tracked size at 0 behaves exactly like one marked "Sold out".

export const DEFAULT_LOW_STOCK = 5

export function isTracked(variant) {
  return Boolean(variant) && typeof variant.stock === 'number' && isFinite(variant.stock)
}

export function normalizeThreshold(value) {
  const n = Math.floor(Number(value))
  return isFinite(n) && n >= 0 ? n : DEFAULT_LOW_STOCK
}

// For the storefront: returns products where every tracked size at 0 is
// flagged soldOut, so the cards, product page, quick view, cart and checkout
// all treat it as sold out without needing to know about stock numbers.
// (The Admin always works with the raw products.)
export function withStockApplied(products) {
  return (products || []).map((p) => {
    const variants = p.variants || []
    if (!variants.some((v) => isTracked(v) && v.stock <= 0 && !v.soldOut)) return p
    return {
      ...p,
      variants: variants.map((v) => (isTracked(v) && v.stock <= 0 ? { ...v, soldOut: true } : v))
    }
  })
}

// "Only 3 left" for a tracked size that is running low (otherwise '').
export function lowStockText(variant, threshold) {
  if (!isTracked(variant) || variant.soldOut) return ''
  if (variant.stock > 0 && variant.stock <= threshold) return `Only ${variant.stock} left`
  return ''
}

// One row per size, for the Admin Stock screen.
// status: out | low | ok | untracked
export function stockRows(products, threshold) {
  const rows = []
  ;(products || []).forEach((p) => {
    ;(p.variants || []).forEach((v, index) => {
      let status = 'untracked'
      if (v.soldOut) status = 'out'
      else if (isTracked(v)) status = v.stock <= 0 ? 'out' : v.stock <= threshold ? 'low' : 'ok'
      rows.push({ product: p, variant: v, index, status, stock: isTracked(v) ? v.stock : null })
    })
  })
  return rows
}

export function lowStockCount(products, threshold) {
  return stockRows(products, threshold).filter((r) => r.status === 'low' || (r.status === 'out' && isTracked(r.variant))).length
}
