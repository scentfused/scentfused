import { createContext, useContext, useEffect, useState } from 'react'

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

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addToCart(product, variant, qty = 1) {
    const variantLabel = variant ? variant.label : null
    const price = variant ? variant.price : product.price
    const itemId = `${product.id}-${variantLabel || 'base'}`

    setItems((prev) => {
      const existing = prev.find((i) => i.itemId === itemId)
      if (existing) {
        return prev.map((i) => (i.itemId === itemId ? { ...i, qty: i.qty + qty } : i))
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

  const cartCount = items.reduce((sum, i) => sum + i.qty, 0)
  const cartTotal = items.reduce((sum, i) => sum + i.qty * i.price, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQty,
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
