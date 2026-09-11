export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand footer-row">
            <div className="footer-brand-text">
              <span className="brand">scentfused</span>
              <p>Fused by Scent, Defined by You.</p>
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
                <li><a href="#perfumes">Perfumes</a></li>
                <li><a href="#attars">Attars</a></li>
                <li><a href="#soaps">Soaps &amp; Bodywash</a></li>
                <li><a href="#candles">Candles</a></li>
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
                <li><a href="#">Shipping</a></li>
                <li><a href="#">Returns</a></li>
                <li><a href="#">Track order</a></li>
                <li><a href="#">Contact us</a></li>
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
