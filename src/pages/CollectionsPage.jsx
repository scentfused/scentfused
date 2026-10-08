import { Link } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'
import { useSite } from '../context/SiteContext.jsx'

// /collections — all the line-ups, A–Z.
export default function CollectionsPage() {
  const { collections } = useSite()
  return (
    <div>
      <Nav />
      <main>
        <div className="wrap breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Line-ups</span>
        </div>
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2>Line-ups</h2>
                <p>Shop a whole collection, across perfumes, attars, soaps and candles.</p>
              </div>
            </div>
            {collections.length === 0 ? (
              <div className="shop-empty"><p>No collections yet — check back soon.</p></div>
            ) : (
              <div className="lineup-grid">
                {collections.map((c) => (
                  <Link className="lineup-card" key={c.slug} to={`/collection/${c.slug}`}>
                    <span className="lineup-name">{c.name}</span>
                    <span className="lineup-count">{c.count} product{c.count === 1 ? '' : 's'}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
