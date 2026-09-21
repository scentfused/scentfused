import { useSearchParams, Link } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'
import ProductCard from '../components/ProductCard.jsx'

export default function SearchResultsPage({ products }) {
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('q') || '').trim()

  const results = query
    ? products.filter((p) => {
        const haystack = `${p.name} ${p.note || ''} ${p.description || ''}`.toLowerCase()
        return haystack.includes(query.toLowerCase())
      })
    : []

  return (
    <div>
      <Nav />
      <main className="wrap search-results-page">
        <h1>Search results for "{query}"</h1>
        <p className="muted">{results.length} product{results.length === 1 ? '' : 's'} found</p>

        {results.length > 0 ? (
          <div className="grid">
            {results.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="search-no-results">
            No products matched your search. <Link to="/">Back to shop</Link>
          </p>
        )}
      </main>
      <Footer />
    </div>
  )
}
