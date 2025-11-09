import React from 'react';
import { AlertTriangle, Database, Wifi, WifiOff } from 'lucide-react';

const DebugPanel = ({ 
  supabaseConnected, 
  customersLoaded, 
  callRecordsLoaded, 
  errors = [], 
  warnings = [] 
}) => {
  // Only show in development
  if (process.env.NODE_ENV === 'production') return null;

  const isDebugMode = localStorage.getItem('debug_mode') === 'true';

  if (!isDebugMode) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => localStorage.setItem('debug_mode', 'true')}
          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
        >
          🐛 Enable Debug
        </button>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    return status ? (
      <Wifi className="w-4 h-4 text-green-500" />
    ) : (
      <WifiOff className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusColor = (status) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-80 glass-card p-4 text-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">🔧 Debug Panel</h3>
        <button
          onClick={() => localStorage.setItem('debug_mode', 'false')}
          className="text-slate-500 hover:text-slate-700"
        >
          ✕
        </button>
      </div>

      {/* System Status */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Supabase Connection</span>
          </span>
          {getStatusIcon(supabaseConnected)}
        </div>
        
        <div className="flex items-center justify-between">
          <span>Customers Loaded</span>
          <span className={getStatusColor(customersLoaded)}>
            {customersLoaded ? '✓' : '✗'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Call Records Loaded</span>
          <span className={getStatusColor(callRecordsLoaded)}>
            {callRecordsLoaded ? '✓' : '✗'}
          </span>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-red-600 mb-2 flex items-center space-x-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Errors ({errors.length})</span>
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {errors.map((error, index) => (
              <div key={index} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                {typeof error === 'string' ? error : error.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-yellow-600 mb-2">Warnings ({warnings.length})</h4>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {warnings.map((warning, index) => (
              <div key={index} className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                {typeof warning === 'string' ? warning : warning.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-500 text-white py-1 px-2 rounded text-xs hover:bg-blue-600"
        >
          🔄 Reload Page
        </button>
        
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="w-full bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600"
        >
          🗑️ Clear Storage & Reload
        </button>
      </div>
    </div>
  );
};

export default DebugPanel;