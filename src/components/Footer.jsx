import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand footer-row">
            <div className="footer-brand-text">
              <span className="brand">scentfused</span>
              <p>A curated house of perfumes, attars, bodycare and candles, for every skin and every story.</p>
            </div>
            <form className="newsletter" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Your email" aria-label="Email address" />
              <button type="submit">Join</button>
            </form>
          </div>

          <div className="footer-links-row">
            <div className="footer-col footer-col-left">
              <h4>Shop</h4>
              <ul>
                <li><Link to="/perfumes">Perfumes</Link></li>
                <li><Link to="/attars">Attars</Link></li>
                <li><Link to="/soaps">Soaps &amp; Bodywash</Link></li>
                <li><Link to="/candles">Candles</Link></li>
              </ul>
            </div>

            <div className="footer-col footer-col-center">
              <h4>Follow</h4>
              <ul>
                <li><a href="#">Instagram</a></li>
                <li><a href="#">TikTok</a></li>
                <li><a href="#">WhatsApp</a></li>
              </ul>
            </div>

            <div className="footer-col footer-col-right">
              <h4>Help</h4>
              <ul>
                <li><Link to="/help#shipping">Shipping</Link></li>
                <li><Link to="/help#returns">Returns</Link></li>
                <li><Link to="/help#track-order">Track order</Link></li>
                <li><Link to="/help#contact-us">Contact us</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Scentfused. All rights reserved.</span>
          <span>Karachi, Pakistan</span>
        </div>
      </div>
    </footer>
  )
}
