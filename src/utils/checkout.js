// Everything about checkout that isn't screen layout: the default delivery and
// payment settings, how a delivery fee is worked out, phone checking and the
// WhatsApp message. The same defaults are written into the database by
// supabase-orders.sql; the database re-checks everything when an order is placed.

export const DEFAULT_DELIVERY_RATES = {
  default: 400,
  cities: [{ city: 'Karachi', fee: 250 }]
}

export const DEFAULT_PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on delivery', enabled: true, askReference: false, account: '',
    instructions: 'Pay the rider in cash when your order arrives.' },
  { id: 'jazzcash', label: 'JazzCash', enabled: true, askReference: true, account: '0302 2726002',
    instructions: 'Send {total} to JazzCash 0302 2726002, then enter the transaction ID below or send the screenshot to us on WhatsApp.' }
]

export const DEFAULT_WHATSAPP = '923022726002'

export const ORDER_STATUSES = [
  { key: 'new', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' }
]

export function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`
}

function wholeNumber(v, fallback) {
  const n = Number(v)
  return v === '' || v == null || isNaN(n) || n < 0 ? fallback : Math.round(n)
}

export function normalizeDeliveryRates(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const seen = new Set()
  const cities = (Array.isArray(src.cities) ? src.cities : DEFAULT_DELIVERY_RATES.cities)
    .map((c) => ({ city: String(c?.city || '').trim(), fee: wholeNumber(c?.fee, null) }))
    .filter((c) => {
      const k = c.city.toLowerCase()
      if (!c.city || c.fee == null || seen.has(k)) return false
      seen.add(k)
      return true
    })
  return { default: wholeNumber(src.default, DEFAULT_DELIVERY_RATES.default), cities }
}

export function normalizePaymentMethods(raw) {
  const list = Array.isArray(raw) ? raw : DEFAULT_PAYMENT_METHODS
  const seen = new Set()
  return list
    .map((m) => ({
      id: String(m?.id || '').trim(),
      label: String(m?.label || '').trim(),
      enabled: m?.enabled !== false,
      askReference: Boolean(m?.askReference),
      account: String(m?.account || '').trim(),
      instructions: String(m?.instructions || '').trim()
    }))
    .filter((m) => {
      if (!m.id || !m.label || seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
}

export function normalizeWhatsapp(raw) {
  const digits = String(raw == null ? '' : raw).replace(/\D/g, '')
  return digits.length >= 10 ? digits : DEFAULT_WHATSAPP
}

export function slugify(text, taken) {
  const base = String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'method'
  let id = base
  let i = 2
  while (taken.includes(id)) id = `${base}-${i++}`
  return id
}

// The fee for a city: its own rate if one is set, otherwise the default rate.
export function deliveryFeeFor(city, rates) {
  const r = normalizeDeliveryRates(rates)
  const key = String(city || '').trim().toLowerCase()
  const hit = r.cities.find((c) => c.city.toLowerCase() === key)
  return hit ? hit.fee : r.default
}

export function cleanPhone(value) {
  return String(value || '').replace(/\D/g, '')
}

export function isValidPhone(value) {
  const d = cleanPhone(value)
  return d.length >= 10 && d.length <= 13
}

// "{total}" in a payment method's instructions becomes the order total.
export function fillInstructions(text, total) {
  return String(text || '').replace(/\{total\}/g, money(total))
}

export function whatsappLink(number, text) {
  return `https://wa.me/${normalizeWhatsapp(number)}?text=${encodeURIComponent(text)}`
}

export function orderMessage(order, customer) {
  const lines = (order.items || []).map(
    (i) => `• ${i.name}${i.variant ? ` (${i.variant})` : ''} × ${i.qty} — ${money(i.line_total)}`
  )
  return [
    `Hi Scentfused! I placed order ${order.order_number}.`,
    '',
    ...lines,
    '',
    `Items: ${money(order.subtotal)}`,
    `Delivery: ${money(order.delivery_fee)}`,
    `Total: ${money(order.total)}`,
    `Payment: ${order.payment_method}${customer?.paymentRef ? ` (ID: ${customer.paymentRef})` : ''}`,
    '',
    `Name: ${customer?.name || ''}`,
    `Phone: ${customer?.phone || ''}`,
    `Address: ${customer?.address || ''}, ${customer?.city || ''}`
  ].join('\n')
}
