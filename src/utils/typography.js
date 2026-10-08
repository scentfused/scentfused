import { FONT_OPTIONS } from '../data/settings.js'

// Per-section font, text size and text colour, chosen in
// Admin -> Site Settings -> "Fonts & text colors".
//
// Nothing here edits your stylesheet. A rule is generated ONLY for a value you
// have actually picked, so anything left on "Site default" keeps the original
// look exactly as it was.
//
// Every piece of text belongs to exactly ONE section below, so two sections
// never fight over (or double-scale) the same text.

// ---------------------------------------------------------------- fonts ----

// Fonts the site's own design already uses, so they can be picked to go back
// to the original look.
export const BASE_FONTS = ['Cormorant Garamond', 'Jost']

// FONT_OPTIONS lists two names that were never registered as fonts of their
// own (they are weights of "Royale"), so choosing them would do nothing.
const NOT_REAL_FONTS = ['Royale_Sb', 'Royale_BOLD']

const SERIF_FONTS = ['Cormorant Garamond', 'Cinzel']

export function availableFonts() {
  const all = [...BASE_FONTS, ...FONT_OPTIONS]
  return all
    .filter((f, i) => all.indexOf(f) === i && !NOT_REAL_FONTS.includes(f))
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
}

export function fontStack(name) {
  return `'${name}', ${SERIF_FONTS.includes(name) ? 'serif' : 'sans-serif'}`
}

// -------------------------------------------------------- colours & sizes --

export function isValidColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value || '')
}

// Text size is a percentage of the original: 100 = unchanged.
export const SIZE_MIN = 50
export const SIZE_MAX = 200

export function isValidSize(value) {
  if (value === '' || value == null) return false
  const n = Number(value)
  return Number.isInteger(n) && n >= SIZE_MIN && n <= SIZE_MAX && n !== 100
}

// -------------------------------------------------------------- sections ---

// A few selector groups shared below. They keep the storefront separate from
// the admin screens (which must never change), and keep the hero and the
// promo banners (which have their own settings) out of the generic groups.
const NOT_ADMIN = ':not(.admin *)'
const NOT_HERO = ':not(.hero *)'
const NOT_PROMO = ':not(.promo-banner *)'

// Small dim-gold text. SMALL_ALL is every piece of text in the dim gold colour
// (used for colour). SMALL_OWN is the subset that no other section already
// controls the font/size of (the hero label and footer small print belong to
// the Hero and Footer sections for font and size).
const SMALL_ALL = [
  '.hero .eyebrow', '.promo-banner-eyebrow', '.section-head p', '.section-head-inline p',
  '.card .note', '.breadcrumb', '.footer-brand p', '.footer-bottom', '.cart-empty',
  '.cart-item-variant', '.cart-item-remove', '.product-page-category', '.product-page-back',
  '.product-page-detail-line strong', '.product-page-meta-line strong', '.help-jump-nav a',
  '.wa-popup-status', '.price-was'
]
const SMALL_OWN = [
  '.promo-banner-eyebrow', '.section-head p', '.section-head-inline p', '.card .note', '.breadcrumb',
  '.cart-empty', '.cart-item-variant', '.cart-item-remove', '.product-page-category',
  '.product-page-back', '.help-jump-nav a', '.wa-popup-status'
]

const scoped = (list) => list.map((s) => `.app-shell ${s}`).join(', ')

function keysFor(key, hasColor = true) {
  return {
    fontKey: `${key}Font`,
    sizeKey: `${key}Size`,
    ...(hasColor ? { colorKey: `${key}Color` } : {})
  }
}

// "default" values are what the site uses today, shown in Admin so you can see
// what "Site default" means. "sel" says which parts of the page each setting
// controls.
export const AREAS = [
  {
    key: 'header',
    ...keysFor('header'),
    label: 'Header',
    hint: 'All titles, like "Latest arrivals", product names and page titles',
    defaultFont: 'Cormorant Garamond',
    defaultColor: '#f1d775',
    sample: 'Latest arrivals',
    sel: {
      // Every title except the hero headline, the promo banners (they have
      // their own settings) and anything inside the admin screens.
      font: `.app-shell :is(h1, h2, h3)${NOT_HERO}${NOT_PROMO}${NOT_ADMIN}`,
      color: `.app-shell :is(h1, h2, h3)${NOT_HERO}${NOT_PROMO}${NOT_ADMIN}`,
      size: `.app-shell :is(h1, h2, h3)${NOT_HERO}${NOT_PROMO}${NOT_ADMIN}`
    }
  },
  {
    key: 'nav',
    ...keysFor('nav'),
    label: 'Nav bar',
    hint: 'Menu links, the search bar and the icons in the top bar',
    defaultFont: 'Jost',
    defaultColor: '#cbb98a',
    sample: 'Perfumes',
    sel: {
      font:
        '.app-shell .nav-drawer-links a, .app-shell .nav-search-bar input, ' +
        '.app-shell .nav-search-bar button, .app-shell .nav-drawer-actions .admin-btn',
      // Hover/active colours are left alone so links still react when touched.
      color:
        '.app-shell .nav-drawer-links li a:not(:hover):not(.active), ' +
        '.app-shell .nav-icon-group button:not(:hover)',
      size:
        '.app-shell .nav-drawer-links a, .app-shell .nav-search-bar input, ' +
        '.app-shell .nav-search-bar button, .app-shell .nav-drawer-actions .admin-btn'
    }
  },
  {
    key: 'hero',
    ...keysFor('hero'),
    label: 'Hero section',
    hint: 'The big headline, intro text, label and buttons on the home page',
    colorNote: 'Color applies to the headline and intro text. The small label follows "Small text" and the buttons keep their own colors so they stay readable on gold.',
    defaultFont: 'Cormorant Garamond',
    defaultColor: '#f1d775',
    sample: 'Fused by Scent, Defined by You.',
    sel: {
      font:
        '.app-shell .hero, .app-shell .hero h1, .app-shell .hero .eyebrow, ' +
        '.app-shell .hero-copy, .app-shell .hero .btn',
      color: '.app-shell .hero h1, .app-shell .hero-copy',
      size: '.app-shell .hero h1, .app-shell .hero .eyebrow, .app-shell .hero-copy, .app-shell .hero .btn'
    }
  },
  {
    key: 'body',
    ...keysFor('body'),
    label: 'Body text',
    hint: 'The base font for the whole site: everything that has no font of its own',
    colorNote: 'This is the starting point for all text. Any section with its own setting (titles, nav, hero, prices, buttons, small text, footer) overrides it. Size and color only reach text that has no fixed size or color of its own.',
    defaultFont: 'Jost',
    defaultColor: '#cbb98a',
    sample: 'A warm, spicy-amber signature that owns the room after dark.',
    // Applied to the page containers (not the admin screens) and inherited by
    // text that has no style of its own.
    kind: 'body',
    sel: {
      container: '.app-shell > :not(.admin):not(.admin-login-wrap)'
    }
  },
  {
    key: 'small',
    ...keysFor('small'),
    label: 'Small text (dim gold)',
    hint: 'Section descriptions, product notes, labels and small print in the dim gold color',
    colorNote: 'Color changes ALL the dim gold text on the site, including the hero label and the footer small print.',
    defaultFont: 'Jost',
    defaultColor: '#8c6d1f',
    sample: 'Freshly poured and freshly bottled',
    sel: {
      font: scoped(SMALL_OWN),
      // Wrapped in :where() and repeated to outrank the stylesheet, while
      // still leaving hover colours alone.
      color: `.app-shell.app-shell.app-shell :where(${SMALL_ALL.join(', ')}):not(:hover)`,
      size: scoped(SMALL_OWN)
    }
  },
  {
    key: 'prices',
    ...keysFor('prices'),
    label: 'Prices',
    hint: 'Prices on product cards, the product page, the popup and the cart',
    colorNote: 'The struck-through old price and the sale price keep their own colors.',
    defaultFont: 'Jost',
    defaultColor: '#f1d775',
    sample: 'Rs. 3,800',
    sel: {
      font:
        '.app-shell .card .price, .app-shell .product-page-price, .app-shell .quickview-info .price, ' +
        '.app-shell .cart-item-price, .app-shell .cart-subtotal',
      color:
        '.app-shell .card .price, .app-shell .product-page-price, .app-shell .quickview-info .price, ' +
        '.app-shell .cart-item-price, .app-shell .cart-subtotal',
      size:
        '.app-shell .card .price, .app-shell .product-page-price, .app-shell .quickview-info .price, ' +
        '.app-shell .cart-item-price, .app-shell .cart-subtotal'
    }
  },
  {
    key: 'buttons',
    ...keysFor('buttons', false),
    label: 'Buttons',
    hint: 'Add, Add to bag, Quick view, size options and other buttons (not the hero buttons)',
    colorNote: 'Buttons keep their own colors, so they always stay readable on gold.',
    defaultFont: 'Jost',
    defaultColor: '#cbb98a',
    sample: 'ADD TO BAG',
    sel: {
      font: `.app-shell :is(.btn, .card .add, .tile-hover-btn, .variant-chip)${NOT_HERO}${NOT_ADMIN}`,
      size: `.app-shell :is(.btn, .card .add, .tile-hover-btn, .variant-chip)${NOT_HERO}${NOT_ADMIN}`
    }
  },
  {
    key: 'footer',
    ...keysFor('footer'),
    label: 'Footer',
    hint: 'Footer links, headings, the tagline and the small print',
    colorNote: 'Color applies to the footer links. The dim tagline and small print follow "Small text".',
    defaultFont: 'Jost',
    defaultColor: '#cbb98a',
    sample: 'Shipping · Returns · Contact us',
    sel: {
      font:
        '.app-shell footer, .app-shell footer h4, .app-shell footer a, ' +
        '.app-shell footer input, .app-shell footer button',
      color: '.app-shell .footer-grid a:not(:hover)',
      size:
        '.app-shell footer h4, .app-shell footer a, .app-shell .footer-brand p, ' +
        '.app-shell .footer-bottom, .app-shell footer input, .app-shell footer button'
    }
  }
]

// ------------------------------------------------------- saving & loading --

// One row per saved setting: where it lives in the database, and what it is
// called in the Activity log. Everything else (loading, saving, the SQL) is
// generated from this list, so they cannot drift apart.
export const TYPOGRAPHY_COLUMNS = AREAS.flatMap((area) => [
  { key: area.fontKey, column: `${area.key}_font`, type: 'text', label: `${area.label.toLowerCase()} font` },
  ...(area.colorKey
    ? [{ key: area.colorKey, column: `${area.key}_color`, type: 'text', label: `${area.label.toLowerCase()} text color` }]
    : []),
  { key: area.sizeKey, column: `${area.key}_size`, type: 'number', label: `${area.label.toLowerCase()} text size` }
])

export const TYPOGRAPHY_KEYS = TYPOGRAPHY_COLUMNS.map((c) => c.key)

export function rowToSettings(row) {
  const out = {}
  TYPOGRAPHY_COLUMNS.forEach((c) => {
    const v = row ? row[c.column] : null
    out[c.key] = v == null ? '' : v
  })
  return out
}

export function settingsToRow(settings) {
  const out = {}
  TYPOGRAPHY_COLUMNS.forEach((c) => {
    const v = settings[c.key]
    if (c.type === 'number') out[c.column] = isValidSize(v) ? Number(v) : null
    else out[c.column] = v || null
  })
  return out
}

// The SQL that adds every column above. Kept here so the script and the app
// can never disagree about names.
export function typographySql() {
  return TYPOGRAPHY_COLUMNS
    .map((c) => `alter table public.settings add column if not exists ${c.column} ${c.type === 'number' ? 'integer' : 'text'};`)
    .join('\n')
}

// ------------------------------------------------------------ the styles ---

// Turns the saved settings into CSS. Values are checked first (a font must be
// one from the list, a colour must be #rrggbb, a size must be 50-200) so
// nothing odd can be injected.
export function buildTypographyCss(settings = {}) {
  const fonts = availableFonts()
  const rules = []

  AREAS.forEach((area) => {
    const font = settings[area.fontKey]
    const color = area.colorKey ? settings[area.colorKey] : ''
    const size = settings[area.sizeKey]
    const isBody = area.kind === 'body'

    if (font && fonts.includes(font)) {
      rules.push(`${isBody ? area.sel.container : area.sel.font}{font-family:${fontStack(font)};}`)
    }
    if (isValidColor(color)) {
      rules.push(`${isBody ? area.sel.container : area.sel.color}{color:${color};}`)
    }
    if (isValidSize(size)) {
      const scale = Number(size) / 100
      if (isBody) {
        // Body text has no size of its own, so scale the 16px browser default.
        rules.push(`${area.sel.container}{font-size:${Math.round(16 * scale * 100) / 100}px;}`)
      } else {
        // zoom scales just this text (and its own spacing) and follows any
        // phone/desktop sizes already in the stylesheet.
        rules.push(`${area.sel.size}{zoom:${scale};}`)
      }
    }
  })

  return rules.join('\n')
}

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
