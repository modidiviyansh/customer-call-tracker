import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Phone, User, Calendar, AlertCircle, AlertTriangle, Filter, History, X, Upload, PhoneCall } from 'lucide-react';
import { supabase } from '../services/supabase';
import CallDisposition from './CallDisposition';
import CSVImport from './CSVImport';
import { useToast } from './Toast';
import Accordion from './Accordion';

import { Button } from './index';
import { formatDateLocal } from '../utils';

const Reminders = ({ agentPin }) => {
  const { success, error } = useToast();
  const [reminders, setReminders] = useState({
    overdue: [],
    today: [],
    upcoming: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDisposition, setShowDisposition] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineCustomer, setTimelineCustomer] = useState(null);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [csvImportType, setCSVImportType] = useState('reminders');
  const [activeTab, setActiveTab] = useState('today');
  const [selectedDispositions, setSelectedDispositions] = useState([]);
  const [availableDispositions, setAvailableDispositions] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  useEffect(() => {
    if (agentPin) {
      fetchAllReminders(agentPin);
    }
  }, [agentPin]);

  const fetchAllReminders = async (agentPin) => {
    setLoading(true);
    try {
      // Get dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      // Fetch all reminders for the agent with updated_at for latest selection
      const { data, error } = await supabase
        .from('fcm_call_logs')
        .select(`
          id,
          next_call_date,
          remarks,
          call_status,
          call_date,
          updated_at,
          customer_id,
          fcm_customers (
            id,
            name,
            mobile1,
            mobile2,
            mobile3
          )
        `)
        .eq('agent_pin', agentPin)
        .not('next_call_date', 'is', null)
        .order('next_call_date', { ascending: true });

      if (error) throw error;

      // Group by customer_id only, keep latest record per customer
      const latestCustomerReminders = new Map();
      const dispositions = new Set();

      (data || []).forEach(reminder => {
        // Track available dispositions
        if (reminder.call_status) {
          dispositions.add(reminder.call_status);
        }

        const existing = latestCustomerReminders.get(reminder.customer_id);
        if (!existing || new Date(reminder.updated_at || reminder.call_date) > new Date(existing.updated_at || existing.call_date)) {
          latestCustomerReminders.set(reminder.customer_id, reminder);
        }
      });

      // Set available dispositions
      setAvailableDispositions(Array.from(dispositions));

      // Categorize reminders by timeline (using latest record per customer)
      const categorized = {
        overdue: [],
        today: [],
        upcoming: []
      };

      latestCustomerReminders.forEach(reminder => {
        const reminderDate = new Date(reminder.next_call_date);
        reminderDate.setHours(0, 0, 0, 0);

        if (reminderDate < today) {
          categorized.overdue.push(reminder);
        } else if (reminderDate.getTime() === today.getTime()) {
          categorized.today.push(reminder);
        } else if (reminderDate <= nextWeek) {
          categorized.upcoming.push(reminder);
        }
      });

      setReminders(categorized);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDispositionSubmit = () => {
    // Refresh reminders after disposition
    if (agentPin) {
      fetchAllReminders(agentPin);
    }
    setShowDisposition(false);
    setSelectedCustomer(null);
  };

  const handleViewTimeline = (customer) => {
    setTimelineCustomer(customer);
    setShowTimeline(true);
    fetchTimelineData(customer.id);
  };

  const handleCSVImportSuccess = async (importType, importData) => {
    if (importType === 'reminders') {
      // Import reminders in batches to handle 1000+ entries
      await importRemindersInBatches(importData, agentPin);
    }
  };

  const importRemindersInBatches = async (reminders, agentPin) => {
    const batchSize = 50; // Process 50 records at a time
    const totalBatches = Math.ceil(reminders.length / batchSize);
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    try {
      // Process reminders in batches
      for (let i = 0; i < totalBatches; i++) {
        const batch = reminders.slice(i * batchSize, (i + 1) * batchSize);
        
        console.log(`🗂️ Processing batch ${i + 1}/${totalBatches} (${batch.length} reminders)`);
        
        // Process current batch
        const batchResults = await Promise.allSettled(
          batch.map(async (reminder) => {
            // Find customer by mobile number (check all mobile fields)
            const { data: customer, error: customerError } = await supabase
              .from('fcm_customers')
              .select('id')
              .or(`mobile1.eq.${reminder.customer_mobile},mobile2.eq.${reminder.customer_mobile},mobile3.eq.${reminder.customer_mobile}`)
              .single();

            if (customerError || !customer) {
              throw new Error(`Customer not found for mobile: ${reminder.customer_mobile}`);
            }

            // Create call record for reminder
            const callRecord = {
              customer_id: customer.id,
              agent_pin: agentPin,
              call_date: new Date().toISOString(),
              next_call_date: new Date(reminder.reminder_date).toISOString(),
              call_status: 'follow_up',
              remarks: reminder.reminder_text,
            };

            const { error: insertError } = await supabase
              .from('fcm_call_logs')
              .insert([callRecord]);

            if (insertError) {
              throw insertError;
            }

            return { success: true, mobile: reminder.customer_mobile };
          })
        );

        // Count batch results
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push(result.reason.message || result.reason);
            console.error('Failed to import reminder:', result.reason);
          }
        });

        // Update user feedback every batch
        const progress = Math.round(((i + 1) / totalBatches) * 100);
        console.log(`⏳ Import progress: ${progress}% (${results.successful} successful, ${results.failed} failed)`);

        // Brief pause between batches to prevent overwhelming the database
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Final user feedback
      if (results.successful > 0) {
        success(`Successfully imported ${results.successful} reminders!`);
        fetchAllReminders(agentPin); // Refresh the reminders list
      }

      if (results.failed > 0) {
        console.error('Import completed with errors:', results.errors);
        // Show only first few errors to user to avoid spam
        const errorMessage = results.errors.slice(0, 3).join('; ');
        const moreErrors = results.errors.length > 3 ? `...and ${results.errors.length - 3} more` : '';
        error(`Failed to import ${results.failed} reminders. First errors: ${errorMessage} ${moreErrors}`);
      }

    } catch (error) {
      console.error('Critical error during reminder import:', error);
      error(`Import failed: ${error.message}`);
    }
  };

  const handleCallCustomer = (customer) => {
    // Open phone dialer - use primary mobile number
    const phoneNumber = customer.mobile1 || customer.mobile_number;
    if (phoneNumber) {
      // Try to open phone dialer (works on mobile devices and some desktop apps)
      window.open(`tel:${phoneNumber}`, '_self');
    }
  };

  const handleImportCSV = (type) => {
    setCSVImportType(type);
    setShowCSVImport(true);
  };

  const fetchTimelineData = async (customerId) => {
    setIsLoadingTimeline(true);
    try {
      const { data, error } = await supabase
        .from('fcm_call_logs')
        .select(`
          id,
          call_date,
          call_status,
          remarks,
          next_call_date,
          updated_at,
          agent_pin
        `)
        .eq('customer_id', customerId)
        .order('call_date', { ascending: false });

      if (error) throw error;
      setTimelineData(data || []);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      setTimelineData([]);
    } finally {
      setIsLoadingTimeline(false);
    }
  };


  // Filter reminders by dispositions (multi-select)
  const getFilteredReminders = () => {
    const filteredReminders = reminders[activeTab] || [];
    if (selectedDispositions.length === 0) return filteredReminders;
    return filteredReminders.filter(reminder => selectedDispositions.includes(reminder.call_status));
  };

  const getStatusIcon = (status) => {
    const icons = {
      follow_up: Clock,
      completed: User,
      no_answer: Phone,
      busy: Phone,
      invalid: AlertCircle,
      not_interested: User,
    };
    return icons[status] || User;
  };

  const getStatusColor = (status) => {
    const colors = {
      follow_up: 'text-indigo-700 bg-indigo-100 border-indigo-300 font-semibold',
      completed: 'text-emerald-700 bg-emerald-100 border-emerald-300 font-semibold',
      no_answer: 'text-slate-700 bg-slate-100 border-slate-300 font-semibold',
      busy: 'text-amber-700 bg-amber-100 border-amber-300 font-semibold',
      invalid: 'text-red-700 bg-red-100 border-red-300 font-semibold',
      not_interested: 'text-purple-700 bg-purple-100 border-purple-300 font-semibold',
    };
    return colors[status] || 'text-slate-700 bg-slate-100 border-slate-300 font-semibold';
  };


  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  const reminderTabs = [
    { id: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'text-red-600', data: reminders.overdue },
    { id: 'today', label: 'Today', icon: Clock, color: 'text-blue-600', data: reminders.today },
    { id: 'upcoming', label: 'Coming Week', icon: Calendar, color: 'text-green-600', data: reminders.upcoming }
  ];


  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-xl font-luxury font-semibold text-slate-800">
          Call Queue
        </h2>
        <button
          onClick={() => handleImportCSV('reminders')}
          className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-full px-4 py-2 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 flex items-center space-x-2 font-semibold min-h-[44px] text-sm touch-manipulation"
        >
          <Upload className="w-4 h-4" />
          <span>Import</span>
        </button>
      </div>

      {/* Sticky Tab Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 px-4 py-4 shadow-sm">
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
          {reminderTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => {
                  console.log('🏷️ Reminder tab clicked:', tab.id);
                  setActiveTab(tab.id);
                }}
                className={`
                  flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 relative z-20
                  min-h-[56px] whitespace-nowrap touch-manipulation cursor-pointer select-none flex-shrink-0
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-800 to-blue-700 text-white shadow-xl shadow-blue-500/25'
                    : 'bg-white/80 text-slate-600 hover:text-slate-800 hover:bg-white hover:shadow-lg border border-slate-200/50'
                  }
                `}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: isActive ? 1.05 : 1.02 }}
                animate={{
                  scale: isActive ? 1.05 : 1,
                  y: isActive ? -2 : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ pointerEvents: 'auto' }}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-sm font-semibold">{tab.label}</span>
                {tab.data.length > 0 && (
                  <motion.span
                    className={`
                      text-xs rounded-full px-3 py-1.5 font-bold min-w-[24px] h-6 flex items-center justify-center border-2
                      ${isActive
                        ? 'bg-white/30 text-white backdrop-blur-sm border-white/40'
                        : tab.id === 'overdue'
                        ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md border-red-400'
                        : tab.id === 'today'
                        ? 'bg-gradient-to-r from-blue-800 to-blue-700 text-white shadow-md border-blue-400'
                        : 'bg-gradient-to-r from-green-700 to-green-600 text-white shadow-md border-green-400'
                      }
                    `}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                      delay: 0.1
                    }}
                  >
                    {tab.data.length}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Disposition Filter Pills */}
      {availableDispositions.length > 0 && (
        <div className="sticky top-[88px] z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200/30 px-4 py-4">
          <div className="flex items-center space-x-3 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Filter by outcome:</span>
          </div>
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
            {/* All Filter Pill */}
            <motion.button
              onClick={() => setSelectedDispositions([])}
              className={`
                flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all duration-300 relative border-2
                min-h-[44px] flex-shrink-0
                ${selectedDispositions.length === 0
                  ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg shadow-slate-500/30 border-slate-500'
                  : 'bg-white/80 text-slate-600 hover:text-slate-800 hover:bg-white hover:shadow-md border-slate-200/50 hover:border-slate-300'
                }
              `}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              animate={{
                scale: selectedDispositions.length === 0 ? 1.05 : 1,
                y: selectedDispositions.length === 0 ? -1 : 0
              }}
            >
              <span className="text-sm">Show All</span>
              <motion.span
                className={`
                  text-xs rounded-full px-2.5 py-1 font-bold min-w-[20px] h-5 flex items-center justify-center
                  ${selectedDispositions.length === 0
                    ? 'bg-white/30 text-white backdrop-blur-sm'
                    : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white'
                  }
                `}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {reminders[activeTab]?.length || 0}
              </motion.span>
            </motion.button>

            {/* Disposition Filter Pills */}
            {availableDispositions.map((disposition) => {
              const count = reminders[activeTab]?.filter(r => r.call_status === disposition).length || 0;
              const isSelected = selectedDispositions.includes(disposition);
              
              // Get status-specific colors for filter pills
              const getFilterColors = (status) => {
                const colors = {
                  completed: isSelected
                    ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
                  no_answer: isSelected
                    ? 'bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-500/25'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200',
                  busy: isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
                  follow_up: isSelected
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200',
                  invalid: isSelected
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
                  not_interested: isSelected
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
                };
                return colors[status] || (isSelected
                  ? 'bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-500/25'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200');
              };
              
              return (
                <motion.button
                  key={disposition}
                  onClick={() => {
                    setSelectedDispositions(prev =>
                      isSelected
                        ? prev.filter(d => d !== disposition)
                        : [...prev, disposition]
                    );
                  }}
                  className={`
                    flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all duration-300 relative border-2
                    min-h-[44px] flex-shrink-0
                    ${getFilterColors(disposition)}
                  `}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  animate={{
                    scale: isSelected ? 1.05 : 1,
                    y: isSelected ? -1 : 0
                  }}
                >
                  <span className="text-sm">{formatStatus(disposition)}</span>
                  <motion.span
                    className={`
                      text-xs rounded-full px-2.5 py-1 font-bold min-w-[20px] h-5 flex items-center justify-center
                      ${isSelected
                        ? 'bg-white/30 text-white backdrop-blur-sm'
                        : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white'
                      }
                    `}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.05 }}
                  >
                    {count}
                  </motion.span>
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-white/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cards Container with Animation */}
      <div className="px-4 pt-2 pb-4">
        <AnimatePresence mode="wait">
          {getFilteredReminders().length === 0 ? (
            <motion.div
              key={`empty-${activeTab}-${selectedDispositions.join(',')}`}
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                {selectedDispositions.length === 0
                  ? (activeTab === 'overdue' && 'No overdue calls') ||
                    (activeTab === 'today' && 'No calls in queue for today') ||
                    (activeTab === 'upcoming' && 'No upcoming calls this week')
                  : `No ${selectedDispositions.map(d => formatStatus(d).toLowerCase()).join(' or ')} calls ${activeTab === 'today' ? 'today' : activeTab === 'overdue' ? 'overdue' : 'this week'}`
                }
              </h3>
              <p className="text-base text-slate-500">
                {selectedDispositions.length === 0
                  ? (activeTab === 'overdue' && 'Great! All overdue calls have been handled.') ||
                    (activeTab === 'today' && 'Your call queue is clear for today.') ||
                    (activeTab === 'upcoming' && 'No calls scheduled for the coming week.')
                  : `No contacts with ${selectedDispositions.map(d => formatStatus(d).toLowerCase()).join(' or ')} results in this time period.`
                }
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={`${activeTab}-${selectedDispositions.join(',')}`}
              className="flex flex-col gap-6 pb-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {getFilteredReminders().map((reminder, index) => {
                const StatusIcon = getStatusIcon(reminder.call_status);
                return (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
                    className="w-full"
                  >
                    {/* Card Design Matching Customer Cards */}
                    <div className={`
                      w-full bg-white rounded-2xl shadow-lg border border-white/20 
                      overflow-hidden mb-4
                    `}
                    style={{
                      borderRadius: '16px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      fontFamily: 'Helvetica, Arial, sans-serif'
                    }}>
                      {/* Header Section - Contact Name & Status */}
                      <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-start justify-between mb-2">
                          {/* Contact Name - Bold, Helvetica, max 2 lines */}
                          <div className="flex-1 mr-3">
                            <h3 
                              className="text-slate-800 font-bold leading-tight"
                              style={{ 
                                fontSize: '15px', 
                                fontWeight: '700',
                                lineHeight: '1.3',
                                maxHeight: '2.6em',
                                overflow: 'hidden',
                                fontFamily: 'Helvetica, Arial, sans-serif'
                              }}
                              title={reminder.fcm_customers?.name}
                            >
                              {reminder.fcm_customers?.name}
                            </h3>
                          </div>
                          
                          {/* Status Pill - Top Right */}
                          <motion.span
                            className={`
                              px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm flex-shrink-0
                              ${getStatusColor(reminder.call_status)}
                            `}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                          >
                            {formatStatus(reminder.call_status)}
                          </motion.span>
                        </div>
                        
                        {/* Scheduled For Metadata - Single line, left-aligned */}
                        <div className="text-xs text-slate-500 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            Scheduled For: {formatDateLocal(reminder.next_call_date)}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Numbers Section - Horizontal Pills Only */}
                      <div className="px-5 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Primary Mobile Number - Blue Pill */}
                          <motion.button
                            onClick={() => {
                              console.log('📞 Calling primary:', reminder.fcm_customers?.mobile1);
                              handleCallCustomer(reminder.fcm_customers);
                            }}
                            className="
                              bg-gradient-to-r from-blue-500 to-blue-600 text-white 
                              px-4 py-2.5 rounded-full text-sm font-medium
                              min-h-[40px] flex items-center gap-2
                              active:scale-95 transition-transform duration-200
                              shadow-sm hover:shadow-md
                            "
                            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <PhoneCall className="w-4 h-4" />
                            <span>{reminder.fcm_customers?.mobile1}</span>
                          </motion.button>

                          {/* Secondary Mobile Numbers - Grey Pills with "Sec" Label */}
                          {reminder.fcm_customers?.mobile2 && (
                            <motion.button
                              onClick={() => {
                                const customerWithNumber = { ...reminder.fcm_customers, mobile1: reminder.fcm_customers.mobile2 };
                                console.log('📞 Calling secondary:', reminder.fcm_customers.mobile2);
                                handleCallCustomer(customerWithNumber);
                              }}
                              className="
                                bg-slate-200 text-slate-700 px-3 py-2.5 rounded-full text-sm font-medium
                                min-h-[40px] flex items-center gap-2
                                active:scale-95 transition-transform duration-200
                                hover:bg-slate-300 hover:text-slate-800
                              "
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span>{reminder.fcm_customers.mobile2}</span>
                              <span className="text-xs text-slate-500 bg-slate-300 px-2 py-0.5 rounded-full">
                                Sec
                              </span>
                            </motion.button>
                          )}

                          {reminder.fcm_customers?.mobile3 && (
                            <motion.button
                              onClick={() => {
                                const customerWithNumber = { ...reminder.fcm_customers, mobile1: reminder.fcm_customers.mobile3 };
                                console.log('📞 Calling tertiary:', reminder.fcm_customers.mobile3);
                                handleCallCustomer(customerWithNumber);
                              }}
                              className="
                                bg-slate-200 text-slate-700 px-3 py-2.5 rounded-full text-sm font-medium
                                min-h-[40px] flex items-center gap-2
                                active:scale-95 transition-transform duration-200
                                hover:bg-slate-300 hover:text-slate-800
                              "
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span>{reminder.fcm_customers.mobile3}</span>
                              <span className="text-xs text-slate-500 bg-slate-300 px-2 py-0.5 rounded-full">
                                Sec
                              </span>
                            </motion.button>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Row - Log Call (Left) + Icon Buttons (Right) */}
                      <div className="px-5 pb-4">
                        <div className="flex items-center justify-between">
                          {/* Log Call Button - Left Placement */}
                          <motion.button
                            onClick={() => {
                              console.log('📝 Log call for:', reminder.fcm_customers?.name);
                              setSelectedCustomer(reminder.fcm_customers);
                              setShowDisposition(true);
                            }}
                            className="
                              bg-gradient-to-r from-emerald-500 to-emerald-600 text-white 
                              px-5 py-3 rounded-xl font-medium text-sm
                              min-h-[44px] flex items-center justify-center gap-2
                              active:scale-95 transition-transform duration-200
                              shadow-sm hover:shadow-md
                            "
                            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Phone className="w-4 h-4" />
                            <span>Log Call</span>
                          </motion.button>

                          {/* Icon Buttons - Right Side */}
                          <div className="flex items-center gap-2">
                            {/* Call History Button */}
                            <motion.button
                              onClick={() => {
                                console.log('📋 View history for:', reminder.fcm_customers?.name);
                                handleViewTimeline(reminder.fcm_customers);
                              }}
                              className="
                                bg-slate-100 text-slate-600 
                                px-3 py-3 rounded-xl
                                min-h-[44px] min-w-[44px] flex items-center justify-center
                                active:scale-95 transition-transform duration-200
                                hover:bg-slate-200 hover:text-slate-700
                              "
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                              whileTap={{ scale: 0.95 }}
                              title="Call History"
                            >
                              <History className="w-4 h-4" />
                            </motion.button>

                            {/* Profile Button */}
                            <motion.button
                              onClick={() => {
                                console.log('👤 View profile for:', reminder.fcm_customers?.name);
                                // This would need to be implemented in the parent component
                                // For now, we'll use the same function as the Customer Tab
                                if (window.handleViewProfile) {
                                  window.handleViewProfile(reminder.fcm_customers);
                                }
                              }}
                              className="
                                bg-slate-100 text-slate-600 
                                px-3 py-3 rounded-xl
                                min-h-[44px] min-w-[44px] flex items-center justify-center
                                active:scale-95 transition-transform duration-200
                                hover:bg-slate-200 hover:text-slate-700
                              "
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                              whileTap={{ scale: 0.95 }}
                              title="Profile"
                            >
                              <User className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </div>

                      {/* Latest Notes Section - Full Width Collapsible */}
                      {reminder.remarks && (
                        <div className="px-5 pb-4">
                          <Accordion
                            title="Latest Notes"
                            icon={AlertCircle}
                            defaultExpanded={false}
                            className="bg-blue-50/50 border-blue-200"
                            titleClassName="hover:bg-blue-100"
                          >
                            <div className="text-sm text-slate-700 bg-white rounded-lg p-4">
                              <p className="leading-relaxed">{reminder.remarks}</p>
                            </div>
                          </Accordion>
                        </div>
                      )}

                      {/* Additional Follow-up Info Pill Row (if needed) */}
                      {reminder.call_date && (
                        <div className="px-5 pb-4">
                          <div className="flex items-center gap-2">
                            <motion.div
                              className="
                                bg-slate-100 text-slate-600 px-3 py-2 rounded-full text-xs font-medium
                                min-h-[32px] flex items-center gap-2
                              "
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                            >
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Last called: {formatDateLocal(reminder.call_date)}</span>
                            </motion.div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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

      {/* Timeline Modal */}
      <AnimatePresence>
        {showTimeline && timelineCustomer && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTimeline(false)}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl border border-white/30"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <History className="w-6 h-6" />
                    <div>
                      <h2 className="text-xl font-semibold">
                        Call History
                      </h2>
                      <p className="text-emerald-100">
                        {timelineCustomer.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTimeline(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {isLoadingTimeline ? (
                  <div className="flex justify-center py-8">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                ) : timelineData.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">
                      No call history
                    </h3>
                    <p className="text-slate-500">
                      This customer has no recorded calls yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timelineData
                      .sort((a, b) => new Date(b.call_date) - new Date(a.call_date)) // Sort by date desc (latest first)
                      .map((record, index) => {
                        const StatusIcon = getStatusIcon(record.call_status);
                        const isLatest = index === 0; // First item after sorting is latest
                        return (
                          <div
                            key={record.id}
                            className={`
                              border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg
                              ${isLatest
                                ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/30 shadow-emerald-500/10'
                                : 'border-slate-200 bg-white/60 hover:bg-slate-50/60'
                              }
                            `}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <StatusIcon className={`w-5 h-5 ${isLatest ? 'text-emerald-600' : 'text-slate-600'}`} />
                                <span className={`
                                  px-3 py-1 rounded-full text-xs font-medium
                                  ${isLatest
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : getStatusColor(record.call_status)
                                  }
                                `}>
                                  {formatStatus(record.call_status)}
                                  {isLatest && ' • Latest'}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 font-medium">
                                Agent: {record.agent_pin}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
                              <div>
                                <span className="font-medium text-slate-700">Call Date:</span>
                                <br />
                                <span className={isLatest ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                                  {formatDateLocal(record.call_date)}
                                </span>
                              </div>
                              {record.next_call_date && (
                                <div>
                                  <span className="font-medium text-slate-700">Next Call:</span>
                                  <br />
                                  <span className={isLatest ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                                    {formatDateLocal(record.next_call_date)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {record.remarks && (
                              <div className={`
                                rounded-2xl p-4 border
                                ${isLatest
                                  ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
                                  : 'bg-gradient-to-r from-slate-50 to-blue-50/30 border-slate-100'
                                }
                              `}>
                                <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                                  {isLatest ? 'Latest Note' : 'Call Notes'}
                                </p>
                                <p className={`text-sm leading-relaxed ${isLatest ? 'text-slate-800' : 'text-slate-700'}`}>
                                  {record.remarks}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSV Import Modal */}
      <CSVImport
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        importType={csvImportType}
        onImportSuccess={handleCSVImportSuccess}
      />
    </div>
  );
};

export default Reminders;