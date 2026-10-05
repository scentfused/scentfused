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
