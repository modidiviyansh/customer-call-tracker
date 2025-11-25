import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Phone, PhoneCall } from 'lucide-react';

const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = { icon: Phone, label: 'Log Call', color: 'from-emerald-500 to-emerald-600' },
  rightAction = { icon: PhoneCall, label: 'Call Now', color: 'from-blue-500 to-blue-600' },
  className = '',
  disabled = false,
  threshold = 100,
  maxSwipe = 150,
  angleThreshold = 20 // degrees - only trigger actions within ±20° of horizontal
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [swipeAngle, setSwipeAngle] = useState(0);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);
  
  // Calculate swipe angle in degrees
  const calculateAngle = (offsetX, offsetY) => {
    const angle = Math.atan2(offsetY, offsetX) * (180 / Math.PI);
    return Math.abs(angle);
  };
  
  // Check if swipe angle is within horizontal threshold
  const isHorizontalSwipe = (angle) => {
    return angle <= angleThreshold || angle >= (180 - angleThreshold);
  };
  
  const handleDrag = (event, info) => {
    setIsDragging(true);
    
    const { offset } = info;
    const angle = calculateAngle(offset.x, offset.y);
    setSwipeAngle(angle);
    
    // Fade to 50% opacity during dragging for visual feedback
    opacity.set(0.5);
    
    // Only show visual feedback for horizontal swipes
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      if (offset.x > 0) {
        setSwipeDirection('right');
      } else if (offset.x < 0) {
        setSwipeDirection('left');
      }
    } else {
      setSwipeDirection(null); // No feedback for vertical/diagonal swipes
    }
  };
  
  const triggerShakeAnimation = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };
  
  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    
    const { offset } = info;
    const angle = calculateAngle(offset.x, offset.y);
    
    // Reset angle after processing
    setTimeout(() => setSwipeAngle(0), 100);
    
    // Only process horizontal swipes with angle validation
    if (Math.abs(offset.x) > Math.abs(offset.y) && isHorizontalSwipe(angle)) {
      if (offset.x > threshold && onSwipeRight) {
        // Right swipe - Call Now with action feedback
        setIsPerformingAction(true);
        onSwipeRight();
        // Keep card at 50% opacity briefly to show action is in progress
        setTimeout(() => {
          animateToCenter();
          opacity.set(1);
          setIsPerformingAction(false);
        }, 500);
      } else if (offset.x < -threshold && onSwipeLeft) {
        // Left swipe - Log Call with action feedback
        setIsPerformingAction(true);
        onSwipeLeft();
        // Keep card at 50% opacity briefly to show action is in progress
        setTimeout(() => {
          animateToCenter();
          opacity.set(1);
          setIsPerformingAction(false);
        }, 500);
      } else {
        // Not enough swipe, animate back to full opacity
        animateToCenter();
        opacity.set(1);
      }
    } else {
      // Invalid swipe (diagonal, vertical, or insufficient horizontal angle)
      triggerShakeAnimation();
      animateToCenter();
      opacity.set(1);
    }
    
    setSwipeDirection(null);
  };
  
  const animateToCenter = () => {
    x.set(0);
    y.set(0);
    // Restore full opacity if not currently performing an action
    if (!isPerformingAction) {
      opacity.set(1);
    }
  };
  
  const getActionColor = () => {
    switch (swipeDirection) {
      case 'left':
        return `bg-gradient-to-r ${leftAction.color}`;
      case 'right':
        return `bg-gradient-to-r ${rightAction.color}`;
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
      default:
        return '';
    }
  };

  // Show angle constraint message when dragging diagonally
  const getAngleFeedback = () => {
    if (isDragging && swipeAngle > 0 && !isHorizontalSwipe(swipeAngle)) {
      return (
        <motion.div
          className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-orange-500/90 text-white px-3 py-1 rounded-full text-xs font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          Swipe horizontally only
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Angle Constraint Feedback */}
      {getAngleFeedback()}
      
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

      {/* Draggable Card with Shake Animation */}
      <motion.div
        className="relative z-10 bg-white touch-manipulation"
        drag={!disabled}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x, y, opacity }}
        whileDrag={{ scale: 0.95 }}
        animate={isShaking ? {
          x: [0, -8, 8, -8, 8, 0],
          rotate: [0, -2, 2, -2, 2, 0]
        } : {}}
        transition={isShaking ? {
          duration: 0.5,
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          ease: "easeInOut"
        } : { type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
      
      {/* Enhanced Visual Feedback Indicators */}
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

      {/* Horizontal Constraint Indicator */}
      {isDragging && swipeAngle > 0 && !isHorizontalSwipe(swipeAngle) && (
        <motion.div
          className="absolute inset-0 border-2 border-dashed border-orange-400/50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Shake completion indicator */}
      {isShaking && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white px-3 py-1 rounded-full text-xs font-bold z-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ delay: 0.3 }}
        >
          Horizontal only!
        </motion.div>
      )}
    </div>
  );
};

export default SwipeableCard;