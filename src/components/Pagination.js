/**
 * REUSABLE PAGINATION COMPONENT
 * 
 * Features:
 * - 20 items per page (mobile-optimized)
 * - Debounced search integration
 * - Consistent UX patterns
 * - Touch-friendly controls
 * - Configurable page sizes
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';

const Pagination = ({
  data = [],
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showSearch = false,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  searchDebounceMs = 300,
  showInfo = true,
  className = "",
  loading = false,
  emptyMessage = "No data available",
  showJumpToPage = true,
  maxVisiblePages = 7
}) => {
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [jumpToPage, setJumpToPage] = useState('');

  // Calculate pagination values
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;


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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage && onPageChange) {
      onPageChange(newPage);
    }
  };

  const handlePageSizeChange = (newSize) => {
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
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

  // Generate page numbers for display
  const getPageNumbers = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const half = Math.floor(maxVisiblePages / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
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

  if (totalItems === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-slate-500">{emptyMessage}</p>
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
      {/* Search and Controls */}
      {(showSearch || showPageSizeSelector || showJumpToPage) && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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
          <div className="flex items-center gap-4">
            {/* Page Size Selector */}
            {showPageSizeSelector && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Show:</label>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                  className="border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-slate-600">per page</span>
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
          </div>
        </div>
      )}

      {/* Info */}
      {showInfo && (
        <div className="text-sm text-slate-600 text-center">
          Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
          <span className="font-medium">{endIndex}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
          {totalPages > 1 && (
            <span className="ml-2">
              (Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>)
            </span>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1">
            {/* First Page */}
            <motion.button
              onClick={() => handlePageChange(1)}
              disabled={!hasPreviousPage || loading}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: hasPreviousPage ? 1.05 : 1 }}
              whileTap={{ scale: hasPreviousPage ? 0.95 : 1 }}
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </motion.button>

            {/* Previous Page */}
            <motion.button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPreviousPage || loading}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: hasPreviousPage ? 1.05 : 1 }}
              whileTap={{ scale: hasPreviousPage ? 0.95 : 1 }}
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 mx-2">
              {getPageNumbers().map((pageNum, index) => {
                if (pageNum === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 py-1 text-slate-400">
                      ...
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
            <motion.button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage || loading}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: hasNextPage ? 1.05 : 1 }}
              whileTap={{ scale: hasNextPage ? 0.95 : 1 }}
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>

            {/* Last Page */}
            <motion.button
              onClick={() => handlePageChange(totalPages)}
              disabled={!hasNextPage || loading}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: hasNextPage ? 1.05 : 1 }}
              whileTap={{ scale: hasNextPage ? 0.95 : 1 }}
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-2">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-slate-600">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default Pagination;