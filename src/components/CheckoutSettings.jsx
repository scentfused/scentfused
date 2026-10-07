import { useEffect, useMemo, useState } from 'react'
import {
  normalizeDeliveryRates, normalizePaymentMethods, normalizeWhatsapp, slugify
} from '../utils/checkout.js'

let nextId = 1
const newId = () => `c${nextId++}`

function toDraft(rates, methods, whatsapp) {
  return {
    defaultFee: String(rates.default),
    cities: rates.cities.map((c) => ({ key: newId(), city: c.city, fee: String(c.fee) })),
    methods: methods.map((m) => ({ ...m, key: newId() })),
    whatsapp
  }
}

function fromDraft(d) {
  return {
    rates: normalizeDeliveryRates({
      default: d.defaultFee,
      cities: d.cities.map((c) => ({ city: c.city, fee: c.fee }))
    }),
    methods: normalizePaymentMethods(d.methods.map((m) => ({ ...m, id: m.id || '' }))),
    whatsapp: d.whatsapp
  }
}

// Admin -> Site Settings -> Checkout: delivery charges, payment methods and
// the WhatsApp number the order button sends to.
export default function CheckoutSettings({ settings, setSettings }) {
  const base = useMemo(() => ({
    rates: normalizeDeliveryRates(settings.deliveryRates),
    methods: normalizePaymentMethods(settings.paymentMethods),
    whatsapp: normalizeWhatsapp(settings.whatsappNumber)
  }), [settings.deliveryRates, settings.paymentMethods, settings.whatsappNumber])

  const [draft, setDraft] = useState(() => toDraft(base.rates, base.methods, base.whatsapp))
  const [status, setStatus] = useState({ kind: '', text: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { setDraft(toDraft(base.rates, base.methods, base.whatsapp)) }, [base])

  const dirty = JSON.stringify(fromDraft(draft)) !== JSON.stringify(base)

  function patch(p) { setDraft((d) => ({ ...d, ...p })); setStatus({ kind: '', text: '' }) }
  function patchMethod(key, p) { patch({ methods: draft.methods.map((m) => (m.key === key ? { ...m, ...p } : m)) }) }
  function patchCity(key, p) { patch({ cities: draft.cities.map((c) => (c.key === key ? { ...c, ...p } : c)) }) }

  function addMethod() {
    patch({ methods: [...draft.methods, { key: newId(), id: '', label: '', enabled: true, askReference: false, account: '', instructions: '' }] })
  }

  async function save() {
    if (!/^\d+$/.test(draft.defaultFee.trim())) return setStatus({ kind: 'error', text: 'The default delivery charge must be a number.' })
    for (const c of draft.cities) {
      if (!c.city.trim() && !c.fee.trim()) continue
      if (!c.city.trim() || !/^\d+$/.test(c.fee.trim())) return setStatus({ kind: 'error', text: 'Each city rate needs a city name and a number.' })
    }
    for (const m of draft.methods) {
      if (!m.label.trim()) return setStatus({ kind: 'error', text: 'Every payment method needs a name.' })
    }
    if (String(draft.whatsapp).replace(/\D/g, '').length < 10) {
      return setStatus({ kind: 'error', text: 'Enter the WhatsApp number with country code, e.g. 923022726002.' })
    }
    if (!draft.methods.some((m) => m.enabled)) {
      if (!window.confirm('No payment method is switched on, so customers will not be able to order. Save anyway?')) return
    }

    // Give brand-new methods an id; existing ones keep theirs.
    const taken = draft.methods.map((m) => m.id).filter(Boolean)
    const methods = draft.methods.map((m) => {
      if (m.id) return m
      const id = slugify(m.label, taken)
      taken.push(id)
      return { ...m, id }
    })
    const cleaned = fromDraft({ ...draft, methods })

    setSaving(true)
    const ok = await setSettings({
      ...settings,
      deliveryRates: cleaned.rates,
      paymentMethods: cleaned.methods,
      whatsappNumber: cleaned.whatsapp
    })
    setSaving(false)
    setStatus(ok === false
      ? { kind: 'error', text: 'Could not save. Check that the orders SQL has been run in Supabase, then try again.' }
      : { kind: 'ok', text: 'Saved. Checkout now uses these settings.' })
  }

  return (
    <div className="settings-group filter-settings">
      <h3 className="settings-group-title">Checkout</h3>
      <p className="settings-help">
        Delivery charges, payment methods and the WhatsApp number used at checkout.
        Nothing changes on the website until you press <strong>Save checkout settings</strong>.
      </p>

      <div className="filter-group-card">
        <strong>Delivery charges (Rs.)</strong>
        <p className="settings-help">A city listed here gets its own charge. Any other city pays the default charge.</p>
        <label className="settings-row">
          Default charge (all other cities)
          <input type="number" min="0" value={draft.defaultFee} onChange={(e) => patch({ defaultFee: e.target.value })} className="checkout-num" />
        </label>
        <ul className="filter-item-list filter-range-row-list">
          {draft.cities.map((c) => (
            <li key={c.key} className="filter-range-row">
              <input type="text" placeholder="City" aria-label="City" value={c.city} onChange={(e) => patchCity(c.key, { city: e.target.value })} />
              <input type="number" min="0" placeholder="Charge" aria-label="Charge" value={c.fee} onChange={(e) => patchCity(c.key, { fee: e.target.value })} />
              <button type="button" className="btn btn-line filter-remove" onClick={() => patch({ cities: draft.cities.filter((x) => x.key !== c.key) })}>Remove</button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-line" onClick={() => patch({ cities: [...draft.cities, { key: newId(), city: '', fee: '' }] })}>+ Add a city rate</button>
      </div>

      <div className="filter-group-card">
        <strong>Payment methods</strong>
        <p className="settings-help">
          Use {'{total}'} in the instructions to show the order total. "Ask for a transaction ID" adds an optional box for customers who have already paid.
          Removing a method does not affect orders already placed.
        </p>
        {draft.methods.map((m) => (
          <div className="checkout-method-edit" key={m.key}>
            <div className="filter-group-head">
              <input type="text" placeholder="Name, e.g. JazzCash" aria-label="Payment method name" value={m.label} onChange={(e) => patchMethod(m.key, { label: e.target.value })} />
              <label className="settings-toggle">
                <input type="checkbox" checked={m.enabled} onChange={(e) => patchMethod(m.key, { enabled: e.target.checked })} />
                On
              </label>
              <label className="settings-toggle">
                <input type="checkbox" checked={m.askReference} onChange={(e) => patchMethod(m.key, { askReference: e.target.checked })} />
                Ask for a transaction ID
              </label>
              <button type="button" className="btn btn-line filter-remove" onClick={() => patch({ methods: draft.methods.filter((x) => x.key !== m.key) })}>Remove</button>
            </div>
            <textarea rows="2" placeholder="What the customer should do, e.g. Send {total} to account…" aria-label="Instructions" value={m.instructions} onChange={(e) => patchMethod(m.key, { instructions: e.target.value })} />
          </div>
        ))}
        <button type="button" className="btn btn-line" onClick={addMethod}>+ Add a payment method</button>
      </div>

      <div className="filter-group-card">
        <strong>WhatsApp</strong>
        <p className="settings-help">The number the "Send order details on WhatsApp" button opens. Digits only, with country code.</p>
        <input type="text" inputMode="numeric" value={draft.whatsapp} onChange={(e) => patch({ whatsapp: e.target.value })} aria-label="WhatsApp number" className="checkout-wa-input" />
      </div>

      <div className="filter-save-bar">
        <button type="button" className="btn btn-solid" onClick={save} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save checkout settings'}
        </button>
        {dirty && !saving && <button type="button" className="btn btn-line" onClick={() => { setDraft(toDraft(base.rates, base.methods, base.whatsapp)); setStatus({ kind: '', text: '' }) }}>Discard changes</button>}
        {dirty && !saving && <span className="settings-help">You have unsaved changes.</span>}
        {status.text && <span className={`filter-status filter-status-${status.kind}`} role="status">{status.text}</span>}
      </div>
    </div>
  )
}
