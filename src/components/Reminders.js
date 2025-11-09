import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Phone, User, Calendar, AlertCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../services/supabase';
import CallDisposition from './CallDisposition';

const Reminders = ({ agentPin }) => {
  const [reminders, setReminders] = useState({
    overdue: [],
    today: [],
    upcoming: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDisposition, setShowDisposition] = useState(false);
  const [activeTab, setActiveTab] = useState('today');

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
      const todayStr = today.toISOString().split('T')[0];

      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      // Fetch all reminders for the agent
      const { data, error } = await supabase
        .from('fcm_call_logs')
        .select(`
          id,
          next_call_date,
          remarks,
          call_status,
          call_date,
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

      // Categorize reminders
      const categorized = {
        overdue: [],
        today: [],
        upcoming: []
      };

      (data || []).forEach(reminder => {
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

  const currentReminders = reminders[activeTab] || [];

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-luxury font-semibold text-slate-800">
          Call Reminders
        </h2>
        <div className="text-lg text-slate-600 font-medium">
          {currentReminders.length} reminder{currentReminders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Reminder Tabs - Mobile First */}
      <div className="flex justify-center">
        <div className="glass-card-gradient p-2 flex space-x-2 overflow-x-auto shadow-gradient hover:shadow-luxury-lg hover:scale-105 transition-all duration-300">
          {reminderTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-3 rounded-full font-medium transition-all duration-300
                  min-h-[44px] whitespace-nowrap touch-manipulation
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#FFD700] to-[#09c6f9] text-white shadow-luxury-lg scale-105'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/80 hover:scale-105'
                  }
                `}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
                {tab.data.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                    {tab.data.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {currentReminders.length === 0 ? (
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            {activeTab === 'overdue' && 'No overdue reminders'}
            {activeTab === 'today' && 'No reminders for today'}
            {activeTab === 'upcoming' && 'No upcoming reminders this week'}
          </h3>
          <p className="text-base text-slate-500">
            {activeTab === 'overdue' && 'Great! All past reminders have been addressed.'}
            {activeTab === 'today' && 'No calls scheduled for today.'}
            {activeTab === 'upcoming' && 'No calls scheduled for the coming week.'}
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-y-4">
          {currentReminders.map((reminder, index) => {
            const StatusIcon = getStatusIcon(reminder.call_status);
            return (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                className="glass-card-gradient p-6 hover:shadow-luxury-lg hover:scale-105 transition-all duration-300 shadow-gradient"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <StatusIcon className="w-5 h-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-800">
                        {reminder.fcm_customers?.name}
                      </h3>
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-medium border shadow-sm
                        ${getStatusColor(reminder.call_status)}
                      `}>
                        {formatStatus(reminder.call_status)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-y-2">
                      <div className="flex items-center space-x-2 text-lg text-slate-600">
                        <Phone className="w-4 h-4" />
                        <span>{reminder.fcm_customers?.mobile_number || 'No phone'}</span>
                      </div>

                      {reminder.remarks && (
                        <div className="text-lg text-slate-700 bg-slate-50 rounded-lg p-3">
                          <p className="font-medium text-slate-800 mb-1">Notes:</p>
                          <p>{reminder.remarks}</p>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-lg text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {activeTab === 'overdue' && 'Was due: '}
                          {activeTab === 'today' && 'Due today: '}
                          {activeTab === 'upcoming' && 'Scheduled for: '}
                          {new Date(reminder.next_call_date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-lg text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>Last called: {new Date(reminder.call_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCustomer(reminder.fcm_customers);
                        setShowDisposition(true);
                      }}
                      className="btn-luxury text-sm font-semibold min-h-[44px] px-6 rounded-full hover:scale-105 transition-all duration-300 touch-manipulation"
                    >
                      Call Now
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

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
    </div>
  );
};

export default Reminders;