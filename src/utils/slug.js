// Product links. A product's link is /product/<slug> (e.g. /product/noir-oud).
// Until the slugs SQL has been run a product has no slug, so we fall back to
// its number and everything keeps working.

export function productPath(product) {
  return `/product/${product.slug || product.id}`
}

// Finds the product for a URL part: its slug, or (for old links such as
// /product/17) its number.
export function findProductByParam(products, param) {
  const key = String(param == null ? '' : param).trim().toLowerCase()
  if (!key) return undefined
  return (
    products.find((p) => p.slug && p.slug.toLowerCase() === key) ||
    products.find((p) => String(p.id) === key)
  )
}
