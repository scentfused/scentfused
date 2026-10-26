import { useEffect, useRef } from 'react'

// A slow animated background for the hero, drawn in code (no video file):
// two streams of mist - amber and rose - drift in from either side, swirl
// together into one golden cloud with sparkles, then part and begin again.
// Light on data and battery: small canvas, pauses when off-screen.

const CYCLE = 18 // seconds for one fuse-and-part loop
const AMBER = [232, 150, 40]
const ROSE = [214, 76, 110]
const GOLD = [214, 160, 50]

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const mix = (a, b, t) => a + (b - a) * t
// small deterministic pseudo-random so the layout is stable between renders
const rnd = (i, salt) => { const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x) }

function makeBlobs() {
  const blobs = []
  for (let i = 0; i < 46; i++) {
    blobs.push({ side: i % 2 === 0 ? -1 : 1, seed: i, phase: rnd(i, 1) * Math.PI * 2, orbit: 0.08 + rnd(i, 2) * 0.22, size: 0.16 + rnd(i, 3) * 0.2, speed: 0.4 + rnd(i, 4) * 0.5, lift: (rnd(i, 5) - 0.5) * 0.5 })
  }
  const sparks = []
  for (let i = 0; i < 40; i++) sparks.push({ x: rnd(i, 6), y: rnd(i, 7), r: 0.5 + rnd(i, 8) * 1.1, speed: 0.15 + rnd(i, 9) * 0.35, phase: rnd(i, 10) * Math.PI * 2 })
  return { blobs, sparks }
}

export function drawFusion(ctx, w, h, time, scene) {
  ctx.clearRect(0, 0, w, h)
  const p = (time % CYCLE) / CYCLE
  // 0 = apart, 1 = fully fused
  const fuse = smooth(0.2, 0.5, p) * (1 - smooth(0.72, 0.95, p))
  const cx = w / 2
  const cy = h / 2
  const unit = Math.min(w, h)
  ctx.globalCompositeOperation = 'lighter'

  scene.blobs.forEach((b) => {
    const t = time * b.speed * 0.5 + b.phase
    const homeX = cx + b.side * w * 0.36
    const x0 = mix(homeX, cx, fuse) + Math.cos(t) * b.orbit * w * mix(0.35, 0.6, fuse)
    const y0 = cy + b.lift * h + Math.sin(t * 1.3) * b.orbit * h * mix(0.5, 0.9, fuse)
    const r = b.size * unit * mix(0.8, 1.15, fuse)
    const base = b.side < 0 ? AMBER : ROSE
    const c0 = mix(base[0], GOLD[0], fuse)
    const c1 = mix(base[1], GOLD[1], fuse)
    const c2 = mix(base[2], GOLD[2], fuse)
    const a = mix(0.07, 0.028, fuse)
    const g = ctx.createRadialGradient(x0, y0, 0, x0, y0, r)
    g.addColorStop(0, `rgba(${c0 | 0},${c1 | 0},${c2 | 0},${a})`)
    g.addColorStop(1, `rgba(${c0 | 0},${c1 | 0},${c2 | 0},0)`)
    ctx.fillStyle = g
    ctx.fillRect(x0 - r, y0 - r, r * 2, r * 2)
  })

  scene.sparks.forEach((s) => {
    const tw = 0.5 + 0.5 * Math.sin(time * s.speed * 3 + s.phase)
    const x = ((s.x + Math.sin(time * s.speed * 0.3 + s.phase) * 0.04) % 1) * w
    const y = ((s.y - time * s.speed * 0.01 + 1) % 1) * h
    const alpha = (0.1 + 0.45 * fuse) * tw
    const rr = s.r * 3
    const g = ctx.createRadialGradient(x, y, 0, x, y, rr)
    g.addColorStop(0, `rgba(255,232,160,${alpha})`)
    g.addColorStop(1, 'rgba(255,232,160,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2)
  })
  ctx.globalCompositeOperation = 'source-over'
}

export default function HeroFusion({ reduced = false }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !canvas.getContext) return undefined
    const ctx = canvas.getContext('2d')
    const scene = makeBlobs()
    let raf = 0
    let visible = true
    let start = 0
    let w = 0
    let h = 0

    function resize() {
      const box = canvas.getBoundingClientRect()
      // draw small and let the browser scale it up: the mist is soft anyway
      const scale = 0.5
      w = Math.max(160, Math.round(box.width * scale))
      h = Math.max(120, Math.round(box.height * scale))
      canvas.width = w
      canvas.height = h
    }
    function frame(now) {
      if (!start) start = now
      drawFusion(ctx, w, h, (now - start) / 1000 + 6, scene)
      raf = visible ? requestAnimationFrame(frame) : 0
    }

    resize()
    if (reduced) {
      drawFusion(ctx, w, h, CYCLE * 0.5, scene) // one calm, fused frame
      return undefined
    }
    raf = requestAnimationFrame(frame)

    const onResize = () => resize()
    window.addEventListener('resize', onResize)
    let io
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        if (visible && !raf) raf = requestAnimationFrame(frame)
      })
      io.observe(canvas)
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      if (io) io.disconnect()
    }
  }, [reduced])

  return <canvas ref={ref} className="hero-fusion" aria-hidden="true" />
}
