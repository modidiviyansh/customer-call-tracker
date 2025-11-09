import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Diamond } from 'lucide-react';
import { usePinAuth } from '../hooks/usePinAuth';

const PINEntry = ({ onAuthenticated }) => {
  const [pin, setPin] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isCardExiting, setIsCardExiting] = useState(false);
  const { validatePin, isLoading, error, clearError } = usePinAuth();

  // Clear error when user starts typing
  const handleNumberInput = (digit) => {
    if (error) clearError();
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handleDelete = () => {
    if (error) clearError();
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) return;

    const result = await validatePin(pin);
    if (!result.success) {
      // Trigger shake animation for incorrect PIN
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setTimeout(() => setPin(''), 300);
    } else {
      // Animate card out and reveal dashboard
      setIsCardExiting(true);
      setTimeout(() => {
        onAuthenticated();
      }, 800);
    }
  };

  // Auto-submit when 4 digits are entered
  useEffect(() => {
    if (pin.length === 4 && !isLoading) {
      handleSubmit();
    }
  }, [pin, isLoading, handleSubmit]);

  const numberPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫']
  ];

  const hapticFeedback = (action) => {
    // Visual haptic feedback simulation
    const event = new CustomEvent('haptic-feedback', { detail: { type: action } });
    window.dispatchEvent(event);
  };

  const handleButtonPress = (value) => {
    hapticFeedback('press');
    if (value === '⌫') {
      handleDelete();
    } else if (value) {
      handleNumberInput(value);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      {/* Luxury background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50"></div>
      <div className="absolute inset-0 glass-strong opacity-30"></div>
      
      {/* Floating luxury pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-primary-100/20 to-secondary-100/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-secondary-100/20 to-primary-100/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* PIN Entry Card */}
      <motion.div
        className={`
          relative z-10 w-full max-w-sm mx-auto
          ${isShaking ? 'animate-shake' : ''}
        `}
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isCardExiting ? 0 : 1,
          y: isCardExiting ? 20 : 0,
          scale: isCardExiting ? 0.8 : 1
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="glass-card-gradient p-8 space-y-8 shadow-gradient hover:shadow-luxury-lg hover:scale-105 transition-all duration-300">
          {/* Header with luxury icons */}
          <div className="text-center space-y-4">
            <div className="flex justify-center space-x-2">
              <Diamond className="w-6 h-6 text-luxury-gold animate-glow" />
              <Lock className="w-6 h-6 text-primary-500" />
              <Shield className="w-6 h-6 text-secondary-500 animate-glow" style={{ animationDelay: '0.5s' }} />
            </div>
            
            <div>
              <h1 className="text-2xl font-luxury font-semibold text-slate-800 mb-2">
                Exclusive Access
              </h1>
              <p className="text-sm text-slate-600 font-medium">
                Your exclusive access code
              </p>
            </div>
          </div>

          {/* PIN Display */}
          <div className="space-y-4">
            <div className="flex justify-center space-x-3">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`
                    w-4 h-4 rounded-full border-2 transition-all duration-300
                    ${index < pin.length 
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 border-transparent shadow-luxury-sm' 
                      : 'border-slate-300 bg-white/50'
                    }
                  `}
                />
              ))}
            </div>

            {error && (
              <div className="text-center">
                <p className="text-sm text-red-500 font-medium animate-fade-in">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            {numberPad.flat().map((number, index) => (
              <button
                key={index}
                onClick={() => {
                  console.log('🔢 PIN button clicked:', number);
                  handleButtonPress(number);
                }}
                disabled={!number || isLoading}
                className={`
                  touch-target h-16 rounded-2xl font-semibold text-xl relative z-20
                  ${number === '⌫' 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95' 
                    : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white active:scale-95 shadow-luxury-button'
                  }
                  ${!number ? 'invisible' : ''}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-luxury-lg transition-all duration-200'}
                  cursor-pointer select-none
                `}
                style={{ pointerEvents: 'auto' }}
              >
                {number}
              </button>
            ))}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          {/* Security indicator */}
          <div className="text-center">
            <p className="text-xs text-slate-500 flex items-center justify-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Secure PIN Authentication</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PINEntry;