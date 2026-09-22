import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { CATEGORY_FIELDS } from '../data/categoryFields.js'
import Icon from './Icon.jsx'

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
  const { addToCart, setQuickViewProduct } = useCart()

  function handleAdd(e) {
    e.preventDefault()
    e.stopPropagation()
    const variants = product.variants || []
    addToCart(product, variants[0] || null, 1)
  }

  function handleQuickView(e) {
    e.preventDefault()
    e.stopPropagation()
    setQuickViewProduct(product)
  }

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
      {badge && <span className="badge">{badge}</span>}
      <Link to={`/product/${product.id}`} className="card-link">
        <div className="tile">
          {product.image
            ? <img src={product.image} alt={product.name} />
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
        <button className="add" onClick={handleAdd}>Add</button>
      </div>
    </div>
  )
}
