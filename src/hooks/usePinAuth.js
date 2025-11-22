import { useState, useCallback, useEffect } from 'react';

// Hardcoded PIN for the luxury application
const VALID_PIN = '2342';

export const usePinAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize from localStorage
    return localStorage.getItem('is_authenticated') === 'true';
  });
  const [currentAgentPin, setCurrentAgentPin] = useState(() => {
    // Initialize from localStorage
    return localStorage.getItem('agent_pin') || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);

  // Persist authentication state to localStorage
  useEffect(() => {
    localStorage.setItem('is_authenticated', isAuthenticated.toString());
  }, [isAuthenticated]);

  useEffect(() => {
    if (currentAgentPin) {
      localStorage.setItem('agent_pin', currentAgentPin);
    } else {
      localStorage.removeItem('agent_pin');
    }
  }, [currentAgentPin]);

  const validatePin = useCallback(async (pin) => {
    setIsLoading(true);
    setError(null);

    // Simulate authentication delay for luxury feel
    await new Promise(resolve => setTimeout(resolve, 800));

    if (pin === VALID_PIN) {
      setIsAuthenticated(true);
      setCurrentAgentPin(pin);
      setAttempts(0);
      setError(null);
      setIsLoading(false);
      return { success: true };
    } else {
      setAttempts(prev => prev + 1);
      setError('Invalid access code');
      setIsLoading(false);
      return { success: false, error: 'Invalid access code' };
    }
  }, []);

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentAgentPin('');
    setAttempts(0);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isAuthenticated,
    currentAgentPin,
    isLoading,
    error,
    attempts,
    validatePin,
    signOut,
    clearError,
  };
};