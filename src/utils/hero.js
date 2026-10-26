// Hero videos: up to three short clips that play one after another behind the
// home page headline. Each clip can have a caption (title + one line) that is
// shown while it plays, so details about a perfume or the brand stay editable
// text instead of being baked into the video.

export const MAX_HERO_VIDEOS = 3

export function normalizeHeroVideos(raw) {
  const list = Array.isArray(raw) ? raw : []
  return list
    .map((v) => ({
      url: String((v && v.url) || '').trim(),
      title: String((v && v.title) || '').trim().slice(0, 80),
      text: String((v && v.text) || '').trim().slice(0, 200)
    }))
    .filter((v) => v.url)
    .slice(0, MAX_HERO_VIDEOS)
}

// Cloudinary can shrink a video just by changing its link. q_auto = smart
// compression, w_1280 = no wider than 1280px (c_limit never enlarges).
// Anything that isn't a Cloudinary video link is left alone.
export function optimizeVideo(url, width = 1280) {
  if (!url || typeof url !== 'string') return url
  const marker = '/video/upload/'
  const j = url.indexOf(marker)
  if (url.indexOf('res.cloudinary.com') === -1 || j === -1) return url
  const rest = url.slice(j + marker.length)
  if (/^(q_auto|w_\d+|c_[a-z_]+|f_auto)[,/]/.test(rest)) return url
  return `${url.slice(0, j + marker.length)}q_auto,c_limit,w_${width}/${rest}`
}

export function prefersReducedMotion() {
  try { return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) } catch (e) { return false }
}

// Visitors who asked for less motion, or are saving data, get the still image.
export function shouldPlayHeroVideo() {
  if (typeof window === 'undefined') return false
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    const c = navigator.connection
    if (c && c.saveData) return false
  } catch (e) { /* ignore */ }
  return true
}
