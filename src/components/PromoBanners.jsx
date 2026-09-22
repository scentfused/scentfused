import { Link } from 'react-router-dom'

export default function PromoBanners({ banner1Image, banner2Image, banner1Font, banner2Font }) {
  const royalStyle = banner1Image
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${banner1Image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined

  const marinaStyle = banner2Image
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${banner2Image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined

  return (
    <section className="section promo-banners">
      <div className="wrap promo-banners-grid">
        <Link to="/search?q=Royal" className="promo-banner promo-banner-royal" style={royalStyle}>
          <span className="promo-banner-eyebrow">The Line-Up</span>
          <h3 style={{ fontFamily: `'${banner1Font || 'Robot Monster'}', sans-serif` }}>Royal Collection</h3>
          <span className="promo-banner-cta">Shop the collection →</span>
        </Link>

        <Link to="/search?q=Marina" className="promo-banner promo-banner-marina" style={marinaStyle}>
          <span className="promo-banner-eyebrow">The Line-Up</span>
          <h3 style={{ fontFamily: `'${banner2Font || 'Robot Monster'}', sans-serif` }}>Marina Collection</h3>
          <span className="promo-banner-cta">Shop the collection →</span>
        </Link>
      </div>
    </section>
  )
}
