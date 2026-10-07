import ProductCard from './ProductCard.jsx'

export default function CategorySection({ id, title, blurb, products, toolbar, empty }) {
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
        {products.length === 0 && empty ? empty : (
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
