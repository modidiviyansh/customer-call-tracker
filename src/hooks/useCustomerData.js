import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { mockApi, debugLog } from '../utils/mockData';
import { usePinAuth } from './usePinAuth';

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated } = usePinAuth();

  const fetchCustomers = async (query = '') => {
    if (!isAuthenticated) return;

    setLoading(true);
    debugLog('useCustomers', 'Fetching customers', { authenticated: isAuthenticated, query });

    try {
      // Try Supabase first
      let supabaseQuery = supabase
        .from('fcm_customers')
        .select(`
          id,
          name,
          mobile_number,
          address_details,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      // Apply search filter if query provided
      if (query.trim()) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,mobile_number.ilike.%${query}%`);
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;
      setCustomers(data || []);
      debugLog('useCustomers', 'Successfully fetched from Supabase', { count: data?.length || 0, query });
    } catch (error) {
      console.warn('Supabase failed, using mock data:', error);
      debugLog('useCustomers', 'Supabase failed, using mock data', error, true);

      // Fallback to mock data
      try {
        const { data: mockData, error: mockError } = await mockApi.getCustomers();
        if (mockError) throw mockError;

        // Filter mock data if query provided
        let filteredData = mockData;
        if (query.trim()) {
          const lowerQuery = query.toLowerCase();
          filteredData = mockData.filter(customer =>
            customer.name.toLowerCase().includes(lowerQuery) ||
            customer.mobile_number.toLowerCase().includes(lowerQuery)
          );
        }

        setCustomers(filteredData);
        debugLog('useCustomers', 'Successfully fetched from mock data', { count: filteredData?.length || 0, query });
      } catch (mockError) {
        console.error('Mock data also failed:', mockError);
        debugLog('useCustomers', 'Mock data failed', mockError, true);
        setCustomers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [isAuthenticated]);

  const createCustomer = async (customerData) => {
    try {
      const { data, error } = await supabase
        .from('fcm_customers')
        .insert([{
          name: customerData.name,
          mobile_number: customerData.mobile,
          address_details: customerData.address_details || null,
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchCustomers();
      return { data, error: null };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { data: null, error };
    }
  };

  const updateCustomer = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('fcm_customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchCustomers();
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
      await fetchCustomers();
      return { error: null };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return { error };
    }
  };

  return {
    customers,
    loading,
    searchQuery,
    setSearchQuery,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};

// Helper function to categorize calls
export const categorizeCalls = (calls) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const next3Days = new Date(today);
  next3Days.setDate(today.getDate() + 3);
  
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);

  const categorized = {
    today: [],
    next3Days: [],
    next7Days: [],
    overdue: [],
    all: calls || []
  };

  (calls || []).forEach(call => {
    if (!call.next_call_date) return;
    
    const nextCallDate = new Date(call.next_call_date);
    nextCallDate.setHours(0, 0, 0, 0);
    
    if (nextCallDate.getTime() === today.getTime()) {
      categorized.today.push(call);
    } else if (nextCallDate > today && nextCallDate <= next3Days) {
      categorized.next3Days.push(call);
    } else if (nextCallDate > next3Days && nextCallDate <= next7Days) {
      categorized.next7Days.push(call);
    } else if (nextCallDate < today) {
      categorized.overdue.push(call);
    }
  });

  // Sort all categories by next_call_date
  Object.keys(categorized).forEach(key => {
    if (key !== 'all') {
      categorized[key].sort((a, b) =>
        new Date(a.next_call_date).getTime() - new Date(b.next_call_date).getTime()
      );
    }
  });

  return categorized;
};

export const useCallRecords = () => {
  const [callRecords, setCallRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = usePinAuth();

  // Helper function to deduplicate records by customer, keeping only the latest
  const getLatestRecordsByCustomer = (records) => {
    if (!records || !Array.isArray(records)) return [];
    
    const customerMap = new Map();
    
    // Group by customer_id and keep the most recent record
    records.forEach(record => {
      const customerId = record.customer_id;
      if (!customerId) return;
      
      const existingRecord = customerMap.get(customerId);
      if (!existingRecord || new Date(record.call_date) > new Date(existingRecord.call_date)) {
        customerMap.set(customerId, record);
      }
    });
    
    return Array.from(customerMap.values());
  };

  const fetchCallRecords = async (filters = {}) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    debugLog('useCallRecords', 'Fetching call records', { filters, authenticated: isAuthenticated });
    
    try {
      // Try Supabase first
      let query = supabase
        .from('fcm_call_logs')
        .select(`
          id,
          agent_pin,
          call_date,
          next_call_date,
          remarks,
          call_status,
          call_duration_seconds,
          outcome_score,
          created_at,
          updated_at,
          customer_id,
          fcm_customers (
            id,
            name,
            mobile_number
          )
        `)
        .order('call_date', { ascending: false });

      // Apply filters
      if (filters.agent_pin) {
        query = query.eq('agent_pin', filters.agent_pin);
      }
      if (filters.next_reminder_date) {
        query = query.eq('next_call_date', filters.next_reminder_date);
      }
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters.call_status) {
        query = query.eq('call_status', filters.call_status);
      }
      if (filters.today) {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('call_date', today);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let records = data || [];
      
      // If latest_only filter is set, deduplicate by customer
      if (filters.latest_only) {
        records = getLatestRecordsByCustomer(records);
      }
      
      setCallRecords(records);
      debugLog('useCallRecords', 'Successfully fetched from Supabase', {
        count: records?.length || 0,
        latest_only: filters.latest_only
      });
    } catch (error) {
      console.warn('Supabase failed, using mock data:', error);
      debugLog('useCallRecords', 'Supabase failed, using mock data', error, true);
      
      // Fallback to mock data
      try {
        const { data: mockData, error: mockError } = await mockApi.getCallLogs(filters);
        if (mockError) throw mockError;
        
        let records = mockData || [];
        
        // If latest_only filter is set, deduplicate by customer
        if (filters.latest_only) {
          records = getLatestRecordsByCustomer(records);
        }
        
        setCallRecords(records);
        debugLog('useCallRecords', 'Successfully fetched from mock data', {
          count: records?.length || 0,
          latest_only: filters.latest_only
        });
      } catch (mockError) {
        console.error('Mock data also failed:', mockError);
        debugLog('useCallRecords', 'Mock data failed', mockError, true);
        setCallRecords([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const createCallRecord = async (callData) => {
    try {
      const { data, error } = await supabase
        .from('fcm_call_logs')
        .insert([{
          customer_id: callData.customer_id,
          agent_pin: callData.agent_pin,
          call_date: callData.call_date || new Date().toISOString(),
          next_call_date: callData.next_call_date || null,
          remarks: callData.remarks || null,
          call_status: callData.call_status,
          call_duration_seconds: callData.call_duration_seconds || null,
          outcome_score: callData.outcome_score || null,
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchCallRecords();
      return { data, error: null };
    } catch (error) {
      console.error('Error creating call record:', error);
      return { data: null, error };
    }
  };

  const updateCallRecord = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('fcm_call_logs')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchCallRecords();
      return { data, error: null };
    } catch (error) {
      console.error('Error updating call record:', error);
      return { data: null, error };
    }
  };

  return {
    callRecords,
    loading,
    fetchCallRecords,
    createCallRecord,
    updateCallRecord,
  };
};

export const useDashboardStats = (agentPin) => {
  const [stats, setStats] = useState({
    totalCalls: 0,
    todaysCalls: 0,
    todaysReminders: 0,
    callStatusBreakdown: {},
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (!agentPin) return;
    
    setLoading(true);
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch all call records for this agent
      const { data, error } = await supabase
        .from('fcm_call_logs')
        .select('call_date, next_call_date, call_status')
        .eq('agent_pin', agentPin);

      if (error) throw error;

      // Calculate stats
      const totalCalls = data?.length || 0;
      const todaysCalls = data?.filter(record =>
        record.call_date.startsWith(today)
      ).length || 0;
      const todaysReminders = data?.filter(record =>
        record.next_call_date === today
      ).length || 0;

      // Calculate call status breakdown
      const callStatusBreakdown = data?.reduce((acc, record) => {
        acc[record.call_status] = (acc[record.call_status] || 0) + 1;
        return acc;
      }, {}) || {};

      setStats({
        totalCalls,
        todaysCalls,
        todaysReminders,
        callStatusBreakdown,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [agentPin]);

  return {
    stats,
    loading,
    refreshStats: fetchStats,
  };
};