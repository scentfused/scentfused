import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import HelpPage from './pages/HelpPage.jsx'
import SearchResultsPage from './pages/SearchResultsPage.jsx'
import Admin from './pages/Admin.jsx'
import AdminGate from './components/AdminGate.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import WhatsAppButton from './components/WhatsAppButton.jsx'
import QuickView from './components/QuickView.jsx'
import { CATEGORIES } from './data/catalog.js'
import { defaultSettings } from './data/settings.js'
import { shade } from './utils/color.js'
import { buildTypographyCss, TYPOGRAPHY_KEYS } from './utils/typography.js'
import { supabase, isSupabaseConfigured } from './lib/supabaseClient.js'
import { useCart } from './context/CartContext.jsx'

export default function App() {
  const [products, setProducts] = useState([])
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const location = useLocation()
  const { syncCartPrices } = useCart()

  // Only used inside the Admin "Fonts & text colors" preview frame. Admin sends
  // the UNPUBLISHED design here so it can be seen on the real site without
  // being saved. It is ignored everywhere else: this page must be inside a
  // frame, opened with ?typographyPreview, and the message must come from the
  // page that framed it, on the same site.
  const [isPreviewFrame] = useState(
    () => window.self !== window.top && new URLSearchParams(window.location.search).has('typographyPreview')
  )
  const [previewSettings, setPreviewSettings] = useState(null)

  useEffect(() => {
    if (!isPreviewFrame) return undefined

    function onMessage(event) {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      const data = event.data
      if (!data || data.type !== 'scentfused-preview-typography' || !data.settings) return
      const next = {}
      TYPOGRAPHY_KEYS.forEach((key) => {
        if (typeof data.settings[key] === 'string') next[key] = data.settings[key]
      })
      setPreviewSettings(next)
    }

    window.addEventListener('message', onMessage)
    // Tell Admin we're ready, so it sends the current draft straight away.
    window.parent.postMessage({ type: 'scentfused-preview-ready' }, window.location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [isPreviewFrame])

    useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'auto' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [location.pathname, location.hash])

  // Load products + settings from Supabase once, on first mount.
  // This replaces the old hardcoded `initialProducts` starting state,
  // so a page refresh now re-fetches whatever is actually saved instead
  // of resetting to the sample catalog.
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!isSupabaseConfigured) {
        setLoadError(
          'Missing Supabase configuration. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
          'in your Vercel project\u2019s Environment Variables (and in a local .env file), then redeploy.'
        )
        setLoading(false)
        return
      }

      const [productsRes, settingsRes] = await Promise.all([
        supabase.from('products').select('*').order('id', { ascending: true }),
        supabase.from('settings').select('*').eq('id', 1).single()
      ])

      if (cancelled) return

      if (productsRes.error) {
        console.error('Failed to load products:', productsRes.error)
        setLoadError('Could not load products from the database.')
      } else {
        setProducts(productsRes.data.map((p) => ({ ...p, image: p.image || '' })))
      }

      if (settingsRes.error) {
        console.error('Failed to load settings:', settingsRes.error)
        // Fall back to defaultSettings, already set above.
      } else if (settingsRes.data) {
        setSettings({
          brandFont: settingsRes.data.brand_font,
          accentColor: settingsRes.data.accent_color,
          showNewBadge: settingsRes.data.show_new_badge,
          carouselAutoplay: settingsRes.data.carousel_autoplay,
          heroImage: settingsRes.data.hero_image || '',
          carouselProductIds: settingsRes.data.carousel_product_ids || [],
          promoBanner1Image: settingsRes.data.promo_banner_1_image || '',
          promoBanner2Image: settingsRes.data.promo_banner_2_image || '',
          promoBanner1Font: settingsRes.data.promo_banner_1_font || 'Robot Monster',
          promoBanner2Font: settingsRes.data.promo_banner_2_font || 'Robot Monster',
          promoBanner1FontSize: settingsRes.data.promo_banner_1_font_size || 30,
          promoBanner2FontSize: settingsRes.data.promo_banner_2_font_size || 30,
          headerFont: settingsRes.data.header_font || '',
          headerColor: settingsRes.data.header_color || '',
          navFont: settingsRes.data.nav_font || '',
          navColor: settingsRes.data.nav_color || '',
          heroFont: settingsRes.data.hero_font || '',
          heroColor: settingsRes.data.hero_color || '',
          footerFont: settingsRes.data.footer_font || '',
          footerColor: settingsRes.data.footer_color || ''
        })
      }

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  // Once live products are loaded, re-check anything already in the cart so
  // prices saved earlier (e.g. before a sale was set) match current pricing.
  useEffect(() => {
    if (products.length > 0) syncCartPrices(products)
  }, [products, syncCartPrices])

  // Derive the bright/dim accent shades from the single chosen accent color,
  // and expose the brand font as a CSS variable, so both apply live site-wide.
  const themeVars = useMemo(() => ({
    '--brand-font': `'${settings.brandFont}', sans-serif`,
    '--gold': settings.accentColor,
    '--gold-bright': shade(settings.accentColor, 0.35),
    '--gold-dim': shade(settings.accentColor, -0.45)
  }), [settings.brandFont, settings.accentColor])

  // Per-area fonts/colours from Site Settings, turned into CSS. Empty when
  // nothing has been customised, so the original stylesheet is left alone.
  const typographyCss = useMemo(
    () => buildTypographyCss(previewSettings ? { ...settings, ...previewSettings } : settings),
    [settings, previewSettings]
  )

  // Updates settings in local state immediately, then persists to Supabase.
  // Passed down to Admin as `setSettings` so its existing onChange handlers
  // don't need to change at all.
  async function updateSettings(next) {
    setSettings(next)
    const { error } = await supabase
      .from('settings')
      .update({
        brand_font: next.brandFont,
        accent_color: next.accentColor,
        show_new_badge: next.showNewBadge,
        carousel_autoplay: next.carouselAutoplay,
        hero_image: next.heroImage || null,
        carousel_product_ids: next.carouselProductIds || [],
        promo_banner_1_image: next.promoBanner1Image || null,
        promo_banner_2_image: next.promoBanner2Image || null,
        promo_banner_1_font: next.promoBanner1Font || null,
        promo_banner_2_font: next.promoBanner2Font || null,
        promo_banner_1_font_size: next.promoBanner1FontSize || null,
        promo_banner_2_font_size: next.promoBanner2FontSize || null,
        header_font: next.headerFont || null,
        header_color: next.headerColor || null,
        nav_font: next.navFont || null,
        nav_color: next.navColor || null,
        hero_font: next.heroFont || null,
        hero_color: next.heroColor || null,
        footer_font: next.footerFont || null,
        footer_color: next.footerColor || null
      })
      .eq('id', 1)
    if (error) console.error('Failed to save settings:', error)
    return !error // lets the caller know whether it really saved
  }

  if (loading) {
    return (
      <div className="app-shell" style={{ padding: '3rem', textAlign: 'center' }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={themeVars} className="app-shell">
      {typographyCss && <style>{typographyCss}</style>}
      {loadError && (
        <div style={{ background: '#3a1414', color: '#ffb4b4', padding: '0.75rem 1rem', textAlign: 'center' }}>
          {loadError}
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home products={products} settings={settings} />} />
        {CATEGORIES.map((cat) => (
          <Route
            key={cat.key}
            path={`/${cat.key}`}
            element={<CategoryPage products={products} categoryKey={cat.key} />}
          />
        ))}       
        <Route path="/product/:id" element={<ProductPage products={products} />} />
        <Route path="/help" element={<HelpPage />} />         
        <Route path="/search" element={<SearchResultsPage products={products} />} />
        <Route
          path="/admin"
          element={
            <AdminGate>
              <Admin
                products={products}
                setProducts={setProducts}
                settings={settings}
                setSettings={updateSettings}
              />
            </AdminGate>
          }
        />
     </Routes>
        <CartDrawer />
        <WhatsAppButton />
        <QuickView />
    </div>
  )
}
