import React, { useState, useEffect } from 'react';
import { LogOut, Shield, TrendingUp, Users, Bell, Phone, Clock, UserCheck, BarChart3, Calendar, Search, Plus, Edit, Trash2, X, PhoneCall, User, History } from 'lucide-react';
import { useCustomers, useCallRecords, useDashboardStats } from '../hooks/useCustomerData';
import { usePinAuth } from '../hooks/usePinAuth';
import { Reminders, CallDisposition } from '../components';
import { validateIndianMobile, validateIndianPIN, formatIndianMobile } from '../utils/validation';

const Dashboard = ({ agentPin, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('customers');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDisposition, setShowDisposition] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({ name: '', mobile: '', address_details: { street: '', city: '', state: '', zipCode: '' } });
  const [formErrors, setFormErrors] = useState({});
  const { isAuthenticated } = usePinAuth();
  const { stats, loading: statsLoading, refreshStats } = useDashboardStats(agentPin);
  const { customers, searchQuery, setSearchQuery, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { callRecords, fetchCallRecords } = useCallRecords();

  console.log('Dashboard render - agentPin:', agentPin, 'isAuthenticated:', isAuthenticated);

  useEffect(() => {
    console.log('Dashboard useEffect triggered - isAuthenticated:', isAuthenticated, 'agentPin:', agentPin);
    if (isAuthenticated && agentPin) {
      console.log('Loading dashboard data...');
      // Set agent PIN in localStorage for component use
      localStorage.setItem('agent_pin', agentPin);

      // Load all data
      fetchCustomers();
      const today = new Date().toISOString().split('T')[0];
      fetchCallRecords({ agent_pin: agentPin, today: true });
      refreshStats();
    } else {
      console.log('Dashboard useEffect - conditions not met:', { isAuthenticated, agentPin });
    }
  }, [isAuthenticated, agentPin]);

  const handleCallCustomer = (customer) => {
    // Open phone dialer
    const phoneNumber = customer.mobile_number;
    if (phoneNumber) {
      // Try to open phone dialer (works on mobile devices and some desktop apps)
      window.open(`tel:${phoneNumber}`, '_self');
    }
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
    fetchCallRecords({ agent_pin: agentPin, today: true });
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchCustomers(query);
  };

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({ name: '', mobile: '', address_details: { street: '', city: '', state: '', zipCode: '' } });
    setFormErrors({});
    setShowCustomerForm(true);
  };

  const handleViewProfile = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name || '',
      mobile: customer.mobile_number || '',
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
        alert('Customer deleted successfully!');
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error deleting customer. Please try again.');
      }
    }
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
    if (!customerForm.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!validateIndianMobile(customerForm.mobile)) {
      errors.mobile = 'Please enter a valid Indian mobile number (10 digits starting with 6-9)';
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
      mobile_number: formatIndianMobile(customerForm.mobile.trim()),
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
        mobile_number: editingCustomer.mobile_number,
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
      alert(editingCustomer ? 'Customer updated successfully!' : 'Customer added successfully!');

      setShowCustomerForm(false);
      setEditingCustomer(null);
      setCustomerForm({ name: '', mobile: '', address_details: { street: '', city: '', state: '', zipCode: '' } });
      setFormErrors({});
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer. Please try again.');
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
      completed: 'text-green-600 bg-green-50 border-green-200',
      no_answer: 'text-gray-600 bg-gray-50 border-gray-200',
      busy: 'text-orange-600 bg-orange-50 border-orange-200',
      follow_up: 'text-blue-600 bg-blue-50 border-blue-200',
      invalid: 'text-red-600 bg-red-50 border-red-200',
      not_interested: 'text-red-500 bg-red-50 border-red-200',
    };
    return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const renderCustomers = () => (
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
        <button
          onClick={handleCreateCustomer}
          className="btn-luxury flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

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
          customers.map((customer) => (
            <div
              key={customer.id}
              className="card-luxury-minimal p-6 hover:shadow-luxury transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {customer.name}
                    </h3>
                    <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {customer.mobile_number}
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

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCallCustomer(customer)}
                    className="btn-luxury text-sm flex items-center space-x-1"
                    title="Open phone dialer"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call</span>
                  </button>
                  <button
                    onClick={() => handleDispositionCustomer(customer)}
                    className="btn-luxury-outline text-sm flex items-center space-x-1"
                    title="Log call disposition"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Log Call</span>
                  </button>
                  <button
                    onClick={() => handleViewProfile(customer)}
                    className="btn-luxury-outline text-sm flex items-center space-x-1"
                    title="View customer profile"
                  >
                    <User className="w-3 h-3" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => handleViewCallHistory(customer)}
                    className="btn-luxury-outline text-sm flex items-center space-x-1"
                    title="View call history"
                  >
                    <History className="w-3 h-3" />
                    <span>History</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer.id)}
                    className="btn-luxury-outline text-red-600 hover:bg-red-50 text-sm flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Calls */}
        <div className="card-luxury animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <Phone className="w-8 h-8 text-primary-500" />
            <div className="text-2xl font-bold text-primary-600">{stats.totalCalls}</div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Total Calls</h3>
          <p className="text-slate-600 text-sm">All-time record</p>
        </div>

        {/* Today's Calls */}
        <div className="card-luxury animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <UserCheck className="w-8 h-8 text-secondary-500" />
            <div className="text-2xl font-bold text-secondary-600">{stats.todaysCalls}</div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Today's Calls</h3>
          <p className="text-slate-600 text-sm">Completed today</p>
        </div>

        {/* Reminders */}
        <div className="card-luxury animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-luxury-gold" />
            <div className="text-2xl font-bold text-luxury-gold">{stats.todaysReminders}</div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Reminders</h3>
          <p className="text-slate-600 text-sm">Due today</p>
        </div>

        {/* Active Customers */}
        <div className="card-luxury animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-slate-600" />
            <div className="text-2xl font-bold text-slate-600">{customers.length}</div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Customers</h3>
          <p className="text-slate-600 text-sm">Total in system</p>
        </div>
      </div>

      {/* Call Status Breakdown */}
      <div className="card-luxury-minimal">
        <h3 className="text-xl font-luxury font-semibold text-slate-800 mb-6">Call Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(stats.callStatusBreakdown).map(([status, count]) => (
            <div key={status} className="text-center">
              <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor(status)}`}>
                {formatCallStatus(status)}
              </div>
              <div className="text-2xl font-bold text-slate-800 mt-2">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTodaysCalls = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-luxury font-semibold text-slate-800">Today's Call Activity</h2>
        <div className="text-sm text-slate-600">
          {callRecords.length} call{callRecords.length !== 1 ? 's' : ''} logged
        </div>
      </div>

      {callRecords.length === 0 ? (
        <div className="text-center py-12">
          <Phone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">No calls logged today</h3>
          <p className="text-slate-500">Start calling customers to build your activity.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {callRecords.map((record) => (
            <div
              key={record.id}
              className="card-luxury-minimal p-6 hover:shadow-luxury transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {record.fcm_customers?.name}
                    </h3>
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium border
                      ${getStatusColor(record.call_status)}
                    `}>
                      {formatCallStatus(record.call_status)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
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

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCallCustomer(record.fcm_customers)}
                    className="btn-luxury text-sm flex items-center space-x-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call Again</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );


  const renderActivityLogs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-luxury font-semibold text-slate-800">Activity Logs</h2>
        <div className="text-sm text-slate-600">
          System activities and profile changes
        </div>
      </div>

      <div className="space-y-4">
        {/* Customer Edit Logs */}
        <div className="card-luxury-minimal p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Customer Profile Changes</h3>
          <div className="space-y-3">
            {/* This would be populated from a customer_audit_logs table in a real implementation */}
            <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">John Smith</span> - Mobile number updated from +91-9876543210 to +91-9876543211
                </p>
                <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Sarah Johnson</span> - Address updated: Added PIN code 110001
                </p>
                <p className="text-xs text-slate-500 mt-1">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Navigation */}
      <nav className="nav-luxury px-4 py-4">
        <div className="luxury-container flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-primary-500 animate-glow" />
            <div>
              <h1 className="text-2xl font-luxury font-semibold text-slate-800">
                Call Tracker Pro
              </h1>
              <div className="text-sm text-slate-600">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="btn-luxury-outline flex items-center space-x-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="luxury-container luxury-section">
        
        {/* Welcome Header */}
        <div className="text-center animate-fade-in-up mb-8">
          <h2 className="text-4xl font-luxury font-semibold text-slate-800 mb-4">
            Agent Dashboard
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Track your calls, manage customers, and stay on top of reminders
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="glass-card p-2 flex space-x-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all
                    ${activeTab === tab.id
                      ? 'bg-primary-500 text-white shadow-luxury'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                    }
                  `}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in-up">
          {activeTab === 'customers' && renderCustomers()}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'reminders' && <Reminders agentPin={agentPin} />}
          {activeTab === 'calls' && renderTodaysCalls()}
          {activeTab === 'logs' && renderActivityLogs()}
        </div>
      </div>

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Customer Name
                  </label>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <p className="text-slate-800 font-medium">{editingCustomer.name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <p className="text-slate-800 font-medium">{editingCustomer.mobile_number}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Street Address
                  </label>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <p className="text-slate-800">{editingCustomer.address_details?.street || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    City
                  </label>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <p className="text-slate-800">{editingCustomer.address_details?.city || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    State
                  </label>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <p className="text-slate-800">{editingCustomer.address_details?.state || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    PIN Code
                  </label>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <p className="text-slate-800">{editingCustomer.address_details?.zipCode || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Customer Stats */}
              <div className="card-luxury-minimal p-4">
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
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleViewCallHistory(editingCustomer)}
                  className="btn-luxury-outline flex items-center space-x-1"
                >
                  <History className="w-4 h-4" />
                  <span>View History</span>
                </button>
                <button
                  onClick={handleEditFromProfile}
                  className="btn-luxury flex items-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">

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
                  setCustomerForm({ name: '', mobile: '', address_details: { street: '', city: '', state: '', zipCode: '' } });
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`input-luxury w-full ${formErrors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter customer name"
                  required
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={customerForm.mobile}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, mobile: e.target.value }))}
                  className={`input-luxury w-full ${formErrors.mobile ? 'border-red-500' : ''}`}
                  placeholder="Enter 10-digit mobile number (e.g., 9876543210)"
                  required
                />
                {formErrors.mobile && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>
                )}
                <p className="text-slate-500 text-xs mt-1">
                  Enter number with or without +91 prefix
                </p>
              </div>

              {/* Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="input-luxury w-full"
                    placeholder="123 Main St"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="input-luxury w-full"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="input-luxury w-full"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className={`input-luxury w-full ${formErrors.zipCode ? 'border-red-500' : ''}`}
                    placeholder="110001"
                    maxLength="6"
                  />
                  {formErrors.zipCode && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.zipCode}</p>
                  )}
                  <p className="text-slate-500 text-xs mt-1">
                    6-digit Indian PIN code
                  </p>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerForm(false);
                    setEditingCustomer(null);
                    setCustomerForm({ name: '', mobile: '', address_details: { street: '', city: '', state: '', zipCode: '' } });
                    setFormErrors({});
                  }}
                  className="btn-luxury-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customerForm.name.trim() || !customerForm.mobile.trim()}
                  className="btn-luxury disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call History Modal */}
      {showCallHistory && selectedHistoryCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in-up">

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
              {callRecords
                .filter(record => record.customer_id === selectedHistoryCustomer.id)
                .sort((a, b) => new Date(b.call_date) - new Date(a.call_date))
                .map((call) => (
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;