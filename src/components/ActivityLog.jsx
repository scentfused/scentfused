import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { TYPOGRAPHY_COLUMNS } from '../utils/typography.js'

const PAGE_SIZE = 100

// Friendly names for the database column names the log records.
const FIELD_LABELS = {
  name: 'name',
  category: 'category',
  note: 'note',
  price: 'price',
  sale_price: 'sale price',
  sku: 'SKU',
  image: 'main image',
  images: 'gallery images',
  variants: 'sizes & prices',
  description: 'description',
  features: 'features',
  usage: 'how to use',
  attributes: 'details',
  brand_font: 'brand font',
  accent_color: 'accent color',
  show_new_badge: '"New" badge',
  carousel_autoplay: 'carousel autoplay',
  hero_image: 'hero image',
  carousel_product_ids: 'carousel products',
  promo_banner_1_image: 'Royal banner image',
  promo_banner_2_image: 'Marina banner image',
  promo_banner_1_font: 'Royal banner font',
  promo_banner_2_font: 'Marina banner font',
  promo_banner_1_font_size: 'Royal banner size',
  promo_banner_2_font_size: 'Marina banner size',
  filter_options: 'shop filters',
  delivery_rates: 'delivery charges',
  payment_methods: 'payment methods',
  whatsapp_number: 'WhatsApp number',
  low_stock_threshold: 'Low-stock level',
  status: 'status'
}

// Fonts / sizes / colors saved from Site Settings (generated from one list).
TYPOGRAPHY_COLUMNS.forEach((c) => {
  FIELD_LABELS[c.column] = c.label
})

function formatTimestamp(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function describeAction(row) {
  if (row.target === 'order' && row.action === 'deleted') return 'Deleted an order'
  if (row.target === 'order') return `Order ${row.details?.status ? 'marked ' + row.details.status : 'updated'}`
  if (row.target === 'settings') return 'Changed site settings'
  if (row.action === 'added') return 'Added a product'
  if (row.action === 'deleted') return 'Deleted a product'
  return 'Edited a product'
}

function describeDetails(row) {
  const changed = row.details && Array.isArray(row.details.changed) ? row.details.changed : []
  if (changed.length === 0) return ''
  return changed.map((key) => FIELD_LABELS[key] || key).join(', ')
}

// Who did what, and when. Only the site administrator can open this. The
// entries are written by the database itself, so they can't be edited or
// skipped from the website.
export default function ActivityLog() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [count, setCount] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async (wanted) => {
    setLoading(true)
    setError('')

    // Ask for one extra row just to know whether there is more to load.
    const { data, error: loadError } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(wanted + 1)

    if (loadError) {
      console.error('Failed to load activity log:', loadError)
      setError('Could not load the activity log.')
      setRows([])
      setHasMore(false)
    } else {
      setHasMore(data.length > wanted)
      setRows(data.slice(0, wanted))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load(count)
  }, [count, load])

  return (
    <div>
      <div className="activity-toolbar">
        <p className="muted">Every add, edit, and delete, newest first.</p>
        <button type="button" className="btn btn-line" onClick={() => load(count)} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <p className="admin-form-error">{error}</p>}

      <div className="admin-table-scroll">
        <table className="activity-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>What</th>
              <th>Item</th>
              <th>Changed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="activity-when">{formatTimestamp(row.created_at)}</td>
                <td>{row.user_name}</td>
                <td>
                  <span className={`activity-action activity-${row.action}`}>{describeAction(row)}</span>
                </td>
                <td>{row.record_label || '—'}</td>
                <td className="muted">{describeDetails(row)}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && !error && (
              <tr>
                <td colSpan="5" className="muted">Nothing has been logged yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button
          type="button"
          className="btn btn-line activity-more"
          onClick={() => setCount((c) => c + PAGE_SIZE)}
          disabled={loading}
        >
          Load more
        </button>
      )}
    </div>
  )
}
