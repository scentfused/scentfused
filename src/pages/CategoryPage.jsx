import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'
import CategorySection from '../components/CategorySection.jsx'
import ProductFilters from '../components/ProductFilters.jsx'
import { CATEGORIES } from '../data/catalog.js'
import {
  FILTER_GROUPS, SORTS, normalizeFilterOptions, matchesSelection, sortProducts
} from '../utils/filters.js'

const GROUP_KEYS = [...FILTER_GROUPS.map((g) => g.key), 'price']

export default function CategoryPage({ products, categoryKey, filterOptions }) {
  const category = CATEGORIES.find((c) => c.key === categoryKey)
  const opts = useMemo(() => normalizeFilterOptions(filterOptions), [filterOptions])
  const [params, setParams] = useSearchParams()

  const all = useMemo(() => products.filter((p) => p.category === categoryKey), [products, categoryKey])

  // The selection lives in the web address (?season=Summer&sort=newest) so the
  // Back button from a product page returns to the same filtered list, and a
  // filtered page can be shared. Values that are no longer offered are ignored.
  const selection = {}
  GROUP_KEYS.forEach((key) => {
    const allowed = key === 'price' ? opts.priceRanges.map((r) => r.label) : opts.lists[key]
    const enabled = key === 'price' ? opts.priceEnabled : opts.enabled[key]
    selection[key] = enabled ? params.getAll(key).filter((v) => allowed.includes(v)) : []
  })
  const sortParam = params.get('sort')
  const sort = SORTS.some((s) => s.key === sortParam) ? sortParam : 'az'

  function update(mutate) {
    const next = new URLSearchParams(params)
    mutate(next)
    setParams(next, { replace: true })
  }

  function toggle(key, label) {
    update((next) => {
      const current = next.getAll(key)
      next.delete(key)
      const list = current.includes(label) ? current.filter((v) => v !== label) : [...current, label]
      list.forEach((v) => next.append(key, v))
    })
  }

  function clearAll() {
    update((next) => GROUP_KEYS.forEach((k) => next.delete(k)))
  }

  function changeSort(value) {
    update((next) => { if (value === 'az') next.delete('sort'); else next.set('sort', value) })
  }

  const items = useMemo(
    () => sortProducts(all.filter((p) => matchesSelection(p, selection, opts)), sort),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, opts, sort, params.toString()]
  )

  return (
    <div>
      <Nav />
      <main>
        <div className="wrap breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>{category.label}</span>
        </div>
        <CategorySection
          id={categoryKey}
          title={category.label}
          blurb={category.blurb}
          products={items}
          toolbar={
            <ProductFilters
              products={all}
              opts={opts}
              selection={selection}
              sort={sort}
              onToggle={toggle}
              onClear={clearAll}
              onSort={changeSort}
              shown={items.length}
              total={all.length}
            />
          }
          empty={
            <div className="shop-empty">
              <p>No products match these filters.</p>
              <button type="button" className="btn btn-line" onClick={clearAll}>Clear filters</button>
            </div>
          }
        />
      </main>
      <Footer />
    </div>
  )
}
