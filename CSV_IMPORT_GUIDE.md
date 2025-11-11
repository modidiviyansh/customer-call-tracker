# CSV Import Guide - Customer Call Tracker V2.0

This guide explains how to use the bulk CSV import feature to import customers and reminders into your Call Tracker application.

## 📁 Overview

The bulk CSV import feature allows you to import large numbers of customers and reminders at once, saving time compared to manual entry. The system validates your data and provides a preview before importing.

## 📊 Customer Import

### Requirements
- **File Format**: CSV (Comma Separated Values)
- **Required Columns**: `name`, `mobile`
- **Mobile Format**: 10-digit Indian mobile number (starting with 6-9)
- **Name Length**: Minimum 2 characters

### Sample CSV Format
```csv
name,mobile
John Doe,9876543210
Jane Smith,8765432109
Raj Patel,7654321098
Priya Singh,6543210987
```

### Import Steps
1. Click the **"Import"** button in the Customers tab
2. Download the template if needed
3. Prepare your CSV file with the required format
4. Upload your CSV file
5. Review the preview and any validation errors
6. Click **"Import Customers"** to complete the import

### Validation Rules
- **Customer Name**: Required, minimum 2 characters
- **Mobile Number**: Required, must be 10 digits, start with 6-9
- **Empty Rows**: Skipped automatically
- **Duplicate Data**: Each row is processed individually

## 📅 Reminder Import

### Requirements
- **File Format**: CSV (Comma Separated Values)
- **Required Columns**: `customer_mobile`, `reminder_text`, `reminder_date`
- **Mobile Format**: 10-digit Indian mobile number (must exist in customers)
- **Date Format**: YYYY-MM-DD (e.g., 2025-01-15)
- **Text Length**: Reminder text should be descriptive

### Sample CSV Format
```csv
customer_mobile,reminder_text,reminder_date
9876543210,Follow up call,2025-01-15
8765432109,Product demo,2025-01-20
7654321098,Invoice reminder,2025-01-25
6543210987,Customer service check,2025-02-01
```

### Import Steps
1. Click the **"Import"** button in the Reminders tab
2. Download the template if needed
3. Prepare your CSV file with the required format
4. Upload your CSV file
5. Review the preview and any validation errors
6. Click **"Import Reminders"** to complete the import

### Validation Rules
- **Customer Mobile**: Required, must match existing customer
- **Reminder Text**: Required, should be descriptive
- **Reminder Date**: Required, must be in YYYY-MM-DD format
- **Future Dates**: Recommended for scheduled reminders

## 🔧 Template Download

Both import functions provide downloadable templates with the correct format:

- **Customer Template**: `customer-template.csv`
- **Reminder Template**: `reminder-template.csv`

Templates include:
- Correct column headers
- Sample data for reference
- Proper formatting examples

## ⚠️ Error Handling

The import system validates your data and shows:

### Common Validation Errors
- **Invalid mobile number format**: Must be 10 digits starting with 6-9
- **Missing required fields**: Name, mobile, text, or date not provided
- **Invalid date format**: Must be YYYY-MM-DD
- **Duplicate entries**: Processed individually
- **Non-existent customers**: For reminder imports

### Error Display
- **Red highlighting**: Individual row errors
- **Error summary**: Count of total issues found
- **Detailed messages**: Specific line and error type
- **Processing continues**: Valid rows are imported even with some errors

## 📱 Mobile Optimized

The CSV import feature is designed to work seamlessly on mobile devices:

- **Touch-friendly buttons**: Optimized for finger navigation
- **Responsive modal**: Adapts to different screen sizes
- **Scrollable content**: Easy to navigate on small screens
- **Quick actions**: Import and cancel buttons positioned for easy access

## 🔄 Best Practices

### For Customer Import
1. **Data Cleaning**: Remove duplicates before importing
2. **Mobile Validation**: Ensure all mobile numbers are 10 digits
3. **Name Consistency**: Use proper names, avoid special characters
4. **Batch Size**: Import in reasonable batches (100-500 at a time)

### For Reminder Import
1. **Customer First**: Import customers before creating reminders for them
2. **Descriptive Text**: Use clear, actionable reminder text
3. **Logical Dates**: Set reminder dates that make sense for your workflow
4. **Review Preview**: Always check the preview before importing

## 🆘 Troubleshooting

### Import Fails
- **File Format**: Ensure you're using a .csv file
- **Column Headers**: Must match exactly (case-sensitive)
- **Encoding**: Use UTF-8 encoding for special characters
- **File Size**: Keep files under 10MB for best performance

### Validation Errors
- **Check Sample Data**: Use the template as a reference
- **Format Examples**: Follow the sample data structure exactly
- **Mobile Numbers**: Ensure no +91 prefix or spaces
- **Date Format**: Use YYYY-MM-DD format only

### Preview Not Showing
- **File Upload**: Make sure file was selected properly
- **Processing**: Wait for validation to complete
- **Re-upload**: Try re-selecting the file

## 📞 Support

If you encounter issues with the CSV import feature:
1. Check this guide first
2. Review the error messages in the import modal
3. Use the template files as a reference
4. Test with a small sample first

---

*This feature is available in Customer Call Tracker V2.0 (offline-v-2 branch)*