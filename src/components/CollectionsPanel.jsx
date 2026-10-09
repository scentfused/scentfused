import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { CATEGORIES } from '../data/catalog.js'
import { formOptions, normalizeFilterOptions, serializeFilterOptions, sortAZ } from '../utils/filters.js'

const MODES = {
  collection: { label: 'Collection', plural: 'collections', key: 'collection', fallback: [] },
  gender: { label: 'Gender', plural: 'genders', key: 'gender', fallback: ['Men', 'Women', 'Unisex'] }
}

const valueOf = (p, key) => {
  const v = p.attributes && p.attributes[key]
  return typeof v === 'string' ? v.trim() : ''
}

// Admin -> Collections. Pick a collection (or a gender), tick the products that
// belong to it, press Save. Much quicker than editing products one by one.
export default function CollectionsPanel({ products, setProducts, settings, setSettings, isAdmin }) {
  const [mode, setMode] = useState('collection')
  const [chosen, setChosen] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [ticked, setTicked] = useState(null) // Set of product ids, null = untouched
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ kind: '', text: '' })
  const [newName, setNewName] = useState('')

  const m = MODES[mode]

  const options = useMemo(
    () => formOptions(settings.filterOptions, m.key, m.fallback, products.map((p) => valueOf(p, m.key)).filter(Boolean)),
    [settings.filterOptions, products, m]
  )
  const counts = useMemo(() => {
    const c = {}
    products.forEach((p) => { const v = valueOf(p, m.key).toLowerCase(); if (v) c[v] = (c[v] || 0) + 1 })
    return c
  }, [products, m])

  // Products that already have the chosen value.
  const original = useMemo(
    () => new Set(products.filter((p) => chosen && valueOf(p, m.key).toLowerCase() === chosen.toLowerCase()).map((p) => p.id)),
    [products, chosen, m]
  )
  const current = ticked || original

  const shown = useMemo(() => {
    return products
      .filter((p) => (category === 'all' || p.category === category) && (!query || p.name.toLowerCase().includes(query.toLowerCase())))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, category, query])

  const added = [...current].filter((id) => !original.has(id))
  const removed = [...original].filter((id) => !current.has(id))
  const dirty = added.length + removed.length > 0

  function pick(value) {
    if (dirty && !window.confirm('You have unsaved ticks. Switch anyway and lose them?')) return
    setChosen(value)
    setTicked(null)
    setMessage({ kind: '', text: '' })
  }
  function switchMode(next) {
    if (dirty && !window.confirm('You have unsaved ticks. Switch anyway and lose them?')) return
    setMode(next)
    setChosen('')
    setTicked(null)
    setMessage({ kind: '', text: '' })
  }
  function toggle(id) {
    const next = new Set(current)
    if (next.has(id)) next.delete(id); else next.add(id)
    setTicked(next)
    setMessage({ kind: '', text: '' })
  }
  function tickShown(on) {
    const next = new Set(current)
    shown.forEach((p) => { if (on) next.add(p.id); else next.delete(p.id) })
    setTicked(next)
  }

  async function addOption() {
    const name = newName.trim()
    if (!name) return
    if (options.some((o) => o.toLowerCase() === name.toLowerCase())) {
      setMessage({ kind: 'error', text: `"${name}" already exists.` })
      return
    }
    const opts = normalizeFilterOptions(settings.filterOptions)
    const next = serializeFilterOptions({ ...opts, lists: { ...opts.lists, [m.key]: [...opts.lists[m.key], name] } })
    const ok = await setSettings({ ...settings, filterOptions: next })
    if (ok === false) { setMessage({ kind: 'error', text: 'Could not add it. Please try again.' }); return }
    setNewName('')
    setChosen(name)
    setTicked(null)
    setMessage({ kind: 'ok', text: `Added ${m.label.toLowerCase()} "${name}". Now tick its products.` })
  }

  async function save() {
    if (!dirty || !chosen) return
    const movedFrom = added.filter((id) => {
      const p = products.find((x) => x.id === id)
      return p && valueOf(p, m.key)
    }).length
    const lines = [`${added.length} product${added.length === 1 ? '' : 's'} will be set to ${m.label.toLowerCase()} "${chosen}".`]
    if (movedFrom) lines.push(`${movedFrom} of them are in another ${m.label.toLowerCase()} now and will be moved.`)
    if (removed.length) lines.push(`${removed.length} product${removed.length === 1 ? '' : 's'} will have the ${m.label.toLowerCase()} removed.`)
    if (!window.confirm(`${lines.join('\n')}\n\nSave?`)) return

    setSaving(true)
    setMessage({ kind: '', text: '' })
    const updated = new Map()
    let failed = 0
    const changes = [...added.map((id) => [id, chosen]), ...removed.map((id) => [id, ''])]
    for (const [id, value] of changes) {
      const p = products.find((x) => x.id === id)
      if (!p) continue
      const attrs = { ...(p.attributes || {}), [m.key]: value }
      const { error } = await supabase.from('products').update({ attributes: attrs }).eq('id', id)
      if (error) { failed += 1; console.error('Collections save failed for', id, error) } else updated.set(id, { ...p, attributes: attrs })
    }
    if (updated.size) setProducts((prev) => prev.map((p) => updated.get(p.id) || p))
    setSaving(false)
    setTicked(null)
    setMessage(failed
      ? { kind: 'error', text: `${updated.size} saved, ${failed} could not be saved. Tick them again and retry.` }
      : { kind: 'ok', text: `Saved. "${chosen}" now has ${original.size + added.length - removed.length} product${original.size + added.length - removed.length === 1 ? '' : 's'}.` })
  }

  return (
    <div className="collections-panel">
      <p className="settings-help">
        Choose a {m.label.toLowerCase()}, tick the products that belong to it, then press Save.
        A product can be in one collection and have one gender.
      </p>

      <div className="orders-filters" role="tablist" aria-label="What to assign">
        {Object.entries(MODES).map(([k, v]) => (
          <button key={k} type="button" className={`orders-filter${mode === k ? ' is-on' : ''}`} onClick={() => switchMode(k)}>{v.label}</button>
        ))}
      </div>

      <div className="collections-layout">
        <div className="collections-list">
          <h4>{m.label === 'Collection' ? 'Your collections' : 'Genders'}</h4>
          <ul>
            {options.map((o) => (
              <li key={o}>
                <button type="button" className={`collections-item${chosen.toLowerCase() === o.toLowerCase() ? ' is-on' : ''}`} onClick={() => pick(o)}>
                  <span>{o}</span><b>{counts[o.toLowerCase()] || 0}</b>
                </button>
              </li>
            ))}
            {options.length === 0 && <li className="muted">None yet.</li>}
          </ul>
          {isAdmin && (
            <div className="filter-add-row">
              <input
                type="text"
                placeholder={`New ${m.label.toLowerCase()}`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
              />
              <button type="button" className="btn btn-line" onClick={addOption}>Add</button>
            </div>
          )}
        </div>

        <div className="collections-products">
          {!chosen ? (
            <p className="muted">Pick a {m.label.toLowerCase()} on the left to choose its products.</p>
          ) : (
            <>
              <h4>Products in "{chosen}"</h4>
              <div className="stock-toolbar">
                <input type="text" placeholder="Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
                <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
                  <option value="all">All categories</option>
                  {CATEGORIES.slice().sort((a, b) => a.label.localeCompare(b.label)).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <button type="button" className="btn btn-line" onClick={() => tickShown(true)}>Tick all shown</button>
                <button type="button" className="btn btn-line" onClick={() => tickShown(false)}>Untick all shown</button>
              </div>

              <ul className="collections-checklist">
                {shown.map((p) => {
                  const other = valueOf(p, m.key)
                  const inOther = other && other.toLowerCase() !== chosen.toLowerCase()
                  return (
                    <li key={p.id}>
                      <label>
                        <input type="checkbox" checked={current.has(p.id)} onChange={() => toggle(p.id)} />
                        <span>{p.name}</span>
                        {inOther && <em className="muted"> — now in {other}</em>}
                      </label>
                    </li>
                  )
                })}
                {shown.length === 0 && <li className="muted">No products match.</li>}
              </ul>

              <div className="filter-save-bar">
                <button type="button" className="btn btn-solid" onClick={save} disabled={!dirty || saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                {dirty && !saving && <button type="button" className="btn btn-line" onClick={() => setTicked(null)}>Undo changes</button>}
                {dirty && !saving && <span className="settings-help">{added.length} to add, {removed.length} to remove.</span>}
              </div>
            </>
          )}
          {message.text && <p className={`filter-status filter-status-${message.kind}`} role="status">{message.text}</p>}
        </div>
      </div>
    </div>
  )
}
