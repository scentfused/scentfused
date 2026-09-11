import { useEffect, useRef } from 'react'
import ProductCard from './ProductCard.jsx'

export default function Carousel({ products, autoplay = true, showBadge = true }) {
  const trackRef = useRef(null)

  const scrollByAmount = (dir) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' })
  }

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !autoplay) return

    const timer = setInterval(() => {
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) {
        track.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        track.scrollBy({ left: 238, behavior: 'smooth' })
      }
    }, 4500)

    const stop = () => clearInterval(timer)
    track.addEventListener('mouseenter', stop)
    track.addEventListener('focusin', stop)
    track.addEventListener('touchstart', stop)

    return () => {
      clearInterval(timer)
      track.removeEventListener('mouseenter', stop)
      track.removeEventListener('focusin', stop)
      track.removeEventListener('touchstart', stop)
    }
  }, [products, autoplay])

  return (
    <section className="section" id="latest">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>Latest arrivals</h2>
            <p>Freshly poured and freshly bottled — the newest additions across the collection.</p>
          </div>
          <div className="carousel-controls">
            <button aria-label="Scroll left" onClick={() => scrollByAmount(-1)}>‹</button>
            <button aria-label="Scroll right" onClick={() => scrollByAmount(1)}>›</button>
          </div>
        </div>

        <div className="carousel-wrap">
          <div className="carousel-track" ref={trackRef}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} badge={showBadge ? 'New' : null} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
