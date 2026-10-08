const FONT_LIST = [
  'Audiowide',
  'Robot Monster',
  'Royale',
  'Orange Avenue',
  'Royale_Sb',
  'Royale_BOLD',
  'SS Royal',
  'Senda Display',
  'Shanoy',
  'Soviet Style',
  'Orbitron',
  'Bebas Neue',
  'Cinzel',
  'Metal Mania',
  'Monoton'  
/*
  'Orange Avenue',
  'Royale_Sb',
  'Royale_BOLD',
  'SS Royal',
  'Senda Display',
  'Shanoy',
  'Soviet Style' */
]

// Shown A–Z in every font dropdown.
export const FONT_OPTIONS = FONT_LIST.slice().sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))

export const defaultSettings = {
  brandFont: 'Robot Monster',
  accentColor: '#d4af37',
  showNewBadge: true,
  carouselAutoplay: true,
  heroImage: '',
  carouselProductIds: [],
  promoBanner1Image: '',
  promoBanner2Image: '',
  promoBanner1Font: 'Robot Monster',
  promoBanner2Font: 'Robot Monster',
  promoBanner1FontSize: 30,
  promoBanner2FontSize: 30,
  // Per-area fonts and text colours. Empty = keep the site's original look.
  headerFont: '',
  headerColor: '',
  navFont: '',
  navColor: '',
  heroFont: '',
  heroColor: '',
  footerFont: '',
  footerColor: '',
  // Shop filter lists (Site Settings -> Filters). See utils/filters.js
  filterOptions: null,
  // Checkout (Site Settings -> Checkout). See utils/checkout.js
  deliveryRates: null,
  paymentMethods: null,
  whatsappNumber: '',
  lowStockThreshold: 5
}
