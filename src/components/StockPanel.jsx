import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { CATEGORIES } from '../data/catalog.js'
import { stockRows, isTracked } from '../utils/stock.js'

const STATUS_LABEL = { out: 'Out of stock', low: 'Low', ok: 'OK', untracked: 'Not tracked' }
const STATUS_ORDER = { out: 0, low: 1, ok: 2, untracked: 3 }

// Admin -> Stock. Every size of every product with its quantity. Low and
// empty sizes come first. Change a number, press Save on that row.
export default function StockPanel({ products, setProducts, threshold, isAdmin, onThreshold }) {
  const [filter, setFilter] = useState('attention')
  const [query, setQuery] = useState('')
  const [edits, setEdits] = useState({}) // "productId:index" -> text
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState({ kind: '', text: '' })
  const [thresholdText, setThresholdText] = useState(String(threshold))

  const rows = useMemo(() => {
    const all = stockRows(products, threshold)
    return all
      .filter((r) => {
        if (query && !r.product.name.toLowerCase().includes(query.toLowerCase())) return false
        if (filter === 'attention') return r.status === 'out' || r.status === 'low'
        if (filter === 'all') return true
        return r.status === filter
      })
      .sort((a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        || (a.stock ?? 1e9) - (b.stock ?? 1e9)
        || a.product.name.localeCompare(b.product.name)
        || a.index - b.index)
  }, [products, threshold, filter, query])

  const counts = useMemo(() => {
    const c = { out: 0, low: 0, ok: 0, untracked: 0 }
    stockRows(products, threshold).forEach((r) => { c[r.status] += 1 })
    return c
  }, [products, threshold])

  const keyOf = (r) => `${r.product.id}:${r.index}`

  async function save(r) {
    const k = keyOf(r)
    const text = edits[k]
    if (text === undefined) return
    const trimmed = String(text).trim()
    let nextStock
    if (trimmed === '') nextStock = undefined // stop tracking
    else {
      const n = Math.floor(Number(trimmed))
      if (!isFinite(n) || n < 0) { setMessage({ kind: 'error', text: 'Stock must be 0 or a whole number above it.' }); return }
      nextStock = n
    }
    // Always edit the freshest copy of the product's sizes.
    const current = products.find((p) => p.id === r.product.id)
    const variants = (current.variants || []).map((v, i) => {
      if (i !== r.index) return v
      const copy = { ...v }
      if (nextStock === undefined) delete copy.stock
      else { copy.stock = nextStock; if (nextStock > 0) copy.soldOut = false }
      return copy
    })
    setBusy(k)
    setMessage({ kind: '', text: '' })
    const { error } = await supabase.from('products').update({ variants }).eq('id', r.product.id)
    setBusy('')
    if (error) {
      console.error('Failed to save stock:', error)
      setMessage({ kind: 'error', text: 'Could not save that number. Please try again.' })
      return
    }
    setProducts((prev) => prev.map((p) => (p.id === r.product.id ? { ...p, variants } : p)))
    setEdits((e) => { const n = { ...e }; delete n[k]; return n })
    setMessage({ kind: 'ok', text: `Saved ${r.product.name} (${r.variant.label}).` })
  }

  function saveThreshold() {
    const n = Math.floor(Number(thresholdText))
    if (!isFinite(n) || n < 0) { setMessage({ kind: 'error', text: 'Low-stock level must be 0 or more.' }); return }
    onThreshold(n)
    setMessage({ kind: 'ok', text: `Low-stock warning now starts at ${n}.` })
  }

  return (
    <div className="stock-panel">
      <p className="settings-help">
        Type a stock quantity for a size to track it. Customer orders take quantities off automatically,
        a size at 0 shows <strong>Sold out</strong> on the website, and cancelling an order puts its items back.
        Leave a size empty if you do not want to track it.
      </p>

      <div className="stock-summary">
        <button type="button" className={`stock-chip stock-out${filter === 'out' ? ' is-on' : ''}`} onClick={() => setFilter('out')}>Out <b>{counts.out}</b></button>
        <button type="button" className={`stock-chip stock-low${filter === 'low' ? ' is-on' : ''}`} onClick={() => setFilter('low')}>Low <b>{counts.low}</b></button>
        <button type="button" className={`stock-chip stock-ok${filter === 'ok' ? ' is-on' : ''}`} onClick={() => setFilter('ok')}>OK <b>{counts.ok}</b></button>
        <button type="button" className={`stock-chip stock-untracked${filter === 'untracked' ? ' is-on' : ''}`} onClick={() => setFilter('untracked')}>Not tracked <b>{counts.untracked}</b></button>
        <button type="button" className={`stock-chip${filter === 'attention' ? ' is-on' : ''}`} onClick={() => setFilter('attention')}>Needs attention</button>
        <button type="button" className={`stock-chip${filter === 'all' ? ' is-on' : ''}`} onClick={() => setFilter('all')}>All</button>
      </div>

      <div className="stock-toolbar">
        <input type="text" placeholder="Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        {isAdmin && (
          <label className="stock-threshold">
            Warn when stock is
            <input type="number" min="0" step="1" value={thresholdText} onChange={(e) => setThresholdText(e.target.value)} aria-label="Low stock level" />
            or less
            <button type="button" className="btn btn-line" onClick={saveThreshold} disabled={Number(thresholdText) === threshold}>Save</button>
          </label>
        )}
      </div>

      {message.text && <p className={`filter-status filter-status-${message.kind}`} role="status">{message.text}</p>}

      <div className="admin-table-scroll">
        <table className="admin-table stock-table">
          <thead>
            <tr><th>Product</th><th>Category</th><th>Size</th><th>Status</th><th>Quantity</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const k = keyOf(r)
              const value = edits[k] !== undefined ? edits[k] : (isTracked(r.variant) ? String(r.variant.stock) : '')
              const changed = edits[k] !== undefined
              return (
                <tr key={k}>
                  <td>{r.product.name}</td>
                  <td className="muted">{CATEGORIES.find((c) => c.key === r.product.category)?.label}</td>
                  <td>{r.variant.label}</td>
                  <td><span className={`stock-pill stock-${r.status}`}>{STATUS_LABEL[r.status]}{r.variant.soldOut && isTracked(r.variant) && r.variant.stock > 0 ? ' (marked sold out)' : ''}</span></td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="stock-input"
                      placeholder="not tracked"
                      aria-label={`Stock of ${r.product.name} ${r.variant.label}`}
                      value={value}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [k]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(r) } }}
                    />
                  </td>
                  <td>
                    <button type="button" className="btn btn-line" onClick={() => save(r)} disabled={!changed || busy === k}>
                      {busy === k ? 'Saving…' : 'Save'}
                    </button>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan="6" className="muted">
                {filter === 'attention' ? 'Nothing is low or out of stock. 🎉' : 'Nothing to show here.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
