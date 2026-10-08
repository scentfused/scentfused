import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'
import CategorySection from '../components/CategorySection.jsx'
import ProductFilters from '../components/ProductFilters.jsx'
import { CATEGORIES } from '../data/catalog.js'
import {
  FILTER_GROUPS, SORTS, normalizeFilterOptions, matchesSelection, sortProducts,
  activeCollections, collectionOf, collectionSlug
} from '../utils/filters.js'

const GROUP_KEYS = ['category', ...FILTER_GROUPS.filter((g) => g.key !== 'collection').map((g) => g.key), 'price']

// One collection (line-up), e.g. /collection/marina: every product in it across
// all categories, with the same filters and sorting as a category page.
export default function CollectionPage({ products, filterOptions }) {
  const { slug } = useParams()
  const opts = useMemo(() => normalizeFilterOptions(filterOptions), [filterOptions])
  const [params, setParams] = useSearchParams()

  const collection = useMemo(
    () => activeCollections(products, filterOptions).find((c) => c.slug === slug)
      || opts.lists.collection.map((name) => ({ name, slug: collectionSlug(name), count: 0 })).find((c) => c.slug === slug),
    [products, filterOptions, opts, slug]
  )

  const all = useMemo(
    () => (collection ? products.filter((p) => collectionOf(p).toLowerCase() === collection.name.toLowerCase()) : []),
    [products, collection]
  )
  const categoryLabels = useMemo(
    () => CATEGORIES.filter((c) => all.some((p) => p.category === c.key)).map((c) => c.label).sort((a, b) => a.localeCompare(b)),
    [all]
  )

  const selection = {}
  GROUP_KEYS.forEach((key) => {
    let allowed
    let enabled = true
    if (key === 'price') { allowed = opts.priceRanges.map((r) => r.label); enabled = opts.priceEnabled }
    else if (key === 'category') allowed = categoryLabels
    else { allowed = opts.lists[key]; enabled = opts.enabled[key] }
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
  function clearAll() { update((next) => GROUP_KEYS.forEach((k) => next.delete(k))) }
  function changeSort(value) { update((next) => { if (value === 'az') next.delete('sort'); else next.set('sort', value) }) }

  const items = useMemo(
    () => sortProducts(all.filter((p) => matchesSelection(p, selection, opts)), sort),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, opts, sort, params.toString()]
  )

  if (!collection) {
    return (
      <div>
        <Nav />
        <div className="product-not-found">
          <h2>Collection not found</h2>
          <p>This collection may have been removed or the link is incorrect.</p>
          <Link to="/collections" className="btn btn-line">See all line-ups</Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div>
      <Nav />
      <main>
        <div className="wrap breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/collections">Line-ups</Link>
          <span>/</span>
          <span>{collection.name}</span>
        </div>
        <CategorySection
          id={`collection-${collection.slug}`}
          title={`${collection.name} collection`}
          blurb={`Everything in the ${collection.name} line-up.`}
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
              hideGroups={['collection']}
              categories={categoryLabels}
            />
          }
          empty={
            all.length === 0
              ? <div className="shop-empty"><p>No products in this collection yet.</p></div>
              : (
                <div className="shop-empty">
                  <p>No products match these filters.</p>
                  <button type="button" className="btn btn-line" onClick={clearAll}>Clear filters</button>
                </div>
              )
          }
        />
      </main>
      <Footer />
    </div>
  )
}
