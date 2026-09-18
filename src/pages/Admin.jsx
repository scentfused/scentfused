import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, emptyDraft } from '../data/catalog.js'
import { FONT_OPTIONS } from '../data/settings.js'
import { CATEGORY_FIELDS } from '../data/categoryFields.js'
import { supabase } from '../lib/supabaseClient.js'
import { uploadImageToCloudinary } from '../lib/cloudinary.js'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB, Cloudinary handles storage/optimization now

export default function Admin({ products, setProducts, settings, setSettings }) {
  const [draft, setDraft] = useState(emptyDraft())
  const [tagInputs, setTagInputs] = useState({})

  function addTag(fieldKey, rawValue) {
    const value = rawValue.trim()
    if (!value) return
    const current = Array.isArray(draft.attributes?.[fieldKey]) ? draft.attributes[fieldKey] : []
    if (current.includes(value)) {
      setTagInputs((prev) => ({ ...prev, [fieldKey]: '' }))
      return
    }
    setDraft({ ...draft, attributes: { ...draft.attributes, [fieldKey]: [...current, value] } })
    setTagInputs((prev) => ({ ...prev, [fieldKey]: '' }))
  }

  function removeTag(fieldKey, index) {
    const current = Array.isArray(draft.attributes?.[fieldKey]) ? draft.attributes[fieldKey] : []
    setDraft({ ...draft, attributes: { ...draft.attributes, [fieldKey]: current.filter((_, i) => i !== index) } })
  }
  const [editingId, setEditingId] = useState(null)
  const [imageError, setImageError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [galleryUploadingIndex, setGalleryUploadingIndex] = useState(null)
  const [galleryError, setGalleryError] = useState('')
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroImageError, setHeroImageError] = useState('')
  const [saving, setSaving] = useState(false)
  const [originalProduct, setOriginalProduct] = useState(null)
  const [pendingUpdate, setPendingUpdate] = useState(null)

  // Which top-level cards are expanded. Each toggles independently.
  const [openSections, setOpenSections] = useState({ settings: false, product: false, table: false, ai: false, adInfographic: false })
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiSelectedProductId, setAiSelectedProductId] = useState('')
  const [adPrompt, setAdPrompt] = useState('')
  const [adSelectedProductId, setAdSelectedProductId] = useState('')
  const [adCopied, setAdCopied] = useState(false)

  function buildAdInfographicPrompt(product) {
    const topNotes = (product.attributes?.topNotes || []).join(', ') || '—'
    const heartNotes = (product.attributes?.heartNotes || []).join(', ') || '—'
    const baseNotes = (product.attributes?.baseNotes || []).join(', ') || '—'
    const oneLiner = product.note || product.description || product.name

    return `Create a luxury perfume advertisement infographic in a vertical 4:5 portrait format. Ultra-realistic, cinematic product photography style. The entire image has a seamless pitch black background (#000000) across both the left and right sides, with only gold accents and gold typography. No green, no other background colors.

LEFT SIDE (hero scene): Use the uploaded perfume bottle image exactly as it is. Do not change the bottle's shape, colors, label, or text. Remove the original photo background and place the bottle on the pitch black background.

The bottle sits on a glossy black reflective surface with soft golden reflections beneath it. Around it in the foreground: ${topNotes}, shown as fresh, realistic ingredients with warm golden highlights against the black background.

RIGHT SIDE (info panel): On the same pitch black background, the title "FRAGRANCE NOTES" in large gold serif capitals with a small ornamental gold divider below it. Three sections, each with a gold heading flanked by thin gold horizontal lines and three realistic ingredient photos with centered gold labels beneath:
- TOP NOTES: ${topNotes}
- HEART NOTES: ${heartNotes}
- BASE NOTES: ${baseNotes}

At the bottom, centered gold serif text: "${oneLiner}". Finish with a thin ornamental gold divider.

Color palette: pitch black and metallic gold only (the bottle and ingredients keep their natural colors). All text, dividers, lines, and decorative elements are gold.

Lighting: dramatic low-key lighting, warm golden rim light on the bottle, glossy reflections, shallow depth of field, rich contrast, 8K, sharp details, premium luxury branding. Render all text exactly as written, with correct spelling.`
  }

  function handleSelectAdProduct(productId) {
    setAdSelectedProductId(productId)
    if (!productId) return
    const product = products.find((p) => String(p.id) === String(productId))
    if (product) {
      setAdPrompt(buildAdInfographicPrompt(product))
    }
  }
  
  function buildPromptFromProduct(product) {
    const fieldDefs = CATEGORY_FIELDS[product.category] || []
    const notesParts = []
    ;['topNotes', 'heartNotes', 'baseNotes'].forEach((key) => {
      const value = product.attributes?.[key]
      if (Array.isArray(value) && value.length > 0) notesParts.push(value[0])
    })
    const noteText = notesParts.length > 0 ? notesParts.join(', ') : (product.note || '')
    const categoryLabel = CATEGORIES.find((c) => c.key === product.category)?.label || product.category

    return `A luxury product photograph of "${product.name}", a ${categoryLabel.toLowerCase()} with notes of ${noteText || 'fine fragrance'}. Elegant glass bottle, dramatic studio lighting, black background, gold accents, high-end e-commerce photography style.`
  }

  function handleSelectAIProduct(productId) {
    setAiSelectedProductId(productId)
    if (!productId) return
    const product = products.find((p) => String(p.id) === String(productId))
    if (product) {
      setAiPrompt(buildPromptFromProduct(product))
    }
  }
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiImage, setAiImage] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiCopied, setAiCopied] = useState(false)

  function handleGenerateAIImage() {
    if (!aiPrompt.trim()) return
    setAiGenerating(true)
    setAiError('')
    // A random seed forces a fresh image each time instead of reusing a
    // cached result for the exact same prompt text.
    const seed = Math.floor(Math.random() * 1000000)
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt.trim())}?width=1024&height=1024&nologo=true&seed=${seed}`
    setAiImage(url)
  }
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
    setGalleryError('')
    setGalleryUrlInput('')
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
      images: (draft.images || []).filter((url) => url.trim()),
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
    setTagInputs({})

    // Older products may have topNotes/heartNotes/baseNotes saved as a plain
    // comma-separated string (from before tags existed) — convert those into
    // an array here so the tag-chip UI displays them correctly either way.
    const rawAttributes = product.attributes || {}
    const normalizedAttributes = {}
    Object.keys(rawAttributes).forEach((key) => {
      const value = rawAttributes[key]
      if (typeof value === 'string' && ['topNotes', 'heartNotes', 'baseNotes'].includes(key)) {
        normalizedAttributes[key] = value.split(',').map((v) => v.trim()).filter(Boolean)
      } else {
        normalizedAttributes[key] = value
      }
    })

    setGalleryError('')
    setGalleryUrlInput('')
    setDraft({
      name: product.name,
      category: product.category,
      note: product.note,
      image: product.image || '',
      images: product.images || [],
      variants: (product.variants || []).map((v) => ({ label: v.label, price: String(v.price) })),
      description: product.description || '',
      features: (product.features || []).join('\n'),
      usage: product.usage || '',
      attributes: normalizedAttributes,
      sku: product.sku || '',
      salePrice: product.sale_price ? String(product.sale_price) : ''
    })
    setOpenSections((prev) => ({ ...prev, table: true }))
    setTimeout(() => {
      document.getElementById(`edit-row-${product.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
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

  function addGalleryImageRow() {
    setDraft((d) => ({ ...d, images: [...(d.images || []), ''] }))
  }

  function updateGalleryImageUrl(index, value) {
    setDraft((d) => {
      const next = [...(d.images || [])]
      next[index] = value
      return { ...d, images: next }
    })
  }

  async function handleGalleryImageFile(index, e) {
    const file = e.target.files?.[0]
    if (!file) return
    setGalleryError('')

    if (!file.type.startsWith('image/')) {
      setGalleryError('Please choose an image file.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setGalleryError('Image is too large — please use a file under 5MB, or paste a URL instead.')
      return
    }

    setGalleryUploadingIndex(index)
    try {
      const url = await uploadImageToCloudinary(file)
      updateGalleryImageUrl(index, url)
    } catch (err) {
      console.error('Gallery image upload failed:', err)
      setGalleryError('Upload failed — please try again, or paste a URL instead.')
    } finally {
      setGalleryUploadingIndex(null)
    }
    e.target.value = ''
  }

  function removeGalleryImage(index) {
    setDraft((d) => ({ ...d, images: (d.images || []).filter((_, i) => i !== index) }))
  }

  function renderProductForm() {
    return (
      <>
                  <form
                    onSubmit={handleSubmit}
                    className="admin-form"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                        e.preventDefault()
                      }
                    }}
                  >
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
                      <label key={field.key} className={field.type === 'tags' ? 'admin-form-wide' : ''}>
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

                        {field.type === 'tags' && (
                          <div className="tag-input-box">
                            <div className="tag-chip-list">
                              {(Array.isArray(draft.attributes?.[field.key]) ? draft.attributes[field.key] : []).map((tag, i) => (
                                <span className="tag-chip" key={`${tag}-${i}`}>
                                  {tag}
                                  <button type="button" onClick={() => removeTag(field.key, i)} aria-label={`Remove ${tag}`}>&times;</button>
                                </span>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={tagInputs[field.key] || ''}
                              onChange={(e) => setTagInputs((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ',') {
                                  e.preventDefault()
                                  addTag(field.key, tagInputs[field.key] || '')
                                } else if (e.key === 'Backspace' && !tagInputs[field.key]) {
                                  const current = Array.isArray(draft.attributes?.[field.key]) ? draft.attributes[field.key] : []
                                  if (current.length > 0) removeTag(field.key, current.length - 1)
                                }
                              }}
                              onBlur={() => addTag(field.key, tagInputs[field.key] || '')}
                              placeholder="Type a note, press Enter"
                            />
                          </div>
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
                  Describe the image you want
                  <textarea
                    rows="3"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. A luxury amber perfume bottle on black marble, dramatic lighting, product photography"
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

                  <div className="admin-form-wide">
                    <span className="variants-label">Additional images (optional gallery for the product page)</span>

                    {(draft.images || []).map((url, i) => (
                      <div className="gallery-row" key={i}>
                        {url && (
                          <div className="gallery-row-thumb">
                            <img src={url} alt={`Gallery ${i + 1}`} />
                          </div>
                        )}
                        <input
                          type="url"
                          placeholder="https://example.com/photo.jpg"
                          value={url}
                          onChange={(e) => updateGalleryImageUrl(i, e.target.value)}
                        />
                        <label className="gallery-row-upload">
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleGalleryImageFile(i, e)}
                            disabled={galleryUploadingIndex === i}
                          />
                        </label>
                        <button
                          type="button"
                          className="variant-remove"
                          onClick={() => removeGalleryImage(i)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    {galleryUploadingIndex !== null && <p className="muted">Uploading image…</p>}
                    {galleryError && <p className="admin-form-error">{galleryError}</p>}

                    <button type="button" className="btn btn-line" onClick={addGalleryImageRow}>
                      + Add another image
                    </button>
                  </div>

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
      </>
    )
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

          {/* ---------- AI image generation ---------- */}
          <section className={`admin-collapsible ${openSections.ai ? 'open' : ''}`}>
            <button type="button" className="admin-collapsible-head" onClick={() => toggleSection('ai')}>
              <span>AI Image Generation</span>
              <span className="admin-collapsible-arrow">▾</span>
            </button>

            {openSections.ai && (
              <div className="admin-collapsible-body">
                <div className="admin-form">
                <label className="admin-form-wide">
                  Base this on an existing product (optional)
                  <select value={aiSelectedProductId} onChange={(e) => handleSelectAIProduct(e.target.value)}>
                    <option value="">Choose a product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>

                <label className="admin-form-wide">
                  Describe the image you want
                  <textarea
                    rows="3"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. A luxury amber perfume bottle on black marble, dramatic lighting, product photography"
                  />
                </label>

                                <button
                  type="button"
                  className="btn btn-line"
                  onClick={() => {
                    navigator.clipboard.writeText(aiPrompt)
                    setAiCopied(true)
                    setTimeout(() => setAiCopied(false), 1500)
                  }}
                  disabled={!aiPrompt.trim()}
                >
                  {aiCopied ? 'Copied ✓' : 'Copy prompt'}
                </button>
                </div>
              </div>
            )}
          </section>

          {/* ---------- AI ad infographic prompt ---------- */}
          <section className={`admin-collapsible ${openSections.adInfographic ? 'open' : ''}`}>
            <button type="button" className="admin-collapsible-head" onClick={() => toggleSection('adInfographic')}>
              <span>AI Ad Infographic Prompt</span>
              <span className="admin-collapsible-arrow">▾</span>
            </button>

            {openSections.adInfographic && (
              <div className="admin-collapsible-body">
                <div className="admin-form">
                  <label className="admin-form-wide">
                    Base this on an existing product
                    <select value={adSelectedProductId} onChange={(e) => handleSelectAdProduct(e.target.value)}>
                      <option value="">Choose a product…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-form-wide">
                    Generated prompt
                    <textarea
                      rows="14"
                      value={adPrompt}
                      onChange={(e) => setAdPrompt(e.target.value)}
                      placeholder="Pick a product above to generate the infographic prompt"
                    />
                  </label>

                  <button
                    type="button"
                    className="btn btn-line"
                    onClick={() => {
                      navigator.clipboard.writeText(adPrompt)
                      setAdCopied(true)
                      setTimeout(() => setAdCopied(false), 1500)
                    }}
                    disabled={!adPrompt.trim()}
                  >
                    {adCopied ? 'Copied ✓' : 'Copy prompt'}
                  </button>
                </div>
              </div>
            )}
          </section>
          {/* ---------- Add product ---------- */}
          
          <section className={`admin-collapsible ${openSections.product ? 'open' : ''}`}>
            <button type="button" className="admin-collapsible-head" onClick={() => toggleSection('product')}>
              <span>Add a product</span>
              <span className="admin-collapsible-arrow">▾</span>
            </button>

            {openSections.product && (
              <div className="admin-collapsible-body">
                {editingId ? (
                  <p className="muted">
                    You're currently editing "{originalProduct?.name}" — scroll down to the Products
                    table below, where the edit form now appears directly under that product.
                  </p>
                ) : (
                  renderProductForm()
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
                      <Fragment key={p.id}>
                        <tr>
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
                            <button onClick={() => (editingId === p.id ? resetForm() : handleEdit(p))}>
                              {editingId === p.id ? 'Close' : 'Edit'}
                            </button>
                            <button onClick={() => handleDelete(p.id)}>Delete</button>
                          </td>
                        </tr>
                        {editingId === p.id && (
                          <tr id={`edit-row-${p.id}`}>
                            <td colSpan="6" className="admin-inline-edit-cell">
                              {renderProductForm()}
                            </td>
                          </tr>
                        )}
                      </Fragment>
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
