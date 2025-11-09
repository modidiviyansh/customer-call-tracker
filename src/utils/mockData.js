// Mock data for development when Supabase is not connected
export const mockCustomers = [
  {
    id: '1',
    name: 'John Smith',
    mobile_number: '+1-555-0101',
    address_details: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    mobile_number: '+1-555-0102',
    address_details: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210'
    },
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z'
  },
  {
    id: '3',
    name: 'Mike Wilson',
    mobile_number: '+1-555-0103',
    address_details: {
      street: '789 Pine Rd',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601'
    },
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z'
  },
  {
    id: '4',
    name: 'Emily Davis',
    mobile_number: '+1-555-0104',
    address_details: {
      street: '321 Elm St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001'
    },
    created_at: '2024-01-15T13:00:00Z',
    updated_at: '2024-01-15T13:00:00Z'
  },
  {
    id: '5',
    name: 'Robert Brown',
    mobile_number: '+1-555-0105',
    address_details: {
      street: '654 Maple Dr',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001'
    },
    created_at: '2024-01-15T14:00:00Z',
    updated_at: '2024-01-15T14:00:00Z'
  }
];

export const mockCallLogs = [
  {
    id: '1',
    customer_id: '1',
    agent_pin: '2342',
    call_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    next_call_date: new Date().toISOString().split('T')[0], // Today
    call_status: 'follow_up',
    remarks: 'Customer interested in premium package. Follow up required for demo scheduling.',
    outcome_score: 8,
    call_duration_seconds: 300,
    created_at: '2024-01-15T15:00:00Z',
    updated_at: '2024-01-15T15:00:00Z',
    fcm_customer: {
      id: '1',
      name: 'John Smith'
    }
  },
  {
    id: '2',
    customer_id: '2',
    agent_pin: '2342',
    call_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    next_call_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    call_status: 'completed',
    remarks: 'Successful call. Product demo scheduled for next week. Customer very interested.',
    outcome_score: 9,
    call_duration_seconds: 480,
    created_at: '2024-01-15T16:00:00Z',
    updated_at: '2024-01-15T16:00:00Z',
    fcm_customer: {
      id: '2',
      name: 'Sarah Johnson'
    }
  },
  {
    id: '3',
    customer_id: '3',
    agent_pin: '2342',
    call_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    next_call_date: new Date().toISOString().split('T')[0], // Today
    call_status: 'no_answer',
    remarks: 'No answer. Customer may be busy. Try again later in the day.',
    outcome_score: 3,
    call_duration_seconds: 30,
    created_at: '2024-01-15T17:00:00Z',
    updated_at: '2024-01-15T17:00:00Z',
    fcm_customer: {
      id: '3',
      name: 'Mike Wilson'
    }
  },
  {
    id: '4',
    customer_id: '4',
    agent_pin: '2342',
    call_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    next_call_date: new Date().toISOString().split('T')[0], // Today
    call_status: 'follow_up',
    remarks: 'Follow-up call scheduled. Customer requested callback about pricing options.',
    outcome_score: 7,
    call_duration_seconds: 420,
    created_at: '2024-01-15T18:00:00Z',
    updated_at: '2024-01-15T18:00:00Z',
    fcm_customer: {
      id: '4',
      name: 'Emily Davis'
    }
  },
  {
    id: '5',
    customer_id: '5',
    agent_pin: '2342',
    call_date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    next_call_date: null,
    call_status: 'busy',
    remarks: 'Customer was busy. Will try again tomorrow.',
    outcome_score: 4,
    call_duration_seconds: 60,
    created_at: '2024-01-15T19:00:00Z',
    updated_at: '2024-01-15T19:00:00Z',
    fcm_customer: {
      id: '5',
      name: 'Robert Brown'
    }
  }
];

// Debug logging utility
export const debugLog = (component, action, data = null, isError = false) => {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${component}: ${action}`;
  
  if (isError) {
    console.error(`🔴 ERROR ${message}`, data);
  } else {
    console.log(`🟢 LOG ${message}`, data);
  }
};

// Simulate network delay for realistic UX
export const simulateNetworkDelay = (min = 500, max = 1500) => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Mock API functions that return data with simulated network delay
export const mockApi = {
  async getCustomers() {
    debugLog('MockAPI', 'Getting customers');
    await simulateNetworkDelay();
    return { data: mockCustomers, error: null };
  },

  async getCallLogs(filters = {}) {
    debugLog('MockAPI', 'Getting call logs', filters);
    await simulateNetworkDelay();
    
    let filteredLogs = [...mockCallLogs];
    
    if (filters.agent_pin) {
      filteredLogs = filteredLogs.filter(log => log.agent_pin === filters.agent_pin);
    }
    
    if (filters.today) {
      const today = new Date().toISOString().split('T')[0];
      filteredLogs = filteredLogs.filter(log => 
        log.call_date.startsWith(today) || log.next_call_date === today
      );
    }
    
    if (filters.next_reminder_date) {
      filteredLogs = filteredLogs.filter(log => 
        log.next_call_date === filters.next_reminder_date
      );
    }
    
    return { data: filteredLogs, error: null };
  },

  async createCallLog(callData) {
    debugLog('MockAPI', 'Creating call log', callData);
    await simulateNetworkDelay();
    
    const newLog = {
      id: (mockCallLogs.length + 1).toString(),
      ...callData,
      call_date: callData.call_date || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fcm_customer: mockCustomers.find(c => c.id === callData.customer_id)
    };
    
    mockCallLogs.push(newLog);
    return { data: newLog, error: null };
  },

  async updateCallLog(id, updates) {
    debugLog('MockAPI', 'Updating call log', { id, updates });
    await simulateNetworkDelay();
    
    const index = mockCallLogs.findIndex(log => log.id === id);
    if (index !== -1) {
      mockCallLogs[index] = {
        ...mockCallLogs[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      return { data: mockCallLogs[index], error: null };
    }
    
    return { data: null, error: { message: 'Call log not found' } };
  }
};