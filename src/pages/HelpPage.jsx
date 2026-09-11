import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'

export default function HelpPage() {
  return (
    <div>
      <Nav />
      <main className="wrap help-page">
        <h1 className="help-title">Help</h1>

        <nav className="help-jump-nav">
          <a href="#shipping">Shipping</a>
          <a href="#returns">Returns</a>
          <a href="#track-order">Track order</a>
          <a href="#contact-us">Contact us</a>
        </nav>

        <section id="shipping" className="help-section">
          <h2>Shipping</h2>
          <p>
            Orders are processed within 1–2 business days. Delivery across Pakistan typically
            takes 5–8 business days depending on your city. We currently ship from Karachi and
            deliver nationwide via courier.
          </p>
          <p>
            You'll receive tracking details from our courier partner once your order has shipped.
            If you haven't received an update within 5 business days of ordering, please reach out
            using the Contact Us section below.
          </p>
        </section>

        <section id="returns" className="help-section">
          <h2>Returns &amp; Exchanges</h2>
          <p>
            We accept returns or exchanges within 3 days of delivery, provided the product is
            unused, unopened, and in its original packaging — this helps us maintain quality and
            hygiene standards for fragrance products.
          </p>
          <p>
            To start a return or exchange, message us on WhatsApp or email with your order details
            and reason for return. Once approved, we'll share instructions for sending the item
            back. Refunds are processed after the returned item is received and inspected.
          </p>
        </section>

        <section id="track-order" className="help-section">
          <h2>Track Order</h2>
          <p>
            We don't have an automated order-tracking system on the site just yet. In the
            meantime, message us on WhatsApp or email with your order number (from your
            confirmation message) and we'll get you an update right away.
          </p>
        </section>

        <section id="contact-us" className="help-section">
          <h2>Contact Us</h2>
          <p>Have a question about a product, an order, or anything else? We're happy to help.</p>
          <p>
            <strong>Email:</strong> <a href="mailto:scentfused@gmail.com">scentfused@gmail.com</a><br />
            <strong>WhatsApp:</strong> <a href="https://wa.me/923022726002" target="_blank" rel="noopener noreferrer">Message us</a><br />
            <strong>Location:</strong> Karachi, Pakistan
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
