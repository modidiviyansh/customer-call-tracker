import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing REACT_APP_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing REACT_APP_SUPABASE_ANON_KEY environment variable')
}

// Create Supabase client with modern session strategies
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable session persistence across page reloads
    persistSession: true,
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Detect session in URL and exchange for session
    detectSessionInUrl: true,
    // Storage key for session storage (optional customization)
    storageKey: 'customer-call-tracker-auth-token',
    // Flow type - PKCE for enhanced security
    flowType: 'pkce'
  },
  // Enable realtime for live updates
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // Database connection settings
  db: {
    schema: 'public'
  },
  // Global headers
  global: {
    headers: {
      'x-my-custom-header': 'customer-call-tracker-app'
    }
  }
})

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Export default client for easy importing
export default supabase