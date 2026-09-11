import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import Admin from './pages/Admin.jsx'
import AdminGate from './components/AdminGate.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import QuickView from './components/QuickView.jsx'
import { CATEGORIES } from './data/catalog.js'
import { defaultSettings } from './data/settings.js'
import { shade } from './utils/color.js'
import { supabase, isSupabaseConfigured } from './lib/supabaseClient.js'

export default function App() {
  const [products, setProducts] = useState([])
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

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
          carouselProductIds: settingsRes.data.carousel_product_ids || []
        })
      }

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  // Derive the bright/dim accent shades from the single chosen accent color,
  // and expose the brand font as a CSS variable, so both apply live site-wide.
  const themeVars = useMemo(() => ({
    '--brand-font': `'${settings.brandFont}', sans-serif`,
    '--gold': settings.accentColor,
    '--gold-bright': shade(settings.accentColor, 0.35),
    '--gold-dim': shade(settings.accentColor, -0.45)
  }), [settings.brandFont, settings.accentColor])

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
        carousel_product_ids: next.carouselProductIds || []
      })
      .eq('id', 1)
    if (error) console.error('Failed to save settings:', error)
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
        <QuickView />
    </div>
  )
}
