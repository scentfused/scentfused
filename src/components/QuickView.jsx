import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import Icon from './Icon.jsx'
import { firstAvailableVariant } from '../utils/stock.js'
import { optimizeImage } from '../utils/filters.js'

function getDisplayNote(product) {
  if (product.note && product.note.trim()) return product.note
  const attrs = product.attributes || {}
  const firstTop = Array.isArray(attrs.topNotes) ? attrs.topNotes[0] : null
  const firstHeart = Array.isArray(attrs.heartNotes) ? attrs.heartNotes[0] : null
  const firstBase = Array.isArray(attrs.baseNotes) ? attrs.baseNotes[0] : null
  return [firstTop, firstHeart, firstBase].filter(Boolean).join(', ')
}

export default function QuickView() {
  const { quickViewProduct, setQuickViewProduct, addToCart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [qty, setQty] = useState(1)

  if (!quickViewProduct) return null

  const product = quickViewProduct
  const variants = product.variants || []
  // Pre-select the first size that's still in stock.
  const activeVariant = selectedVariant || firstAvailableVariant(product)
  const activeSoldOut = Boolean(activeVariant && activeVariant.soldOut)

  // Each variant can have its own sale price now — fall back to the
  // product-level values only when there's no variant at all.
  const originalPrice = activeVariant ? activeVariant.price : product.price
  // Prefer the variant's own sale price; fall back to the product-level one
  // only when this variant's price matches the product's base price.
  let effectiveSalePrice = activeVariant ? activeVariant.salePrice : product.sale_price
  if (!effectiveSalePrice && product.sale_price && Number(originalPrice) === Number(product.price)) {
    effectiveSalePrice = product.sale_price
  }
  const showSale = Boolean(effectiveSalePrice) && Number(effectiveSalePrice) < Number(originalPrice)
  const displayPrice = showSale ? effectiveSalePrice : originalPrice

  function close() {
    setQuickViewProduct(null)
    setSelectedVariant(null)
    setQty(1)
  }

  function handleAdd() {
    if (activeSoldOut) return
    addToCart(product, activeVariant, qty)
    close()
  }

  return (
    <div className="quickview-overlay" onClick={close}>
      <div className="quickview-modal" onClick={(e) => e.stopPropagation()}>
        <button className="quickview-close" onClick={close}>&times;</button>

        <div className="quickview-image">
          {product.image ? <img src={optimizeImage(product.image, 800)} alt={product.name} decoding="async" /> : <Icon category={product.category} />}
        </div>

        <div className="quickview-info">
          <h3>{product.name}</h3>
          <p className="note">{getDisplayNote(product)}</p>
          <p className="price">
            {showSale ? (
              <span className="price-stack">
                <span className="price-was">Rs. {Number(originalPrice).toLocaleString()}</span>
                <span className="price-sale">Rs. {Number(displayPrice).toLocaleString()}</span>
              </span>
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
                    disabled={Boolean(v.soldOut)}
                    title={v.soldOut ? 'Sold out' : undefined}
                    className={`variant-chip ${activeVariant?.label === v.label ? 'active' : ''} ${v.soldOut ? 'sold-out' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSoldOut ? (
            <p className="soldout-note">This item is currently sold out.</p>
          ) : (
            <div className="quickview-qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>&minus;</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
          )}

          <button className="btn btn-solid quickview-add" onClick={handleAdd} disabled={activeSoldOut}>
            {activeSoldOut ? 'Sold out' : 'Add to bag'}
          </button>
        </div>
      </div>
    </div>
  )
}
