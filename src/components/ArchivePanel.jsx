import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { money } from '../utils/checkout.js'

function when(value) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Admin -> Archive (administrator only). Everything anyone deletes - products
// and orders - lands here. Restore puts it back exactly as it was; "Delete
// forever" removes it for good.
export default function ArchivePanel({ setProducts }) {
  const [rows, setRows] = useState([])
  const [kind, setKind] = useState('all')
  const [open, setOpen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [message, setMessage] = useState({ kind: '', text: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('archive').select('*').order('deleted_at', { ascending: false }).limit(500)
    if (error) {
      console.error('Failed to load archive:', error)
      setMessage({ kind: 'error', text: 'Could not load the archive. Has the stock & archive SQL been run in Supabase?' })
      setRows([])
    } else {
      setRows(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function restore(row) {
    if (!window.confirm(`Restore ${row.kind} "${row.label}"?`)) return
    setBusy(row.id)
    setMessage({ kind: '', text: '' })
    const { error } = await supabase.rpc('restore_archived', { p_id: row.id })
    if (error) {
      console.error('Restore failed:', error)
      setMessage({ kind: 'error', text: error.message || 'Could not restore that item.' })
      setBusy(null)
      return
    }
    if (row.kind === 'product') {
      // bring the restored product back into the Admin list straight away
      const { data } = await supabase.from('products').select('*').eq('id', row.original_id).single()
      if (data && setProducts) setProducts((prev) => (prev.some((p) => p.id === data.id) ? prev : [...prev, { ...data, image: data.image || '' }]))
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id))
    setBusy(null)
    setMessage({ kind: 'ok', text: `Restored ${row.kind} "${row.label}".` })
  }

  async function purge(row) {
    if (!window.confirm(`Delete "${row.label}" forever? This cannot be undone.`)) return
    setBusy(row.id)
    setMessage({ kind: '', text: '' })
    const { data, error } = await supabase.from('archive').delete().eq('id', row.id).select()
    setBusy(null)
    if (error || !data || data.length === 0) {
      console.error('Purge failed:', error)
      setMessage({ kind: 'error', text: 'Could not remove that entry.' })
      return
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id))
    setMessage({ kind: 'ok', text: `"${row.label}" was deleted forever.` })
  }

  const shown = rows.filter((r) => kind === 'all' || r.kind === kind)
  const count = (k) => rows.filter((r) => r.kind === k).length

  return (
    <div className="archive-panel">
      <p className="settings-help">
        Products and orders that were deleted are kept here, and only you can see this page.
        Restore brings one back exactly as it was.
      </p>
      <div className="activity-toolbar">
        <div className="orders-filters" role="tablist" aria-label="Filter archive">
          {[{ key: 'all', label: `All (${rows.length})` }, { key: 'product', label: `Products (${count('product')})` }, { key: 'order', label: `Orders (${count('order')})` }].map((f) => (
            <button key={f.key} type="button" className={`orders-filter${kind === f.key ? ' is-on' : ''}`} onClick={() => setKind(f.key)}>{f.label}</button>
          ))}
        </div>
        <button type="button" className="btn btn-line" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>

      {message.text && <p className={`filter-status filter-status-${message.kind}`} role="status">{message.text}</p>}

      <div className="admin-table-scroll">
        <table className="activity-table archive-table">
          <thead>
            <tr><th>Type</th><th>Name</th><th>Deleted</th><th>By</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <FragmentRows key={r.id} r={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} busy={busy === r.id} onRestore={() => restore(r)} onPurge={() => purge(r)} />
            ))}
            {!loading && shown.length === 0 && (
              <tr><td colSpan="5" className="muted">The archive is empty.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FragmentRows({ r, open, onToggle, busy, onRestore, onPurge }) {
  const d = r.data || {}
  return (
    <>
      <tr>
        <td><span className={`archive-kind archive-${r.kind}`}>{r.kind === 'product' ? 'Product' : 'Order'}</span></td>
        <td><button type="button" className="orders-link" onClick={onToggle} aria-expanded={open}>{r.label}</button></td>
        <td className="activity-when">{when(r.deleted_at)}</td>
        <td>{r.deleted_by_name || '—'}</td>
        <td className="admin-row-actions">
          <button type="button" onClick={onRestore} disabled={busy}>{busy ? '…' : 'Restore'}</button>
          <button type="button" onClick={onPurge} disabled={busy}>Delete forever</button>
        </td>
      </tr>
      {open && (
        <tr className="orders-detail">
          <td colSpan="5">
            {r.kind === 'product' ? (
              <div>
                <p><strong>Price:</strong> {money(d.price)} · <strong>Category:</strong> {d.category}</p>
                {Array.isArray(d.variants) && d.variants.length > 0 && (
                  <p><strong>Sizes:</strong> {d.variants.map((v) => `${v.label} ${money(v.price)}${typeof v.stock === 'number' ? ` (stock ${v.stock})` : ''}`).join(' · ')}</p>
                )}
                {d.description && <p className="muted">{d.description}</p>}
              </div>
            ) : (
              <div className="orders-detail-grid">
                <div>
                  <h4>Items</h4>
                  <ul>
                    {(d.items || []).map((i, idx) => (
                      <li key={idx}>{i.name}{i.variant ? ` (${i.variant})` : ''} × {i.qty} — {money(i.line_total)}</li>
                    ))}
                    <li><strong>Total — {money(d.total)}</strong> ({d.payment_method}) · status: {d.status}</li>
                  </ul>
                </div>
                <div>
                  <h4>Deliver to</h4>
                  <p>{d.customer_name}<br />{d.address}<br />{d.city}<br />{d.phone}</p>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
