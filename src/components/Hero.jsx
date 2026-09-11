export default function Hero({ heroImage }) {
  const style = heroImage
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : undefined

  return (
    <section className="hero" style={style}>
      <p className="eyebrow">Perfumes · Attars · Bodycare · Candles</p>
      <h1>Fused by Scent, Defined by You.</h1>
      <p className="hero-copy">
        ScentFused: Where luxury meets craftsmanship. We fuse the essence of the 
        world's most iconic scent, crafting our own signature scents. From 
	      exquisite fragrances to scented soaps, bodywash,and candles, every product
	      is designed to elevate your everyday moments.
      </p>
      <div className="hero-actions">
        <a href="#latest" className="btn btn-solid">Shop new arrivals</a>
        <a href="#attars" className="btn btn-line">Explore Catalogue </a>
      </div>
    </section>
  )
}
