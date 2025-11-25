import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';

const CSVImport = ({ isOpen, onClose, importType, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);
  const { success } = useToast();

  const getTemplateData = () => {
    if (importType === 'customers') {
      return {
        filename: 'customer-template.csv',
        headers: ['name', 'mobile'],
        sampleData: [
          'John Doe,9876543210',
          'Jane Smith,8765432109',
          'Raj Patel,7654321098'
        ]
      };
    } else {
      return {
        filename: 'reminder-template.csv',
        headers: ['customer_mobile', 'reminder_text', 'reminder_date'],
        sampleData: [
          '9876543210,Follow up call,2025-01-15',
          '8765432109,Product demo,2025-01-20',
          '7654321098,Invoice reminder,2025-01-25'
        ]
      };
    }
  };

  const downloadTemplate = () => {
    const template = getTemplateData();
    const csvContent = [template.headers.join(','), ...template.sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.filename;
    a.click();
    window.URL.revokeObjectURL(url);
    success('Template downloaded successfully!');
  };

  const validateCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const template = getTemplateData();
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const expectedHeaders = template.headers.map(h => h.toLowerCase());
    
    // Check if headers match
    const headersMatch = expectedHeaders.every(header => headers.includes(header));
    if (!headersMatch) {
      throw new Error(`Invalid headers. Expected: ${expectedHeaders.join(', ')}. Got: ${headers.join(', ')}`);
    }

    return lines.slice(1); // Return data rows only
  };

  const parseCustomers = (dataRows) => {
    const customers = [];
    const errors = [];

    dataRows.forEach((row, index) => {
      const cols = row.split(',').map(c => c.trim());
      const name = cols[0];
      const mobile = cols[1];

      if (!name) {
        errors.push(`Row ${index + 2}: Customer name is required`);
        return;
      }

      if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
        errors.push(`Row ${index + 2}: Invalid mobile number format (should be 10 digits starting with 6-9)`);
        return;
      }

      customers.push({
        name: name,
        mobile_number: mobile,
        address_details: {}
      });
    });

    return { customers, errors };
  };

  const parseReminders = (dataRows) => {
    const reminders = [];
    const errors = [];

    dataRows.forEach((row, index) => {
      const cols = row.split(',').map(c => c.trim());
      const customer_mobile = cols[0];
      const reminder_text = cols[1];
      const reminder_date = cols[2];

      if (!customer_mobile) {
        errors.push(`Row ${index + 2}: Customer mobile number is required`);
        return;
      }

      if (!/^[6-9]\d{9}$/.test(customer_mobile)) {
        errors.push(`Row ${index + 2}: Invalid customer mobile number format`);
        return;
      }

      if (!reminder_text) {
        errors.push(`Row ${index + 2}: Reminder text is required`);
        return;
      }

      if (!reminder_date || !/^\d{4}-\d{2}-\d{2}$/.test(reminder_date)) {
        errors.push(`Row ${index + 2}: Invalid date format (should be YYYY-MM-DD)`);
        return;
      }

      reminders.push({
        customer_mobile,
        reminder_text,
        reminder_date
      });
    });

    return { reminders, errors };
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrors([]);

    try {
      const text = await file.text();
      const dataRows = validateCSV(text);

      let processedData;
      if (importType === 'customers') {
        processedData = parseCustomers(dataRows);
      } else {
        processedData = parseReminders(dataRows);
      }

      setProcessedData(processedData);
      
      if (processedData.errors.length > 0) {
        setErrors(processedData.errors);
      }

    } catch (err) {
      setErrors([err.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!processedData) return;

    const importData = importType === 'customers' 
      ? processedData.customers 
      : processedData.reminders;

    onImportSuccess(importType, importData);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setProcessedData(null);
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  const template = getTemplateData();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl border border-white/30"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-luxury font-semibold text-slate-800">
                  Bulk {importType === 'customers' ? 'Customer' : 'Reminder'} Import
                </h2>
                <p className="text-slate-600 text-sm">
                  Import {importType} from CSV file
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Template Download */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-slate-600" />
                <div>
                  <h3 className="font-semibold text-slate-800">CSV Template</h3>
                  <p className="text-sm text-slate-600">Download template with correct format</p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
            <div className="mt-3 text-sm text-slate-600">
              <p className="font-medium">Expected columns: {template.headers.join(', ')}</p>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-800 mb-3">
              Select CSV File
            </label>
            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 mb-2">
                Click to select CSV file or drag and drop
              </p>
              <p className="text-sm text-slate-500">
                Supported format: .csv files only
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
            />
            {file && (
              <p className="mt-2 text-sm text-green-600 font-medium">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* Process Button */}
          {file && (
            <div className="mb-6">
              <button
                onClick={processFile}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-800 to-blue-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Process File'}
              </button>
            </div>
          )}

          {/* Results */}
          {processedData && (
            <div className="space-y-4">
              {/* Success Summary */}
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Import Summary</h3>
                </div>
                <p className="text-sm text-green-700">
                  {importType === 'customers' 
                    ? `${processedData.customers.length} customers ready to import`
                    : `${processedData.reminders.length} reminders ready to import`
                  }
                </p>
                {errors.length > 0 && (
                  <p className="text-sm text-amber-700 mt-1">
                    {errors.length} issues found (see below)
                  </p>
                )}
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-800">Issues Found</h3>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {errors.map((err, index) => (
                      <p key={index} className="text-sm text-red-700">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-3">Preview</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(importType === 'customers' ? processedData.customers : processedData.reminders)
                    .slice(0, 5)
                    .map((item, index) => (
                      <div key={index} className="text-sm p-2 bg-white rounded border">
                        {importType === 'customers' 
                          ? `${item.name} - ${item.mobile_number}`
                          : `${item.customer_mobile}: ${item.reminder_text} (${item.reminder_date})`
                        }
                      </div>
                    ))
                  }
                  {(importType === 'customers' ? processedData.customers : processedData.reminders).length > 5 && (
                    <p className="text-sm text-slate-500">
                      ... and {importType === 'customers' 
                        ? processedData.customers.length - 5
                        : processedData.reminders.length - 5
                      } more items
                    </p>
                  )}
                </div>
              </div>

              {/* Import Button */}
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-slate-200 text-slate-800 py-3 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 bg-gradient-to-r from-green-700 to-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Import {importType === 'customers' ? 'Customers' : 'Reminders'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CSVImport;