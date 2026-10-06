import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AREAS,
  SIZE_MAX,
  SIZE_MIN,
  TYPOGRAPHY_KEYS,
  availableFonts,
  contrastOnBlack,
  describeContrast,
  fontStack,
  isValidSize
} from '../utils/typography.js'

// Admin -> Site Settings -> "Fonts & text colors". Each section of the site gets a
// font, a text size (a % of the original) and, where it makes sense, a color.
//
// Changes made here are a DRAFT. They are shown on a live preview of your real
// site (the frame on the right) but are NOT saved, and visitors do not see
// them, until you press Publish. Discard throws the draft away.
//
// Styling is inline on purpose, so this section needs nothing added to App.css.

const PREVIEW_URL = '/?typographyPreview=1'

// The preview frame is rendered at a real screen size and scaled down to fit,
// so the layout you see is the layout visitors get.
const SIZES = {
  desktop: { w: 1280, h: 820 },
  mobile: { w: 390, h: 780 }
}

function pickValues(settings) {
  const out = {}
  TYPOGRAPHY_KEYS.forEach((key) => {
    out[key] = settings[key] || ''
  })
  return out
}

export default function TypographySettings({ settings, setSettings }) {
  const fonts = availableFonts()
  const saved = useMemo(() => pickValues(settings), [settings])

  const [draft, setDraft] = useState(saved)
  const [device, setDevice] = useState('desktop')
  const [publishing, setPublishing] = useState(false)
  const [notice, setNotice] = useState(null) // { text, ok }
  const [boxWidth, setBoxWidth] = useState(0)

  const iframeRef = useRef(null)
  const boxRef = useRef(null)

  const pending = TYPOGRAPHY_KEYS.some((key) => draft[key] !== saved[key])

  // ---- talk to the preview frame -------------------------------------------
  const sendDraft = useCallback(() => {
    const frameWindow = iframeRef.current && iframeRef.current.contentWindow
    if (frameWindow) {
      frameWindow.postMessage(
        { type: 'scentfused-preview-typography', settings: draft },
        window.location.origin
      )
    }
  }, [draft])

  // Send the draft every time it changes.
  useEffect(() => {
    sendDraft()
  }, [sendDraft])

  // The frame says "ready" each time it loads, so send the draft right then too.
  useEffect(() => {
    function onMessage(event) {
      if (event.origin !== window.location.origin) return
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return
      if (event.data && event.data.type === 'scentfused-preview-ready') sendDraft()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [sendDraft])

  // ---- fit the preview to the available width ------------------------------
  useEffect(() => {
    const el = boxRef.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver((entries) => {
      setBoxWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ---- actions -------------------------------------------------------------
  function change(changes) {
    setDraft((d) => ({ ...d, ...changes }))
    setNotice(null)
  }

  function discard() {
    setDraft(saved)
    setNotice(null)
  }

  async function publish() {
    setPublishing(true)
    setNotice(null)
    const ok = await setSettings({ ...settings, ...draft })
    setPublishing(false)
    setNotice(
      ok === false
        ? { ok: false, text: "Couldn't save. Make sure the database step (supabase-typography.sql) was run, then try again." }
        : { ok: true, text: 'Published. Visitors now see this design.' }
    )
  }

  const { w, h } = SIZES[device]
  const scale = boxWidth ? Math.min(1, boxWidth / w) : 1

  return (
    <div className="settings-group" style={{ gridColumn: '1 / -1' }}>
      <h3 className="settings-group-title">Fonts &amp; text colors</h3>
      <p className="muted settings-hint">
        Open a section, change its font, size or color, and watch the preview. Nothing goes live
        until you press Publish. Anything left on "Site default" keeps your original look.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>
        {/* ---------------- controls ---------------- */}
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {AREAS.map((area) => {
            const font = draft[area.fontKey]
            const color = area.colorKey ? draft[area.colorKey] : ''
            const size = draft[area.sizeKey]
            const sizePercent = isValidSize(size) ? Number(size) : 100
            const shownColor = color || area.defaultColor
            const shownFont = font || area.defaultFont
            const ratio = contrastOnBlack(shownColor)
            const verdict = describeContrast(ratio)
            const isCustom = Boolean(font || color || isValidSize(size))

            return (
              <details
                key={area.key}
                style={{ borderTop: '1px solid var(--hairline)', paddingTop: 14 }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 12,
                    listStyle: 'none'
                  }}
                >
                  <span>
                    <strong style={{ color: 'var(--gold-bright)', fontWeight: 500, fontSize: 14 }}>
                      {area.label}
                    </strong>
                    <span className="muted" style={{ display: 'block', fontSize: 12 }}>{area.hint}</span>
                  </span>
                  {isCustom && (
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        border: '1px solid var(--gold)',
                        color: 'var(--gold-bright)',
                        padding: '2px 7px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Changed
                    </span>
                  )}
                </summary>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 14 }}>
                  <label className="settings-row">
                    Font for {area.label.toLowerCase()}
                    <select value={font} onChange={(e) => change({ [area.fontKey]: e.target.value })}>
                      <option value="">Site default ({area.defaultFont})</option>
                      {fonts.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </label>

                  <label className="settings-row">
                    <span style={{ whiteSpace: 'nowrap' }}>
                      Text size for {area.label.toLowerCase()}{' '}
                      <span style={{ color: 'var(--gold-bright)' }}>{sizePercent}%</span>
                    </span>
                    <input
                      type="range"
                      min={SIZE_MIN}
                      max={SIZE_MAX}
                      step={5}
                      value={sizePercent}
                      aria-label={`Text size for ${area.label.toLowerCase()}`}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        change({ [area.sizeKey]: n === 100 ? '' : n })
                      }}
                      style={{ flex: 1, minWidth: 120, padding: 0, accentColor: 'var(--gold)', cursor: 'pointer' }}
                    />
                  </label>

                  {area.colorKey && (
                    <label className="settings-row">
                      Text color for {area.label.toLowerCase()}
                      <input
                        type="color"
                        value={shownColor}
                        onChange={(e) => change({ [area.colorKey]: e.target.value })}
                      />
                    </label>
                  )}

                  <div
                    style={{
                      background: '#000',
                      border: '1px solid var(--hairline)',
                      padding: '10px 14px',
                      fontFamily: fontStack(shownFont),
                      color: area.colorKey ? shownColor : 'var(--champagne)',
                      fontSize: 18 * (sizePercent / 100),
                      lineHeight: 1.3,
                      overflow: 'hidden'
                    }}
                  >
                    {area.sample}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      flexWrap: 'wrap'
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: area.colorKey && verdict.level !== 'good' ? '#e8987c' : 'var(--gold-dim)'
                      }}
                    >
                      {area.colorKey
                        ? `${color ? 'Your color' : 'Site default color'} · contrast on black ${
                            ratio ? `${ratio.toFixed(1)}:1` : '—'
                          } (${verdict.text})`
                        : 'Colors stay as they are.'}
                    </span>

                    {isCustom && (
                      <button
                        type="button"
                        className="btn btn-line"
                        style={{ padding: '8px 16px' }}
                        onClick={() =>
                          change({
                            [area.fontKey]: '',
                            [area.sizeKey]: '',
                            ...(area.colorKey ? { [area.colorKey]: '' } : {})
                          })
                        }
                      >
                        Reset {area.label.toLowerCase()}
                      </button>
                    )}
                  </div>

                  {area.colorNote && (
                    <p className="muted" style={{ margin: 0, fontSize: 12 }}>{area.colorNote}</p>
                  )}
                </div>
              </details>
            )
          })}
        </div>

        {/* ---------------- preview + publish ---------------- */}
        <div
          style={{
            flex: '2 1 460px',
            minWidth: 0,
            position: 'sticky',
            top: 84,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div
            data-testid="publish-bar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              padding: '12px 14px',
              background: '#0a0a0a',
              border: `1px solid ${pending ? 'var(--gold)' : 'var(--hairline)'}`
            }}
          >
            <span style={{ fontSize: 13, color: pending ? 'var(--gold-bright)' : 'var(--gold-dim)' }}>
              {pending
                ? 'Unpublished changes. Visitors still see your current design.'
                : 'No unpublished changes. This preview matches your live site.'}
            </span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-line"
                style={{ padding: '8px 16px' }}
                disabled={!pending || publishing}
                onClick={discard}
              >
                Discard
              </button>
              <button
                type="button"
                className="btn btn-solid"
                style={{ padding: '8px 16px' }}
                disabled={!pending || publishing}
                onClick={publish}
              >
                {publishing ? 'Publishing…' : 'Publish'}
              </button>
            </span>
          </div>

          {notice && (
            <p style={{ margin: 0, fontSize: 13, color: notice.ok ? 'var(--gold-bright)' : '#e8987c' }}>
              {notice.text}
            </p>
          )}
          {pending && (
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>
              Leaving this tab throws away unpublished changes.
            </p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {['desktop', 'mobile'].map((mode) => (
              <button
                key={mode}
                type="button"
                className="btn btn-line"
                aria-pressed={device === mode}
                style={{
                  padding: '6px 14px',
                  ...(device === mode ? { background: 'var(--gold)', color: '#000' } : {})
                }}
                onClick={() => setDevice(mode)}
              >
                {mode === 'desktop' ? 'Desktop' : 'Mobile'}
              </button>
            ))}
          </div>

          <div ref={boxRef} style={{ width: '100%' }}>
            <div
              style={{
                width: w * scale,
                height: h * scale,
                margin: '0 auto',
                overflow: 'hidden',
                border: '1px solid var(--hairline)',
                background: '#000'
              }}
            >
              <iframe
                ref={iframeRef}
                title="Preview of your site with the unpublished design"
                src={PREVIEW_URL}
                style={{
                  width: w,
                  height: h,
                  border: 0,
                  background: '#000',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left'
                }}
              />
            </div>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            This is your real site. You can click around inside it to check other pages.
          </p>
        </div>
      </div>
    </div>
  )
}
