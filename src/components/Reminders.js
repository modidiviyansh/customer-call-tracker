import React, { useState, useEffect } from 'react';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-luxury font-semibold text-slate-800">
          Call Reminders
        </h2>
        <div className="text-sm text-slate-600">
          {currentReminders.length} reminder{currentReminders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Reminder Tabs */}
      <div className="flex justify-center">
        <div className="glass-card p-2 flex space-x-2">
          {reminderTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all
                  ${activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-luxury'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                  }
                `}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.data.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {tab.data.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {currentReminders.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            {activeTab === 'overdue' && 'No overdue reminders'}
            {activeTab === 'today' && 'No reminders for today'}
            {activeTab === 'upcoming' && 'No upcoming reminders this week'}
          </h3>
          <p className="text-slate-500">
            {activeTab === 'overdue' && 'Great! All past reminders have been addressed.'}
            {activeTab === 'today' && 'No calls scheduled for today.'}
            {activeTab === 'upcoming' && 'No calls scheduled for the coming week.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentReminders.map((reminder) => {
            const StatusIcon = getStatusIcon(reminder.call_status);
            return (
              <div
                key={reminder.id}
                className="card-luxury-minimal p-6 hover:shadow-luxury transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <StatusIcon className="w-5 h-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-800">
                        {reminder.fcm_customers?.name}
                      </h3>
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-medium border
                        ${getStatusColor(reminder.call_status)}
                      `}>
                        {formatStatus(reminder.call_status)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4" />
                        <span>{reminder.fcm_customers?.mobile_number || 'No phone'}</span>
                      </div>

                      {reminder.remarks && (
                        <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                          <p className="font-medium text-slate-800 mb-1">Notes:</p>
                          <p>{reminder.remarks}</p>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {activeTab === 'overdue' && 'Was due: '}
                          {activeTab === 'today' && 'Due today: '}
                          {activeTab === 'upcoming' && 'Scheduled for: '}
                          {new Date(reminder.next_call_date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-slate-500">
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
                      className="btn-luxury text-sm"
                    >
                      {activeTab === 'overdue' ? 'Call Now' : 'Call Now'}
                    </button>
                  </div>
                </div>
              </div>
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