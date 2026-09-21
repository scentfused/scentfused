import { Link } from 'react-router-dom'

export default function PromoBanners() {
  return (
    <section className="section promo-banners">
      <div className="wrap promo-banners-grid">
        <Link to="/search?q=Royal" className="promo-banner promo-banner-royal">
          <span className="promo-banner-eyebrow">The Line-Up</span>
          <h3>Royal Collection</h3>
          <span className="promo-banner-cta">Shop the collection →</span>
        </Link>

        <Link to="/search?q=Marina" className="promo-banner promo-banner-marina">
          <span className="promo-banner-eyebrow">The Line-Up</span>
          <h3>Marina Collection</h3>
          <span className="promo-banner-cta">Shop the collection →</span>
        </Link>
      </div>
    </section>
  )
}
