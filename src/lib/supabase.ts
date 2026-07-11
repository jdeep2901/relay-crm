import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

// Relay lives in the `relay` schema of the shared dashboard project.
// Default every query to that schema; RLS keeps all of it authenticated-only.
export const supabase = createClient(url, anonKey, {
  db: { schema: 'relay' },
  auth: { persistSession: true, autoRefreshToken: true },
})

// The auth schema isn't reachable through the relay-scoped client's helpers we
// need, so expose a plainly-scoped client for edge-function calls.
export const functionsBase = `${url}/functions/v1`
