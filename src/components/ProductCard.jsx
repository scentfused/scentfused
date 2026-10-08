import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { CATEGORY_FIELDS } from '../data/categoryFields.js'
import Icon from './Icon.jsx'
import { isProductSoldOut } from '../utils/stock.js'
import { optimizeImage, imageSrcSet, lineupText } from '../utils/filters.js'
import { productPath } from '../utils/slug.js'

const CARD_WIDTHS = [320, 480, 720, 960]

const HOVER_ATTRIBUTE_KEYS = ['topNotes', 'heartNotes', 'baseNotes', 'concentration']

// If a product's short "Note" blurb was never saved (or the auto-fill from
// tags didn't trigger for some reason), fall back to building one on the fly
// from its first Top/Heart/Base note instead of showing a blank line.
function getDisplayNote(product) {
  if (product.note && product.note.trim()) return product.note
  const attrs = product.attributes || {}
  const firstTop = Array.isArray(attrs.topNotes) ? attrs.topNotes[0] : null
  const firstHeart = Array.isArray(attrs.heartNotes) ? attrs.heartNotes[0] : null
  const firstBase = Array.isArray(attrs.baseNotes) ? attrs.baseNotes[0] : null
  return [firstTop, firstHeart, firstBase].filter(Boolean).join(', ')
}

export default function ProductCard({ product, badge }) {
  const { setQuickViewProduct } = useCart()

  function handleAdd(e) {
    e.preventDefault()
    e.stopPropagation()
    // Instead of silently adding a default variant, open the same popup
    // used for "Quick view" so the person can confirm which size/variant
    // they actually want before it's added to the cart.
    setQuickViewProduct(product)
  }

  function handleQuickView(e) {
    e.preventDefault()
    e.stopPropagation()
    setQuickViewProduct(product)
  }

  const soldOut = isProductSoldOut(product)
  const fieldDefs = CATEGORY_FIELDS[product.category] || []
  const hoverLines = HOVER_ATTRIBUTE_KEYS
    .map((key) => {
      const value = product.attributes?.[key]
      const hasValue = Array.isArray(value) ? value.length > 0 : Boolean(value)
      if (!hasValue) return null
      const label = fieldDefs.find((f) => f.key === key)?.label || key
      // Top/Heart/Base notes are tag arrays — show just the first one here to
      // keep the hover card short; Concentration is a plain string as-is.
      const display = Array.isArray(value) ? value[0] : value
      return { label, display }
    })
    .filter(Boolean)

  return (
    <div className="card">
      {soldOut
        ? <span className="badge badge-soldout">Sold out</span>
        : badge && <span className="badge">{badge}</span>}
      <Link to={productPath(product)} className="card-link">
        <div className="tile">
          {product.image
            ? (
              <img
                src={optimizeImage(product.image, 480)}
                srcSet={imageSrcSet(product.image, CARD_WIDTHS)}
                sizes="(max-width: 520px) 100vw, (max-width: 960px) 50vw, 25vw"
                alt={product.name}
                loading="lazy"
                decoding="async"
              />
            )
            : <Icon category={product.category} />}

          <div className="tile-hover">
            {hoverLines.length > 0 && (
              <div className="tile-hover-attributes">
                {hoverLines.map((line) => (
                  <p key={line.label}><strong>{line.label}:</strong> {line.display}</p>
                ))}
              </div>
            )}
            <button className="tile-hover-btn" onClick={handleQuickView}>
              Quick view
            </button>
          </div>
        </div>
        <h3>{product.name}</h3>
        <p className="note">{getDisplayNote(product)}</p>
        {lineupText(product) && <p className="card-meta">{lineupText(product)}</p>}
      </Link>
      <div className="row">
        <span className="price">
          {product.sale_price ? (
            <span className="price-stack">
              <span className="price-was">Rs. {Number(product.price).toLocaleString()}</span>
              <span className="price-sale">Rs. {Number(product.sale_price).toLocaleString()}</span>
            </span>
          ) : (
            <>Rs. {Number(product.price).toLocaleString()}</>
          )}
        </span>
        <button className="add" onClick={handleAdd} disabled={soldOut}>
          {soldOut ? 'Sold out' : 'Add'}
        </button>
      </div>
    </div>
  )
}
