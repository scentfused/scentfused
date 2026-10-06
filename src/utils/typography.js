import { FONT_OPTIONS } from '../data/settings.js'

// Per-area font and text-colour overrides, chosen in Admin -> Site Settings ->
// "Fonts & text colors".
//
// Nothing here changes your stylesheet. A rule is generated ONLY for a value
// you have actually picked, so leaving a setting on "Site default" keeps the
// original look exactly as it was.

// Fonts the site's own design already uses, so they can be picked to go back
// to the original look.
export const BASE_FONTS = ['Cormorant Garamond', 'Jost']

// FONT_OPTIONS lists two names that were never registered as fonts of their
// own (they are weights of "Royale"), so choosing them would do nothing.
const NOT_REAL_FONTS = ['Royale_Sb', 'Royale_BOLD']

const SERIF_FONTS = ['Cormorant Garamond', 'Cinzel']

export function availableFonts() {
  const all = [...BASE_FONTS, ...FONT_OPTIONS]
  return all.filter((f, i) => all.indexOf(f) === i && !NOT_REAL_FONTS.includes(f))
}

export function fontStack(name) {
  return `'${name}', ${SERIF_FONTS.includes(name) ? 'serif' : 'sans-serif'}`
}

export function isValidColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value || '')
}

// The four areas, in the order they appear in Admin. "default" values are what
// the site uses today, shown in Admin so you can see what "Site default" means.
export const AREAS = [
  {
    key: 'header',
    label: 'Header',
    hint: 'Page and section titles, like "Latest arrivals"',
    fontKey: 'headerFont',
    colorKey: 'headerColor',
    defaultFont: 'Cormorant Garamond',
    defaultColor: '#f1d775',
    sample: 'Latest arrivals'
  },
  {
    key: 'nav',
    label: 'Nav bar',
    hint: 'Menu links, search bar and the icons in the top bar',
    fontKey: 'navFont',
    colorKey: 'navColor',
    defaultFont: 'Jost',
    defaultColor: '#cbb98a',
    sample: 'Perfumes'
  },
  {
    key: 'hero',
    label: 'Hero section',
    hint: 'The big headline, intro text and buttons on the home page',
    fontKey: 'heroFont',
    colorKey: 'heroColor',
    defaultFont: 'Cormorant Garamond',
    defaultColor: '#f1d775',
    sample: 'Fused by Scent, Defined by You.'
  },
  {
    key: 'footer',
    label: 'Footer',
    hint: 'Footer links, the tagline and the small print',
    fontKey: 'footerFont',
    colorKey: 'footerColor',
    defaultFont: 'Jost',
    defaultColor: '#cbb98a',
    sample: 'Shipping · Returns · Contact us'
  }
]

// Which parts of the page each area controls. Everything is scoped under
// .app-shell so it out-ranks the stylesheet, and hover/active colours are left
// alone (:not(:hover)) so links still react when touched.
const SELECTORS = {
  header: {
    // All titles, except the hero headline, the promo banners (they have
    // their own font settings) and anything inside the admin screens.
    font: '.app-shell :is(h1, h2, h3):not(.hero *):not(.promo-banner *):not(.admin *)',
    color: '.app-shell :is(h1, h2, h3):not(.hero *):not(.promo-banner *):not(.admin *)'
  },
  nav: {
    font:
      '.app-shell .nav-drawer-links a, .app-shell .nav-search-bar input, ' +
      '.app-shell .nav-search-bar button, .app-shell .nav-drawer-actions .admin-btn',
    color:
      '.app-shell .nav-drawer-links li a:not(:hover):not(.active), ' +
      '.app-shell .nav-icon-group button:not(:hover)'
  },
  hero: {
    font:
      '.app-shell .hero, .app-shell .hero h1, .app-shell .hero .eyebrow, ' +
      '.app-shell .hero-copy, .app-shell .hero .btn',
    // Buttons keep their own colours so they stay readable on gold.
    color: '.app-shell .hero h1, .app-shell .hero-copy'
  },
  footer: {
    font:
      '.app-shell footer, .app-shell footer h4, .app-shell footer a, ' +
      '.app-shell footer input, .app-shell footer button',
    color:
      '.app-shell .footer-grid a:not(:hover), .app-shell .footer-brand p, .app-shell .footer-bottom'
  }
}

// Turns the saved settings into CSS. Values are checked first (a font must be
// one from the list, a colour must be #rrggbb) so nothing odd can be injected.
export function buildTypographyCss(settings = {}) {
  const fonts = availableFonts()
  const rules = []

  AREAS.forEach((area) => {
    const font = settings[area.fontKey]
    const color = settings[area.colorKey]
    const selectors = SELECTORS[area.key]

    if (font && fonts.includes(font)) {
      rules.push(`${selectors.font}{font-family:${fontStack(font)};}`)
    }
    if (isValidColor(color)) {
      rules.push(`${selectors.color}{color:${color};}`)
    }
  })

  return rules.join('\n')
}

// Every settings key this feature uses, in one list.
export const TYPOGRAPHY_KEYS = AREAS.flatMap((area) => [area.fontKey, area.colorKey])

// Contrast of a text colour against the black the site uses (1 = invisible,
// 21 = maximum). 4.5 or more is the usual readability target.
export function contrastOnBlack(hex) {
  if (!isValidColor(hex)) return null
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return (luminance + 0.05) / 0.05
}

export function describeContrast(ratio) {
  if (ratio == null) return { text: 'unknown', level: 'poor' }
  if (ratio >= 7) return { text: 'excellent', level: 'good' }
  if (ratio >= 4.5) return { text: 'good', level: 'good' }
  if (ratio >= 3) return { text: 'low, only OK for large text', level: 'low' }
  return { text: 'too low to read comfortably', level: 'poor' }
}
