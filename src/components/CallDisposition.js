import React, { useState } from 'react';
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
        
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
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Disposition Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Call Status *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {dispositionOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDisposition(option.value)}
                    className={`
                      p-4 rounded-2xl border-2 text-left transition-all
                      ${disposition === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`w-5 h-5 ${option.color}`} />
                      <span className="font-medium text-slate-800">{option.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Call Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Call Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input-luxury w-full"
                placeholder="0"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Outcome Score (1-10)
              </label>
              <select
                value={outcomeScore}
                onChange={(e) => setOutcomeScore(parseInt(e.target.value))}
                className="input-luxury w-full"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                  <option key={score} value={score}>{score}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Next Reminder */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Next Reminder Date
            </label>
            <input
              type="date"
              value={nextReminder}
              onChange={(e) => setNextReminder(e.target.value)}
              className="input-luxury w-full"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="input-luxury w-full h-24 resize-none"
              placeholder="Add call notes, follow-up requirements, or customer feedback..."
            />
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-luxury-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!disposition || loading}
              className="btn-luxury disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Disposition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CallDisposition;