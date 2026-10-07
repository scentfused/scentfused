// Everything about the shop filters lives here: the default option lists, how
// they are saved, how products are matched against them, and how images are
// resized. Admin -> Site Settings -> Filters edits these lists and the website
// reads them back, so the storefront filters and the Admin product form always
// offer exactly the same choices.

// The groups an administrator can manage. `key` is also the product attribute
// the group matches (for the 'notes' group it matches Top/Heart/Base notes).
export const FILTER_GROUPS = [
  { key: 'notes', label: 'Notes', help: 'Words people can filter by, e.g. Oud, Rose, Vanilla. A perfume matches if any of its top, heart or base notes contains the word.', free: true, defaultOn: true },
  { key: 'season', label: 'Season', help: 'Also the Season checkboxes in the Add / Edit product form.', defaultOn: true },
  { key: 'occasion', label: 'Occasion', help: 'Also the Occasion checkboxes in the Add / Edit product form.', defaultOn: true },
  { key: 'concentration', label: 'Concentration', help: 'Also the Concentration dropdown in the product form.', defaultOn: false },
  { key: 'lasting', label: 'Lasting power', help: 'Also the Lasting power dropdown in the product form.', defaultOn: false },
  { key: 'projection', label: 'Projection', help: 'Also the Projection dropdown in the product form.', defaultOn: false }
]

export const DEFAULT_FILTER_OPTIONS = {
  lists: {
    notes: ['Oud', 'Rose', 'Vanilla', 'Amber', 'Musk', 'Sandalwood', 'Citrus', 'Jasmine'],
    season: ['Spring', 'Summer', 'Fall', 'Winter'],
    occasion: ['Casual', 'Office', 'Evening', 'Special'],
    concentration: ['EDT', 'EDP', 'Parfum', 'Extrait'],
    lasting: ['Light', 'Moderate', 'Long-lasting', 'Very long-lasting'],
    projection: ['Intimate', 'Moderate', 'Strong', 'Beast mode']
  },
  // Which groups appear as filters on the category pages.
  enabled: { notes: true, season: true, occasion: true, concentration: false, lasting: false, projection: false },
  priceEnabled: true,
  // min is inclusive, max is exclusive. null = no limit.
  priceRanges: [
    { label: 'Under Rs. 2,000', min: null, max: 2000 },
    { label: 'Rs. 2,000 – 4,000', min: 2000, max: 4000 },
    { label: 'Rs. 4,000 – 6,000', min: 4000, max: 6000 },
    { label: 'Rs. 6,000 and above', min: 6000, max: null }
  ]
}

function cleanList(list) {
  const seen = new Set()
  const out = []
  ;(Array.isArray(list) ? list : []).forEach((v) => {
    const s = String(v == null ? '' : v).trim()
    if (!s || seen.has(s.toLowerCase())) return
    seen.add(s.toLowerCase())
    out.push(s)
  })
  return out
}

function cleanRange(r) {
  if (!r || typeof r !== 'object') return null
  const min = r.min === '' || r.min == null || isNaN(Number(r.min)) ? null : Number(r.min)
  const max = r.max === '' || r.max == null || isNaN(Number(r.max)) ? null : Number(r.max)
  if (min == null && max == null) return null
  if (min != null && max != null && min >= max) return null
  const label = String(r.label || '').trim() || describeRange(min, max)
  return { label, min, max }
}

export function describeRange(min, max) {
  const f = (n) => `Rs. ${Number(n).toLocaleString()}`
  if (min == null) return `Under ${f(max)}`
  if (max == null) return `${f(min)} and above`
  return `${f(min)} – ${Number(max).toLocaleString()}`
}

// Accepts whatever came out of the database (null, partial, old) and returns a
// complete, tidy object. Anything missing falls back to the defaults, so the
// site works before the SQL has even been run.
export function normalizeFilterOptions(raw) {
  const d = DEFAULT_FILTER_OPTIONS
  const src = raw && typeof raw === 'object' ? raw : {}
  const lists = {}
  FILTER_GROUPS.forEach((g) => {
    lists[g.key] = Array.isArray(src.lists?.[g.key]) ? cleanList(src.lists[g.key]) : d.lists[g.key].slice()
  })
  const enabled = {}
  FILTER_GROUPS.forEach((g) => {
    enabled[g.key] = typeof src.enabled?.[g.key] === 'boolean' ? src.enabled[g.key] : d.enabled[g.key]
  })
  const priceRanges = Array.isArray(src.priceRanges)
    ? src.priceRanges.map(cleanRange).filter(Boolean)
    : d.priceRanges.map((r) => ({ ...r }))
  return {
    lists,
    enabled,
    priceEnabled: typeof src.priceEnabled === 'boolean' ? src.priceEnabled : d.priceEnabled,
    priceRanges
  }
}

// What gets written to the database (same cleaning, so bad input can't be saved).
export function serializeFilterOptions(opts) {
  return normalizeFilterOptions(opts)
}

// The choices the product form should offer for one field. Anything a product
// already has but that was since removed from the list is still included, so
// editing an old product never silently drops its value.
export function formOptions(filterOptions, fieldKey, fallback, currentValue) {
  const opts = normalizeFilterOptions(filterOptions)
  const base = opts.lists[fieldKey] ? opts.lists[fieldKey].slice() : (fallback || []).slice()
  const current = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : [])
  current.forEach((v) => {
    if (v && !base.some((b) => b.toLowerCase() === String(v).toLowerCase())) base.push(v)
  })
  return base
}

// ---------- matching ----------

// The price the shop card shows: the sale price when there is one.
export function effectivePrice(p) {
  const sale = Number(p.sale_price)
  const base = Number(p.price) || 0
  if (sale > 0 && sale < base) return sale
  return base
}

function asArray(v) {
  if (Array.isArray(v)) return v
  return v ? [v] : []
}

export function productNotes(p) {
  const a = p.attributes || {}
  return [...asArray(a.topNotes), ...asArray(a.heartNotes), ...asArray(a.baseNotes)]
    .map((n) => String(n).toLowerCase())
}

function matchesNote(p, word) {
  const w = String(word).toLowerCase()
  return productNotes(p).some((n) => n.includes(w))
}

function matchesValue(p, key, wanted) {
  const have = asArray(p.attributes?.[key]).map((v) => String(v).toLowerCase())
  return have.includes(String(wanted).toLowerCase())
}

function matchesPrice(p, range) {
  const price = effectivePrice(p)
  if (range.min != null && price < range.min) return false
  if (range.max != null && price >= range.max) return false
  return true
}

// selection: { notes:[], season:[], occasion:[], ..., price:[rangeLabel] }
// Within one group the choices are OR ("Summer or Winter"); between groups
// they are AND ("Summer AND contains Oud").
export function matchesSelection(p, selection, opts, skipKey) {
  for (const g of FILTER_GROUPS) {
    if (g.key === skipKey) continue
    const chosen = selection[g.key] || []
    if (!chosen.length) continue
    const ok = g.key === 'notes'
      ? chosen.some((w) => matchesNote(p, w))
      : chosen.some((w) => matchesValue(p, g.key, w))
    if (!ok) return false
  }
  if (skipKey !== 'price') {
    const chosen = selection.price || []
    if (chosen.length) {
      const ranges = opts.priceRanges.filter((r) => chosen.includes(r.label))
      if (!ranges.some((r) => matchesPrice(p, r))) return false
    }
  }
  return true
}

export function countFor(products, groupKey, option, selection, opts) {
  const probe = { ...selection, [groupKey]: [option] }
  return products.filter((p) => matchesSelection(p, probe, opts)).length
}

export const SORTS = [
  { key: 'az', label: 'Name: A – Z' },
  { key: 'newest', label: 'Newest first' },
  { key: 'price-asc', label: 'Price: low to high' },
  { key: 'price-desc', label: 'Price: high to low' }
]

export function sortProducts(list, sortKey) {
  const out = list.slice()
  const time = (p) => {
    const t = p.created_at ? new Date(p.created_at).getTime() : NaN
    return isNaN(t) ? 0 : t
  }
  if (sortKey === 'newest') out.sort((a, b) => (time(b) - time(a)) || (Number(b.id) - Number(a.id)))
  else if (sortKey === 'price-asc') out.sort((a, b) => effectivePrice(a) - effectivePrice(b) || a.name.localeCompare(b.name))
  else if (sortKey === 'price-desc') out.sort((a, b) => effectivePrice(b) - effectivePrice(a) || a.name.localeCompare(b.name))
  else out.sort((a, b) => a.name.localeCompare(b.name))
  return out
}

// ---------- images ----------

// Cloudinary can shrink and re-encode an image just by changing its URL.
// f_auto = best format for the browser (WebP/AVIF), q_auto = smart quality,
// w_N = width. Anything that isn't a Cloudinary upload URL is left alone.
export function optimizeImage(url, width) {
  if (!url || typeof url !== 'string') return url
  const marker = '/image/upload/'
  const i = url.indexOf('res.cloudinary.com')
  const j = url.indexOf(marker)
  if (i === -1 || j === -1) return url
  const rest = url.slice(j + marker.length)
  // Already has transformations from us? don't stack them.
  if (/^(f_auto|q_auto|w_\d+|c_[a-z_]+)[,/]/.test(rest)) return url
  return `${url.slice(0, j + marker.length)}f_auto,q_auto,c_limit,w_${width}/${rest}`
}

export function imageSrcSet(url, widths) {
  const first = optimizeImage(url, widths[0])
  if (first === url) return undefined
  return widths.map((w) => `${optimizeImage(url, w)} ${w}w`).join(', ')
}
