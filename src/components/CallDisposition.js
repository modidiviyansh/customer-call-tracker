import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Clock, Phone, UserX } from 'lucide-react';
import { useCallRecords } from '../hooks/useCustomerData';

const CallDisposition = ({ customer, agentPin, onClose, onSubmit }) => {
  const [disposition, setDisposition] = useState('');
  const [remarks, setRemarks] = useState('');
  const [nextReminder, setNextReminder] = useState('');
  const [duration, setDuration] = useState('');
  const [outcomeScore, setOutcomeScore] = useState(5);
  const { createCallRecord, loading } = useCallRecords();

  const dispositionOptions = [
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600' },
    { value: 'no_answer', label: 'No Answer', icon: Phone, color: 'text-gray-600' },
    { value: 'busy', label: 'Busy', icon: Phone, color: 'text-orange-600' },
    { value: 'follow_up', label: 'Follow Up', icon: Clock, color: 'text-blue-600' },
    { value: 'invalid', label: 'Invalid Number', icon: XCircle, color: 'text-red-600' },
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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl border border-white/20"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-luxury font-semibold text-slate-800">
              Call Disposition
            </h2>
            <p className="text-slate-600">
              {customer?.name} • {customer?.mobile_number}
            </p>
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
              Call Status *
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
              Next Reminder Date
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
              className="btn-luxury-outline px-6 py-3 rounded-full min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!disposition || loading}
              className="btn-luxury px-8 py-3 rounded-full min-h-[44px] disabled:opacity-50 hover:scale-105"
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