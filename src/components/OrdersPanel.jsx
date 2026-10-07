import { Fragment, useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { ORDER_STATUSES, money, whatsappLink } from '../utils/checkout.js'

function when(value) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

// Admin -> Orders. Both administrators and editors can see orders and move
// them through New -> Confirmed -> Shipped -> Delivered (or Cancelled).
export default function OrdersPanel({ onNewCount }) {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('active')
  const [open, setOpen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('orders').select('*').order('created_at', { ascending: false }).limit(300)
    if (err) {
      console.error('Failed to load orders:', err)
      setError('Could not load orders. Has the orders SQL been run in Supabase?')
      setOrders([])
    } else {
      setError('')
      setOrders(data)
      if (onNewCount) onNewCount(data.filter((o) => o.status === 'new').length)
    }
    setLoading(false)
  }, [onNewCount])

  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  async function setStatus(order, status) {
    const prev = orders
    const next = orders.map((o) => (o.id === order.id ? { ...o, status } : o))
    setOrders(next)
    if (onNewCount) onNewCount(next.filter((o) => o.status === 'new').length)
    const { error: err } = await supabase.from('orders').update({ status }).eq('id', order.id)
    if (err) {
      console.error('Failed to update order:', err)
      setError('Could not change the status. Please try again.')
      setOrders(prev)
      if (onNewCount) onNewCount(prev.filter((o) => o.status === 'new').length)
    } else {
      setError('')
    }
  }

  const shown = orders.filter((o) => {
    if (filter === 'all') return true
    if (filter === 'active') return o.status === 'new' || o.status === 'confirmed' || o.status === 'shipped'
    return o.status === filter
  })
  const count = (s) => orders.filter((o) => o.status === s).length

  return (
    <div className="orders-panel">
      <div className="activity-toolbar">
        <div className="orders-filters" role="tablist" aria-label="Filter orders">
          {[{ key: 'active', label: 'Open' }, ...ORDER_STATUSES, { key: 'all', label: 'All' }].map((f) => (
            <button
              key={f.key}
              type="button"
              className={`orders-filter${filter === f.key ? ' is-on' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}{f.key === 'new' && count('new') ? ` (${count('new')})` : ''}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-line" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>

      {error && <p className="admin-form-error">{error}</p>}

      <div className="admin-table-scroll">
        <table className="activity-table orders-table">
          <thead>
            <tr><th>Order</th><th>When</th><th>Customer</th><th>City</th><th>Total</th><th>Payment</th><th>Status</th></tr>
          </thead>
          <tbody>
            {shown.map((o) => (
              <Fragment key={o.id}>
                <tr className={`orders-row status-${o.status}`}>
                  <td>
                    <button type="button" className="orders-link" onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}>
                      {o.order_number}
                    </button>
                  </td>
                  <td className="activity-when">{when(o.created_at)}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.city}</td>
                  <td>{money(o.total)}</td>
                  <td>{o.payment_method}{o.payment_ref ? ` · ${o.payment_ref}` : ''}</td>
                  <td>
                    <select value={o.status} onChange={(e) => setStatus(o, e.target.value)} aria-label={`Status of ${o.order_number}`}>
                      {ORDER_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </td>
                </tr>
                {open === o.id && (
                  <tr className="orders-detail">
                    <td colSpan="7">
                      <div className="orders-detail-grid">
                        <div>
                          <h4>Items</h4>
                          <ul>
                            {o.items.map((i, idx) => (
                              <li key={idx}>{i.name}{i.variant ? ` (${i.variant})` : ''} × {i.qty} — {money(i.line_total)}</li>
                            ))}
                            <li>Delivery — {money(o.delivery_fee)}</li>
                            <li><strong>Total — {money(o.total)}</strong></li>
                          </ul>
                        </div>
                        <div>
                          <h4>Deliver to</h4>
                          <p>{o.customer_name}<br />{o.address}<br />{o.city}</p>
                          <p>
                            <a href={`tel:${o.phone}`}>{o.phone}</a>{' · '}
                            <a href={whatsappLink(o.phone.startsWith('0') ? `92${o.phone.slice(1)}` : o.phone, `Hi ${o.customer_name}, this is Scentfused about your order ${o.order_number}.`)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                          </p>
                          {o.notes && <p><strong>Notes:</strong> {o.notes}</p>}
                          {o.updated_by_name && <p className="muted">Last status change by {o.updated_by_name}, {when(o.updated_at)}</p>}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!loading && shown.length === 0 && !error && (
              <tr><td colSpan="7" className="muted">No orders here yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
