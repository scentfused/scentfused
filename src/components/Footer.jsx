export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand footer-row">
            <span className="brand">scentfused</span>
            <p>A curated house of perfumes, attars, bodycare and candles, for every skin and every story.</p>
            <form className="newsletter" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Your email" aria-label="Email address" />
              <button type="submit">Join</button>
            </form>
          </div>
          <div className="footer-row">
            <h4>Shop</h4>
            <ul>
              <li><a href="#perfumes">Perfumes</a></li>
              <li><a href="#attars">Attars</a></li>
              <li><a href="#soaps">Soaps &amp; Bodywash</a></li>
              <li><a href="#candles">Candles</a></li>
            </ul>
          </div>
          <div className="footer-row">
            <h4>Help</h4>
            <ul>
              <li><a href="#">Shipping</a></li>
              <li><a href="#">Returns</a></li>
              <li><a href="#">Track order</a></li>
              <li><a href="#">Contact us</a></li>
            </ul>
          </div>
          <div className="footer-row">
            <h4>Follow</h4>
            <ul>
              <li><a href="#">Instagram</a></li>
              <li><a href="#">TikTok</a></li>
              <li><a href="#">WhatsApp</a></li>
            </ul>
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
