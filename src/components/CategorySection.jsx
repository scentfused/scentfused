import ProductCard from './ProductCard.jsx'

export default function CategorySection({ id, title, blurb, products }) {
  return (
    <section className="section" id={id}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>{title}</h2>
            <p>{blurb}</p>
          </div>
        </div>
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
