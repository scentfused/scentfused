import { useEffect, useRef, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { CATEGORY_FIELDS } from '../data/categoryFields.js'
import { CATEGORIES } from '../data/catalog.js'
import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'
import Icon from '../components/Icon.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { firstAvailableVariant } from '../utils/stock.js'
import { optimizeImage, imageSrcSet } from '../utils/filters.js'
import { productPath, findProductByParam } from '../utils/slug.js'

function getDisplayNote(product) {
  if (product.note && product.note.trim()) return product.note
  const attrs = product.attributes || {}
  const firstTop = Array.isArray(attrs.topNotes) ? attrs.topNotes[0] : null
  const firstHeart = Array.isArray(attrs.heartNotes) ? attrs.heartNotes[0] : null
  const firstBase = Array.isArray(attrs.baseNotes) ? attrs.baseNotes[0] : null
  return [firstTop, firstHeart, firstBase].filter(Boolean).join(', ')
}

export default function ProductPage({ products }) {
  const { id } = useParams()
  const { addToCart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const product = findProductByParam(products, id)

  const galleryImages = product
    ? [product.image, ...(product.images || [])].filter(Boolean)
    : []
  const sliderRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Reset to the first image whenever navigating to a different product —
  // React Router keeps this same component mounted across /product/:id changes.
  useEffect(() => {
    setActiveIndex(0)
    if (sliderRef.current) sliderRef.current.scrollTo({ left: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id])

  function handleSliderScroll() {
    const el = sliderRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIndex(index)
  }

  function scrollToImage(index) {
    const el = sliderRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
    setActiveIndex(index)
  }

  // Old number links (/product/17) and odd capitalisation go to the name link.
  if (product && product.slug && id !== product.slug) {
    return <Navigate to={productPath(product)} replace />
  }

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

  const categoryLabel = CATEGORIES.find((c) => c.key === product.category)?.label

  const detailFields = (CATEGORY_FIELDS[product.category] || []).filter((field) => {
    const v = product.attributes?.[field.key]
    return Array.isArray(v) ? v.length > 0 : Boolean(v)
  })

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  function handleAdd() {
    if (activeSoldOut) return
    addToCart(product, activeVariant, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <>
      <Nav />

      <div className="product-page">
        <div className="product-page-image-col">
          <div className="product-page-image">
            {galleryImages.length > 0 ? (
              <div className="product-page-slider" ref={sliderRef} onScroll={handleSliderScroll}>
                {galleryImages.map((img, i) => (
                  <div className="product-page-slide" key={i}>
                    <img
                      src={optimizeImage(img, 900)}
                      srcSet={imageSrcSet(img, [600, 900, 1300])}
                      sizes="(max-width: 900px) 100vw, 50vw"
                      alt={`${product.name} ${i + 1}`}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Icon category={product.category} />
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="product-page-dots">
              {galleryImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show image ${i + 1}`}
                  className={`product-page-dot ${activeIndex === i ? 'active' : ''}`}
                  onClick={() => scrollToImage(i)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="product-page-info">
          <h1>{product.name}</h1>
          <p className="product-page-price">
            {showSale ? (
              <span className="price-stack">
                <span className="price-was">Rs. {Number(originalPrice).toLocaleString()}</span>
                <span className="price-sale">Rs. {Number(displayPrice).toLocaleString()}</span>
              </span>
            ) : (
              <>Rs. {Number(displayPrice).toLocaleString()}</>
            )}
          </p>

          {product.note && <p className="product-page-tagline">{getDisplayNote(product)}</p>}

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
          ) : variants.length === 1 ? (
            <p className="product-page-meta-line"><strong>Size:</strong> {variants[0].label}{variants[0].soldOut ? ' (sold out)' : ''}</p>
          ) : null}

          {activeSoldOut && <p className="soldout-note">This item is currently sold out.</p>}

          <div className="product-page-buy-row">
            {!activeSoldOut && (
              <div className="quickview-qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>&minus;</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
            )}

            <button className="btn btn-solid product-page-add" onClick={handleAdd} disabled={activeSoldOut}>
              {activeSoldOut ? 'Sold out' : added ? 'Added ✓' : 'Add to bag'}
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
