import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './pages';
import { ErrorBoundary, PINEntry, DebugPanel } from './components';
import { usePinAuth } from './hooks/usePinAuth';
import { debugLog } from './utils/mockData';
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
  const [debugMode, setDebugMode] = useState(false);
  const [debugState, setDebugState] = useState({
    supabaseConnected: true,
    customersLoaded: false,
    callRecordsLoaded: false,
    errors: [],
    warnings: []
  });

  const handleAuthenticated = () => {
    debugLog('App', 'PIN authentication successful', { agentPin: currentAgentPin });
    // Force a re-render to ensure authentication state is updated
    setTimeout(() => {
      console.log('Authentication state after PIN entry:', { isAuthenticated, currentAgentPin });
      // Force re-render by updating state
      setDebugState(prev => ({ ...prev }));
    }, 100);
  };

  const handleSignOut = () => {
    debugLog('App', 'User signing out');
    signOut();
  };

  // Toggle debug mode with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        setDebugMode(!debugMode);
        console.log('🔧 Debug mode:', !debugMode ? 'ENABLED' : 'DISABLED');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [debugMode]);

  // Update debug state based on data loading
  useEffect(() => {
    if (isAuthenticated) {
      // Check localStorage for debug info from data hooks
      const debugInfo = localStorage.getItem('debug_info');
      if (debugInfo) {
        try {
          const parsed = JSON.parse(debugInfo);
          setDebugState(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.warn('Failed to parse debug info:', e);
        }
      }
    }
  }, [isAuthenticated]);

  console.log('App render - isAuthenticated:', isAuthenticated, 'currentAgentPin:', currentAgentPin);

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
              setDebugState={setDebugState}
            />
          )}
          
          {/* Debug Mode Toggle */}
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="fixed bottom-4 right-4 z-50 bg-purple-500 text-white px-3 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-purple-600 hover:scale-105 transition-all duration-300 min-h-[44px] touch-manipulation"
            title="Toggle Debug Mode (Ctrl+D)"
          >
            {debugMode ? '🔧 Debug ON' : '🔧 Debug OFF'}
          </button>

          {/* Debug Panel - Only show in debug mode */}
          {debugMode && (
            <DebugPanel
              isOpen={debugMode}
              onClose={() => setDebugMode(false)}
              lastAction={null}
              customerData={null}
              reminders={null}
              callRecords={null}
            />
          )}

          {/* Status Indicator */}
          <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono">
            Auth: {isAuthenticated ? '✅' : '❌'} | PIN: {currentAgentPin || 'none'} | Debug: {debugMode ? 'ON' : 'OFF'}
          </div>
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
