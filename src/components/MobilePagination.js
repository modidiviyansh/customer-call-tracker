/**
 * MOBILE-OPTIMIZED PAGINATION COMPONENT
 * 
 * Features:
 * - Simple prev/next navigation for mobile
 * - "Load More" infinite scroll style button
 * - Touch-friendly controls (44px minimum)
 * - No complex page counts or numbers
 * - Clean, minimal design
 * - Smooth animations
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from './index';

const MobilePagination = ({
  // Server-side data props
  currentPage = 1,
  pageSize = 20,
  totalCount = 0,
  totalPages = 0,
  
  // Event handlers
  onPageChange,
  
  // UI customization
  showLoadMore = true,
  showPrevNext = true,
  showInfo = true,
  className = "",
  loading = false,
  emptyMessage = "No data available",
  loadMoreText = "Load More",
  loadMoreLoadingText = "Loading...",
  
  // Styling
  variant = "outline", // "outline" | "filled" | "ghost"
  size = "lg", // "sm" | "md" | "lg"
  serverName = "Database"
}) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Calculate derived values
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  // Event handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage && onPageChange) {
      onPageChange(newPage);
    }
  };

  const handleLoadMore = async () => {
    if (!hasNextPage || loading) return;
    
    setIsLoadingMore(true);
    try {
      await handlePageChange(currentPage + 1);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const goToPreviousPage = () => handlePageChange(currentPage - 1);
  const goToNextPage = () => handlePageChange(currentPage + 1);

  // Empty state
  if (totalCount === 0 && !loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mobile Info Strip */}
      {showInfo && totalCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-slate-600 bg-slate-50 rounded-lg py-3 px-4"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span>Showing <span className="font-medium">{startIndex + 1}-{endIndex}</span> of <span className="font-medium">{totalCount.toLocaleString()}</span> customers</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span>{serverName}</span>
            {totalPages > 1 && (
              <span>• Page {currentPage} of {totalPages}</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Mobile Navigation Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {/* Previous Page Button */}
          {showPrevNext && hasPreviousPage && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={goToPreviousPage}
                disabled={loading}
                variant={variant}
                size={size}
                className="flex items-center gap-2 min-w-[100px]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
                <span>Previous</span>
              </Button>
            </motion.div>
          )}

          {/* Load More Button (Primary Action) */}
          {showLoadMore && hasNextPage && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 max-w-[200px]"
            >
              <Button
                onClick={handleLoadMore}
                disabled={loading || isLoadingMore}
                variant="filled"
                size={size}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {(loading || isLoadingMore) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{loadMoreLoadingText}</span>
                  </>
                ) : (
                  <>
                    <MoreHorizontal className="w-4 h-4" />
                    <span>{loadMoreText}</span>
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Next Page Button */}
          {showPrevNext && hasNextPage && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={goToNextPage}
                disabled={loading}
                variant={variant}
                size={size}
                className="flex items-center gap-2 min-w-[100px]"
              >
                <span>Next</span>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {/* Single Page or End State */}
      {totalPages <= 1 && totalCount > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">All customers loaded</span>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center py-4"
          >
            <div className="inline-flex items-center gap-2 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading {serverName} data...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End of Results Message */}
      {!hasNextPage && totalCount > pageSize && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg">
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-sm">You've reached the end</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MobilePagination;