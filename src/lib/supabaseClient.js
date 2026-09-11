import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// True only when both env vars are actually set. Checked by App.jsx before
// trying to load data, so a missing/misspelled env var shows a clear
// on-screen message instead of a silent blank page.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error(
    'Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
    '(see .env.example), then restart the dev server or redeploy.'
  )
}

// createClient() throws immediately if given an empty/undefined URL, which
// would crash the whole app before React even renders (blank page, easy to
// miss in the console). Falling back to harmless placeholder strings here
// means the client always constructs successfully; isSupabaseConfigured is
// what actually gates whether App.jsx attempts to use it.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
