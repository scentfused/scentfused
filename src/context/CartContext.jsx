import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'scentfused-cart'

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Works out what a customer should actually pay for a product + variant.
// Prefers the variant's own sale price; if it has none (older products never
// re-saved through the per-variant form), falls back to the product-level
// sale price, but only when this variant is the base-priced one so a
// discount meant for one size isn't applied to a differently-priced size.
function computePrice(product, variant) {
  const basePrice = variant ? variant.price : product.price
  let saleOverride = variant ? variant.salePrice : product.sale_price
  if (!saleOverride && product.sale_price && Number(basePrice) === Number(product.price)) {
    saleOverride = product.sale_price
  }
  return (saleOverride && Number(saleOverride) < Number(basePrice))
    ? Number(saleOverride)
    : Number(basePrice)
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addToCart(product, variant, qty = 1) {
    // A sold-out size can't be added, even if something tries to.
    if (variant && variant.soldOut) return
    const variantLabel = variant ? variant.label : null
    const price = computePrice(product, variant)
    const itemId = `${product.id}-${variantLabel || 'base'}`

    setItems((prev) => {
      const existing = prev.find((i) => i.itemId === itemId)
      if (existing) {
        // Refresh the price as well, so an item added earlier at an old
        // (pre-sale) price doesn't keep that price when added again.
        return prev.map((i) => (i.itemId === itemId ? { ...i, qty: i.qty + qty, price } : i))
      }
      return [
        ...prev,
        {
          itemId,
          productId: product.id,
          name: product.name,
          image: product.image,
          variantLabel,
          price,
          qty
        }
      ]
    })
    setIsCartOpen(true)
  }

  function removeFromCart(itemId) {
    setItems((prev) => prev.filter((i) => i.itemId !== itemId))
  }

  function updateQty(itemId, delta) {
    setItems((prev) =>
      prev
        .map((i) => (i.itemId === itemId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    )
  }

  // Re-checks every item already sitting in the cart against the live
  // product data, so prices saved on someone's phone earlier (before a sale
  // was set, or before a fix) correct themselves automatically.
  const syncCartPrices = useCallback((products) => {
    setItems((prev) => {
      let changed = false
      const next = prev.map((item) => {
        const product = products.find((p) => p.id === item.productId)
        let variant = null
        let unavailable = false

        if (!product) {
          unavailable = true
        } else if (item.variantLabel) {
          variant = (product.variants || []).find((v) => v.label === item.variantLabel) || null
          if (!variant) unavailable = true
        }
        if (variant && variant.soldOut) unavailable = true

        // Keep the last known price when the product/size is gone entirely.
        const price = product && (!item.variantLabel || variant)
          ? computePrice(product, variant)
          : item.price

        if (price !== item.price || Boolean(item.soldOut) !== unavailable) {
          changed = true
          return { ...item, price, soldOut: unavailable }
        }
        return item
      })
      return changed ? next : prev
    })
  }, [])

  const cartCount = items.reduce((sum, i) => sum + i.qty, 0)
  const cartTotal = items.reduce((sum, i) => (i.soldOut ? sum : sum + i.qty * i.price), 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQty,
        syncCartPrices,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        quickViewProduct,
        setQuickViewProduct
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
