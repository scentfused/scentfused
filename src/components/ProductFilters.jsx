import { useEffect, useRef, useState } from 'react'
import { FILTER_GROUPS, SORTS, countFor } from '../utils/filters.js'

// Filter + sort bar for a category page. It owns no data: the parent passes the
// category's products, the options (managed in Admin -> Site Settings ->
// Filters) and the current selection, and gets changes back through callbacks.
export default function ProductFilters({
  products, opts, selection, sort, onToggle, onClear, onSort, shown, total
}) {
  const [open, setOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 960
  )
  // Which dropdown is open (only one at a time). Closes on outside click / Esc.
  const [menu, setMenu] = useState(null)
  const panelRef = useRef(null)
  useEffect(() => {
    if (!menu) return undefined
    const onDown = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setMenu(null) }
    const onKey = (e) => { if (e.key === 'Escape') setMenu(null) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [menu])

  // Build the groups that are switched on and have something to show.
  const groups = []
  FILTER_GROUPS.forEach((g) => {
    if (!opts.enabled[g.key]) return
    const chosen = selection[g.key] || []
    const options = opts.lists[g.key]
      .map((label) => ({ label, count: countFor(products, g.key, label, selection, opts) }))
      .filter((o) => o.count > 0 || chosen.includes(o.label))
    if (options.length) groups.push({ key: g.key, title: g.label, options })
  })
  if (opts.priceEnabled) {
    const chosen = selection.price || []
    const options = opts.priceRanges
      .map((r) => ({ label: r.label, count: countFor(products, 'price', r.label, selection, opts) }))
      .filter((o) => o.count > 0 || chosen.includes(o.label))
    if (options.length) groups.push({ key: 'price', title: 'Price', options })
  }

  const activeCount = Object.values(selection).reduce((n, list) => n + list.length, 0)

  return (
    <div className="shop-toolbar">
      <div className="shop-toolbar-row">
        {groups.length > 0 && (
          <button
            type="button"
            className={`shop-filter-toggle${open ? ' is-open' : ''}`}
            aria-expanded={open}
            aria-controls="shop-filter-panel"
            onClick={() => setOpen(!open)}
          >
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        )}
        <span className="shop-count" aria-live="polite">
          {shown === total ? `${total} products` : `Showing ${shown} of ${total}`}
        </span>
        <label className="shop-sort">
          <span>Sort by</span>
          <select value={sort} onChange={(e) => onSort(e.target.value)}>
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {groups.length > 0 && open && (
        <div className="shop-filter-panel" id="shop-filter-panel" ref={panelRef}>
          {groups.map((g) => {
            const chosen = selection[g.key] || []
            const isOpen = menu === g.key
            return (
              <div className="shop-dd" key={g.key}>
                <button
                  type="button"
                  className={`shop-dd-btn${isOpen ? ' is-open' : ''}${chosen.length ? ' has-value' : ''}`}
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  onClick={() => setMenu(isOpen ? null : g.key)}
                >
                  <span>{g.title}{chosen.length ? ` (${chosen.length})` : ''}</span>
                  <span className="shop-dd-arrow" aria-hidden="true">▾</span>
                </button>
                {isOpen && (
                  <div className="shop-dd-menu" role="group" aria-label={g.title}>
                    {g.options.map((o) => {
                      const on = chosen.includes(o.label)
                      return (
                        <label className={`shop-dd-option${on ? ' is-on' : ''}`} key={o.label}>
                          <input type="checkbox" checked={on} onChange={() => onToggle(g.key, o.label)} />
                          <span className="shop-dd-label">{o.label}</span>
                          <span className="shop-chip-count">{o.count}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeCount > 0 && (
        <div className="shop-active">
          {Object.entries(selection).flatMap(([key, list]) =>
            list.map((label) => (
              <button type="button" className="shop-chip is-on" key={`${key}:${label}`} onClick={() => onToggle(key, label)}>
                {label} &times;
              </button>
            ))
          )}
          <button type="button" className="shop-clear" onClick={onClear}>Clear all</button>
        </div>
      )}
    </div>
  )
}
