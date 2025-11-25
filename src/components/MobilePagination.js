/**
 * MOBILE-FIRST PAGINATION COMPONENT
 * 
 * Features:
 * - Compact Previous/Page/Next navigation only
 * - Centered active page number display
 * - Text-based buttons optimized for thumb interaction
 * - Minimal Load More functionality
 * - Touch-friendly spacing (44px minimum targets)
 * - Clean, focused mobile design
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const MobilePagination = ({
  // Server-side data props
  currentPage = 1,
  totalCount = 0,
  totalPages = 0,
  
  // Event handlers
  onPageChange,
  
  // UI customization
  showInfo = false, // Disabled by default for clean interface
  className = "",
  loading = false,
  emptyMessage = "No data available",
  serverName = "Database"
}) => {

  // Calculate derived values
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  // Event handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage && onPageChange) {
      onPageChange(newPage);
    }
  };

  const goToPreviousPage = () => handlePageChange(currentPage - 1);
  const goToNextPage = () => handlePageChange(currentPage + 1);

  // Empty state
  if (totalCount === 0 && !loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-slate-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  // Single page state
  if (totalPages <= 1) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-xs text-slate-500">Page 1 of 1</p>
      </div>
    );
  }

  return (
    <div className={`py-4 ${className}`}>
      {/* Compact Mobile Pagination */}
      <div className="flex items-center justify-center">
        {/* Previous Button */}
        <motion.button
          onClick={goToPreviousPage}
          disabled={loading || !hasPreviousPage}
          className={`
            flex items-center justify-center min-w-[44px] h-11 px-3 rounded-lg
            text-sm font-medium transition-all duration-200 touch-manipulation
            ${hasPreviousPage && !loading
              ? 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 active:scale-95'
              : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
            }
          `}
          whileTap={hasPreviousPage && !loading ? { scale: 0.95 } : {}}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Prev</span>
            </>
          )}
        </motion.button>

        {/* Centered Page Number */}
        <div className="mx-4 flex items-center">
          <motion.div
            className="flex items-center justify-center min-w-[60px] h-11 px-3 bg-blue-500 text-white rounded-lg"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-sm font-semibold">
              {currentPage} / {totalPages}
            </span>
          </motion.div>
        </div>

        {/* Next Button */}
        <motion.button
          onClick={goToNextPage}
          disabled={loading || !hasNextPage}
          className={`
            flex items-center justify-center min-w-[44px] h-11 px-3 rounded-lg
            text-sm font-medium transition-all duration-200 touch-manipulation
            ${hasNextPage && !loading
              ? 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 active:scale-95'
              : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
            }
          `}
          whileTap={hasNextPage && !loading ? { scale: 0.95 } : {}}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </motion.button>
      </div>



      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mt-4"
          >
            <div className="inline-flex items-center gap-2 text-slate-500 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Loading...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobilePagination;