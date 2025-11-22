import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Shield, Users, Phone, Clock, UserCheck, BarChart3, Calendar, Search, Plus, Edit, Trash2, X, PhoneCall, User, History, Upload } from 'lucide-react';
import { usePaginatedCustomers, useCallRecords, useDashboardStats } from '../hooks';
import { usePinAuth } from '../hooks/usePinAuth';
import { Reminders, CallDisposition, EnhancedCSVImport, SkeletonLoader, ToastContainer, useToast, ServerPagination, MobileNumberManager, CallNowDropdown } from '../components';
import { validateIndianPIN } from '../utils';

const Dashboard = ({ agentPin, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('customers');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDisposition, setShowDisposition] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [csvImportType, setCSVImportType] = useState('customers');
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    mobile1: '',
    mobile2: '',
    mobile3: '',
    address_details: { street: '', city: '', state: '', zipCode: '' }
  });
  const [formErrors, setFormErrors] = useState({});

  const { isAuthenticated } = usePinAuth();
  const { stats, loading: statsLoading, refreshStats } = useDashboardStats(agentPin);
  const { 
    customers, 
    loading: customersLoading, 
    error: customersError,
    searchQuery, 
    handleSearch, 
    clearSearch,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    goToPage,
    changePageSize,
    paginationInfo,
    refresh,
    createCustomer, 
    updateCustomer, 
    deleteCustomer 
  } = usePaginatedCustomers();
  const { callRecords, fetchCallRecords } = useCallRecords();
  const { toasts, success, removeToast } = useToast();

  console.log('Dashboard render - agentPin:', agentPin, 'isAuthenticated:', isAuthenticated);

  useEffect(() => {
    console.log('Dashboard useEffect triggered - isAuthenticated:', isAuthenticated, 'agentPin:', agentPin);
    if (isAuthenticated && agentPin) {
      console.log('Loading dashboard data...');
      // Set agent PIN in localStorage for component use
      localStorage.setItem('agent_pin', agentPin);

      // Load all data
      // For today's calls, show only the latest record per customer
      fetchCallRecords({ agent_pin: agentPin, today: true, latest_only: true });
      refreshStats();
    } else {
      console.log('Dashboard useEffect - conditions not met:', { isAuthenticated, agentPin });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, agentPin]);

  const handleCallInitiated = (callDetails) => {
    console.log('Call initiated:', callDetails);
    // You could add additional logging here if needed
  };

  const handleDispositionCustomer = (customer) => {
    // Show disposition modal for logging call
    setSelectedCustomer(customer);
    setShowDisposition(true);
  };

  const handleDispositionSubmit = () => {
    setShowDisposition(false);
    setSelectedCustomer(null);
    refreshStats();
    // For today's calls, show only the latest record per customer
    fetchCallRecords({ agent_pin: agentPin, today: true, latest_only: true });
  };

  const handleCallCustomer = (customer) => {
    // Initiate call to customer's primary mobile number
    if (customer && customer.mobile1) {
      const callUrl = `tel:${customer.mobile1}`;
      window.open(callUrl, '_self');
      handleCallInitiated({
        customerId: customer.id,
        customerName: customer.name,
        mobileNumber: customer.mobile1,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleSearchChange = (e) => {
    handleSearch(e.target.value);
  };

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      mobile1: '',
      mobile2: '',
      mobile3: '',
      address_details: { street: '', city: '', state: '', zipCode: '' }
    });
    setFormErrors({});
    setShowCustomerForm(true);
  };

  const handleViewProfile = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name || '',
      mobile1: customer.mobile1 || '',
      mobile2: customer.mobile2 || '',
      mobile3: customer.mobile3 || '',
      address_details: customer.address_details || {}
    });
    setShowCustomerProfile(true);
  };

  const handleEditFromProfile = () => {
    setShowCustomerProfile(false);
    setShowCustomerForm(true);
  };

  const handleViewCallHistory = (customer) => {
    setSelectedHistoryCustomer(customer);
    setShowCallHistory(true);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        const result = await deleteCustomer(customerId);
        if (result.error) {
          throw result.error;
        }
        success('Customer deleted successfully!');
      } catch (error) {
        console.error('Error deleting customer:', error);
        error('Error deleting customer. Please try again.');
      }
    }
  };

  const handleCSVImportSuccess = async (importType, importData) => {
    if (importType === 'customers') {
      // Import customers in batches to handle 1000+ entries
      const result = await importCustomersInBatches(importData);
      
      // Return proper result structure for EnhancedCSVImport tracking
      if (result.error) {
        return { 
          data: null, 
          error: { message: result.error.message || result.error.toString() } 
        };
      } else {
        return { 
          data: result.data, 
          error: null 
        };
      }
    } else {
      // Reminders are handled in the Reminders component
      console.log('Reminder import handled in Reminders component:', importType);
      return { data: null, error: null };
    }
  };

  const importCustomersInBatches = async (customers) => {
    // EnhancedCSVImport handles batching internally, but we still need to process the actual creation
    // This function is now called by EnhancedCSVImport for each batch or item
    
    // If we receive a single item or small batch from EnhancedCSVImport
    const batch = Array.isArray(customers) ? customers : [customers];
    
    try {
      const results = await Promise.all(
        batch.map(async (customer) => {
          const customerData = {
            name: customer.name,
            mobile1: customer.mobile1,
            mobile2: customer.mobile2,
            mobile3: customer.mobile3,
            address_details: customer.address_details || {}
          };
          
          const result = await createCustomer(customerData);
          if (result.error) {
            throw new Error(`Failed to create customer ${customer.name}: ${result.error.message}`);
          }
          return result.data;
        })
      );
      
      // Refresh customers list after successful import
      refresh();
      
      return { data: results, error: null };
    } catch (error) {
      console.error('Error importing customers:', error);
      return { data: null, error };
    }
  };

  const handleImportCSV = (type) => {
    setCSVImportType(type);
    setShowCSVImport(true);
  };

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!customerForm.name.trim()) {
      errors.name = 'Customer name is required';
    } else if (customerForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Mobile validation
    if (!customerForm.mobile1) {
      errors.mobile = 'Primary mobile number is required';
    }

    // PIN validation if provided
    if (customerForm.address_details?.zipCode && !validateIndianPIN(customerForm.address_details.zipCode)) {
      errors.zipCode = 'Please enter a valid 6-digit PIN code';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCustomerFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const customerData = {
      name: customerForm.name.trim(),
      mobile1: customerForm.mobile1,
      mobile2: customerForm.mobile2,
      mobile3: customerForm.mobile3,
      address_details: {
        ...customerForm.address_details,
        zipCode: customerForm.address_details.zipCode || undefined
      }
    };

    // Remove empty address fields
    Object.keys(customerData.address_details).forEach(key => {
      if (!customerData.address_details[key]) {
        delete customerData.address_details[key];
      }
    });

    // Create audit log entry for customer changes
  const auditLog = {
    customer_id: editingCustomer?.id,
    action: editingCustomer ? 'UPDATE' : 'CREATE',
    old_values: editingCustomer ? {
      name: editingCustomer.name,
      mobile1: editingCustomer.mobile1,
      mobile2: editingCustomer.mobile2,
      mobile3: editingCustomer.mobile3,
      address_details: editingCustomer.address_details
    } : null,
    new_values: customerData,
    changed_by: agentPin,
    change_reason: editingCustomer ? 'Customer profile updated' : 'New customer added'
  };

  try {
    let result;
    if (editingCustomer) {
      result = await updateCustomer(editingCustomer.id, customerData);
    } else {
      result = await createCustomer(customerData);
    }

    if (result.error) {
      throw result.error;
    }

    // Log the activity (in a real app, this would be saved to an audit table)
    console.log('Customer activity logged:', auditLog);

    // Success feedback
    success(editingCustomer ? 'Customer updated successfully!' : 'Customer added successfully!');

    setShowCustomerForm(false);
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      mobile1: '',
      mobile2: '',
      mobile3: '',
      address_details: { street: '', city: '', state: '', zipCode: '' }
    });
    setFormErrors({});
  } catch (error) {
    console.error('Error saving customer:', error);
    error('Error saving customer. Please try again.');
  }
};

  const tabs = [
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'reminders', label: 'Reminders', icon: Clock },
    { id: 'calls', label: 'Today\'s Calls', icon: Phone },
    { id: 'logs', label: 'Activity Logs', icon: Calendar },
  ];

  const formatCallStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/25',
      no_answer: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-lg shadow-slate-500/25',
      busy: 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-lg shadow-orange-500/25',
      follow_up: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25',
      invalid: 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg shadow-red-500/25',
      not_interested: 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25',
    };
    return colors[status] || 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-lg shadow-slate-500/25';
  };

  const renderCustomers = () => {
    return (
      <div className="space-y-6">
        {/* Search and Add Customer */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search customers by name or mobile..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="input-luxury pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleImportCSV('customers')}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full px-3 py-2 sm:px-4 sm:py-3 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 flex items-center space-x-2 font-semibold min-h-[44px] text-xs sm:text-sm touch-manipulation"
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Import</span>
            </button>
            <button
              onClick={handleCreateCustomer}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full px-4 py-2 sm:px-6 sm:py-3 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 flex items-center space-x-2 font-semibold min-h-[44px] text-sm sm:text-base touch-manipulation"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Pagination Controls (Top) */}
        {customers.length > 0 && (
          <ServerPagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
            showSearch={false}
            showInfo={true}
            loading={customersLoading}
            serverName="Supabase"
          />
        )}

        {/* Customers List */}
        <div className="space-y-4">
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                {searchQuery ? 'No customers found' : 'No customers yet'}
              </h3>
              <p className="text-slate-500">
                {searchQuery ? 'Try a different search term' : 'Start by adding your first customer'}
              </p>
            </div>
          ) : (
            customers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
                className="glass-card-gradient p-4 hover:scale-105 transition-all duration-300 shadow-gradient"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {customer.name}
                      </h3>
                      <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {customer.mobile1}
                        {customer.mobile2 && <span className="ml-1 text-xs text-slate-400">+{customer.mobile2 ? 1 : 0} more</span>}
                      </span>
                    </div>

                    <div className="text-sm text-slate-600 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span>Added: {new Date(customer.created_at).toLocaleDateString()}</span>
                      </div>
                      {customer.address_details && (
                        <>
                          {customer.address_details.street && (
                            <div>{customer.address_details.street}</div>
                          )}
                          {customer.address_details.city && customer.address_details.state && (
                            <div>{customer.address_details.city}, {customer.address_details.state}</div>
                          )}
                          {customer.address_details.zipCode && (
                            <div>{customer.address_details.zipCode}</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-3">
                    {/* Call Now Dropdown - Mobile optimized */}
                    <CallNowDropdown
                      customer={customer}
                      onCallInitiated={handleCallInitiated}
                    />

                    {/* Log Call Button - Mobile optimized */}
                    <motion.button
                      onClick={() => {
                        console.log('📝 Log Call clicked for:', customer.name);
                        handleDispositionCustomer(customer);
                      }}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full px-4 py-3 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 text-sm sm:text-base font-semibold flex items-center justify-center space-x-2 min-h-[48px] sm:min-h-[56px] touch-manipulation relative z-20 active:scale-95"
                      whileTap={{ scale: 0.95 }}
                      title="Log call disposition"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      >
                        <Phone className="w-5 h-5" />
                      </motion.div>
                      <span>Log Call</span>
                    </motion.button>

                    {/* Secondary Actions - Mobile optimized */}
                    <div className="flex justify-center space-x-2 pt-2">
                      <motion.button
                        onClick={() => handleViewProfile(customer)}
                        className="bg-white/90 backdrop-blur-lg rounded-full px-3 py-2 shadow-lg shadow-slate-500/10 hover:shadow-xl hover:shadow-slate-500/20 transition-all duration-300 text-xs sm:text-sm flex items-center space-x-1 text-slate-700 min-h-[40px] min-w-[40px] sm:min-h-[48px] sm:min-w-[48px] touch-manipulation"
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.95)" }}
                        whileTap={{ scale: 0.95 }}
                        title="View customer profile"
                      >
                        <User className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline font-medium">Profile</span>
                      </motion.button>
                      <motion.button
                        onClick={() => handleViewCallHistory(customer)}
                        className="bg-white/90 backdrop-blur-lg rounded-full px-3 py-2 shadow-lg shadow-slate-500/10 hover:shadow-xl hover:shadow-slate-500/20 transition-all duration-300 text-xs sm:text-sm flex items-center space-x-1 text-slate-700 min-h-[40px] min-w-[40px] sm:min-h-[48px] sm:min-w-[48px] touch-manipulation"
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.95)" }}
                        whileTap={{ scale: 0.95 }}
                        title="View call history"
                      >
                        <History className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline font-medium">History</span>
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="bg-white/90 backdrop-blur-lg rounded-full px-3 py-2 shadow-lg shadow-red-500/10 hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300 text-xs sm:text-sm flex items-center space-x-1 text-red-600 min-h-[40px] min-w-[40px] sm:min-h-[48px] sm:min-w-[48px] touch-manipulation"
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.95)" }}
                        whileTap={{ scale: 0.95 }}
                        title="Delete customer"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline font-medium">Delete</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination Controls (Bottom) */}
        {customers.length > 0 && (
          <ServerPagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
            showSearch={false}
            showInfo={false}
            loading={customersLoading}
            serverName="Supabase"
          />
        )}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="flex flex-col gap-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {statsLoading ? (
          <SkeletonLoader type="stats" count={4} />
        ) : (
          <>
            {/* Total Calls */}
            <motion.div
              className="glass-card-gradient p-3 sm:p-4 hover:scale-105 transition-all duration-300 shadow-gradient"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" />
                <div className="text-lg sm:text-xl font-bold text-primary-600">{stats.totalCalls}</div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-800">Total Calls</h3>
              <p className="text-slate-600 text-xs sm:text-sm">All-time record</p>
            </motion.div>

            {/* Today's Calls */}
            <motion.div
              className="glass-card-gradient p-3 sm:p-4 hover:scale-105 transition-all duration-300 shadow-gradient"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-secondary-500" />
                <div className="text-lg sm:text-xl font-bold text-secondary-600">{stats.todaysCalls}</div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-800">Today's Calls</h3>
              <p className="text-slate-600 text-xs sm:text-sm">Completed today</p>
            </motion.div>

            {/* Reminders */}
            <motion.div
              className="glass-card-gradient p-3 sm:p-4 hover:scale-105 transition-all duration-300 shadow-gradient"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-luxury-gold" />
                <div className="text-lg sm:text-xl font-bold text-luxury-gold">{stats.todaysReminders}</div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-800">Reminders</h3>
              <p className="text-slate-600 text-xs sm:text-sm">Due today</p>
            </motion.div>

            {/* Active Customers */}
            <motion.div
              className="glass-card-gradient p-3 sm:p-4 hover:scale-105 transition-all duration-300 shadow-gradient"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                <div className="text-lg sm:text-xl font-bold text-slate-600">{customers.length}</div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-800">Customers</h3>
              <p className="text-slate-600 text-xs sm:text-sm">Total in system</p>
            </motion.div>
          </>
        )}
      </div>

      {/* Call Status Breakdown */}
      <div className="glass-card-gradient p-4 hover:scale-105 transition-all duration-300 shadow-gradient">
        <h3 className="text-xl font-luxury font-semibold text-slate-800 mb-4">Call Status Overview</h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(stats.callStatusBreakdown).map(([status, count]) => (
            <div key={status} className="text-center">
              <div className={`px-3 py-2 rounded-full border text-sm font-medium ${getStatusColor(status)} hover:scale-105 transition-all duration-300 shadow-sm`}>
                {formatCallStatus(status)}
              </div>
              <div className="text-xl font-bold text-slate-800 mt-2">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTodaysCalls = () => (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-luxury font-semibold text-slate-800">Today's Call Activity</h2>
        <div className="text-lg text-slate-600 font-medium">
          {callRecords.length} call{callRecords.length !== 1 ? 's' : ''} logged
        </div>
      </div>

      {callRecords.length === 0 ? (
        <div className="text-center py-8">
          <Phone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No calls logged today</h3>
          <p className="text-base text-slate-500">Start calling customers to build your activity.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-y-4">
          {callRecords.map((record) => (
            <div
              key={record.id}
              className="glass-card-gradient p-3 sm:p-4 hover:scale-105 transition-all duration-300 shadow-gradient"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {record.fcm_customers?.name}
                    </h3>
                    <motion.span
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-semibold border-0
                        ${getStatusColor(record.call_status)}
                      `}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      {formatCallStatus(record.call_status)}
                    </motion.span>
                  </div>

                  <div className="flex flex-col gap-y-2 text-sm text-slate-600">
                    <div>Call time: {new Date(record.call_date).toLocaleTimeString()}</div>
                    {record.remarks && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-700">{record.remarks}</p>
                      </div>
                    )}
                    {record.next_call_date && (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <Calendar className="w-4 h-4" />
                        <span>Next reminder: {new Date(record.next_call_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <motion.button
                    onClick={() => {
                      console.log('🔄 Call Again clicked for:', record.fcm_customers?.name);
                      handleCallCustomer(record.fcm_customers);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full px-6 py-3 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 text-base font-semibold flex items-center space-x-3 min-h-[56px] touch-manipulation relative z-20 active:scale-95"
                    whileTap={{ scale: 0.95 }}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <PhoneCall className="w-5 h-5" />
                    </motion.div>
                    <span>Call Again</span>
                  </motion.button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );


  const renderActivityLogs = () => (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-luxury font-semibold text-slate-800">Activity Logs</h2>
        <div className="text-lg text-slate-600 font-medium">
          System activities and profile changes
        </div>
      </div>

      <div className="flex flex-col gap-y-4">
        {/* Customer Edit Logs */}
        <div className="glass-card-gradient p-4 hover:scale-105 transition-all duration-300 shadow-gradient">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Customer Profile Changes</h3>
          <div className="flex flex-col gap-y-3">
            {/* This would be populated from a customer_audit_logs table in a real implementation */}
            <div className="flex items-start space-x-3 p-3 bg-slate-50/80 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-lg text-slate-700">
                  <span className="font-medium">John Smith</span> - Mobile number updated from +91-9876543210 to +91-9876543211
                </p>
                <p className="text-sm text-slate-500 mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-slate-50/80 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-lg text-slate-700">
                  <span className="font-medium">Sarah Johnson</span> - Address updated: Added PIN code 110001
                </p>
                <p className="text-sm text-slate-500 mt-1">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Main Content */}
      <div className="w-full max-w-md mx-auto px-4 py-2">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Shield className="w-6 h-6 text-primary-500 animate-glow" />
            <h1 className="text-xl font-luxury font-semibold text-slate-800">
              Call Tracker Pro
            </h1>
          </div>
          <div className="text-lg text-slate-600 font-medium">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        </div>

        {/* Tab Navigation - Mobile Bottom Sticky */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-40 bg-glass/90 backdrop-blur-lg border-t shadow-xl flex"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="flex justify-around w-full p-2">
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => {
                    console.log('📱 Dashboard tab clicked:', tab.id);
                    setActiveTab(tab.id);
                  }}
                  className={`
                    relative flex flex-col items-center justify-center space-y-2 z-30
                    px-4 py-4 rounded-full font-semibold transition-all cursor-pointer select-none
                    min-h-[72px] min-w-[64px] w-full touch-manipulation active:scale-95
                    ${isActive
                      ? 'text-white shadow-lg'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                    }
                  `}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  style={{ pointerEvents: 'auto' }}
                  aria-label={`Navigate to ${tab.label} tab`}
                >
                  {/* Animated bubble background */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    initial={false}
                    animate={{
                      background: isActive
                        ? 'linear-gradient(135deg, #FFD700 0%, #09c6f9 100%)'
                        : 'transparent',
                      scale: isActive ? 1 : 0.9,
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />

                  {/* Icon with gradient fill when active */}
                  <motion.div
                    animate={{
                      color: isActive ? '#ffffff' : '#64748b',
                      filter: isActive ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.3))' : 'none'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <IconComponent className="w-6 h-6" />
                  </motion.div>

                  <motion.span
                    className="text-sm font-semibold"
                    animate={{
                      color: isActive ? '#ffffff' : '#64748b'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {tab.label}
                  </motion.span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="pb-20"
        >
          {activeTab === 'customers' && renderCustomers()}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'reminders' && <Reminders agentPin={agentPin} />}
          {activeTab === 'calls' && renderTodaysCalls()}
          {activeTab === 'logs' && renderActivityLogs()}
        </motion.div>
      </div>

      {/* Mobile Sign Out Button */}
      <motion.div
        className="fixed top-4 right-4 z-50 md:hidden"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
      >
        <motion.button
          onClick={onSignOut}
          className="bg-white/90 backdrop-blur-lg p-3 rounded-full shadow-lg border border-white/20 min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation"
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.95)" }}
          whileTap={{ scale: 0.95 }}
        >
          <LogOut className="w-5 h-5 text-slate-600" />
        </motion.button>
      </motion.div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Call Disposition Modal */}
      {showDisposition && selectedCustomer && (
        <CallDisposition
          customer={selectedCustomer}
          agentPin={agentPin}
          onClose={() => {
            setShowDisposition(false);
            setSelectedCustomer(null);
          }}
          onSubmit={handleDispositionSubmit}
        />
      )}

      {/* Customer Profile Modal */}
      {showCustomerProfile && editingCustomer && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl border border-white/20"
          >

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-luxury font-semibold text-slate-800">
                  Customer Profile
                </h2>
                <p className="text-slate-600">
                  View and manage customer information
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCustomerProfile(false);
                  setEditingCustomer(null);
                }}
                className="p-2 hover:bg-white/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Info Display */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-base font-semibold text-slate-800 mb-3">
                    Customer Name
                  </label>
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 min-h-[56px] flex items-center">
                    <p className="text-slate-800 font-medium text-lg">{editingCustomer.name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-slate-800 mb-3">
                    Mobile Numbers
                  </label>
                  <div className="space-y-2">
                    {editingCustomer.mobile1 && (
                      <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 min-h-[56px] flex items-center justify-between">
                        <p className="text-slate-800 font-medium text-lg">{editingCustomer.mobile1}</p>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Primary</span>
                      </div>
                    )}
                    {editingCustomer.mobile2 && (
                      <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 min-h-[56px] flex items-center justify-between">
                        <p className="text-slate-800 font-medium text-lg">{editingCustomer.mobile2}</p>
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">Secondary</span>
                      </div>
                    )}
                    {editingCustomer.mobile3 && (
                      <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 min-h-[56px] flex items-center justify-between">
                        <p className="text-slate-800 font-medium text-lg">{editingCustomer.mobile3}</p>
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">Tertiary</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-slate-800 mb-3">
                    Street Address
                  </label>
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 min-h-[56px] flex items-center">
                    <p className="text-slate-800 text-lg">{editingCustomer.address_details?.street || 'Not provided'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-semibold text-slate-800 mb-3">
                      City
                    </label>
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 min-h-[56px] flex items-center">
                      <p className="text-slate-800 text-lg">{editingCustomer.address_details?.city || 'Not provided'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-slate-800 mb-3">
                      State
                    </label>
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 min-h-[56px] flex items-center">
                      <p className="text-slate-800 text-lg">{editingCustomer.address_details?.state || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-slate-800 mb-3">
                    PIN Code
                  </label>
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 min-h-[56px] flex items-center">
                    <p className="text-slate-800 text-lg">{editingCustomer.address_details?.zipCode || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Customer Stats */}
              <div className="glass-card-gradient p-4 hover:scale-105 transition-all duration-300 shadow-gradient">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Customer Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {callRecords.filter(record => record.customer_id === editingCustomer.id).length}
                    </div>
                    <div className="text-sm text-slate-500">Total Calls</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {callRecords.filter(record =>
                        record.customer_id === editingCustomer.id &&
                        record.call_status === 'completed'
                      ).length}
                    </div>
                    <div className="text-sm text-slate-500">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {callRecords.filter(record =>
                        record.customer_id === editingCustomer.id &&
                        record.next_call_date
                      ).length}
                    </div>
                    <div className="text-sm text-slate-500">Follow-ups</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-600">
                      {new Date(editingCustomer.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-slate-500">Added</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                <motion.button
                  onClick={() => handleViewCallHistory(editingCustomer)}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full px-6 py-4 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 text-base font-semibold flex items-center justify-center space-x-3 min-h-[64px] touch-manipulation"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <History className="w-5 h-5" />
                  <span>View History</span>
                </motion.button>
                <motion.button
                  onClick={handleEditFromProfile}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full px-6 py-4 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 text-base font-semibold flex items-center justify-center space-x-3 min-h-[64px] touch-manipulation"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Edit className="w-5 h-5" />
                  <span>Edit Profile</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl border border-white/20"
          >

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-luxury font-semibold text-slate-800">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <p className="text-slate-600">
                  {editingCustomer ? 'Update customer information' : 'Enter customer details'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCustomerForm(false);
                  setEditingCustomer(null);
                  setCustomerForm({
                    name: '',
                    mobile1: '',
                    mobile2: '',
                    mobile3: '',
                    address_details: { street: '', city: '', state: '', zipCode: '' }
                  });
                  setFormErrors({});
                }}
                className="p-2 hover:bg-white/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleCustomerFormSubmit} className="space-y-6">
              {/* Customer Name */}
              <div>
                <label className="block text-base font-semibold text-slate-800 mb-3">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full p-4 rounded-xl border-2 bg-white/80 backdrop-blur-sm text-lg font-medium min-h-[56px] transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${formErrors.name ? 'border-red-500' : 'border-slate-300'}`}
                  placeholder="Enter customer name"
                  required
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{formErrors.name}</p>
                )}
              </div>

              {/* Mobile Numbers */}
              <div>
                <MobileNumberManager
                  customer={customerForm}
                  onUpdate={(updatedCustomer) => setCustomerForm(updatedCustomer)}
                  existingCustomers={customers}
                  disabled={false}
                />
                {formErrors.mobile && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{formErrors.mobile}</p>
                )}
              </div>

              {/* Address Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-base font-semibold text-slate-800 mb-3">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={customerForm.address_details?.street || ''}
                    onChange={(e) => setCustomerForm(prev => ({
                      ...prev,
                      address_details: {
                        ...prev.address_details,
                        street: e.target.value
                      }
                    }))}
                    className="w-full p-4 rounded-xl border-2 bg-white/80 backdrop-blur-sm text-lg min-h-[56px] transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-slate-300"
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-semibold text-slate-800 mb-3">
                      City
                    </label>
                    <input
                      type="text"
                      value={customerForm.address_details?.city || ''}
                      onChange={(e) => setCustomerForm(prev => ({
                        ...prev,
                        address_details: {
                          ...prev.address_details,
                          city: e.target.value
                        }
                      }))}
                      className="w-full p-4 rounded-xl border-2 bg-white/80 backdrop-blur-sm text-lg min-h-[56px] transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-slate-300"
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-slate-800 mb-3">
                      State
                    </label>
                    <input
                      type="text"
                      value={customerForm.address_details?.state || ''}
                      onChange={(e) => setCustomerForm(prev => ({
                        ...prev,
                        address_details: {
                          ...prev.address_details,
                          state: e.target.value
                        }
                      }))}
                      className="w-full p-4 rounded-xl border-2 bg-white/80 backdrop-blur-sm text-lg min-h-[56px] transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-slate-300"
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-slate-800 mb-3">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={customerForm.address_details?.zipCode || ''}
                    onChange={(e) => setCustomerForm(prev => ({
                      ...prev,
                      address_details: {
                        ...prev.address_details,
                        zipCode: e.target.value
                      }
                    }))}
                    className={`w-full p-4 rounded-xl border-2 bg-white/80 backdrop-blur-sm text-lg min-h-[56px] transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${formErrors.zipCode ? 'border-red-500' : 'border-slate-300'}`}
                    placeholder="110001"
                    maxLength="6"
                  />
                  {formErrors.zipCode && (
                    <p className="text-red-500 text-sm mt-2 font-medium">{formErrors.zipCode}</p>
                  )}
                  <p className="text-slate-600 text-sm mt-2">
                    6-digit Indian PIN code
                  </p>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowCustomerForm(false);
                    setEditingCustomer(null);
                    setCustomerForm({
                      name: '',
                      mobile1: '',
                      mobile2: '',
                      mobile3: '',
                      address_details: { street: '', city: '', state: '', zipCode: '' }
                    });
                    setFormErrors({});
                  }}
                  className="w-full sm:w-auto bg-white/90 backdrop-blur-lg text-slate-700 rounded-full px-6 py-4 shadow-lg shadow-slate-500/10 hover:shadow-xl hover:shadow-slate-500/20 transition-all duration-300 text-base font-semibold flex items-center justify-center space-x-3 min-h-[64px] touch-manipulation"
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.95)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="w-5 h-5" />
                  <span>Cancel</span>
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={!customerForm.name.trim() || !customerForm.mobile1}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full px-6 py-4 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 text-base font-semibold flex items-center justify-center space-x-3 min-h-[64px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-5 h-5" />
                  <span>{editingCustomer ? 'Update Customer' : 'Add Customer'}</span>
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Call History Modal */}
      {showCallHistory && selectedHistoryCustomer && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl border border-white/20"
          >

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-luxury font-semibold text-slate-800">
                  Call History - {selectedHistoryCustomer.name}
                </h2>
                <p className="text-slate-600">
                  Historical remarks and interactions
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCallHistory(false);
                  setSelectedHistoryCustomer(null);
                }}
                className="p-2 hover:bg-white/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-700">
                  Complete Call History (All Records)
                </h4>
                <span className="text-sm text-slate-500">
                  {callRecords.filter(record => record.customer_id === selectedHistoryCustomer.id).length} total calls
                </span>
              </div>
              
              {callRecords
                .filter(record => record.customer_id === selectedHistoryCustomer.id)
                .sort((a, b) => new Date(b.call_date) - new Date(a.call_date))
                .map((call, index) => (
                  <div key={call.id} className="border-l-4 border-primary-200 pl-4 py-4 bg-slate-50 rounded-r-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(call.call_status)}`}>
                            {formatCallStatus(call.call_status)}
                          </span>
                          <span className="text-sm text-slate-500">
                            {new Date(call.call_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {index === 0 && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                              Latest
                            </span>
                          )}
                        </div>

                        {call.remarks && (
                          <div className="text-sm text-slate-700 bg-white p-4 rounded border mb-3">
                            <p className="font-medium text-slate-800 mb-2">Call Remarks:</p>
                            <p>{call.remarks}</p>
                          </div>
                        )}

                        <div className="flex items-center space-x-6 text-xs text-slate-500">
                          {call.call_duration_seconds && (
                            <span>Duration: {Math.round(call.call_duration_seconds / 60)} min</span>
                          )}
                          {call.outcome_score && (
                            <span>Outcome Score: {call.outcome_score}/10</span>
                          )}
                          {call.next_call_date && (
                            <span>Next Follow-up: {new Date(call.next_call_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              {callRecords.filter(record => record.customer_id === selectedHistoryCustomer.id).length === 0 && (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No call history available for this customer.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* CSV Import Modal */}
      <EnhancedCSVImport
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        importType={csvImportType}
        onImportSuccess={handleCSVImportSuccess}
        existingCustomers={customers}
      />
    </div>
  );
};

export default Dashboard;