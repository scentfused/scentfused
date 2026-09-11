import { Link } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Hero from '../components/Hero.jsx'
import Carousel from '../components/Carousel.jsx'
import Footer from '../components/Footer.jsx'
import Icon from '../components/Icon.jsx'
import { CATEGORIES, latestNames } from '../data/catalog.js'

export default function Home({ products, settings }) {
  const latest = (settings.carouselProductIds && settings.carouselProductIds.length > 0)
    ? settings.carouselProductIds.map((id) => products.find((p) => p.id === id)).filter(Boolean)
    : latestNames.map((name) => products.find((p) => p.name === name)).filter(Boolean)

  return (
    <div>
      <Nav />
      <main>
      <Hero heroImage={settings.heroImage} />
        <Carousel
          products={latest}
          autoplay={settings.carouselAutoplay}
          showBadge={settings.showNewBadge}
        />

        <section className="section" id="shop">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2>Shop by category</h2>
                <p>Four ways into the collection — pick where you want to start.</p>
              </div>
            </div>
            <div className="category-teaser-grid">
              {CATEGORIES.map((cat) => {
                const count = products.filter((p) => p.category === cat.key).length
                return (
                  <Link to={`/${cat.key}`} className="category-teaser" key={cat.key}>
                    <div className="category-teaser-icon"><Icon category={cat.key} /></div>
                    <h3>{cat.label}</h3>
                    <p>{cat.blurb}</p>
                    <span className="category-teaser-link">Shop {count} products</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
