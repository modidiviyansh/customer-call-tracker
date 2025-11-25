import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Shield, Users, Phone, Clock, UserCheck, BarChart3, Calendar, Search, Plus, Edit, X, PhoneCall, User, History, Upload, CheckCircle } from 'lucide-react';
import { usePaginatedCustomers, useCallRecords, useDashboardStats } from '../hooks';
import { usePinAuth } from '../hooks/usePinAuth';
import { Reminders, CallDisposition, EnhancedCSVImport, SkeletonLoader, ToastContainer, useToast, ServerPagination, MobilePagination, MobileNumberManager, Button, Accordion, SwipeableCard, SwipeableMobileCallCard } from '../components';
import { validateIndianPIN, formatDateLocal, formatDateTimeLocal } from '../utils';

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
    searchQuery, 
    handleSearch, 
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    goToPage,
    changePageSize,
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
    { id: 'reminders', label: 'Call Queue', icon: Clock },
    { id: 'calls', label: 'My Calls Today', icon: Phone },
    { id: 'logs', label: 'Activity Logs', icon: Calendar },
  ];

  const formatCallStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 border-2 border-emerald-400',
      no_answer: 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg shadow-slate-500/30 border-2 border-slate-400',
      busy: 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-lg shadow-amber-500/30 border-2 border-amber-400',
      follow_up: 'bg-gradient-to-r from-blue-800 to-blue-700 text-white shadow-lg shadow-blue-500/30 border-2 border-blue-400',
      invalid: 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-500/30 border-2 border-red-400',
      not_interested: 'bg-gradient-to-r from-purple-700 to-pink-700 text-white shadow-lg shadow-purple-500/30 border-2 border-purple-400',
    };
    return colors[status] || 'bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-500/30 border-2 border-slate-400';
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
            <Button
              onClick={() => handleImportCSV('customers')}
              variant="success"
              size="md"
              className="flex items-center space-x-2"
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Import</span>
            </Button>
            <Button
              onClick={handleCreateCustomer}
              variant="primary"
              size="lg"
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add Customer</span>
            </Button>
          </div>
        </div>

        {/* Responsive Pagination Controls (Top) */}
        {customers.length > 0 && (
          <div className="hidden md:block">
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
          </div>
        )}

        {/* Mobile Pagination */}
        {customers.length > 0 && (
          <div className="md:hidden">
            <MobilePagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              onPageChange={goToPage}
              loading={customersLoading}
              serverName="Supabase"
              loadMoreText="Load More Customers"
              loadMoreLoadingText="Loading..."
              showPrevNext={true}
              showLoadMore={true}
            />
          </div>
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
              >
                <SwipeableMobileCallCard
                  customer={customer}
                  onCallCustomer={(customerWithNumber) => {
                    console.log('📞 Call initiated for:', customerWithNumber.name);
                    handleCallCustomer(customerWithNumber);
                  }}
                  onLogCall={(customer) => {
                    console.log('📝 Log call for:', customer.name);
                    handleDispositionCustomer(customer);
                  }}
                  onViewProfile={(customer) => {
                    console.log('👤 View profile for:', customer.name);
                    handleViewProfile(customer);
                  }}
                  onViewHistory={(customer) => {
                    console.log('📋 View history for:', customer.name);
                    handleViewCallHistory(customer);
                  }}
                  onDeleteCustomer={(customerId) => {
                    console.log('🗑️ Delete customer:', customerId);
                    handleDeleteCustomer(customerId);
                  }}
                  className="w-full"
                />
              </motion.div>
            ))
          )}
        </div>

        {/* Responsive Pagination Controls (Bottom) */}
        {customers.length > 0 && (
          <div className="hidden md:block">
            <ServerPagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              onPageChange={goToPage}
              onPageSizeChange={changePageSize}
              showSearch={false}
              showInfo={false}
              showJumpToPage={false}
              loading={customersLoading}
              serverName="Supabase"
            />
          </div>
        )}

        {/* Mobile Pagination Bottom */}
        {customers.length > 0 && (
          <div className="md:hidden">
            <MobilePagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              onPageChange={goToPage}
              loading={customersLoading}
              serverName="Supabase"
              loadMoreText="Load More"
              loadMoreLoadingText="Loading..."
              showPrevNext={false}
              showLoadMore={true}
              showInfo={false}
            />
          </div>
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
              <h3 className="text-base sm:text-lg font-semibold text-slate-800">My Calls Today</h3>
              <p className="text-slate-600 text-xs sm:text-sm">Calls I've completed</p>
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
              <h3 className="text-base sm:text-lg font-semibold text-slate-800">Call Queue</h3>
              <p className="text-slate-600 text-xs sm:text-sm">Calls to make today</p>
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
        <h3 className="text-xl font-luxury font-semibold text-slate-800 mb-4">Call Results Summary</h3>
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
          {callRecords.map((record, index) => (
            <div key={record.id} className="space-y-2">
              {/* Disposition Tag Above Card */}
              <div className="flex items-center space-x-3 px-2">
                <motion.span
                  className={`
                    px-4 py-2 rounded-full text-sm font-bold border-2 shadow-lg flex-shrink-0
                    ${getStatusColor(record.call_status)}
                  `}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                >
                  {formatCallStatus(record.call_status)}
                </motion.span>
              </div>
              
              <SwipeableCard
                onSwipeLeft={() => {
                  console.log('📝 Swipe left - Log Call for:', record.fcm_customers?.name);
                  // For call records, this could open a form to edit the call log
                  handleDispositionCustomer(record.fcm_customers);
                }}
                onSwipeRight={() => {
                  console.log('📞 Swipe right - Call Again for:', record.fcm_customers?.name);
                  handleCallCustomer(record.fcm_customers);
                }}
                leftAction={{
                  icon: Phone,
                  label: 'Log Call',
                  color: 'from-emerald-500 to-emerald-600'
                }}
                rightAction={{
                  icon: PhoneCall,
                  label: 'Call Again',
                  color: 'from-blue-500 to-blue-600'
                }}
                className="w-full"
              >
                <div className="glass-card-gradient p-3 sm:p-4 hover:scale-105 transition-all duration-300 shadow-gradient">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {record.fcm_customers?.name}
                      </h3>
                    </div>

                    {/* Essential Info - Always Visible */}
                    <div className="text-sm text-slate-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Call time: {formatDateTimeLocal(record.call_date).split(' ')[1]}</span>
                      </div>
                    </div>

                    {/* Collapsible Details */}
                    <div className="space-y-3">
                      {/* Notes Section */}
                      {record.remarks && (
                        <Accordion
                          title="Call Notes"
                          icon={User}
                          defaultExpanded={false}
                          className="bg-blue-50/50 border-blue-200"
                          titleClassName="hover:bg-blue-100"
                        >
                          <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                            <p className="leading-relaxed">{record.remarks}</p>
                          </div>
                        </Accordion>
                      )}

                      {/* Next Reminder */}
                      {record.next_call_date && (
                        <Accordion
                          title={`Next follow-up: ${formatDateLocal(record.next_call_date)}`}
                          icon={Calendar}
                          defaultExpanded={false}
                          className="bg-green-50/50 border-green-200"
                          titleClassName="hover:bg-green-100"
                        >
                          <div className="text-sm text-slate-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-3 h-3 text-green-600" />
                              <span>Scheduled for: {formatDateLocal(record.next_call_date)}</span>
                            </div>
                          </div>
                        </Accordion>
                      )}
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => {
                      console.log('🔄 Call Again clicked for:', record.fcm_customers?.name);
                      handleCallCustomer(record.fcm_customers);
                    }}
                    variant="call"
                    size="lg"
                    className="flex items-center space-x-3 relative z-20"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <PhoneCall className="w-5 h-5" />
                    </motion.div>
                    <span>Call Again</span>
                  </Button>
                </div>
              </div>
              </div>
              </SwipeableCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );


  const renderActivityLogs = () => (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-luxury font-semibold text-slate-800">Recent Activity</h2>
        <div className="text-lg text-slate-600 font-medium">
          Your latest actions and updates
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
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-primary-500 animate-glow" />
            <h1 className="text-lg font-luxury font-semibold text-slate-800">
              Call Tracker Pro
            </h1>
          </div>
          <div className="text-base text-slate-600 font-medium">
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
          <div className="flex justify-between w-full px-4 py-3 gap-1">
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
                    relative flex flex-col items-center justify-center space-y-3 z-30
                    px-3 py-3 rounded-2xl transition-all cursor-pointer select-none
                    min-h-[68px] min-w-[56px] flex-1 touch-manipulation active:scale-95
                    ${isActive
                      ? 'text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/30'
                    }
                  `}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  style={{ pointerEvents: 'auto' }}
                  aria-label={`Navigate to ${tab.label} tab`}
                >
                  {/* Animated bubble background */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    initial={false}
                    animate={{
                      background: isActive
                        ? 'linear-gradient(135deg, #FFD700 0%, #09c6f9 100%)'
                        : 'transparent',
                      scale: isActive ? 1 : 0.95,
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />

                  {/* Icon with gradient fill when active */}
                  <motion.div
                    animate={{
                      color: isActive ? '#ffffff' : '#94a3b8',
                      filter: isActive ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.3))' : 'none'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </motion.div>

                  <motion.span
                    className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}
                    animate={{
                      color: isActive ? '#ffffff' : '#94a3b8'
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
          {activeTab === 'reminders' && (
            <div className="space-y-6">
              {/* Inline Call Status Overview - Eye Level Position */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="glass-card-gradient p-6 shadow-gradient border border-white/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-luxury font-semibold text-slate-800">
                      Live Call Status
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Real-time overview of call dispositions
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-600 font-medium">Live</span>
                  </div>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Busy Status - Emphasized */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="relative overflow-hidden"
                  >
                    <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-4 text-white shadow-xl border-2 border-amber-400/50">
                      <div className="flex items-center justify-between mb-2">
                        <Phone className="w-6 h-6 text-amber-100" />
                        <div className="w-2 h-2 bg-amber-200 rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {stats.callStatusBreakdown?.busy || 0}
                      </div>
                      <div className="text-sm font-semibold text-amber-100">
                        Line Busy
                      </div>
                      <div className="text-xs text-amber-200 mt-1">
                        Needs retry
                      </div>
                    </div>
                    {/* Priority indicator */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">!</span>
                    </div>
                  </motion.div>

                  {/* Completed */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="glass-card-subtle rounded-2xl p-4 border border-emerald-200/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    </div>
                    <div className="text-xl font-bold text-slate-800 mb-1">
                      {stats.callStatusBreakdown?.completed || 0}
                    </div>
                    <div className="text-sm font-medium text-emerald-700">
                      Completed
                    </div>
                  </motion.div>

                  {/* No Response */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="glass-card-subtle rounded-2xl p-4 border border-slate-200/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Phone className="w-5 h-5 text-slate-600" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    </div>
                    <div className="text-xl font-bold text-slate-800 mb-1">
                      {stats.callStatusBreakdown?.no_answer || 0}
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                      No Response
                    </div>
                  </motion.div>

                  {/* Follow Up */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="glass-card-subtle rounded-2xl p-4 border border-blue-200/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    </div>
                    <div className="text-xl font-bold text-slate-800 mb-1">
                      {stats.callStatusBreakdown?.follow_up || 0}
                    </div>
                    <div className="text-sm font-medium text-blue-700">
                      Follow Up
                    </div>
                  </motion.div>

                  {/* Not Interested */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="glass-card-subtle rounded-2xl p-4 border border-purple-200/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <User className="w-5 h-5 text-purple-600" />
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    </div>
                    <div className="text-xl font-bold text-slate-800 mb-1">
                      {stats.callStatusBreakdown?.not_interested || 0}
                    </div>
                    <div className="text-sm font-medium text-purple-700">
                      Not Interested
                    </div>
                  </motion.div>

                  {/* Invalid */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="glass-card-subtle rounded-2xl p-4 border border-red-200/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <X className="w-5 h-5 text-red-600" />
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    </div>
                    <div className="text-xl font-bold text-slate-800 mb-1">
                      {stats.callStatusBreakdown?.invalid || 0}
                    </div>
                    <div className="text-sm font-medium text-red-700">
                      Invalid
                    </div>
                  </motion.div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/50">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Total Calls:</span> {stats.totalCalls || 0}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={refreshStats}
                      variant="secondary"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <BarChart3 className="w-3 h-3" />
                      <span>Refresh</span>
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Main Call Queue */}
              <Reminders agentPin={agentPin} />
            </div>
          )}
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
          className="bg-white/90 backdrop-blur-lg p-3 rounded-full shadow-lg border border-white/30 min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation"
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
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl border border-white/30"
          >

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-luxury font-semibold text-slate-800">
                  Contact Details
                </h2>
                <p className="text-slate-600">
                  View and update contact information
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
                      {formatDateLocal(editingCustomer.created_at)}
                    </div>
                    <div className="text-sm text-slate-500">Added</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                <Button
                  onClick={() => handleViewCallHistory(editingCustomer)}
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto flex items-center justify-center space-x-3"
                >
                  <History className="w-5 h-5" />
                  <span>View History</span>
                </Button>
                <Button
                  onClick={handleEditFromProfile}
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto flex items-center justify-center space-x-3"
                >
                  <Edit className="w-5 h-5" />
                  <span>Update Contact</span>
                </Button>
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
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl border border-white/30"
          >

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-luxury font-semibold text-slate-800">
                  {editingCustomer ? 'Update Contact' : 'Add New Contact'}
                </h2>
                <p className="text-slate-600">
                  {editingCustomer ? 'Update contact details' : 'Enter contact information'}
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
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full p-4 rounded-xl border-2 bg-white/80 backdrop-blur-sm text-lg font-medium min-h-[56px] transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${formErrors.name ? 'border-red-500' : 'border-slate-300'}`}
                  placeholder="Enter contact name"
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
                <Button
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
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto flex items-center justify-center space-x-3"
                >
                  <X className="w-5 h-5" />
                  <span>Discard Changes</span>
                </Button>
                <Button
                  type="submit"
                  disabled={!customerForm.name.trim() || !customerForm.mobile1}
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                  <span>{editingCustomer ? 'Save Changes' : 'Add New Contact'}</span>
                </Button>
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
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl border border-white/30"
          >

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-luxury font-semibold text-slate-800">
                  Call Log - {selectedHistoryCustomer.name}
                </h2>
                <p className="text-slate-600">
                  Previous call records and outcomes
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
                            {formatDateTimeLocal(call.call_date)}
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
                            <span>Next Follow-up: {formatDateLocal(call.next_call_date)}</span>
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