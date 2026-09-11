import { useCart } from '../context/CartContext.jsx'

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQty, cartTotal } = useCart()

  if (!isCartOpen) return null

  return (
    <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-head">
          <h3>Your bag</h3>
          <button className="cart-close" onClick={() => setIsCartOpen(false)}>&times;</button>
        </div>

        {items.length === 0 ? (
          <p className="cart-empty">Your bag is empty.</p>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div className="cart-item" key={item.itemId}>
                  <div className="cart-item-thumb">
                    {item.image ? <img src={item.image} alt={item.name} /> : null}
                  </div>
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    {item.variantLabel && <p className="cart-item-variant">{item.variantLabel}</p>}
                    <div className="cart-item-qty">
                      <button onClick={() => updateQty(item.itemId, -1)}>&minus;</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.itemId, 1)}>+</button>
                    </div>
                  </div>
                  <div className="cart-item-right">
                    <span className="cart-item-price">Rs. {(item.price * item.qty).toLocaleString()}</span>
                    <button className="cart-item-remove" onClick={() => removeFromCart(item.itemId)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-drawer-foot">
              <div className="cart-subtotal">
                <span>Subtotal</span>
                <span>Rs. {cartTotal.toLocaleString()}</span>
              </div>
              <button className="btn btn-solid cart-checkout" onClick={() => alert('Checkout coming soon!')}>
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
