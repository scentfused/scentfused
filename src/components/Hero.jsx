import { useEffect, useRef, useState } from 'react'
import { normalizeHeroVideos, optimizeVideo, shouldPlayHeroVideo, prefersReducedMotion } from '../utils/hero.js'
import HeroFusion from './HeroFusion.jsx'

function saveDataOff() {
  try { const c = navigator.connection; return !(c && c.saveData) } catch (e) { return true }
}

export default function Hero({ heroImage, videos, animated = true }) {
  const clips = normalizeHeroVideos(videos)
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const ref = useRef(null)

  // Decide after the page loads (needs the browser's motion / data-saver settings).
  useEffect(() => { setAllowed(shouldPlayHeroVideo()); setMounted(true) }, [])

  const urls = clips.map((c) => c.url).join('|')
  useEffect(() => { setIndex(0); setFailed(false) }, [urls])

  const playing = allowed && !failed && clips.length > 0
  const clip = playing ? clips[index % clips.length] : null
  // No video playing: show the animated gold mist (unless switched off in Admin,
  // or the visitor has data saver on).
  const fusion = mounted && animated && !clip && saveDataOff()

  // Some browsers ignore the autoplay attribute after the source changes.
  useEffect(() => {
    const v = ref.current
    if (v && v.play) { const p = v.play(); if (p && p.catch) p.catch(() => {}) }
  }, [index, playing])

  const style = heroImage
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : undefined

  return (
    <section className={`hero${playing ? ' has-video' : ''}${fusion ? ' has-fusion' : ''}`} style={style}>
      {fusion && <HeroFusion reduced={prefersReducedMotion()} />}
      {clip && (
        <>
          <video
            key={`${index}:${clip.url}`}
            ref={ref}
            className="hero-video"
            src={optimizeVideo(clip.url)}
            poster={heroImage || undefined}
            autoPlay
            muted
            playsInline
            preload="auto"
            loop={clips.length === 1}
            aria-hidden="true"
            onEnded={() => setIndex((i) => (i + 1) % clips.length)}
            onError={() => setFailed(true)}
          />
          <div className="hero-video-shade" aria-hidden="true" />
        </>
      )}
      <div className="hero-content">
        <p className="eyebrow">Perfumes · Attars · Bodycare · Candles</p>
        <h1>Fused by Scent, Defined by You.</h1>
        <p className="hero-copy">
          ScentFused: Where luxury meets craftsmanship. We fuse the essence of the
          world's most iconic scent, crafting our own signature scents. From
          signature scents to scented soaps, bodywash,and candles, every product
          is designed to elevate your everyday moments.
        </p>
        <div className="hero-actions">
          <a href="#latest" className="btn btn-solid">Shop new arrivals</a>
          <a href="#attars" className="btn btn-line">Explore Catalogue </a>
        </div>
        {clip && (clip.title || clip.text) && (
          <div className="hero-caption" key={`cap-${index}`}>
            {clip.title && <strong>{clip.title}</strong>}
            {clip.text && <span>{clip.text}</span>}
          </div>
        )}
      </div>
    </section>
  )
}
