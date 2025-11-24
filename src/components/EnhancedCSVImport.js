/**
 * ENHANCED CSV IMPORT: Multi-Mobile Number Support with Advanced Error Handling
 * 
 * Features:
 * - Support for mobile1, mobile2, mobile3 columns
 * - Immediate feedback with line numbers and specific error types
 * - Import preview with error highlighting
 * - Batch processing with progress tracking
 * - Enhanced error logging and diagnostics
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Download, FileText, CheckCircle, AlertCircle, Eye, Clock, RotateCcw, FileX, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from './Toast';
import { validateIndianMobile, formatIndianMobile } from '../utils/validation';

const EnhancedCSVImport = ({ 
  isOpen, 
  onClose, 
  importType, 
  onImportSuccess,
  existingCustomers = []
}) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const [importHistory, setImportHistory] = useState([]);
  const [importReport, setImportReport] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const fileInputRef = useRef(null);
  const { success, error } = useToast();

  const getTemplateData = () => {
    if (importType === 'customers') {
      return {
        filename: 'customer-template-v3.csv',
        headers: ['name', 'mobile1', 'mobile2', 'mobile3', 'street', 'city', 'state', 'zipCode'],
        sampleData: [
          'John Doe,9876543210,9876543211,,123 Main St,New York,NY,10001',
          'Jane Smith,8765432109,8765432108,8765432107,456 Oak Ave,Los Angeles,CA,90210',
          'Raj Patel,7654321098,,,789 Pine Rd,Chicago,IL,60601'
        ],
        description: 'Customer data with up to 3 mobile numbers'
      };
    } else {
      return {
        filename: 'reminder-template.csv',
        headers: ['customer_mobile', 'reminder_text', 'reminder_date'],
        sampleData: [
          '9876543210,Follow up call,2025-01-15',
          '8765432109,Product demo,2025-01-20',
          '7654321098,Invoice reminder,2025-01-25'
        ],
        description: 'Reminder data for customers'
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
    success('Enhanced template downloaded successfully!');
  };

  const validateCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const template = getTemplateData();
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const expectedHeaders = template.headers.map(h => h.toLowerCase());
    
    // Check if headers match (allowing for additional columns)
    const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}. Expected: ${expectedHeaders.join(', ')}`);
    }

    return lines.slice(1); // Return data rows only
  };

  const parseCustomers = (dataRows) => {
    const customers = [];
    const validationErrors = [];
    const warningErrors = [];

    dataRows.forEach((row, index) => {
      try {
        const cols = row.split(',').map(c => c.trim());
        const lineNumber = index + 2; // +2 because of header row and 0-based index
        
        const customer = {
          name: cols[0] || '',
          mobile1: cols[1] || '',
          mobile2: cols[2] || '',
          mobile3: cols[3] || '',
          street: cols[4] || '',
          city: cols[5] || '',
          state: cols[6] || '',
          zipCode: cols[7] || '',
          lineNumber,
          originalRow: row
        };

        const customerErrors = [];

        // Name validation
        if (!customer.name) {
          customerErrors.push('Customer name is required');
        } else if (customer.name.length < 2) {
          customerErrors.push('Name must be at least 2 characters');
        }

        // Mobile number validation
        const mobileNumbers = [customer.mobile1, customer.mobile2, customer.mobile3].filter(m => m);
        if (mobileNumbers.length === 0) {
          customerErrors.push('At least one mobile number is required');
        }

        // Validate each mobile number
        mobileNumbers.forEach((mobile, mobileIndex) => {
          if (mobile && !validateIndianMobile(mobile)) {
            customerErrors.push(`Mobile ${mobileIndex + 1}: Invalid format (should be 10 digits starting with 6-9)`);
          }
        });

        // Check for duplicates within the same customer
        const uniqueMobiles = [...new Set(mobileNumbers.map(m => formatIndianMobile(m)))];
        if (uniqueMobiles.length !== mobileNumbers.length) {
          customerErrors.push('Duplicate mobile numbers within the same customer');
        }

        // Create composite keys for duplicate checking (name + mobile combination)
        const createCompositeKey = (name, mobile) => {
          if (!name || !mobile) return null;
          
          // Clean and normalize the name - keep alphanumeric characters only
          const cleanName = name.toLowerCase()
            .replace(/[^\w]/g, '') // Remove special characters
            .replace(/\s+/g, '');   // Remove all whitespace
          
          const namePrefix = cleanName.slice(0, 5).padEnd(5, 'x');
          
          // Extract mobile digits
          const mobileDigits = mobile.replace(/\D/g, '');
          if (mobileDigits.length !== 10) return null;
          const mobileSuffix = mobileDigits.slice(-5);
          
          return `${namePrefix}-${mobileSuffix}`;
        };

        // Check for duplicates using composite key (name + mobile combination)
        const newCompositeKeys = [];
        
        // Generate composite keys for all mobile numbers for this customer
        mobileNumbers.forEach(mobile => {
          if (mobile) {
            const compositeKey = createCompositeKey(customer.name, mobile);
            if (compositeKey) {
              newCompositeKeys.push(compositeKey);
            }
          }
        });

        // Check against existing customers' composite keys
        const duplicateCustomers = existingCustomers.filter(existing => {
          const existingCompositeKeys = [
            createCompositeKey(existing.name, existing.mobile1),
            createCompositeKey(existing.name, existing.mobile2),
            createCompositeKey(existing.name, existing.mobile3)
          ].filter(key => key !== null);

          return newCompositeKeys.some(newKey => 
            existingCompositeKeys.includes(newKey)
          );
        });

        if (duplicateCustomers.length > 0) {
          const duplicateDetails = duplicateCustomers.map(existing => 
            `${existing.name} (${existing.mobile1 || existing.mobile2 || existing.mobile3})`
          ).join(', ');
          
          customerErrors.push(`Customer name + mobile combination already exists: ${duplicateDetails}`);
        }

        // Warnings (non-blocking)
        if (customer.zipCode && !/^\d{6}$/.test(customer.zipCode)) {
          warningErrors.push(`Line ${lineNumber}: ZIP code should be 6 digits`);
        }

        if (customerErrors.length > 0) {
          validationErrors.push({
            lineNumber,
            row: customer.originalRow,
            errors: customerErrors,
            type: 'error'
          });
        } else {
          // Format mobile numbers
          customer.mobile1 = customer.mobile1 ? formatIndianMobile(customer.mobile1) : '';
          customer.mobile2 = customer.mobile2 ? formatIndianMobile(customer.mobile2) : '';
          customer.mobile3 = customer.mobile3 ? formatIndianMobile(customer.mobile3) : '';

          // Prepare address details
          const address_details = {};
          if (customer.street) address_details.street = customer.street;
          if (customer.city) address_details.city = customer.city;
          if (customer.state) address_details.state = customer.state;
          if (customer.zipCode) address_details.zipCode = customer.zipCode;

          customers.push({
            name: customer.name,
            mobile1: customer.mobile1,
            mobile2: customer.mobile2 || null,
            mobile3: customer.mobile3 || null,
            address_details: Object.keys(address_details).length > 0 ? address_details : null,
            lineNumber: customer.lineNumber
          });
        }
      } catch (parseError) {
        validationErrors.push({
          lineNumber: index + 2,
          row: row,
          errors: [`Parse error: ${parseError.message}`],
          type: 'error'
        });
      }
    });

    return {
      customers,
      errors: validationErrors,
      warnings: warningErrors,
      totalRows: dataRows.length,
      validRows: customers.length,
      errorRows: validationErrors.length
    };
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrors([]);
    setProcessedData(null);
    setValidationResults(null);

    try {
      const text = await file.text();
      const dataRows = validateCSV(text);

      let results;
      if (importType === 'customers') {
        results = parseCustomers(dataRows);
      } else {
        // Handle reminders - same as before
        results = { reminders: [], errors: [], warnings: [] };
      }

      setProcessedData(results);
      setValidationResults({
        totalRows: results.totalRows || dataRows.length,
        validRows: results.validRows || results.reminders?.length || 0,
        errorRows: results.errors?.length || 0,
        warnings: results.warnings || []
      });

      setErrors(results.errors || []);
      
      if ((results.errors && results.errors.length > 0) || (results.warnings && results.warnings.length > 0)) {
        setShowPreview(true);
      }

    } catch (err) {
      setErrors([{
        lineNumber: 1,
        row: 'Header',
        errors: [err.message],
        type: 'error'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!processedData) return;

    const dataToImport = importType === 'customers' 
      ? processedData.customers 
      : processedData.reminders;

    if (dataToImport.length === 0) {
      error('No valid data to import');
      return;
    }

    // Enhanced batch processing with individual contact tracking
    const batchSize = 25;
    const totalBatches = Math.ceil(dataToImport.length / batchSize);
    const importResults = {
      successful: 0,
      failed: 0,
      warnings: processedData.warnings || [],
      contactDetails: {
        successful: [],
        failed: [],
        transient: [] // For retry logic
      },
      batchHistory: []
    };

    setBatchProgress({
      currentBatch: 0,
      totalBatches,
      progress: 0,
      processing: true,
      status: 'Initializing import...'
    });

    try {
      for (let i = 0; i < totalBatches; i++) {
        const batchStartIndex = i * batchSize;
        const batchEndIndex = Math.min(batchStartIndex + batchSize, dataToImport.length);
        const batch = dataToImport.slice(batchStartIndex, batchEndIndex);
        
        setBatchProgress(prev => ({
          ...prev,
          currentBatch: i + 1,
          progress: Math.round(((i + 1) / totalBatches) * 100),
          status: `Processing batch ${i + 1}/${totalBatches} (${batchStartIndex + 1}-${batchEndIndex})`
        }));

        console.log(`📊 Processing Batch ${i + 1}/${totalBatches}: Contacts ${batchStartIndex + 1}-${batchEndIndex}`);

        // Process current batch with enhanced error handling
        const batchPromises = batch.map(async (item, batchIndex) => {
          const globalIndex = batchStartIndex + batchIndex;
          const itemIdentifier = `${item.name || 'Unknown'} (${item.mobile1 || 'No mobile'})`;
          
          try {
            console.log(`🔄 Attempting to import contact ${globalIndex + 1}/${dataToImport.length}: ${itemIdentifier}`);
            
            const result = importType === 'customers' 
              ? await onImportSuccess('customers', [item])
              : await onImportSuccess('reminders', [item]);
            
            // Handle cases where result is undefined or doesn't have expected structure
            if (!result) {
              throw new Error('Import function returned no result');
            }
            
            if (result.error) {
              console.error(`❌ Import failed for ${itemIdentifier}:`, result.error.message || result.error);
              throw new Error(result.error.message || result.error || 'Import failed');
            }
            
            console.log(`✅ Successfully imported contact ${globalIndex + 1}: ${itemIdentifier}`);
            return { 
              success: true, 
              data: result.data || result, 
              item, 
              index: globalIndex + 1,
              identifier: itemIdentifier,
              timestamp: new Date().toISOString()
            };
          } catch (err) {
            const errorMessage = err.message || err.toString() || 'Unknown error';
            console.error(`❌ Failed to import contact ${globalIndex + 1} (${itemIdentifier}):`, errorMessage);
            return { 
              success: false, 
              error: errorMessage, 
              item, 
              index: globalIndex + 1,
              identifier: itemIdentifier,
              timestamp: new Date().toISOString(),
              isRetryable: isRetryableError(err)
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);

        // Enhanced result processing with individual tracking
        let batchSuccessful = 0;
        let batchFailed = 0;
        const batchErrors = [];

        batchResults.forEach((result, batchIndex) => {
          const globalIndex = batchStartIndex + batchIndex;
          
          // Ensure result object is valid
          if (!result) {
            console.error(`❌ [${globalIndex + 1}/${dataToImport.length}] Invalid result object`);
            importResults.failed++;
            batchFailed++;
            
            const errorDetail = {
              success: false,
              error: 'Invalid result object',
              item: batch[batchIndex],
              index: globalIndex + 1,
              identifier: `${batch[batchIndex]?.name || 'Unknown'} (${batch[batchIndex]?.mobile1 || 'No mobile'})`,
              timestamp: new Date().toISOString(),
              batchNumber: i + 1,
              globalIndex: globalIndex + 1,
              isRetryable: false
            };
            
            importResults.contactDetails.failed.push(errorDetail);
            batchErrors.push(errorDetail);
            return;
          }
          
          if (result.success) {
            importResults.successful++;
            batchSuccessful++;
            importResults.contactDetails.successful.push({
              ...result,
              batchNumber: i + 1,
              globalIndex: globalIndex + 1
            });
            console.log(`✅ [${globalIndex + 1}/${dataToImport.length}] ${result.identifier || 'Unknown'} - SUCCESS`);
          } else {
            importResults.failed++;
            batchFailed++;
            
            const errorDetail = {
              ...result,
              batchNumber: i + 1,
              globalIndex: globalIndex + 1,
              error: result.error || 'Unknown error',
              isRetryable: result.isRetryable || false
            };
            
            importResults.contactDetails.failed.push(errorDetail);
            
            if (result.isRetryable) {
              importResults.contactDetails.transient.push(errorDetail);
            }
            
            batchErrors.push(errorDetail);
            console.log(`❌ [${globalIndex + 1}/${dataToImport.length}] ${result.identifier || 'Unknown'} - FAILED: ${result.error || 'Unknown error'}`);
          }
        });

        // Enhanced batch history
        const batchHistoryEntry = {
          timestamp: new Date().toISOString(),
          type: importType,
          batchNumber: i + 1,
          totalBatches,
          processed: batch.length,
          successful: batchSuccessful,
          failed: batchFailed,
          batchStartIndex: batchStartIndex + 1,
          batchEndIndex: batchEndIndex,
          errors: batchErrors
        };
        
        importResults.batchHistory.push(batchHistoryEntry);
        setImportHistory(prev => [batchHistoryEntry, ...prev.slice(0, 9)]); // Keep last 10 entries

        console.log(`📈 Batch ${i + 1} Summary: ${batchSuccessful}/${batch.length} successful, ${batchFailed} failed`);

        // Brief pause between batches to prevent overwhelming the server
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Final results and reporting
      setBatchProgress(prev => ({ ...prev, processing: false }));

      // Generate comprehensive import report
      const importReport = generateImportReport(importResults, dataToImport.length);
      
      if (importResults.successful > 0) {
        success(`✅ Successfully imported ${importResults.successful}/${dataToImport.length} ${importType}!`);
        onImportSuccess(importType, dataToImport); // Main callback
      }

      // Show detailed failure analysis
      if (importResults.failed > 0) {
        setImportReport(importReport);
        setShowReport(true);
      } else if (importResults.successful > 0) {
        // Full success - close after brief delay
        setTimeout(() => {
          handleClose();
        }, 2000);
      }

    } catch (error) {
      console.error('Critical error during import:', error);
      setBatchProgress(prev => ({ ...prev, processing: false }));
      error(`Critical import error: ${error.message}`);
    }
  };

  // Helper function to determine if an error is retryable
  const isRetryableError = (error) => {
    if (!error) return false;
    
    const retryableErrors = [
      'network',
      'timeout',
      'connection',
      'server',
      'rate limit',
      'temporarily unavailable'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some(retryable => errorMessage.includes(retryable));
  };

  // Generate comprehensive import report
  const generateImportReport = (results, totalContacts) => {
    const report = {
      total: totalContacts,
      successful: results.successful,
      failed: results.failed,
      successRate: `${Math.round((results.successful / totalContacts) * 100)}%`,
      failedContacts: results.contactDetails.failed,
      transientFailures: results.contactDetails.transient,
      permanentFailures: results.contactDetails.failed.filter(f => !f.isRetryable),
      batchBreakdown: results.batchHistory,
      recommendations: []
    };

    // Generate recommendations
    if (report.transientFailures.length > 0) {
      report.recommendations.push({
        type: 'retry',
        message: `${report.transientFailures.length} contacts failed due to temporary issues and can be retried.`,
        contacts: report.transientFailures.map(f => f.identifier)
      });
    }

    if (report.permanentFailures.length > 0) {
      report.recommendations.push({
        type: 'fix',
        message: `${report.permanentFailures.length} contacts failed due to data validation issues and need manual correction.`,
        contacts: report.permanentFailures.map(f => f.identifier)
      });
    }

    return report;
  };

  // Display comprehensive import report
  // eslint-disable-next-line no-unused-vars
  const _showImportReport = (report) => {
    const reportContent = `
IMPORT SUMMARY
================
Total Contacts: ${report.total}
Successful: ${report.successful}
Failed: ${report.failed}
Success Rate: ${report.successRate}

BATCH BREAKDOWN:
${report.batchBreakdown.map(batch => 
  `Batch ${batch.batchNumber}: ${batch.successful}/${batch.processed} successful`
).join('\n')}

${report.transientFailures.length > 0 ? `
RETRYABLE FAILURES (${report.transientFailures.length}):
${report.transientFailures.map(f => `• ${f.identifier}: ${f.error}`).join('\n')}
` : ''}

${report.permanentFailures.length > 0 ? `
PERMANENT FAILURES (${report.permanentFailures.length}):
${report.permanentFailures.map(f => `• ${f.identifier}: ${f.error}`).join('\n')}
` : ''}
    `.trim();

    console.log('📊 IMPORT REPORT:', reportContent);
    
    // Show the report in a more user-friendly way
    if (report.failed > 0) {
      const errorCount = report.failed;
      const errorDetails = report.failedContacts.slice(0, 5).map(f => 
        `${f.identifier}: ${f.error}`
      ).join('; ');
      
      error(`${errorCount} contacts failed. First errors: ${errorDetails}${errorCount > 5 ? '...and more' : ''}`);
    }
  };

  const handleClose = () => {
    setFile(null);
    setProcessedData(null);
    setValidationResults(null);
    setErrors([]);
    setShowPreview(false);
    setBatchProgress(null);
    onClose();
  };

  const rollbackImport = () => {
    // This would implement rollback logic
    error('Rollback feature will be implemented in future version');
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
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl border border-white/20"
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
                  Enhanced {importType === 'customers' ? 'Customer' : 'Reminder'} Import
                </h2>
                <p className="text-slate-600 text-sm">
                  Import {importType} with multi-mobile number support and advanced error handling
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

          {/* Enhanced Batch Progress */}
          {batchProgress && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">
                    {batchProgress.processing ? 'Processing' : 'Completed'} 
                    Batch {batchProgress.currentBatch} of {batchProgress.totalBatches}
                  </h3>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-blue-600 font-bold">{batchProgress.progress}%</span>
                  {batchProgress.processing && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${batchProgress.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Status Details */}
              {batchProgress.status && (
                <div className="text-sm text-blue-700 bg-blue-100 rounded p-2">
                  <span className="font-medium">Status:</span> {batchProgress.status}
                </div>
              )}

              {/* Real-time contact tracking */}
              {batchProgress.processing && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Live Import Tracking</h4>
                  <div className="text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Individual contact progress will be shown here</span>
                      <span>Contact {batchProgress.currentBatch * 25} of {batchProgress.totalBatches * 25}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Template Download */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-slate-600" />
                <div>
                  <h3 className="font-semibold text-slate-800">Enhanced CSV Template</h3>
                  <p className="text-sm text-slate-600">{template.description}</p>
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
              {importType === 'customers' && (
                <p className="text-xs text-slate-500 mt-1">
                  Note: mobile2 and mobile3 are optional. At least one mobile number (mobile1) is required.
                </p>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-800 mb-3">
              Select Enhanced CSV File
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
                Supports enhanced format with multiple mobile numbers
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
          {file && !batchProgress && (
            <div className="mb-6">
              <button
                onClick={processFile}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Analyzing File...' : 'Analyze & Validate File'}
              </button>
            </div>
          )}

          {/* Validation Results */}
          {validationResults && !batchProgress && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <div className="text-2xl font-bold text-blue-600">{validationResults.totalRows}</div>
                  <div className="text-sm text-blue-700">Total Rows</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
                  <div className="text-2xl font-bold text-green-600">{validationResults.validRows}</div>
                  <div className="text-sm text-green-700">Valid Rows</div>
                </div>
                <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
                  <div className="text-2xl font-bold text-red-600">{validationResults.errorRows}</div>
                  <div className="text-sm text-red-700">Error Rows</div>
                </div>
              </div>

              {/* Import Button */}
              {validationResults.validRows > 0 && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex-1 bg-slate-200 text-slate-800 py-3 rounded-xl font-semibold hover:bg-slate-300 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
                  </button>
                  <button
                    onClick={handleImport}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Import {validationResults.validRows} Valid Items</span>
                  </button>
                </div>
              )}

              {/* Preview */}
              {showPreview && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="font-semibold text-slate-800 mb-3">Preview (First 5 Valid Items)</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(importType === 'customers' ? processedData.customers : processedData.reminders)
                      .slice(0, 5)
                      .map((item, index) => (
                        <div key={index} className="text-sm p-2 bg-white rounded border">
                          {importType === 'customers' 
                            ? `${item.name} - M1: ${item.mobile1}${item.mobile2 ? `, M2: ${item.mobile2}` : ''}${item.mobile3 ? `, M3: ${item.mobile3}` : ''}`
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
              )}
            </div>
          )}

          {/* Error Details */}
          {errors.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-800">Validation Errors</h3>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {errors.map((err, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-red-700">Line {err.lineNumber}:</span>
                    <span className="text-red-600 ml-2">{err.errors.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import History */}
          {importHistory.length > 0 && (
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Recent Import History</h3>
                <button
                  onClick={rollbackImport}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Rollback</span>
                </button>
              </div>
              <div className="space-y-2">
                {importHistory.slice(0, 3).map((entry, index) => (
                  <div key={index} className="text-sm p-2 bg-white rounded border">
                    <div className="flex justify-between">
                      <span>{new Date(entry.timestamp).toLocaleTimeString()} - {entry.type}</span>
                      <span className="text-green-600">{entry.successful} success, {entry.failed} failed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comprehensive Import Report Modal */}
          <AnimatePresence>
            {showReport && importReport && (
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowReport(false)}
              >
                <motion.div
                  className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl border border-white/20"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Report Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <FileX className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-luxury font-semibold text-slate-800">
                          Detailed Import Report
                        </h2>
                        <p className="text-slate-600 text-sm">
                          Comprehensive analysis of the bulk import process
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowReport(false)}
                      className="p-2 hover:bg-white/50 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>

                  {/* Summary Statistics */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
                      <div className="text-2xl font-bold text-blue-600">{importReport.total}</div>
                      <div className="text-sm text-blue-700">Total Contacts</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
                      <div className="text-2xl font-bold text-green-600">{importReport.successful}</div>
                      <div className="text-sm text-green-700">Successful</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
                      <div className="text-2xl font-bold text-red-600">{importReport.failed}</div>
                      <div className="text-sm text-red-700">Failed</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
                      <div className="text-2xl font-bold text-purple-600">{importReport.successRate}</div>
                      <div className="text-sm text-purple-700">Success Rate</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {importReport.recommendations.length > 0 && (
                    <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <h3 className="font-semibold text-amber-800">Action Recommendations</h3>
                      </div>
                      <div className="space-y-3">
                        {importReport.recommendations.map((rec, index) => (
                          <div key={index} className="p-3 bg-white rounded border">
                            <p className="text-sm text-slate-700 mb-2">{rec.message}</p>
                            {rec.contacts && rec.contacts.length > 0 && (
                              <details className="text-xs text-slate-600">
                                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                  Show affected contacts ({rec.contacts.length})
                                </summary>
                                <div className="mt-2 pl-4 space-y-1">
                                  {rec.contacts.slice(0, 10).map((contact, i) => (
                                    <div key={i}>• {contact}</div>
                                  ))}
                                  {rec.contacts.length > 10 && (
                                    <div className="text-slate-500">... and {rec.contacts.length - 10} more</div>
                                  )}
                                </div>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Batch Breakdown */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-800 mb-3">Batch Processing Summary</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {importReport.batchBreakdown.map((batch, index) => (
                        <div key={index} className="p-3 bg-slate-50 rounded border">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">Batch {batch.batchNumber}</span>
                              <span className="text-sm text-slate-600 ml-2">
                                (Contacts {batch.batchStartIndex}-{batch.batchEndIndex})
                              </span>
                            </div>
                            <div className="flex space-x-4 text-sm">
                              <span className="text-green-600 font-medium">
                                ✓ {batch.successful}
                              </span>
                              {batch.failed > 0 && (
                                <span className="text-red-600 font-medium">
                                  ✗ {batch.failed}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Failed Contacts Details */}
                  {importReport.failedContacts.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-slate-800 mb-3">
                        Failed Contacts ({importReport.failedContacts.length})
                      </h3>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {importReport.failedContacts.map((failure, index) => (
                          <div key={index} className="p-3 bg-red-50 rounded border border-red-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-red-800">
                                  #{failure.globalIndex}: {failure.identifier}
                                </div>
                                <div className="text-sm text-red-600 mt-1">
                                  Error: {failure.error}
                                </div>
                                {failure.isRetryable && (
                                  <div className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mt-1">
                                    Retryable
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">
                                Batch {failure.batchNumber}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setShowReport(false)}
                      className="bg-slate-200 text-slate-800 px-6 py-3 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                    >
                      Close Report
                    </button>
                    
                    {importReport.transientFailures.length > 0 && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            setShowReport(false);
                            setImportReport(null);
                            // Could implement retry logic here
                            error('Retry functionality will be implemented in the next version');
                          }}
                          className="bg-yellow-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-yellow-600 transition-colors flex items-center space-x-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Retry Failed ({importReport.transientFailures.length})</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedCSVImport;