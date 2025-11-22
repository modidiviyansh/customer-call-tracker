// Mock data for development when Supabase is not connected

// Data generators for realistic mock data
const firstNames = [
  'Amit', 'Priya', 'Rajesh', 'Sunita', 'Vikram', 'Anjali', 'Suresh', 'Meera', 'Arun', 'Kavita',
  'Rahul', 'Poonam', 'Deepak', 'Rekha', 'Sanjay', 'Neha', 'Manoj', 'Kiran', 'Ravi', 'Shweta',
  'Vivek', 'Anita', 'Prakash', 'Sarika', 'Ashok', 'Geeta', 'Rakesh', 'Madhuri', 'Vinod', 'Lata',
  'Sachin', 'Komal', 'Naveen', 'Ritu', 'Ajay', 'Pallavi', 'Rohit', 'Sneha', 'Alok', 'Manju',
  'Karan', 'Divya', 'Sandeep', 'Archana', 'Gaurav', 'Preeti', 'Harish', 'Kusum', 'Mahesh', 'Seema'
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Jain', 'Agarwal', 'Yadav', 'Chauhan',
  'Mishra', 'Tiwari', 'Pandey', 'Dubey', 'Trivedi', 'Chaturvedi', 'Saxena', 'Bhatnagar', 'Mathur', 'Garg',
  'Joshi', 'Shukla', 'Mittal', 'Khanna', 'Kapoor', 'Malhotra', 'Chopra', 'Bansal', 'Goel', 'Arora',
  'Mehra', 'Sodhi', 'Bedi', 'Kohli', 'Dhawan', 'Gill', 'Kaur', 'Sharma', 'Verma', 'Gupta',
  'Singh', 'Kumar', 'Patel', 'Jain', 'Agarwal', 'Yadav', 'Chauhan', 'Mishra', 'Tiwari', 'Pandey'
];

const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Hyderabad',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad',
  'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Dombivli', 'Vasai', 'Varanasi',
  'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Jabalpur', 'Gwalior',
  'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli', 'Bareilly'
];

const states = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Andhra Pradesh',
  'Punjab', 'Haryana', 'Bihar', 'Jharkhand', 'Odisha', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh', 'Jammu and Kashmir', 'Goa'
];

const streetNames = [
  'MG Road', 'Brigade Road', 'Park Street', 'Mount Road', 'Commercial Street', 'Residency Road', 'Jubilee Hills', 'Banjara Hills',
  'Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Nehru Place', 'Rajouri Garden', 'Punjabi Bagh', 'Paschim Vihar',
  'Ashok Nagar', 'Mayur Vihar', 'Dwarka', 'Rohini', 'Pitampura', 'Shalimar Bagh', 'Civil Lines', 'Gandhi Nagar',
  'Model Town', 'Lawrence Road', 'Mall Road', 'The Mall', 'Charminar Road', 'Abids Road', 'Nampally Road'
];

const remarks = [
  'Customer interested in premium package. Follow up required for demo scheduling.',
  'Successful call. Product demo scheduled for next week. Customer very interested.',
  'No answer. Customer may be busy. Try again later in the day.',
  'Follow-up call scheduled. Customer requested callback about pricing options.',
  'Customer was busy. Will try again tomorrow.',
  'Interested in our services. Requested detailed brochure and pricing information.',
  'Call completed successfully. Customer agreed to proceed with the application.',
  'Customer not interested at this time. Added to cold list.',
  'Left voicemail. Waiting for callback regarding loan application.',
  'Customer has questions about interest rates. Need to provide detailed explanation.',
  'Successfully converted lead. Customer ready to sign agreement.',
  'Customer requested more time to decide. Follow up in 3 days.',
  'Wrong number. Customer disconnected.',
  'Customer already has similar service. Not interested.',
  'Call dropped due to poor network. Need to retry.',
  'Customer interested but budget constraints. Offered flexible payment plan.',
  'Successfully explained product benefits. Customer scheduled for next visit.',
  'Customer has existing commitments. Will consider our offer later.',
  'Call completed. Customer needs to discuss with family before deciding.',
  'Successfully addressed all concerns. Customer ready to proceed.'
];

// Generate random date within last 30 days
const getRandomDate = (daysBack = 30) => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - (Math.random() * daysBack * 24 * 60 * 60 * 1000));
  return pastDate.toISOString();
};

// Generate random future date within next 7 days
const getRandomFutureDate = (maxDays = 7) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (Math.random() * maxDays * 24 * 60 * 60 * 1000));
  return futureDate.toISOString().split('T')[0];
};

// Generate random mobile number
const getRandomMobile = (base = 9876543210) => {
  const randomNum = Math.floor(Math.random() * 100000000) + base;
  return `+91${randomNum.toString().slice(-10)}`;
};

// Generate random PIN code
const getRandomPin = () => {
  return Math.floor(Math.random() * 900000) + 100000;
};

// Generate comprehensive mock customers
export const mockCustomers = Array.from({ length: 150 }, (_, index) => {
  const id = (index + 1).toString();
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];
  const street = `${Math.floor(Math.random() * 500) + 1} ${streetNames[Math.floor(Math.random() * streetNames.length)]}`;

  // Generate 1-3 mobile numbers randomly
  const mobileCount = Math.floor(Math.random() * 3) + 1;
  const mobiles = [];
  for (let i = 0; i < mobileCount; i++) {
    mobiles.push(getRandomMobile(9876543210 + index * 10 + i));
  }

  return {
    id,
    name,
    mobile1: mobiles[0],
    mobile2: mobiles[1] || null,
    mobile3: mobiles[2] || null,
    address_details: {
      street,
      city,
      state,
      zipCode: getRandomPin().toString()
    },
    created_at: getRandomDate(60),
    updated_at: getRandomDate(30)
  };
});

// Call status options with realistic distribution
const callStatuses = [
  { status: 'completed', weight: 35, avgDuration: 480, avgScore: 8 },
  { status: 'follow_up', weight: 25, avgDuration: 360, avgScore: 7 },
  { status: 'no_answer', weight: 20, avgDuration: 30, avgScore: 2 },
  { status: 'busy', weight: 10, avgDuration: 45, avgScore: 3 },
  { status: 'invalid', weight: 5, avgDuration: 15, avgScore: 1 },
  { status: 'not_interested', weight: 5, avgDuration: 120, avgScore: 2 }
];

// Generate comprehensive mock call logs
export const mockCallLogs = Array.from({ length: 300 }, (_, index) => {
  const id = (index + 1).toString();

  // Randomly select customer
  const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
  const customerId = customer.id;

  // Random call status based on weights
  const randomWeight = Math.random() * 100;
  let cumulativeWeight = 0;
  let selectedStatus = callStatuses[0];
  for (const status of callStatuses) {
    cumulativeWeight += status.weight;
    if (randomWeight <= cumulativeWeight) {
      selectedStatus = status;
      break;
    }
  }

  // Generate realistic call date (last 30 days)
  const callDate = getRandomDate(30);

  // Generate next call date based on status
  let nextCallDate = null;
  if (selectedStatus.status === 'follow_up' || selectedStatus.status === 'no_answer' || selectedStatus.status === 'busy') {
    nextCallDate = getRandomFutureDate(7);
  } else if (Math.random() < 0.3) { // 30% chance of future reminder even for completed calls
    nextCallDate = getRandomFutureDate(14);
  }

  // Generate duration and score based on status
  const durationVariation = (Math.random() - 0.5) * 0.4; // ±20% variation
  const scoreVariation = Math.floor((Math.random() - 0.5) * 4); // ±2 variation

  const callDuration = Math.max(15, Math.floor(selectedStatus.avgDuration * (1 + durationVariation)));
  const outcomeScore = Math.max(1, Math.min(10, selectedStatus.avgScore + scoreVariation));

  // Select random remark
  const remark = remarks[Math.floor(Math.random() * remarks.length)];

  // Select which mobile number was called (if customer has multiple)
  const availableMobiles = [customer.mobile1, customer.mobile2, customer.mobile3].filter(m => m);
  const calledMobile = availableMobiles[Math.floor(Math.random() * availableMobiles.length)];

  return {
    id,
    customer_id: customerId,
    agent_pin: '2342', // Default agent PIN
    call_date: callDate,
    next_call_date: nextCallDate,
    call_status: selectedStatus.status,
    remarks: remark,
    outcome_score: outcomeScore,
    call_duration_seconds: callDuration,
    called_mobile_number: calledMobile,
    created_at: callDate,
    updated_at: callDate,
    fcm_customers: {
      id: customer.id,
      name: customer.name,
      mobile1: customer.mobile1,
      mobile2: customer.mobile2,
      mobile3: customer.mobile3
    }
  };
});

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

    if (filters.customer_id) {
      filteredLogs = filteredLogs.filter(log => log.customer_id === filters.customer_id);
    }

    if (filters.call_status) {
      filteredLogs = filteredLogs.filter(log => log.call_status === filters.call_status);
    }

    // Sort by call_date descending (most recent first)
    filteredLogs.sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime());

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