import { Link } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'
import CategorySection from '../components/CategorySection.jsx'
import { CATEGORIES } from '../data/catalog.js'

export default function CategoryPage({ products, categoryKey }) {
  const category = CATEGORIES.find((c) => c.key === categoryKey)
  const items = products
    .filter((p) => p.category === categoryKey)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))

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
        />
      </main>
      <Footer />
    </div>
  )
}
