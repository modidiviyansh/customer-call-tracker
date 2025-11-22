import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = (key) => {
    switch (type) {
      case 'card':
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: key * 0.1 }}
            className="glass-card-gradient p-4 space-y-4"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="flex-1 space-y-2">
                <motion.div
                  className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                />
                <motion.div
                  className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-3/4"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <motion.div
                className="h-10 bg-gradient-to-r from-blue-200 to-teal-200 rounded-xl flex-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              />
              <motion.div
                className="h-10 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl w-20"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              />
            </div>
          </motion.div>
        );

      case 'stats':
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: key * 0.1 }}
            className="glass-card-gradient p-4 text-center space-y-3"
          >
            <motion.div
              className="w-8 h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full mx-auto"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-16 mx-auto"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            />
            <motion.div
              className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-20 mx-auto"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
          </motion.div>
        );

      case 'form':
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: key * 0.1 }}
            className="space-y-4"
          >
            <motion.div
              className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-24"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="h-12 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            />
          </motion.div>
        );

      default:
        return (
          <motion.div
            key={key}
            className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => renderSkeleton(i))}
    </div>
  );
};

export default SkeletonLoader;