import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Phone, PhoneCall, X, CheckCircle } from 'lucide-react';

const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  leftAction = { icon: Phone, label: 'Log Call', color: 'from-emerald-500 to-emerald-600' },
  rightAction = { icon: PhoneCall, label: 'Call Now', color: 'from-blue-500 to-blue-600' },
  className = '',
  disabled = false,
  threshold = 100,
  maxSwipe = 150
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const handleDrag = (event, info) => {
    setIsDragging(true);
    
    if (info.offset.x > 0) {
      setSwipeDirection('right');
    } else if (info.offset.x < 0) {
      setSwipeDirection('left');
    } else if (info.offset.y > 0) {
      setSwipeDirection('down');
    } else if (info.offset.y < 0) {
      setSwipeDirection('up');
    } else {
      setSwipeDirection(null);
    }
  };
  
  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    
    const { offset } = info;
    
    // Horizontal swipes
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      if (offset.x > threshold && onSwipeRight) {
        // Right swipe - Call Now
        onSwipeRight();
        animateToCenter();
      } else if (offset.x < -threshold && onSwipeLeft) {
        // Left swipe - Log Call
        onSwipeLeft();
        animateToCenter();
      } else {
        // Not enough swipe, animate back
        animateToCenter();
      }
    }
    // Vertical swipes
    else {
      if (offset.y > threshold && onSwipeDown) {
        onSwipeDown();
        animateToCenter();
      } else if (offset.y < -threshold && onSwipeUp) {
        onSwipeUp();
        animateToCenter();
      } else {
        animateToCenter();
      }
    }
    
    setSwipeDirection(null);
  };
  
  const animateToCenter = () => {
    x.set(0);
    y.set(0);
  };
  
  const getActionColor = () => {
    switch (swipeDirection) {
      case 'left':
        return `bg-gradient-to-r ${leftAction.color}`;
      case 'right':
        return `bg-gradient-to-r ${rightAction.color}`;
      case 'up':
      case 'down':
        return 'bg-gradient-to-r from-purple-500 to-purple-600';
      default:
        return 'bg-transparent';
    }
  };
  
  const getActionIcon = () => {
    switch (swipeDirection) {
      case 'left':
        return <leftAction.icon className="w-8 h-8 text-white" />;
      case 'right':
        return <rightAction.icon className="w-8 h-8 text-white" />;
      case 'up':
        return <CheckCircle className="w-8 h-8 text-white" />;
      case 'down':
        return <X className="w-8 h-8 text-white" />;
      default:
        return null;
    }
  };
  
  const getActionLabel = () => {
    switch (swipeDirection) {
      case 'left':
        return leftAction.label;
      case 'right':
        return rightAction.label;
      case 'up':
        return 'Complete';
      case 'down':
        return 'Dismiss';
      default:
        return '';
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Action Overlay */}
      <AnimatePresence>
        {(swipeDirection || isDragging) && (
          <motion.div
            className={`absolute inset-0 flex items-center justify-center ${getActionColor()}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center space-y-2">
              {getActionIcon()}
              {getActionLabel() && (
                <span className="text-white font-bold text-lg">
                  {getActionLabel()}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draggable Card */}
      <motion.div
        className="relative z-10 bg-white touch-manipulation"
        drag={!disabled}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x, y }}
        whileDrag={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
      
      {/* Visual Feedback Indicators */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
        {/* Left swipe indicator */}
        <motion.div
          className="flex items-center space-x-2 text-emerald-600 opacity-0"
          style={{
            opacity: useTransform(x, [-threshold, -threshold / 2], [1, 0])
          }}
        >
          <Phone className="w-4 h-4" />
          <span className="text-sm font-medium">Swipe to Log</span>
        </motion.div>
        
        {/* Right swipe indicator */}
        <motion.div
          className="flex items-center space-x-2 text-blue-600 opacity-0"
          style={{
            opacity: useTransform(x, [threshold / 2, threshold], [0, 1])
          }}
        >
          <PhoneCall className="w-4 h-4" />
          <span className="text-sm font-medium">Swipe to Call</span>
        </motion.div>
      </div>
    </div>
  );
};

export default SwipeableCard;