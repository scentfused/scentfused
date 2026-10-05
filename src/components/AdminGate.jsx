import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { StaffContext } from '../context/StaffContext.jsx'

// Admin login using Supabase Auth (email + password), plus role lookup.
//
// Accounts are created in the Supabase dashboard (Authentication -> Users)
// and given a role in the `staff` table (see supabase-staff-and-audit.sql):
//   admin  = site administrator, can do everything
//   editor = can add, edit and delete products, but not Site Settings or the
//            Activity log
//
// What really enforces this is the set of database rules in that SQL file.
// This component only decides which parts of the admin screen get shown.
export default function AdminGate({ children }) {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [profile, setProfile] = useState(null)
  const [profileState, setProfileState] = useState('idle') // idle | loading | ready | missing
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setChecking(false)
      return undefined
    }

    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setChecking(false)
    })

    // Fires on login, logout, and when a session expires.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  // Once logged in, look up this person's name and role.
  const userId = session?.user?.id
  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setProfileState('idle')
      return undefined
    }

    let active = true
    setProfileState('loading')

    supabase
      .from('staff')
      .select('display_name, role')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error: profileError }) => {
        if (!active) return
        if (profileError || !data) {
          setProfile(null)
          setProfileState('missing')
        } else {
          setProfile({
            userId,
            name: data.display_name,
            role: data.role,
            isAdmin: data.role === 'admin'
          })
          setProfileState('ready')
        }
      })

    return () => { active = false }
  }, [userId])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })

    if (signInError) {
      setError('Incorrect email or password.')
      setPassword('')
    }
    setSubmitting(false)
  }

  if (checking) {
    return (
      <div className="admin-login-wrap">
        <p className="muted">Checking login…</p>
      </div>
    )
  }

  if (session && (profileState === 'loading' || profileState === 'idle')) {
    return (
      <div className="admin-login-wrap">
        <p className="muted">Loading your access…</p>
      </div>
    )
  }

  if (session && profileState === 'missing') {
    return (
      <div className="admin-login-wrap">
        <div className="admin-login-form">
          <span className="brand">scentfused <em>admin</em></span>
          <p className="admin-form-error">
            This account hasn't been given access to the admin area. Please ask the site
            administrator to add you.
          </p>
          <button type="button" className="btn btn-solid" onClick={() => supabase.auth.signOut()}>
            Log out
          </button>
        </div>
      </div>
    )
  }

  if (session && profile) {
    return <StaffContext.Provider value={profile}>{children}</StaffContext.Provider>
  }

  return (
    <div className="admin-login-wrap">
      <form onSubmit={handleSubmit} className="admin-login-form">
        <span className="brand">scentfused <em>admin</em></span>

        {!isSupabaseConfigured && (
          <p className="admin-form-error">
            Supabase isn't configured on this site, so login is unavailable.
          </p>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="admin-form-error">{error}</p>}

        <button type="submit" className="btn btn-solid" disabled={submitting || !isSupabaseConfigured}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
