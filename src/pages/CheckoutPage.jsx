import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'
import { useCart } from '../context/CartContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { optimizeImage } from '../utils/filters.js'
import {
  money, normalizeDeliveryRates, normalizePaymentMethods, normalizeWhatsapp,
  deliveryFeeFor, isValidPhone, fillInstructions, whatsappLink, orderMessage
} from '../utils/checkout.js'

const LAST_ORDER_KEY = 'scentfused-last-order'
const OTHER = '__other__'

function loadLastOrder() {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function CheckoutPage({ settings }) {
  const { items, cartTotal, clearCart, removeFromCart } = useCart()
  const rates = useMemo(() => normalizeDeliveryRates(settings.deliveryRates), [settings.deliveryRates])
  const methods = useMemo(
    () => normalizePaymentMethods(settings.paymentMethods).filter((m) => m.enabled),
    [settings.paymentMethods]
  )
  const whatsapp = normalizeWhatsapp(settings.whatsappNumber)

  const [form, setForm] = useState({
    name: '', phone: '', address: '', cityChoice: rates.cities[0]?.city || OTHER, otherCity: '', notes: '', paymentRef: ''
  })
  const [methodId, setMethodId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(loadLastOrder)

  const activeMethodId = methodId || methods[0]?.id || ''
  const method = methods.find((m) => m.id === activeMethodId)
  const city = form.cityChoice === OTHER ? form.otherCity.trim() : form.cityChoice
  const fee = city ? deliveryFeeFor(city, rates) : null
  const soldOutItems = items.filter((i) => i.soldOut)
  const buyable = items.filter((i) => !i.soldOut)
  const total = cartTotal + (fee || 0)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    setError('')
  }

  async function submit(e) {
    e.preventDefault()
    if (submitting) return
    if (form.name.trim().length < 2) return setError('Please enter your full name.')
    if (!isValidPhone(form.phone)) return setError('Please enter a valid phone number, e.g. 0300 1234567.')
    if (form.address.trim().length < 8) return setError('Please enter your full delivery address.')
    if (city.length < 2) return setError('Please enter your city.')
    if (!method) return setError('Please choose a payment method.')
    if (buyable.length === 0) return setError('Your bag is empty.')

    setSubmitting(true)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('place_order', {
      p_name: form.name,
      p_phone: form.phone,
      p_address: form.address,
      p_city: city,
      p_notes: form.notes,
      p_payment_id: method.id,
      p_payment_ref: method.askReference ? form.paymentRef : '',
      p_items: buyable.map((i) => ({ productId: i.productId, variantLabel: i.variantLabel, qty: i.qty }))
    })
    setSubmitting(false)

    if (rpcError) {
      console.error('place_order failed:', rpcError)
      // Messages we wrote in the database are safe to show as they are.
      const friendly = rpcError.message && !/function|permission|schema|relation|column/i.test(rpcError.message)
        ? rpcError.message
        : 'Sorry, we could not place your order. Please check your connection and try again, or message us on WhatsApp.'
      setError(friendly)
      return
    }

    const result = {
      order: data,
      customer: {
        name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim(), city,
        paymentRef: method.askReference ? form.paymentRef.trim() : ''
      }
    }
    try { sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(result)) } catch { /* private mode */ }
    clearCart()
    setDone(result)
    window.scrollTo(0, 0)
  }

  // ---------- after the order is placed ----------
  if (done && items.length === 0) {
    const { order, customer } = done
    const doneMethod = normalizePaymentMethods(settings.paymentMethods).find((m) => m.id === order.payment_method_id)
    const needsPayment = doneMethod && doneMethod.id !== 'cod' && doneMethod.instructions
    return (
      <div>
        <Nav />
        <main className="wrap checkout-wrap">
          <div className="checkout-done">
            <p className="checkout-done-kicker">Thank you, {customer.name.split(' ')[0]}</p>
            <h1>Order {order.order_number} received</h1>
            <p className="muted">We will call or message you on {customer.phone} to confirm your order.</p>

            {needsPayment && (
              <div className="checkout-pay-box">
                <strong>{doneMethod.label}</strong>
                <p>{fillInstructions(doneMethod.instructions, order.total)}</p>
                {customer.paymentRef && <p className="muted">Transaction ID you entered: {customer.paymentRef}</p>}
              </div>
            )}

            <ul className="checkout-summary-list">
              {order.items.map((i, idx) => (
                <li key={idx}>
                  <span>{i.name}{i.variant ? ` (${i.variant})` : ''} × {i.qty}</span>
                  <span>{money(i.line_total)}</span>
                </li>
              ))}
              <li><span>Delivery to {customer.city}</span><span>{money(order.delivery_fee)}</span></li>
              <li className="checkout-total"><span>Total</span><span>{money(order.total)}</span></li>
            </ul>

            <a
              className="btn btn-solid checkout-wa"
              href={whatsappLink(whatsapp, orderMessage(order, customer))}
              target="_blank"
              rel="noopener noreferrer"
            >
              Send order details on WhatsApp
            </a>
            <p className="muted">Tap the button and press send, so we see your order straight away{needsPayment ? ' and you can share your payment screenshot' : ''}.</p>
            <Link className="btn btn-line" to="/" onClick={() => { try { sessionStorage.removeItem(LAST_ORDER_KEY) } catch { /* ignore */ } }}>
              Continue shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ---------- empty bag ----------
  if (items.length === 0) {
    return (
      <div>
        <Nav />
        <main className="wrap checkout-wrap">
          <div className="checkout-done">
            <h1>Your bag is empty</h1>
            <p className="muted">Add a fragrance to your bag first.</p>
            <Link className="btn btn-solid" to="/">Browse the collection</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ---------- the form ----------
  return (
    <div>
      <Nav />
      <main className="wrap checkout-wrap">
        <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Checkout</span></div>
        <h1 className="checkout-title">Checkout</h1>

        <form className="checkout-grid" onSubmit={submit} noValidate>
          <div className="checkout-fields">
            <h2>Delivery details</h2>
            <label>Full name
              <input type="text" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </label>
            <label>Phone number
              <input type="tel" inputMode="tel" autoComplete="tel" placeholder="0300 1234567" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </label>
            <label>Full address
              <textarea rows="3" autoComplete="street-address" placeholder="House / flat, street, area" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </label>
            <label>City
              <select value={form.cityChoice} onChange={(e) => set('cityChoice', e.target.value)}>
                {[...rates.cities].sort((a, b) => a.city.localeCompare(b.city)).map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
                <option value={OTHER}>{rates.cities.length ? 'Other city…' : 'Enter your city…'}</option>
              </select>
            </label>
            {form.cityChoice === OTHER && (
              <label>Your city
                <input type="text" autoComplete="address-level2" value={form.otherCity} onChange={(e) => set('otherCity', e.target.value)} />
              </label>
            )}
            <label><span>Order notes <span className="muted">(optional)</span></span>
              <textarea rows="2" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </label>

            <h2>Payment</h2>
            <div className="checkout-methods" role="radiogroup" aria-label="Payment method">
              {methods.map((m) => (
                <label key={m.id} className={`checkout-method${m.id === activeMethodId ? ' is-on' : ''}`}>
                  <input type="radio" name="payment" checked={m.id === activeMethodId} onChange={() => { setMethodId(m.id); setError('') }} />
                  <span>{m.label}</span>
                </label>
              ))}
              {methods.length === 0 && <p className="muted">Payment is not available right now. Please message us on WhatsApp.</p>}
            </div>
            {method && method.instructions && (
              <div className="checkout-pay-box">
                <p>{fillInstructions(method.instructions, total)}</p>
              </div>
            )}
            {method && method.askReference && (
              <label><span>Transaction ID <span className="muted">(if you have already paid)</span></span>
                <input type="text" value={form.paymentRef} onChange={(e) => set('paymentRef', e.target.value)} />
              </label>
            )}
          </div>

          <aside className="checkout-summary">
            <h2>Your order</h2>
            <ul className="checkout-summary-list">
              {items.map((i) => (
                <li key={i.itemId} className={i.soldOut ? 'is-soldout' : ''}>
                  <span className="checkout-line">
                    {i.image && <img src={optimizeImage(i.image, 120)} alt="" loading="lazy" decoding="async" />}
                    <span>
                      {i.name}{i.variantLabel ? ` (${i.variantLabel})` : ''} × {i.qty}
                      {i.soldOut && <em> — sold out</em>}
                    </span>
                  </span>
                  <span>{i.soldOut ? '—' : money(i.price * i.qty)}</span>
                </li>
              ))}
              <li><span>Items</span><span>{money(cartTotal)}</span></li>
              <li><span>Delivery{city ? ` to ${city}` : ''}</span><span>{fee == null ? 'Enter your city' : money(fee)}</span></li>
              <li className="checkout-total"><span>Total</span><span>{fee == null ? money(cartTotal) : money(total)}</span></li>
            </ul>

            {soldOutItems.length > 0 && (
              <div className="checkout-warn">
                Some items in your bag are sold out.
                <button type="button" className="btn btn-line" onClick={() => soldOutItems.forEach((i) => removeFromCart(i.itemId))}>
                  Remove sold-out items
                </button>
              </div>
            )}

            {error && <p className="checkout-error" role="alert">{error}</p>}

            <button className="btn btn-solid checkout-submit" type="submit" disabled={submitting || buyable.length === 0 || !method}>
              {submitting ? 'Placing order…' : `Place order · ${money(fee == null ? cartTotal : total)}`}
            </button>
            <p className="muted checkout-fine">Prices and delivery are confirmed when the order is placed.</p>
          </aside>
        </form>
      </main>
      <Footer />
    </div>
  )
}
