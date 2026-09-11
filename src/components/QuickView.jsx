import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import Icon from './Icon.jsx'

export default function QuickView() {
  const { quickViewProduct, setQuickViewProduct, addToCart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [qty, setQty] = useState(1)

  if (!quickViewProduct) return null

  const product = quickViewProduct
  const variants = product.variants || []
  const activeVariant = selectedVariant || variants[0] || null
  const displayPrice = activeVariant ? activeVariant.price : product.price
  const showSale = Boolean(product.sale_price) && displayPrice === product.price

  function close() {
    setQuickViewProduct(null)
    setSelectedVariant(null)
    setQty(1)
  }

  function handleAdd() {
    addToCart(product, activeVariant, qty)
    close()
  }

  return (
    <div className="quickview-overlay" onClick={close}>
      <div className="quickview-modal" onClick={(e) => e.stopPropagation()}>
        <button className="quickview-close" onClick={close}>&times;</button>

        <div className="quickview-image">
          {product.image ? <img src={product.image} alt={product.name} /> : <Icon category={product.category} />}
        </div>

        <div className="quickview-info">
          <h3>{product.name}</h3>
          <p className="note">{product.note}</p>
          <p className="price">
            {showSale ? (
              <>
              <span className="price-stack">
                <span className="price-was">Rs. {Number(displayPrice).toLocaleString()}</span>
                <span className="price-sale">Rs. {Number(product.sale_price).toLocaleString()}</span>
              </span>
              </>
            ) : (
              <>Rs. {Number(displayPrice).toLocaleString()}</>
            )}
          </p>

          {variants.length > 0 && (
            <div className="quickview-variants">
              <span className="quickview-variants-label">Size</span>
              <div className="quickview-variant-options">
                {variants.map((v) => (
                  <button
                    key={v.label}
                    type="button"
                    className={`variant-chip ${activeVariant?.label === v.label ? 'active' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="quickview-qty">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>&minus;</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => q + 1)}>+</button>
          </div>

          <button className="btn btn-solid quickview-add" onClick={handleAdd}>Add to bag</button>
        </div>
      </div>
    </div>
  )
}
