import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { FILTER_GROUPS, normalizeFilterOptions, describeRange } from '../utils/filters.js'

let nextId = 1
const newId = () => `f${nextId++}`

function toEditable(opts) {
  const lists = {}
  FILTER_GROUPS.forEach((g) => {
    lists[g.key] = opts.lists[g.key].map((v) => ({ id: newId(), value: v, orig: v }))
  })
  return {
    lists,
    enabled: { ...opts.enabled },
    priceEnabled: opts.priceEnabled,
    priceRanges: opts.priceRanges.map((r) => ({
      id: newId(), label: r.label, min: r.min == null ? '' : String(r.min), max: r.max == null ? '' : String(r.max)
    }))
  }
}

function fromEditable(draft) {
  const lists = {}
  FILTER_GROUPS.forEach((g) => { lists[g.key] = draft.lists[g.key].map((i) => i.value) })
  return {
    lists,
    enabled: draft.enabled,
    priceEnabled: draft.priceEnabled,
    priceRanges: draft.priceRanges.map((r) => ({ label: r.label, min: r.min, max: r.max }))
  }
}

function asArray(v) {
  if (Array.isArray(v)) return v
  return v ? [v] : []
}

function hasValue(product, key, value) {
  return asArray(product.attributes?.[key]).some((v) => String(v).toLowerCase() === String(value).toLowerCase())
}

// Admin -> Site Settings -> Filters. Add, rename and remove the options that
// shoppers can filter by. The same lists feed the Season / Occasion /
// Concentration / Lasting / Projection choices in the product form.
export default function FilterSettings({ settings, setSettings, products, setProducts }) {
  const baseline = useMemo(() => normalizeFilterOptions(settings.filterOptions), [settings.filterOptions])
  const [draft, setDraft] = useState(() => toEditable(baseline))
  const [adding, setAdding] = useState({})
  const [status, setStatus] = useState({ kind: '', text: '' })
  const [saving, setSaving] = useState(false)

  // After a save (or if settings load late) show what is really stored.
  useEffect(() => { setDraft(toEditable(baseline)) }, [baseline])

  const cleaned = useMemo(() => normalizeFilterOptions(fromEditable(draft)), [draft])
  const dirty = JSON.stringify(cleaned) !== JSON.stringify(baseline)

  function setList(key, fn) {
    setDraft((d) => ({ ...d, lists: { ...d.lists, [key]: fn(d.lists[key]) } }))
    setStatus({ kind: '', text: '' })
  }

  function addItem(key) {
    const value = (adding[key] || '').trim()
    if (!value) return
    if (draft.lists[key].some((i) => i.value.trim().toLowerCase() === value.toLowerCase())) {
      setStatus({ kind: 'error', text: `"${value}" is already in the ${key} list.` })
      return
    }
    setList(key, (list) => [...list, { id: newId(), value, orig: null }])
    setAdding((a) => ({ ...a, [key]: '' }))
  }

  function setRange(id, patch) {
    setDraft((d) => ({ ...d, priceRanges: d.priceRanges.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
    setStatus({ kind: '', text: '' })
  }

  function addRange() {
    setDraft((d) => ({ ...d, priceRanges: [...d.priceRanges, { id: newId(), label: '', min: '', max: '' }] }))
  }

  function discard() {
    setDraft(toEditable(baseline))
    setStatus({ kind: '', text: '' })
  }

  async function save() {
    // Price ranges: every row needs a sensible From/To.
    for (const r of draft.priceRanges) {
      const min = r.min === '' ? null : Number(r.min)
      const max = r.max === '' ? null : Number(r.max)
      const blank = !r.label.trim() && r.min === '' && r.max === ''
      if (blank) continue
      if ((min != null && isNaN(min)) || (max != null && isNaN(max))) {
        setStatus({ kind: 'error', text: 'Price ranges need numbers only (no commas or "Rs.").' }); return
      }
      if (min == null && max == null) {
        setStatus({ kind: 'error', text: 'Each price range needs a From, a To, or both.' }); return
      }
      if (min != null && max != null && min >= max) {
        setStatus({ kind: 'error', text: `Price range "${r.label || describeRange(min, max)}": From must be lower than To.` }); return
      }
    }

    // Work out renames and removals (the free-form Notes list is only search
    // words, so it never touches products).
    const renames = []
    const removals = []
    FILTER_GROUPS.filter((g) => !g.free).forEach((g) => {
      draft.lists[g.key].forEach((i) => {
        const to = i.value.trim()
        if (i.orig && to && to !== i.orig) renames.push({ key: g.key, from: i.orig, to })
      })
      baseline.lists[g.key].forEach((v) => {
        const stillThere = draft.lists[g.key].some(
          (i) => i.value.trim().toLowerCase() === v.toLowerCase()
        )
        const renamed = draft.lists[g.key].some((i) => i.orig === v && i.value.trim())
        if (!stillThere && !renamed) removals.push({ key: g.key, value: v })
      })
    })

    const renameHits = renames.map((r) => ({ ...r, hit: products.filter((p) => hasValue(p, r.key, r.from)) }))
    const removalHits = removals
      .map((r) => ({ ...r, count: products.filter((p) => hasValue(p, r.key, r.value)).length }))
      .filter((r) => r.count > 0)

    const lines = []
    renameHits.filter((r) => r.hit.length).forEach((r) =>
      lines.push(`• Renaming "${r.from}" to "${r.to}" also updates ${r.hit.length} product${r.hit.length === 1 ? '' : 's'}.`))
    removalHits.forEach((r) =>
      lines.push(`• ${r.count} product${r.count === 1 ? ' still has' : 's still have'} "${r.value}". They keep it, but it will no longer be a filter or a checkbox choice.`))
    if (lines.length && !window.confirm(`Please confirm:\n\n${lines.join('\n')}\n\nSave these changes?`)) return

    setSaving(true)
    setStatus({ kind: '', text: '' })
    const ok = await setSettings({ ...settings, filterOptions: cleaned })
    if (ok === false) {
      setSaving(false)
      setStatus({ kind: 'error', text: 'Could not save. Check that the filters SQL has been run in Supabase, then try again.' })
      return
    }

    // Apply renames to the products that use them.
    let failed = 0
    const updated = new Map()
    for (const r of renameHits) {
      for (const p of r.hit) {
        const current = updated.get(p.id) || p
        const attrs = { ...(current.attributes || {}) }
        const val = attrs[r.key]
        if (Array.isArray(val)) {
          const swapped = val.map((v) => (String(v).toLowerCase() === r.from.toLowerCase() ? r.to : v))
          attrs[r.key] = swapped.filter((v, i) => swapped.findIndex((x) => String(x).toLowerCase() === String(v).toLowerCase()) === i)
        } else {
          attrs[r.key] = r.to
        }
        const { error } = await supabase.from('products').update({ attributes: attrs }).eq('id', p.id)
        if (error) { failed += 1; console.error('Rename failed for product', p.id, error) } else updated.set(p.id, { ...current, attributes: attrs })
      }
    }
    if (updated.size) setProducts((prev) => prev.map((p) => updated.get(p.id) || p))

    setSaving(false)
    setStatus(failed
      ? { kind: 'error', text: `Filters saved, but ${failed} product${failed === 1 ? '' : 's'} could not be renamed. Edit them by hand.` }
      : { kind: 'ok', text: updated.size ? `Saved. ${updated.size} product${updated.size === 1 ? '' : 's'} updated too.` : 'Saved. The website now uses these filters.' })
  }

  return (
    <div className="settings-group filter-settings">
      <h3 className="settings-group-title">Filters</h3>
      <p className="settings-help">
        The options shoppers can filter by on each category page. Season, Occasion, Concentration,
        Lasting power and Projection here are also the choices in the Add / Edit product form.
        Nothing changes on the website until you press <strong>Save filters</strong>.
      </p>

      {FILTER_GROUPS.map((g) => (
        <div className="filter-group-card" key={g.key}>
          <div className="filter-group-head">
            <strong>{g.label}</strong>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={draft.enabled[g.key]}
                onChange={(e) => { setDraft({ ...draft, enabled: { ...draft.enabled, [g.key]: e.target.checked } }); setStatus({ kind: '', text: '' }) }}
              />
              Show as a filter
            </label>
          </div>
          <p className="settings-help">{g.help}</p>

          <ul className="filter-item-list">
            {draft.lists[g.key].map((item) => (
              <li key={item.id}>
                <input
                  type="text"
                  value={item.value}
                  aria-label={`${g.label} option`}
                  onChange={(e) => setList(g.key, (list) => list.map((i) => (i.id === item.id ? { ...i, value: e.target.value } : i)))}
                />
                <button type="button" className="btn btn-line filter-remove" onClick={() => setList(g.key, (list) => list.filter((i) => i.id !== item.id))}>
                  Remove
                </button>
              </li>
            ))}
            {draft.lists[g.key].length === 0 && <li className="settings-help">No options yet.</li>}
          </ul>

          <div className="filter-add-row">
            <input
              type="text"
              placeholder={`Add a ${g.label.toLowerCase()} option`}
              value={adding[g.key] || ''}
              onChange={(e) => setAdding({ ...adding, [g.key]: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(g.key) } }}
            />
            <button type="button" className="btn btn-line" onClick={() => addItem(g.key)}>Add</button>
          </div>
        </div>
      ))}

      <div className="filter-group-card">
        <div className="filter-group-head">
          <strong>Price ranges</strong>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={draft.priceEnabled}
              onChange={(e) => { setDraft({ ...draft, priceEnabled: e.target.checked }); setStatus({ kind: '', text: '' }) }}
            />
            Show as a filter
          </label>
        </div>
        <p className="settings-help">
          Matched against the price shoppers see (the sale price when there is one). Leave From empty
          for "under", leave To empty for "and above". A product at exactly the To price falls in the next range.
        </p>
        <ul className="filter-item-list">
          {draft.priceRanges.map((r) => (
            <li key={r.id} className="filter-range-row">
              <input type="text" placeholder="Label (optional)" aria-label="Price range label" value={r.label} onChange={(e) => setRange(r.id, { label: e.target.value })} />
              <input type="number" min="0" placeholder="From" aria-label="Price from" value={r.min} onChange={(e) => setRange(r.id, { min: e.target.value })} />
              <input type="number" min="0" placeholder="To" aria-label="Price to" value={r.max} onChange={(e) => setRange(r.id, { max: e.target.value })} />
              <button type="button" className="btn btn-line filter-remove" onClick={() => setDraft((d) => ({ ...d, priceRanges: d.priceRanges.filter((x) => x.id !== r.id) }))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-line" onClick={addRange}>+ Add price range</button>
      </div>

      <div className="filter-save-bar">
        <button type="button" className="btn btn-solid" onClick={save} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save filters'}
        </button>
        {dirty && !saving && <button type="button" className="btn btn-line" onClick={discard}>Discard changes</button>}
        {dirty && !saving && <span className="settings-help">You have unsaved changes.</span>}
        {status.text && <span className={`filter-status filter-status-${status.kind}`} role="status">{status.text}</span>}
      </div>
    </div>
  )
}
