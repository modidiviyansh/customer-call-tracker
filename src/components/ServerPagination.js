/**
 * SERVER-SIDE PAGINATION COMPONENT
 * 
 * Designed for Supabase and other REST APIs with proper total counts
 * Features:
 * - Accurate server-side count display
 * - Jump to page functionality
 * - Responsive design for mobile
 * - Loading states and error handling
 * - Performance optimized for large datasets
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search,
  MoreHorizontal,
  Loader2
} from 'lucide-react';

const ServerPagination = ({
  // Server-side data props
  currentPage = 1,
  pageSize = 20,
  totalCount = 0,
  totalPages = 0,
  
  // Event handlers
  onPageChange,
  onPageSizeChange,
  
  // UI customization
  showPageSizeSelector = true,
  showSearch = false,
  showJumpToPage = true,
  showInfo = true,
  showQuickNav = true,
  maxVisiblePages = 7,
  minPageSize = 10,
  maxPageSize = 100,
  
  // Search props
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  searchDebounceMs = 300,
  
  // Styling
  className = "",
  loading = false,
  emptyMessage = "No data available",
  
  // Server info
  serverName = "Database",
  lastUpdated = null
}) => {
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [jumpToPage, setJumpToPage] = useState('');
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange && localSearch !== searchValue) {
        onSearchChange(localSearch);
      }
    }, searchDebounceMs);

    return () => clearTimeout(timer);
  }, [localSearch, searchDebounceMs, onSearchChange, searchValue]);

  // Update local search when prop changes
  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  // Calculate derived values
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const half = Math.floor(maxVisiblePages / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    // Add first page and ellipsis
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }

    // Add page range
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis and last page
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  // Event handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage && onPageChange) {
      onPageChange(newPage);
    }
  };

  const handlePageSizeChange = (newSize) => {
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
    setShowPageSizeDropdown(false);
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
      setJumpToPage('');
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  // Quick navigation handlers
  const goToFirstPage = () => handlePageChange(1);
  const goToLastPage = () => handlePageChange(totalPages);
  const goToNextPage = () => handlePageChange(currentPage + 1);
  const goToPreviousPage = () => handlePageChange(currentPage - 1);

  // Empty state
  if (totalCount === 0 && !loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-slate-500 mb-4">{emptyMessage}</p>
        {showSearch && (
          <div className="mt-4 flex justify-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Controls Bar */}
      {(showSearch || showPageSizeSelector || showJumpToPage || lastUpdated) && (
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          {showSearch && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Page Size Selector */}
            {showPageSizeSelector && (
              <div className="relative">
                <button
                  onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm">Show: {pageSize}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showPageSizeDropdown ? 'rotate-90' : ''}`} />
                </button>
                
                {showPageSizeDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 min-w-[100px]">
                    {[10, 20, 50, 100].filter(size => size <= maxPageSize && size >= minPageSize).map(size => (
                      <button
                        key={size}
                        onClick={() => handlePageSizeChange(size)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                          size === pageSize ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        {size} per page
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Jump to Page */}
            {showJumpToPage && totalPages > 5 && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Page #"
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleJumpToPage)}
                  className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max={totalPages}
                />
                <button
                  onClick={handleJumpToPage}
                  disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Go
                </button>
              </div>
            )}

            {/* Last Updated Info */}
            {lastUpdated && (
              <div className="text-xs text-slate-500">
                Updated: {new Date(lastUpdated).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Server Information Bar */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <div className="flex items-center gap-4">
          {/* Data Info */}
          {showInfo && totalCount > 0 && (
            <span>
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{endIndex}</span> of{' '}
              <span className="font-medium">{totalCount.toLocaleString()}</span> results
            </span>
          )}
          
          {/* Page Info */}
          {totalPages > 1 && (
            <span>
              (Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages.toLocaleString()}</span>)
            </span>
          )}
        </div>

        {/* Server Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-xs">{serverName}</span>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1 flex-wrap justify-center">
            {/* First Page */}
            {showQuickNav && (
              <motion.button
                onClick={goToFirstPage}
                disabled={!hasPreviousPage || loading}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: hasPreviousPage ? 1.05 : 1 }}
                whileTap={{ scale: hasPreviousPage ? 0.95 : 1 }}
                title="First page"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronsLeft className="w-4 h-4" />
                )}
              </motion.button>
            )}

            {/* Previous Page */}
            {showQuickNav && (
              <motion.button
                onClick={goToPreviousPage}
                disabled={!hasPreviousPage || loading}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: hasPreviousPage ? 1.05 : 1 }}
                whileTap={{ scale: hasPreviousPage ? 0.95 : 1 }}
                title="Previous page"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </motion.button>
            )}

            {/* Page Numbers */}
            <div className="flex items-center gap-1 mx-2 flex-wrap justify-center">
              {getPageNumbers().map((pageNum, index) => {
                if (pageNum === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 py-1 text-slate-400 flex items-center">
                      <MoreHorizontal className="w-4 h-4" />
                    </span>
                  );
                }

                const isActive = pageNum === currentPage;
                return (
                  <motion.button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[40px]
                      ${isActive
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'border border-slate-300 hover:bg-slate-50 text-slate-700'
                      }
                      ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    whileHover={!loading ? { scale: 1.05 } : {}}
                    whileTap={!loading ? { scale: 0.95 } : {}}
                  >
                    {pageNum}
                  </motion.button>
                );
              })}
            </div>

            {/* Next Page */}
            {showQuickNav && (
              <motion.button
                onClick={goToNextPage}
                disabled={!hasNextPage || loading}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: hasNextPage ? 1.05 : 1 }}
                whileTap={{ scale: hasNextPage ? 0.95 : 1 }}
                title="Next page"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </motion.button>
            )}

            {/* Last Page */}
            {showQuickNav && (
              <motion.button
                onClick={goToLastPage}
                disabled={!hasNextPage || loading}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: hasNextPage ? 1.05 : 1 }}
                whileTap={{ scale: hasNextPage ? 0.95 : 1 }}
                title="Last page"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronsRight className="w-4 h-4" />
                )}
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading {serverName} data...</span>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {showPageSizeDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowPageSizeDropdown(false)}
        ></div>
      )}
    </div>
  );
};

export default ServerPagination;