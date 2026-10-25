import ProductCard from './ProductCard.jsx'

// `sections` (optional): [{ key, title, products }] - shows each non-empty
// group under its own heading instead of one grid.
export default function CategorySection({ id, title, blurb, products, toolbar, empty, sections }) {
  return (
    <section className="section" id={id}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>{title}</h2>
            <p>{blurb}</p>
          </div>
        </div>
        {toolbar}
        {products.length === 0 && empty ? empty : sections ? (
          sections.filter((s) => s.products.length > 0).map((s) => (
            <div className="shop-subsection" key={s.key} id={`${id}-${s.key}`}>
              <h3 className="shop-subhead">{s.title} <span className="shop-subcount">{s.products.length}</span></h3>
              <div className="grid">
                {s.products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          ))
        ) : (
          <div className="grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
