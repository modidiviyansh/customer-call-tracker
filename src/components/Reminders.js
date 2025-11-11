import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Phone, User, Calendar, AlertCircle, AlertTriangle, Filter, History, X, Upload } from 'lucide-react';
import { supabase } from '../services/supabase';
import CallDisposition from './CallDisposition';
import CSVImport from './CSVImport';
import { useToast } from './Toast';

const Reminders = ({ agentPin }) => {
  const { success } = useToast();
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
            mobile_number
          )
        `)
        .eq('agent_pin', agentPin)
        .not('next_call_date', 'is', null)
        .order('next_call_date', { ascending: true });

      if (error) throw error;

      // Group by customer_id and next_call_date, keep latest per group
      const groupedReminders = new Map();
      const dispositions = new Set();

      (data || []).forEach(reminder => {
        const reminderDate = new Date(reminder.next_call_date);
        reminderDate.setHours(0, 0, 0, 0);

        // Create unique key for customer + next_call_date combination
        const key = `${reminder.customer_id}_${reminder.next_call_date}`;
        
        const existing = groupedReminders.get(key);
        if (!existing || new Date(reminder.updated_at || reminder.call_date) > new Date(existing.updated_at || existing.call_date)) {
          groupedReminders.set(key, reminder);
        }

        // Track available dispositions
        if (reminder.call_status) {
          dispositions.add(reminder.call_status);
        }
      });

      // Set available dispositions
      setAvailableDispositions(Array.from(dispositions));

      // Categorize reminders
      const categorized = {
        overdue: [],
        today: [],
        upcoming: []
      };

      groupedReminders.forEach(reminder => {
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

  const handleCSVImportSuccess = (importType, importData) => {
    if (importType === 'reminders') {
      // For reminders, we would need to implement reminder creation logic
      console.log('Reminder import successful:', importData);
      success(`Successfully processed ${importData.length} reminders! (Reminder creation logic needs to be implemented)`);
      fetchAllReminders(agentPin); // Refresh the reminders list
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
      follow_up: 'text-blue-600 bg-blue-50 border-blue-200',
      completed: 'text-green-600 bg-green-50 border-green-200',
      no_answer: 'text-gray-600 bg-gray-50 border-gray-200',
      busy: 'text-orange-600 bg-orange-50 border-orange-200',
      invalid: 'text-red-600 bg-red-50 border-red-200',
      not_interested: 'text-red-500 bg-red-50 border-red-200',
    };
    return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200';
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
    { id: 'upcoming', label: 'This Week', icon: Calendar, color: 'text-green-600', data: reminders.upcoming }
  ];


  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-xl font-luxury font-semibold text-slate-800">
          Call Reminders
        </h2>
        <button
          onClick={() => handleImportCSV('reminders')}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full px-3 py-2 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 flex items-center space-x-2 font-semibold min-h-[44px] text-xs sm:text-sm touch-manipulation"
        >
          <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
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
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-xl shadow-blue-500/25'
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
                      text-xs rounded-full px-3 py-1.5 font-bold min-w-[24px] h-6 flex items-center justify-center
                      ${isActive
                        ? 'bg-white/30 text-white backdrop-blur-sm'
                        : 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md'
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
            <span className="text-sm font-semibold text-slate-700">Filter by disposition:</span>
          </div>
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
            {/* All Filter Pill */}
            <motion.button
              onClick={() => setSelectedDispositions([])}
              className={`
                flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all duration-300 relative
                min-h-[44px] flex-shrink-0
                ${selectedDispositions.length === 0
                  ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg shadow-slate-500/25'
                  : 'bg-white/80 text-slate-600 hover:text-slate-800 hover:bg-white hover:shadow-md border border-slate-200/50'
                }
              `}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              animate={{
                scale: selectedDispositions.length === 0 ? 1.05 : 1,
                y: selectedDispositions.length === 0 ? -1 : 0
              }}
            >
              <span className="text-sm">All</span>
              <motion.span
                className={`
                  text-xs rounded-full px-2.5 py-1 font-bold min-w-[20px] h-5 flex items-center justify-center
                  ${selectedDispositions.length === 0
                    ? 'bg-white/30 text-white backdrop-blur-sm'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
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
                    flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all duration-300 relative
                    min-h-[44px] flex-shrink-0
                    ${isSelected
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/80 text-slate-600 hover:text-slate-800 hover:bg-white hover:shadow-md border border-slate-200/50'
                    }
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
                        : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
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
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10"
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
                  ? (activeTab === 'overdue' && 'No overdue reminders') ||
                    (activeTab === 'today' && 'No reminders for today') ||
                    (activeTab === 'upcoming' && 'No upcoming reminders this week')
                  : `No ${selectedDispositions.map(d => formatStatus(d).toLowerCase()).join(' or ')} reminders ${activeTab === 'today' ? 'today' : activeTab === 'overdue' ? 'overdue' : 'this week'}`
                }
              </h3>
              <p className="text-base text-slate-500">
                {selectedDispositions.length === 0
                  ? (activeTab === 'overdue' && 'Great! All past reminders have been addressed.') ||
                    (activeTab === 'today' && 'No calls scheduled for today.') ||
                    (activeTab === 'upcoming' && 'No calls scheduled for the coming week.')
                  : `No contacts with ${selectedDispositions.map(d => formatStatus(d).toLowerCase()).join(' or ')} status in this time period.`
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
                    transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                    className="w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-6">
                      {/* Left Content Stack */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-4">
                          <StatusIcon className="w-5 h-5 text-slate-600 flex-shrink-0" />
                          <h3 className="text-lg font-semibold text-slate-800 truncate">
                            {reminder.fcm_customers?.name}
                          </h3>
                          <span className={`
                            px-3 py-1 rounded-full text-xs font-medium border shadow-sm flex-shrink-0
                            ${getStatusColor(reminder.call_status)}
                          `}>
                            {formatStatus(reminder.call_status)}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-base text-slate-600">
                            <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{reminder.fcm_customers?.mobile_number || 'No phone'}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-base text-slate-500">
                            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span>
                              {activeTab === 'overdue' && 'Next follow-up: '}
                              {activeTab === 'today' && 'Due today: '}
                              {activeTab === 'upcoming' && 'Scheduled: '}
                              {new Date(reminder.next_call_date).toLocaleDateString()}
                            </span>
                          </div>

                          {reminder.remarks && (
                            <div className="text-sm text-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl p-4 border border-slate-100">
                              <p className="font-medium text-slate-800 mb-1 text-xs uppercase tracking-wide">Latest Note</p>
                              <p className="leading-relaxed">{reminder.remarks}</p>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 text-sm text-slate-400">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span>Last called: {new Date(reminder.call_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex flex-col space-y-3 flex-shrink-0">
                        <button
                          onClick={() => {
                            console.log('🔄 Reminder Call Now clicked for:', reminder.fcm_customers?.name);
                            setSelectedCustomer(reminder.fcm_customers);
                            setShowDisposition(true);
                          }}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl px-6 py-4 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 text-base font-semibold flex items-center space-x-3 min-h-[64px] w-32 justify-center touch-manipulation relative z-20 active:scale-95"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <Phone className="w-5 h-5" />
                          <span>Call</span>
                        </button>
                        <button
                          onClick={() => {
                            console.log('📅 Timeline view clicked for:', reminder.fcm_customers?.name);
                            handleViewTimeline(reminder.fcm_customers);
                          }}
                          className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl px-6 py-4 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 text-base font-semibold flex items-center space-x-3 min-h-[64px] w-32 justify-center touch-manipulation relative z-20 active:scale-95"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <History className="w-5 h-5" />
                          <span>History</span>
                        </button>
                      </div>
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
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white p-6">
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
                                  {new Date(record.call_date).toLocaleDateString()}
                                </span>
                              </div>
                              {record.next_call_date && (
                                <div>
                                  <span className="font-medium text-slate-700">Next Call:</span>
                                  <br />
                                  <span className={isLatest ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                                    {new Date(record.next_call_date).toLocaleDateString()}
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