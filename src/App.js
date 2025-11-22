import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import { ErrorBoundary, PINEntry } from './components';
import { usePinAuth } from './hooks/usePinAuth';
import { isSupabaseConfigured } from './services/supabase';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

function App() {
  const { isAuthenticated, currentAgentPin, signOut } = usePinAuth();

  const handleAuthenticated = () => {
    // Authentication successful, dashboard will handle data loading
  };

  const handleSignOut = () => {
    signOut();
  };

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #f8fafc 50%, #ffffff 100%)',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          maxWidth: '600px',
          padding: '24px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginBottom: '16px' }}>
            ⚠️ Configuration Error
          </h1>
          <p style={{ color: '#374151', marginBottom: '16px', lineHeight: '1.6' }}>
            Supabase environment variables are not configured. Please set the following GitHub Secrets:
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '24px', color: '#4b5563', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>
              <code style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                REACT_APP_SUPABASE_URL
              </code>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <code style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                REACT_APP_SUPABASE_ANON_KEY
              </code>
            </li>
          </ul>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '16px' }}>
            Go to: <strong>Repository Settings → Secrets and variables → Actions</strong>
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
            Check the browser console (F12) for more debugging information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
          {!isAuthenticated ? (
            <PINEntry onAuthenticated={handleAuthenticated} />
          ) : (
            <Dashboard
              agentPin={currentAgentPin}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
