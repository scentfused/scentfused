import { useEffect, useMemo, useState } from 'react'
import { uploadVideoToCloudinary } from '../lib/cloudinary.js'
import { MAX_HERO_VIDEOS, normalizeHeroVideos } from '../utils/hero.js'

const MAX_VIDEO_BYTES = 25 * 1024 * 1024
const blank = () => ({ url: '', title: '', text: '' })

function toDraft(videos) {
  const list = normalizeHeroVideos(videos)
  return Array.from({ length: MAX_HERO_VIDEOS }, (_, i) => list[i] || blank())
}

// Admin -> Site Settings -> Homepage -> Hero videos. Up to three clips that
// play one after another behind the headline, each with an optional caption.
export default function HeroVideoSettings({ settings, setSettings }) {
  const baseline = useMemo(() => normalizeHeroVideos(settings.heroVideos), [settings.heroVideos])
  const [draft, setDraft] = useState(() => toDraft(settings.heroVideos))
  const [busy, setBusy] = useState(-1)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ kind: '', text: '' })

  useEffect(() => { setDraft(toDraft(settings.heroVideos)) }, [settings.heroVideos])

  const cleaned = normalizeHeroVideos(draft)
  const dirty = JSON.stringify(cleaned) !== JSON.stringify(baseline)

  function patch(i, p) {
    setDraft((d) => d.map((row, j) => (j === i ? { ...row, ...p } : row)))
    setStatus({ kind: '', text: '' })
  }

  async function onFile(i, e) {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('video/')) { setStatus({ kind: 'error', text: 'Please choose a video file (MP4 or WebM).' }); return }
    if (file.size > MAX_VIDEO_BYTES) { setStatus({ kind: 'error', text: 'That video is over 25 MB. Compress it, or upload it to Cloudinary yourself and paste the link.' }); return }
    setBusy(i)
    setStatus({ kind: '', text: '' })
    try {
      const url = await uploadVideoToCloudinary(file)
      patch(i, { url })
    } catch (err) {
      console.error('Hero video upload failed:', err)
      setStatus({ kind: 'error', text: 'Upload failed. Try again, or paste a video link instead.' })
    } finally {
      setBusy(-1)
    }
  }

  async function save() {
    setSaving(true)
    const ok = await setSettings({ ...settings, heroVideos: cleaned })
    setSaving(false)
    setStatus(ok === false
      ? { kind: 'error', text: 'Could not save. Has the hero videos SQL been run in Supabase?' }
      : { kind: 'ok', text: cleaned.length ? `Saved. ${cleaned.length} video${cleaned.length === 1 ? '' : 's'} will play on the home page.` : 'Saved. The home page uses the photo.' })
  }

  return (
    <div className="hero-video-settings">
      <label className="settings-toggle">
        <input
          type="checkbox"
          checked={settings.heroAnimation !== false}
          onChange={(e) => setSettings({ ...settings, heroAnimation: e.target.checked })}
        />
        Animated gold-mist background (shown when no video is playing)
      </label>

      <h4>Hero videos (optional)</h4>
      <p className="muted settings-hint">
        Up to {MAX_HERO_VIDEOS} short, silent clips (6–10 seconds, under 25 MB) that play one after another behind the
        home page headline. The caption is shown while that clip plays. Leave them all empty to keep using the photo above,
        which is also shown while a video loads, and to visitors who have data saver or reduced motion switched on.
      </p>
      {draft.map((row, i) => (
        <div className="hero-video-row" key={i}>
          <strong>Video {i + 1}</strong>
          <label>Upload a video
            <input type="file" accept="video/*" onChange={(e) => onFile(i, e)} disabled={busy !== -1} />
          </label>
          {busy === i && <p className="muted">Uploading… this can take a minute.</p>}
          <label>Or paste a video link
            <input type="text" value={row.url} placeholder="https://res.cloudinary.com/…/video/upload/….mp4" onChange={(e) => patch(i, { url: e.target.value })} />
          </label>
          <label>Caption title (optional)
            <input type="text" maxLength={80} value={row.title} placeholder="e.g. Where notes become one" onChange={(e) => patch(i, { title: e.target.value })} />
          </label>
          <label>Caption line (optional)
            <input type="text" maxLength={200} value={row.text} placeholder="e.g. Oud, amber and rose, fused in small batches" onChange={(e) => patch(i, { text: e.target.value })} />
          </label>
          {row.url && <button type="button" className="btn btn-line" onClick={() => patch(i, blank())}>Remove video {i + 1}</button>}
        </div>
      ))}
      <div className="filter-save-bar">
        <button type="button" className="btn btn-solid" onClick={save} disabled={!dirty || saving || busy !== -1}>{saving ? 'Saving…' : 'Save hero videos'}</button>
        {dirty && !saving && <span className="settings-help">You have unsaved changes.</span>}
        {status.text && <span className={`filter-status filter-status-${status.kind}`} role="status">{status.text}</span>}
      </div>
    </div>
  )
}
