import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, emptyDraft } from '../data/catalog.js'
import { FONT_OPTIONS } from '../data/settings.js'
import { CATEGORY_FIELDS } from '../data/categoryFields.js'
import { supabase } from '../lib/supabaseClient.js'
import { uploadImageToCloudinary } from '../lib/cloudinary.js'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB, Cloudinary handles storage/optimization now

export default function Admin({ products, setProducts, settings, setSettings }) {
  const [draft, setDraft] = useState(emptyDraft())
  const [editingId, setEditingId] = useState(null)
  const [imageError, setImageError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroImageError, setHeroImageError] = useState('')
  const [saving, setSaving] = useState(false)
  const [originalProduct, setOriginalProduct] = useState(null)
  const [pendingUpdate, setPendingUpdate] = useState(null)

  // Which top-level cards are expanded. Each toggles independently.
  const [openSections, setOpenSections] = useState({ settings: false, product: false, table: false })
  function toggleSection(key) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Carousel picker (Site settings > Homepage)
  const [carouselCategory, setCarouselCategory] = useState(CATEGORIES[0]?.key || '')
  const [carouselPick, setCarouselPick] = useState('')
  const carouselCategoryProducts = products.filter((p) => p.category === carouselCategory)
  const carouselSelectedProducts = (settings.carouselProductIds || [])
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)

  function addToCarousel() {
    if (!carouselPick) return
    const id = Number(carouselPick)
    const current = settings.carouselProductIds || []
    if (current.includes(id)) return
    setSettings({ ...settings, carouselProductIds: [...current, id] })
    setCarouselPick('')
  }

  function removeFromCarousel(id) {
    setSettings({ ...settings, carouselProductIds: (settings.carouselProductIds || []).filter((x) => x !== id) })
  }

  // Product table filters
  const [filterName, setFilterName] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterVariant, setFilterVariant] = useState('all')

  const allVariantLabels = useMemo(() => {
    const set = new Set()
    products.forEach((p) => (p.variants || []).forEach((v) => set.add(v.label)))
    return Array.from(set)
  }, [products])

  const visible = products
    .filter((p) => {
      if (filterName && !p.name.toLowerCase().includes(filterName.toLowerCase())) return false
      if (filterCategory !== 'all' && p.category !== filterCategory) return false
      if (filterVariant !== 'all' && !(p.variants || []).some((v) => v.label === filterVariant)) return false
      return true
    })
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))

  const stats = useMemo(() => {
    const total = products.length
    const value = products.reduce((sum, p) => sum + Number(p.price || 0), 0)
    const byCategory = CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      count: products.filter((p) => p.category === c.key).length
    }))
    return { total, value, byCategory }
  }, [products])

  function resetForm() {
    setDraft(emptyDraft())
    setEditingId(null)
    setImageError('')
    setOriginalProduct(null)
    setPendingUpdate(null)
  }

  function buildChanges(original, payload) {
    const changes = []
    const fieldLabels = {
      name: 'Name',
      category: 'Category',
      note: 'Note',
      price: 'Price',
      sale_price: 'Sale price',
      sku: 'SKU',
      description: 'Description',
      usage: 'Usage',
      image: 'Image'
    }

    Object.keys(fieldLabels).forEach((key) => {
      const oldVal = original[key] ?? ''
      const newVal = payload[key] ?? ''
      if (String(oldVal) !== String(newVal)) {
        changes.push({ label: fieldLabels[key], from: String(oldVal) || '—', to: String(newVal) || '—' })
      }
    })

    const oldFeatures = (original.features || []).join(', ')
    const newFeatures = (payload.features || []).join(', ')
    if (oldFeatures !== newFeatures) {
      changes.push({ label: 'Features', from: oldFeatures || '—', to: newFeatures || '—' })
    }

    const oldVariants = (original.variants || []).map((v) => `${v.label}: Rs.${v.price}`).join(', ')
    const newVariants = (payload.variants || []).map((v) => `${v.label}: Rs.${v.price}`).join(', ')
    if (oldVariants !== newVariants) {
      changes.push({ label: 'Variants', from: oldVariants || '—', to: newVariants || '—' })
    }

    const allAttrKeys = new Set([
      ...Object.keys(original.attributes || {}),
      ...Object.keys(payload.attributes || {})
    ])
    allAttrKeys.forEach((key) => {
      const oldVal = original.attributes?.[key]
      const newVal = payload.attributes?.[key]
      const oldDisplay = Array.isArray(oldVal) ? oldVal.join(', ') : (oldVal || '')
      const newDisplay = Array.isArray(newVal) ? newVal.join(', ') : (newVal || '')
      if (oldDisplay !== newDisplay) {
        const fieldDef = (CATEGORY_FIELDS[payload.category] || []).find((f) => f.key === key)
        changes.push({ label: fieldDef?.label || key, from: oldDisplay || '—', to: newDisplay || '—' })
      }
    })

    return changes
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const cleanVariants = (draft.variants || [])
      .filter((v) => v.label.trim() && v.price !== '')
      .map((v) => ({ label: v.label.trim(), price: Number(v.price) }))

    if (!draft.name.trim() || cleanVariants.length === 0) {
      setImageError('Add a name and at least one variant with a price before saving.')
      return
    }

    setImageError('')

    const cleanFeatures = (draft.features || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const payload = {
      name: draft.name,
      category: draft.category,
      note: draft.note,
      price: cleanVariants[0].price,
      sale_price: draft.salePrice ? Number(draft.salePrice) : null,
      sku: draft.sku || null,
      image: draft.image || null,
      variants: cleanVariants,
      description: draft.description || null,
      features: cleanFeatures,
      usage: draft.usage || null,
      attributes: draft.attributes || {}
    }

    if (editingId) {
      // Don't save yet — show a review of what changed and wait for confirmation.
      const changes = buildChanges(originalProduct || {}, payload)
      setPendingUpdate({ payload, changes })
      return
    }

    setSaving(true)
    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.error('Failed to add product:', error)
      setImageError('Could not add product — please try again.')
    } else {
      setProducts((prev) => [...prev, data])
      resetForm()
    }
    setSaving(false)
  }

  async function confirmUpdate() {
    if (!pendingUpdate || !editingId) return
    setSaving(true)

    const { data, error } = await supabase
      .from('products')
      .update(pendingUpdate.payload)
      .eq('id', editingId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update product:', error)
      setImageError('Could not save changes — please try again.')
    } else {
      setProducts((prev) => prev.map((p) => (p.id === editingId ? data : p)))
      resetForm()
    }
    setSaving(false)
  }

  function cancelReview() {
    setPendingUpdate(null)
  }

  function handleEdit(product) {
    setEditingId(product.id)
    setOriginalProduct(product)
    setPendingUpdate(null)
    setImageError('')
    setDraft({
      name: product.name,
      category: product.category,
      note: product.note,
      image: product.image || '',
      variants: (product.variants || []).map((v) => ({ label: v.label, price: String(v.price) })),
      description: product.description || '',
      features: (product.features || []).join('\n'),
      usage: product.usage || '',
      attributes: product.attributes || {},
      sku: product.sku || '',
      salePrice: product.sale_price ? String(product.sale_price) : ''
    })
    setOpenSections((prev) => ({ ...prev, product: true }))
  }

  async function handleDelete(id) {
    if (editingId === id) resetForm()

    const previous = products
    setProducts((prev) => prev.filter((p) => p.id !== id)) // optimistic UI update

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete product:', error)
      setProducts(previous) // roll back if the delete didn't actually happen
    }
  }

  async function handleHeroImageFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setHeroImageError('')

    if (!file.type.startsWith('image/')) {
      setHeroImageError('Please choose an image file.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setHeroImageError('Image is too large — please use a file under 5MB, or paste a URL instead.')
      return
    }

    setHeroUploading(true)
    try {
      const url = await uploadImageToCloudinary(file)
      setSettings({ ...settings, heroImage: url })
    } catch (err) {
      console.error('Hero image upload failed:', err)
      setHeroImageError('Upload failed — please try again, or paste a URL instead.')
    } finally {
      setHeroUploading(false)
    }
  }

  async function handleImageFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError('')

    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image is too large — please use a file under 5MB, or paste a URL instead.')
      return
    }

    setUploading(true)
    try {
      const url = await uploadImageToCloudinary(file)
      setDraft((d) => ({ ...d, image: url }))
    } catch (err) {
      console.error('Image upload failed:', err)
      setImageError('Upload failed — please try again, or paste a URL instead.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin">
      <header className="admin-topbar">
        <span className="brand">scentfused <em>admin</em></span>
        <Link className="admin-btn" to="/">View site</Link>
      </header>

      <div className="wrap admin-wrap">
        <section className="admin-stats">
          <div className="stat-card">
            <span className="stat-label">Total products</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Catalog value</span>
            <span className="stat-value">Rs. {stats.value.toLocaleString()}</span>
          </div>
          {stats.byCategory.map((c) => (
            <div className="stat-card" key={c.key}>
              <span className="stat-label">{c.label}</span>
              <span className="stat-value">{c.count}</span>
            </div>
          ))}
        </section>

        <div className="admin-accordion">
          {/* ---------- Site settings ---------- */}
          <section className={`admin-collapsible ${openSections.settings ? 'open' : ''}`}>
            <button type="button" className="admin-collapsible-head" onClick={() => toggleSection('settings')}>
              <span>Site settings</span>
              <span className="admin-collapsible-arrow">▾</span>
            </button>

            {openSections.settings && (
              <div className="admin-collapsible-body">
                <div className="settings-grid">
                  <div className="settings-group">
                    <h3 className="settings-group-title">Branding</h3>

                    <label className="settings-row">
                      Brand font
                      <select
                        value={settings.brandFont}
                        onChange={(e) => setSettings({ ...settings, brandFont: e.target.value })}
                      >
                        {FONT_OPTIONS.map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </label>
                    <span className="brand-preview" style={{ fontFamily: `'${settings.brandFont}', sans-serif` }}>
                      SCENTFUSED
                    </span>

                    <label className="settings-row">
                      Accent color
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      />
                    </label>
                  </div>

                  <div className="settings-group">
                    <h3 className="settings-group-title">Homepage</h3>

                    <label className="admin-form-wide">
                      Hero background photo
                      <input type="file" accept="image/*" onChange={handleHeroImageFile} disabled={heroUploading} />
                    </label>
                    {heroUploading && <p className="admin-form-wide muted">Uploading image…</p>}
                    {heroImageError && <p className="admin-form-error admin-form-wide">{heroImageError}</p>}

                    <label className="settings-row">
                      Or paste an image URL
                      <input
                        type="text"
                        value={settings.heroImage || ''}
                        onChange={(e) => setSettings({ ...settings, heroImage: e.target.value })}
                        placeholder="https://..."
                      />
                    </label>

                    {settings.heroImage && (
                      <div className="hero-preview">
                        <img src={settings.heroImage} alt="Hero background preview" />
                        <button type="button" className="btn btn-line" onClick={() => setSettings({ ...settings, heroImage: '' })}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="settings-group">
                    <h3 className="settings-group-title">Carousel — "Latest arrivals"</h3>
                    <p className="muted settings-hint">Choose which products appear in the homepage carousel.</p>

                    <div className="carousel-picker">
                      <select
                        value={carouselCategory}
                        onChange={(e) => { setCarouselCategory(e.target.value); setCarouselPick('') }}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>

                      <select value={carouselPick} onChange={(e) => setCarouselPick(e.target.value)}>
                        <option value="">Select a product…</option>
                        {carouselCategoryProducts.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>

                      <button type="button" className="btn btn-line" onClick={addToCarousel} disabled={!carouselPick}>
                        + Add
                      </button>
                    </div>

                    {carouselSelectedProducts.length > 0 && (
                      <ul className="carousel-picked-list">
                        {carouselSelectedProducts.map((p) => (
                          <li key={p.id}>
                            <span>{p.name}</span>
                            <button type="button" onClick={() => removeFromCarousel(p.id)}>Remove</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="settings-group">
                    <h3 className="settings-group-title">Display</h3>

                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settings.showNewBadge}
                        onChange={(e) => setSettings({ ...settings, showNewBadge: e.target.checked })}
                      />
                      Show "New" badge on latest arrivals
                    </label>

                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settings.carouselAutoplay}
                        onChange={(e) => setSettings({ ...settings, carouselAutoplay: e.target.checked })}
                      />
                      Auto-scroll the latest arrivals carousel
                    </label>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ---------- Add / edit product ---------- */}
          <section className={`admin-collapsible ${openSections.product ? 'open' : ''}`}>
            <button type="button" className="admin-collapsible-head" onClick={() => toggleSection('product')}>
              <span>{editingId ? 'Edit product' : 'Add a product'}</span>
              <span className="admin-collapsible-arrow">▾</span>
            </button>

            {openSections.product && (
              <div className="admin-collapsible-body">
                <form onSubmit={handleSubmit} className="admin-form">
                  <label>
                    Category
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value, attributes: {} })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Name
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      placeholder="e.g. Noir Oud"
                      required
                    />
                  </label>

                  {(CATEGORY_FIELDS[draft.category] || [])
                    .filter((field) => field.key !== 'season' && field.key !== 'occasion')
                    .map((field) => (
                      <label key={field.key}>
                        {field.label}

                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={draft.attributes?.[field.key] || ''}
                            onChange={(e) =>
                              setDraft({ ...draft, attributes: { ...draft.attributes, [field.key]: e.target.value } })
                            }
                          />
                        )}

                        {field.type === 'select' && (
                          <select
                            value={draft.attributes?.[field.key] || ''}
                            onChange={(e) =>
                              setDraft({ ...draft, attributes: { ...draft.attributes, [field.key]: e.target.value } })
                            }
                          >
                            <option value="">Select…</option>
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </label>
                    ))}

                  {(() => {
                    const fields = CATEGORY_FIELDS[draft.category] || []
                    const seasonField = fields.find((f) => f.key === 'season')
                    const occasionField = fields.find((f) => f.key === 'occasion')

                    function renderCheckboxes(field) {
                      const current = draft.attributes?.[field.key] || []
                      return (
                        <div className="attribute-checkboxes">
                          {field.options.map((opt) => {
                            const checked = current.includes(opt)
                            return (
                              <label key={opt} className="attribute-checkbox">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...current, opt]
                                      : current.filter((v) => v !== opt)
                                    setDraft({ ...draft, attributes: { ...draft.attributes, [field.key]: next } })
                                  }}
                                />
                                {opt}
                              </label>
                            )
                          })}
                        </div>
                      )
                    }

                    return (
                      <div className="admin-form-wide season-occasion-row">
                        {seasonField && (
                          <div className="season-occasion-col">
                            <span className="variants-label">{seasonField.label}</span>
                            {renderCheckboxes(seasonField)}
                          </div>
                        )}
                        {occasionField && (
                          <div className="season-occasion-col">
                            <span className="variants-label">{occasionField.label}</span>
                            {renderCheckboxes(occasionField)}
                          </div>
                        )}
                        <div className="season-occasion-col">
                          <label>
                            Note (short blurb shown on product cards)
                            <input
                              type="text"
                              value={draft.note}
                              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                              placeholder="e.g. Smoked oud, dark amber, leather"
                            />
                          </label>
                        </div>
                      </div>
                    )
                  })()}

                  <div className="admin-form-wide sku-sale-row">
                    <label>
                      SKU
                      <input
                        type="text"
                        value={draft.sku || ''}
                        onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                        placeholder="e.g. SF-PER-001"
                      />
                    </label>
                    <label>
                      Sale price (Rs.) — optional
                      <input
                        type="number"
                        min="0"
                        value={draft.salePrice || ''}
                        onChange={(e) => setDraft({ ...draft, salePrice: e.target.value })}
                        placeholder="Leave blank if not on sale"
                      />
                    </label>
                  </div>

                  <div className="admin-form-wide">
                    <span className="variants-label">Variants — size and price (at least one required)</span>
                    {(draft.variants || []).map((v, i) => (
                      <div className="variant-row" key={i}>
                        <input
                          type="text"
                          placeholder="Label, e.g. 30ml"
                          value={v.label}
                          onChange={(e) => {
                            const next = [...draft.variants]
                            next[i] = { ...next[i], label: e.target.value }
                            setDraft({ ...draft, variants: next })
                          }}
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Price, e.g. 3800"
                          value={v.price}
                          onChange={(e) => {
                            const next = [...draft.variants]
                            next[i] = { ...next[i], price: e.target.value }
                            setDraft({ ...draft, variants: next })
                          }}
                        />
                        <button
                          type="button"
                          className="variant-remove"
                          onClick={() => setDraft({ ...draft, variants: draft.variants.filter((_, j) => j !== i) })}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-line"
                      onClick={() => setDraft({ ...draft, variants: [...(draft.variants || []), { label: '', price: '' }] })}
                    >
                      + Add variant
                    </button>
                  </div>

                  <label className="admin-form-wide">
                    Description (shown on the product's own page)
                    <textarea
                      rows="4"
                      value={draft.description || ''}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      placeholder="A longer description of the product — story, inspiration, what makes it special..."
                    />
                  </label>

                  <label className="admin-form-wide">
                    Features (one per line)
                    <textarea
                      rows="4"
                      value={draft.features || ''}
                      onChange={(e) => setDraft({ ...draft, features: e.target.value })}
                      placeholder={'Long-lasting 8+ hour wear\nAlcohol-free formula\nHandcrafted in small batches'}
                    />
                  </label>

                  <label className="admin-form-wide">
                    Usage / how to use
                    <textarea
                      rows="3"
                      value={draft.usage || ''}
                      onChange={(e) => setDraft({ ...draft, usage: e.target.value })}
                      placeholder="e.g. Apply to pulse points after showering for best longevity."
                    />
                  </label>

                  <label className="admin-form-wide">
                    Image URL
                    <input
                      type="url"
                      value={draft.image.startsWith('data:') ? '' : draft.image}
                      onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </label>

                  <label className="admin-form-wide">
                    Or upload an image
                    <input type="file" accept="image/*" onChange={handleImageFile} disabled={uploading} />
                  </label>

                  {uploading && <p className="admin-form-wide muted">Uploading image…</p>}
                  {imageError && <p className="admin-form-error admin-form-wide">{imageError}</p>}

                  {draft.image && (
                    <div className="admin-form-wide image-preview">
                      <img src={draft.image} alt="Preview" />
                      <button type="button" onClick={() => setDraft({ ...draft, image: '' })}>
                        Remove image
                      </button>
                    </div>
                  )}

                  <div className="admin-form-actions">
                    <button type="submit" className="btn btn-solid" disabled={saving || uploading}>
                      {saving ? 'Saving…' : editingId ? 'Review changes' : 'Add product'}
                    </button>
                    {editingId && (
                      <button type="button" className="btn btn-line" onClick={resetForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                {pendingUpdate && (
                  <div className="admin-review-panel">
                    <h3>Review changes</h3>
                    {pendingUpdate.changes.length === 0 ? (
                      <p className="muted">No changes detected.</p>
                    ) : (
                      <ul className="admin-review-list">
                        {pendingUpdate.changes.map((c, i) => (
                          <li key={i}>
                            <strong>{c.label}</strong>
                            <span className="admin-review-from">{c.from}</span>
                            <span className="admin-review-arrow">→</span>
                            <span className="admin-review-to">{c.to}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="admin-form-actions">
                      <button type="button" className="btn btn-solid" onClick={confirmUpdate} disabled={saving}>
                        {saving ? 'Updating…' : 'Update product'}
                      </button>
                      <button type="button" className="btn btn-line" onClick={cancelReview}>
                        Back to edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ---------- Product table / management ---------- */}
          <section className={`admin-collapsible ${openSections.table ? 'open' : ''}`}>
            <button type="button" className="admin-collapsible-head" onClick={() => toggleSection('table')}>
              <span>Products</span>
              <span className="admin-collapsible-arrow">▾</span>
            </button>

            {openSections.table && (
              <div className="admin-collapsible-body">
                <div className="admin-table-filters">
                  <input
                    type="text"
                    placeholder="Search by name…"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                  />
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="all">All categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                  <select value={filterVariant} onChange={(e) => setFilterVariant(e.target.value)}>
                    <option value="all">All variants</option>
                    {allVariantLabels.map((label) => (
                      <option key={label} value={label}>{label}</option>
                    ))}
                  </select>
                </div>

                <table className="admin-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Note</th>
                      <th>Price</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="admin-thumb">
                            {p.image
                              ? <img src={p.image} alt={p.name} />
                              : <span className="admin-thumb-empty">—</span>}
                          </div>
                        </td>
                        <td>{p.name}</td>
                        <td>{CATEGORIES.find((c) => c.key === p.category)?.label}</td>
                        <td className="muted">{p.note}</td>
                        <td>Rs. {Number(p.price).toLocaleString()}</td>
                        <td className="admin-row-actions">
                          <button onClick={() => handleEdit(p)}>Edit</button>
                          <button onClick={() => handleDelete(p.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {visible.length === 0 && (
                      <tr>
                        <td colSpan="6" className="muted">No products match these filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
