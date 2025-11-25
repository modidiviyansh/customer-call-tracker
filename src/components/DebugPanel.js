import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bug, X, Zap, Mouse } from 'lucide-react';

const DebugPanel = ({ isOpen, onClose, lastAction, customerData, reminders, callRecords }) => {
  const [events, setEvents] = useState([]);
  const [isEnabled, setIsEnabled] = useState(true);

  // Add event listeners for debugging
  useEffect(() => {
    if (!isEnabled) return;

    const handleClick = (event) => {
      const eventInfo = {
        type: 'click',
        timestamp: new Date().toISOString(),
        target: event.target.tagName,
        targetClass: event.target.className,
        targetId: event.target.id,
        targetText: event.target.textContent?.substring(0, 50),
        x: event.clientX,
        y: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY,
        isButton: event.target.tagName === 'BUTTON',
        hasOnClick: !!event.target.onclick
      };
      
      console.log('🔍 CLICK EVENT:', eventInfo);
      
      setEvents(prev => {
        const newEvents = [eventInfo, ...prev.slice(0, 9)]; // Keep last 10 events
        return newEvents;
      });
    };

    const handleTouch = (event) => {
      const touch = event.touches[0];
      const eventInfo = {
        type: 'touch',
        timestamp: new Date().toISOString(),
        target: touch?.target?.tagName || 'unknown',
        targetClass: touch?.target?.className || '',
        targetText: touch?.target?.textContent?.substring(0, 50),
        x: touch?.clientX,
        y: touch?.clientY,
        isButton: touch?.target?.tagName === 'BUTTON'
      };
      
      console.log('👆 TOUCH EVENT:', eventInfo);
      
      setEvents(prev => {
        const newEvents = [eventInfo, ...prev.slice(0, 9)];
        return newEvents;
      });
    };

    // Add event listeners
    document.addEventListener('click', handleClick, true);
    document.addEventListener('touchstart', handleTouch, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('touchstart', handleTouch, true);
    };
  }, [isEnabled]);

  // Test button click functionality
  const testButtonClick = () => {
    console.log('🧪 TEST: Button click test initiated');
    setEvents(prev => [{
      type: 'test-button',
      timestamp: new Date().toISOString(),
      message: 'Button test clicked successfully'
    }, ...prev.slice(0, 9)]);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed top-4 left-4 z-[9999] w-80 max-h-96 bg-red-500 text-white rounded-2xl shadow-xl overflow-hidden border border-white/30"
    >
      {/* Header */}
      <div className="p-3 bg-red-600 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bug className="w-4 h-4" />
          <span className="font-semibold text-sm">Debug Panel</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className="p-1 hover:bg-red-700 rounded"
            title="Toggle debug logging"
          >
            <Zap className={`w-4 h-4 ${isEnabled ? 'text-yellow-300' : 'text-gray-300'}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Debug Content */}
      <div className="p-3 bg-red-500 max-h-80 overflow-y-auto">
        {/* Event Log */}
        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-2">
            <Mouse className="w-4 h-4" />
            <span className="font-semibold text-sm">Events ({events.length})</span>
          </div>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {events.map((event, index) => (
              <div
                key={index}
                className="text-xs bg-red-600 rounded p-2 font-mono"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{event.type}</span>
                  <span className="text-xs opacity-75">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {event.target && (
                  <div className="mt-1">
                    <span className="text-yellow-200">Target: </span>
                    <span className="text-white">{event.target}</span>
                  </div>
                )}
                {event.targetText && (
                  <div className="text-xs opacity-75 truncate">
                    {event.targetText}
                  </div>
                )}
                {event.message && (
                  <div className="text-xs opacity-75">
                    {event.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Test Button */}
        <button
          onClick={testButtonClick}
          className="w-full bg-yellow-500 text-red-900 font-semibold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors text-sm"
        >
          🧪 Test Click Event
        </button>
      </div>
    </motion.div>
  );
};

export default DebugPanel;