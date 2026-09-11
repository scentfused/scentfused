export const CATEGORIES = [
  { key: 'perfumes', label: 'Perfumes', blurb: 'Alcohol-based eau de parfum, layered for depth and built to last through the day.' },
  { key: 'attars', label: 'Non-alcoholic perfumes', blurb: 'Oil-based attars, gentle on skin and true to their scent from morning into night.' },
  { key: 'soaps', label: 'Soaps & bodywash', blurb: 'Everyday washes finished with the same notes as the perfumes above.' },
  { key: 'candles', label: 'Scented candles', blurb: 'Hand-poured candles that carry the collections signature accords into a room.' }
]

const raw = {
  perfumes: [
    { name: 'Noir Oud', note: 'Smoked oud, dark amber, leather', price: 6500 },
    { name: 'Velvet Amber', note: 'Amber resin, vanilla, warm musk', price: 6200 },
    { name: 'Iron & Rose', note: 'Bulgarian rose, black pepper, cedar', price: 6800 },
    { name: 'Golden Hour', note: 'Bergamot, sandalwood, wild honey', price: 5900 }
  ],
  attars: [
    { name: 'Rose Attar', note: 'Pure rose, threads of saffron', price: 3800 },
    { name: 'Oud Al Layl', note: 'Aged oud, dark musk', price: 4500 },
    { name: 'Amber Mist', note: 'Amber resin, soft vanilla', price: 3600 },
    { name: 'White Musk Attar', note: 'Clean musk, light florals', price: 3400 }
  ],
  soaps: [
    { name: 'Charcoal Detox Bar', note: 'Activated charcoal, cedarwood', price: 950 },
    { name: 'Gold Silk Bodywash', note: 'Shea butter, amber', price: 1450 },
    { name: 'Sandalwood Soap', note: 'Sandalwood, oat milk', price: 900 },
    { name: 'Oud Clay Bar', note: 'Black clay, oud', price: 1050 }
  ],
  candles: [
    { name: 'Ember & Oud', note: 'Smoked oud, warm spice', price: 2800 },
    { name: 'Vanilla Noir', note: 'Vanilla, dark musk', price: 2600 },
    { name: 'Gold Amber', note: 'Amber resin, warm woods', price: 2700 },
    { name: 'Rose Quartz', note: 'Rose, soft musk', price: 2650 }
  ]
}

let counter = 1
export const initialProducts = Object.entries(raw).flatMap(([category, items]) =>
  items.map((item) => ({ id: counter++, category, ...item }))
)

export const latestNames = [
  'Noir Oud',
  'Oud Al Layl',
  'Ember & Oud',
  'Gold Silk Bodywash',
  'Velvet Amber',
  'White Musk Attar'
]

export function emptyDraft() {
  return { name: '', category: 'perfumes', note: '', image: '', variants: [], description: '', features: '', usage: '', attributes: {}, sku: '', salePrice: '' }
}
