import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { CATEGORY_FIELDS } from '../data/categoryFields.js'
import { CATEGORIES } from '../data/catalog.js'
import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'
import Icon from '../components/Icon.jsx'
import ProductCard from '../components/ProductCard.jsx'

export default function ProductPage({ products }) {
  const { id } = useParams()
  const { addToCart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const product = products.find((p) => String(p.id) === String(id))

  if (!product) {
    return (
      <>
        <Nav />
        <div className="product-not-found">
          <h2>Product not found</h2>
          <p>This product may have been removed or the link is incorrect.</p>
          <Link to="/" className="btn btn-line">Back to shop</Link>
        </div>
        <Footer />
      </>
    )
  }

  const variants = product.variants || []
  const activeVariant = selectedVariant || variants[0] || null
  const displayPrice = activeVariant ? activeVariant.price : product.price
  const showSale = Boolean(product.sale_price) && displayPrice === product.price
  const categoryLabel = CATEGORIES.find((c) => c.key === product.category)?.label

  const detailFields = (CATEGORY_FIELDS[product.category] || []).filter((field) => {
    const v = product.attributes?.[field.key]
    return Array.isArray(v) ? v.length > 0 : Boolean(v)
  })

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  function handleAdd() {
    addToCart(product, activeVariant, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <>
      <Nav />

      <div className="product-page">
        <div className="product-page-image">
          {product.image ? <img src={product.image} alt={product.name} /> : <Icon category={product.category} />}
        </div>

        <div className="product-page-info">
          <h1>{product.name}</h1>
          <p className="product-page-price">
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

          {product.note && <p className="product-page-tagline">{product.note}</p>}

          {product.description && (
            <p className="product-page-description">{product.description}</p>
          )}

          {detailFields.length > 0 && (
            <div className="product-page-flat-section">
              <h3>Details</h3>
              {detailFields.map((field) => {
                const value = product.attributes[field.key]
                const display = Array.isArray(value) ? value.join(', ') : value
                return (
                  <p key={field.key} className="product-page-detail-line">
                    <strong>{field.label}:</strong> {display}
                  </p>
                )
              })}
            </div>
          )}

          {product.features && product.features.length > 0 && (
            <div className="product-page-flat-section">
              <h3>Features</h3>
              <ul className="product-page-features">
                {product.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {product.usage && (
            <div className="product-page-flat-section">
              <h3>How to use</h3>
              <p>{product.usage}</p>
            </div>
          )}

          <p className="product-page-meta-line">{categoryLabel}</p>

          {variants.length > 1 ? (
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
          ) : variants.length === 1 ? (
            <p className="product-page-meta-line"><strong>Size:</strong> {variants[0].label}</p>
          ) : null}

          <div className="product-page-buy-row">
            <div className="quickview-qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>&minus;</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}>+</button>
            </div>

            <button className="btn btn-solid product-page-add" onClick={handleAdd}>
              {added ? 'Added ✓' : 'Add to bag'}
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section related-products">
          <div className="wrap">
            <div className="section-head section-head-center">
              <h2>Related Products</h2>
            </div>
            <div className="grid">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  )
}
