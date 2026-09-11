import { useState } from 'react'

// Change this to update the admin password.
const ADMIN_PASSWORD = '0000'
const SESSION_KEY = 'scentfused-admin-auth'

// Simple client-side gate: blocks casual visitors from seeing/using the
// admin form until the password is entered, then remembers that for the
// current browser tab (sessionStorage) so it doesn't ask again mid-session.
//
// IMPORTANT: this only hides the /admin UI. It does NOT stop someone who
// directly calls the Supabase API with the public anon key (which is
// visible in your deployed JS bundle) from reading/writing products anyway,
// because the RLS policies in supabase-schema.sql currently allow public
// insert/update/delete. For real protection, add Supabase Auth and
// restrict those policies to logged-in admins.
export default function AdminGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setUnlocked(true)
      setError('')
    } else {
      setError('Incorrect password.')
      setPassword('')
    }
  }

  if (unlocked) return children

  return (
    <div className="admin-login-wrap">
      <form onSubmit={handleSubmit} className="admin-login-form">
        <span className="brand">scentfused <em>admin</em></span>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
            autoFocus
          />
        </label>
        {error && <p className="admin-form-error">{error}</p>}
        <button type="submit" className="btn btn-solid">Enter</button>
      </form>
    </div>
  )
}
