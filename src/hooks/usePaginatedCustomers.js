import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { mockApi, debugLog } from '../utils/mockData';
import { usePinAuth } from './usePinAuth';

// Environment variable to control mock data usage
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

/**
 * Advanced Server-Side Pagination Hook for Supabase
 * Handles large datasets efficiently with proper count queries
 */
export const usePaginatedCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  const { isAuthenticated } = usePinAuth();

  // Debounce search queries to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // Calculate pagination values
  const paginationInfo = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;
    
    return {
      startIndex,
      endIndex,
      hasNextPage,
      hasPreviousPage,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages
    };
  }, [currentPage, pageSize, totalCount, totalPages]);

  /**
   * Fetch customers with server-side pagination and accurate counting
   */
  const fetchCustomers = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching customers:', {
        page: currentPage,
        pageSize,
        search: debouncedSearchQuery,
        authenticated: isAuthenticated
      });

      // Build the base query
      let query = supabase
        .from('fcm_customers')
        .select(`
          id,
          name,
          mobile1,
          mobile2,
          mobile3,
          address_details,
          created_at,
          updated_at
        `, { count: 'exact' });

      // Apply search filter if query provided - search across name and all mobile numbers
      if (debouncedSearchQuery.trim()) {
        const searchTerm = `%${debouncedSearchQuery}%`;
        query = query.or(
          `name.ilike.${searchTerm},mobile1.ilike.${searchTerm},mobile2.ilike.${searchTerm},mobile3.ilike.${searchTerm}`
        );
      }

      // Apply ordering
      query = query.order('created_at', { ascending: false });

      // Apply pagination (server-side)
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      console.log('📡 Executing Supabase query:', { from, to });

      const { data, error: supabaseError, count } = await query;

      if (supabaseError) {
        throw supabaseError;
      }

      // Update state with server-side data
      setCustomers(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));

      console.log('✅ Supabase query successful:', {
        received: data?.length || 0,
        total: count || 0,
        page: currentPage,
        totalPages: Math.ceil((count || 0) / pageSize)
      });

      debugLog('usePaginatedCustomers', 'Successfully fetched from Supabase', {
        count: data?.length || 0,
        totalCount: count || 0,
        currentPage,
        searchQuery: debouncedSearchQuery
      });

    } catch (error) {
      console.error('❌ Supabase connection failed:', error.message);
      console.log('🔧 USE_MOCK_DATA setting:', USE_MOCK_DATA);
      
      if (USE_MOCK_DATA) {
        console.warn('🔄 Supabase failed, falling back to mock data as requested');
        // Inline mock data fallback logic
        try {
          const { data: mockData, error: mockError } = await mockApi.getCustomers();
          if (mockError) throw mockError;

          // Transform mock data to new format if needed (mobile_number -> mobile1)
          const transformedData = mockData.map(customer => ({
            ...customer,
            mobile1: customer.mobile_number || customer.mobile1,
            mobile2: customer.mobile2 || null,
            mobile3: customer.mobile3 || null
          }));

          // Filter mock data if query provided
          let filteredData = transformedData;
          if (debouncedSearchQuery.trim()) {
            const lowerQuery = debouncedSearchQuery.toLowerCase();
            filteredData = transformedData.filter(customer =>
              customer.name.toLowerCase().includes(lowerQuery) ||
              (customer.mobile1 && customer.mobile1.toLowerCase().includes(lowerQuery)) ||
              (customer.mobile2 && customer.mobile2.toLowerCase().includes(lowerQuery)) ||
              (customer.mobile3 && customer.mobile3.toLowerCase().includes(lowerQuery))
            );
          }

          // Apply client-side pagination to mock data
          const from = (currentPage - 1) * pageSize;
          const to = from + pageSize;
          const paginatedData = filteredData.slice(from, to);

          setCustomers(paginatedData);
          setTotalCount(filteredData.length);
          setTotalPages(Math.ceil(filteredData.length / pageSize));

          debugLog('usePaginatedCustomers', 'Successfully fetched from mock data', {
            count: paginatedData?.length || 0,
            totalCount: filteredData.length,
            currentPage,
            searchQuery: debouncedSearchQuery
          });
        } catch (mockError) {
          console.error('Mock data also failed:', mockError);
          setError(mockError.message);
          setCustomers([]);
          setTotalCount(0);
          setTotalPages(0);
          debugLog('usePaginatedCustomers', 'Mock data fallback failed', mockError, true);
        }
      } else {
        console.warn('🛑 Supabase failed, mock data disabled - showing error state');
        setError(error.message);
        setCustomers([]);
        setTotalCount(0);
        setTotalPages(0);
        debugLog('usePaginatedCustomers', 'Supabase failed, mock data disabled', error, true);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentPage, pageSize, debouncedSearchQuery]);



  // Fetch data when dependencies change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  /**
   * Navigation methods
   */
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  }, [currentPage, totalPages]);

  const nextPage = useCallback(() => {
    if (paginationInfo.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationInfo.hasNextPage]);

  const previousPage = useCallback(() => {
    if (paginationInfo.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationInfo.hasPreviousPage]);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  /**
   * Page size change handler
   */
  const changePageSize = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  /**
   * Search handlers
   */
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
  }, []);

  /**
   * Refresh data
   */
  const refresh = useCallback(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // CRUD operations
  const createCustomer = async (customerData) => {
    try {
      const insertData = {
        name: customerData.name,
        mobile1: customerData.mobile1,
        mobile2: customerData.mobile2 || null,
        mobile3: customerData.mobile3 || null,
        address_details: customerData.address_details || null,
      };

      const { data, error } = await supabase
        .from('fcm_customers')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      await refresh(); // Refresh to get updated data
      return { data, error: null };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { data: null, error };
    }
  };

  const updateCustomer = async (id, updates) => {
    try {
      const { mobile1, mobile2, mobile3, ...otherUpdates } = updates;
      
      const updateData = {
        ...otherUpdates,
        updated_at: new Date().toISOString(),
      };

      if (mobile1 !== undefined) updateData.mobile1 = mobile1;
      if (mobile2 !== undefined) updateData.mobile2 = mobile2 || null;
      if (mobile3 !== undefined) updateData.mobile3 = mobile3 || null;

      const { data, error } = await supabase
        .from('fcm_customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await refresh(); // Refresh to get updated data
      return { data, error: null };
    } catch (error) {
      console.error('Error updating customer:', error);
      return { data: null, error };
    }
  };

  const deleteCustomer = async (id) => {
    try {
      const { error } = await supabase
        .from('fcm_customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await refresh(); // Refresh to get updated data
      return { error: null };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return { error };
    }
  };

  return {
    // Data
    customers,
    loading,
    error,
    
    // Pagination state
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    paginationInfo,
    
    // Navigation
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    changePageSize,
    
    // Search
    searchQuery,
    handleSearch,
    clearSearch,
    
    // Actions
    refresh,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};

// Export the original hook for backward compatibility
export const useCustomers = usePaginatedCustomers;