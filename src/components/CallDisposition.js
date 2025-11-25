import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, XCircle, Clock, Phone, UserX } from 'lucide-react';
import { useCallRecords } from '../hooks/useCustomerData';

const CallDisposition = ({ customer, agentPin, onClose, onSubmit }) => {
  const [disposition, setDisposition] = useState('');
  const [remarks, setRemarks] = useState('');
  const [nextReminder, setNextReminder] = useState('');
  const [duration, setDuration] = useState('');
  const [outcomeScore, setOutcomeScore] = useState(5);
  const [calledMobileNumber, setCalledMobileNumber] = useState('');
  const { createCallRecord, loading } = useCallRecords();

  // Get available mobile numbers for the customer
  const availableMobileNumbers = React.useMemo(() => {
    const numbers = [];
    if (customer?.mobile1) numbers.push({ value: customer.mobile1, label: `Primary: ${customer.mobile1}` });
    if (customer?.mobile2) numbers.push({ value: customer.mobile2, label: `Secondary: ${customer.mobile2}` });
    if (customer?.mobile3) numbers.push({ value: customer.mobile3, label: `Tertiary: ${customer.mobile3}` });
    // Fallback for old schema
    if (customer?.mobile_number && !customer?.mobile1) {
      numbers.push({ value: customer.mobile_number, label: customer.mobile_number });
    }
    return numbers;
  }, [customer]);

  // Set default mobile number when component mounts
  React.useEffect(() => {
    if (availableMobileNumbers.length > 0 && !calledMobileNumber) {
      setCalledMobileNumber(availableMobileNumbers[0].value);
    }
  }, [availableMobileNumbers, calledMobileNumber]);

  const dispositionOptions = [
    { value: 'completed', label: 'Call Completed', icon: CheckCircle, color: 'text-green-600' },
    { value: 'no_answer', label: 'No Response', icon: Phone, color: 'text-gray-600' },
    { value: 'busy', label: 'Line Busy', icon: Phone, color: 'text-orange-600' },
    { value: 'follow_up', label: 'Schedule Callback', icon: Clock, color: 'text-blue-600' },
    { value: 'invalid', label: 'Number Not Working', icon: XCircle, color: 'text-red-600' },
    { value: 'not_interested', label: 'Not Interested', icon: UserX, color: 'text-red-500' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!disposition) return;

    const callData = {
      customer_id: customer.id,
      agent_pin: agentPin,
      call_status: disposition,
      remarks: remarks.trim() || null,
      next_call_date: nextReminder || null,
      call_duration_seconds: duration ? parseInt(duration) * 60 : null, // Convert minutes to seconds
      outcome_score: outcomeScore,
      called_mobile_number: calledMobileNumber || null, // Track which number was called
    };

    // Create remarks history log
    const remarksLog = {
      customer_id: customer.id,
      call_date: new Date().toISOString(),
      remarks: remarks.trim(),
      call_status: disposition,
      agent_pin: agentPin,
      outcome_score: outcomeScore
    };

    const result = await createCallRecord(callData);
    if (result.data && onSubmit) {
      // Log remarks history (in a real app, this would be saved to a remarks_history table)
      console.log('Remarks history logged:', remarksLog);
      onSubmit(result.data);
    }
    onClose();
  };

  return (
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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl bg-white/95 backdrop-blur-xl border border-white/30"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-luxury font-semibold text-slate-800">
              Call Disposition
            </h2>
            <p className="text-slate-600">
              {customer?.name} • {customer?.mobile1 || customer?.mobile_number || 'No mobile'}
            </p>
            {/* Show additional mobile numbers if available */}
            {(customer?.mobile2 || customer?.mobile3) && (
              <p className="text-sm text-slate-500 mt-1">
                {customer?.mobile2 && `Alt: ${customer.mobile2}`}
                {customer?.mobile2 && customer?.mobile3 && ' • '}
                {customer?.mobile3 && `${customer.mobile3}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-all duration-300 hover:scale-110"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Disposition Selection */}
          <div>
            <label className="block text-base font-semibold text-slate-800 mb-4">
              Call Result *
            </label>
            <div className="grid grid-cols-1 gap-3">
              {dispositionOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => setDisposition(option.value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      p-5 rounded-xl border-2 text-left transition-all duration-300 min-h-[72px]
                      ${disposition === option.value
                        ? 'border-gradient-to-r from-[#FFD700] to-[#09c6f9] bg-gradient-to-r from-blue-50 to-teal-50 shadow-lg'
                        : 'border-slate-300 hover:border-blue-400 bg-white/90 backdrop-blur-sm hover:bg-white'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-4">
                      <IconComponent className={`w-6 h-6 ${option.color}`} />
                      <span className="font-semibold text-slate-800 text-lg">{option.label}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Mobile Number Selection - Only show if customer has multiple numbers */}
          {availableMobileNumbers.length > 1 && (
            <div>
              <label className="block text-base font-semibold text-slate-800 mb-3">
                Mobile Number Called *
              </label>
              <select
                value={calledMobileNumber}
                onChange={(e) => setCalledMobileNumber(e.target.value)}
                className="w-full p-4 rounded-xl border-2 bg-white/80 backdrop-blur-sm text-lg font-medium min-h-[56px] transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-slate-300"
                required
              >
                {availableMobileNumbers.map((mobile) => (
                  <option key={mobile.value} value={mobile.value}>
                    {mobile.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-slate-500 mt-2">
                Select which mobile number you called for this customer
              </p>
            </div>
          )}

          {/* Call Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-base font-semibold text-slate-800 mb-3">
                Call Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-4 rounded-xl border-2 bg-white/80 backdrop-blur-sm text-lg font-medium min-h-[56px] transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-slate-300"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-slate-800 mb-3">
                Outcome Score (1-10)
              </label>
              <select
                value={outcomeScore}
                onChange={(e) => setOutcomeScore(parseInt(e.target.value))}
                className="w-full p-4 rounded-xl border-2 bg-white/80 backdrop-blur-sm text-lg font-medium min-h-[56px] transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-slate-300"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                  <option key={score} value={score}>{score}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Next Reminder */}
          <div>
            <label className="block text-base font-semibold text-slate-800 mb-3">
              Schedule Next Call
            </label>
            <input
              type="date"
              value={nextReminder}
              onChange={(e) => setNextReminder(e.target.value)}
              className="w-full p-4 rounded-xl border-2 bg-white/80 backdrop-blur-sm text-lg font-medium min-h-[56px] transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-slate-300"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-base font-semibold text-slate-800 mb-3">
              Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-4 rounded-xl border-2 bg-white/80 backdrop-blur-sm text-lg min-h-[120px] resize-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-slate-300"
              placeholder="Add call notes, follow-up requirements, or customer feedback..."
            />
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200/50">
            <button
              type="button"
              onClick={onClose}
              className="bg-white/90 backdrop-blur-lg text-slate-700 border border-white/30 rounded-full px-6 py-3 shadow-lg shadow-slate-500/10 hover:shadow-xl hover:shadow-slate-500/20 transition-all duration-300 text-base font-semibold min-h-[44px] hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!disposition || loading}
              className="bg-gradient-to-r from-blue-800 to-blue-700 text-white rounded-full px-8 py-3 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 text-base font-semibold min-h-[44px] disabled:opacity-50 hover:scale-105"
            >
              {loading ? 'Saving...' : 'Save Disposition'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CallDisposition;