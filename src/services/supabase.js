import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Log configuration status (only in development or if missing)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are missing:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
}

// Create Supabase client with modern session strategies
// Use placeholder values if env vars are missing to prevent crashes
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co'
const finalKey = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient(finalUrl, finalKey, {
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

export const isSupabaseConfigured = () => {
  // If mock data is enabled, allow app to run without Supabase
  const useMockData = process.env.REACT_APP_USE_MOCK_DATA === 'true';
  if (useMockData) {
    console.log('✅ Mock data enabled - Supabase configuration not required');
    return true;
  }

  const isConfigured = !!(supabaseUrl && supabaseAnonKey &&
            supabaseUrl !== 'https://placeholder.supabase.co' &&
            supabaseAnonKey !== 'placeholder-key' &&
            supabaseUrl.trim() !== '' &&
            supabaseAnonKey.trim() !== '');
  
  if (!isConfigured) {
    console.warn('⚠️ Supabase is not properly configured. Environment variables:', {
      REACT_APP_SUPABASE_URL: supabaseUrl ? 'Set' : 'Missing',
      REACT_APP_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Missing',
      REACT_APP_USE_MOCK_DATA: process.env.REACT_APP_USE_MOCK_DATA
    });
  }
  
  return isConfigured
}

// Export default client for easy importing
export default supabase