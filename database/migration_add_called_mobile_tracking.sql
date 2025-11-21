/**
 * MIGRATION: Add Called Mobile Number Tracking to Call Logs
 * 
 * This migration adds a column to track which specific mobile number was called
 * for each call log entry, supporting the multi-mobile number feature.
 */

-- Add called_mobile_number column to call logs
ALTER TABLE fcm_call_logs 
ADD COLUMN called_mobile_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN fcm_call_logs.called_mobile_number IS 'The specific mobile number that was called for this record';

-- Add index for efficient lookups by called mobile number
CREATE INDEX idx_fcm_call_logs_called_mobile_number ON fcm_call_logs(called_mobile_number);

-- Add check constraint to ensure called_mobile_number is a valid format
ALTER TABLE fcm_call_logs 
ADD CONSTRAINT check_called_mobile_format CHECK (
  called_mobile_number IS NULL OR 
  (called_mobile_number ~ '^(\+91[6-9]\d{9}|91[6-9]\d{9}|0[6-9]\d{9}|[6-9]\d{9})$' AND length(regexp_replace(called_mobile_number, '\D', '', 'g')) = 10)
);

-- Create function to validate that called mobile number belongs to the customer
CREATE OR REPLACE FUNCTION validate_called_mobile_belongs_to_customer(
  customer_id UUID,
  called_mobile TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the called mobile number belongs to the specified customer
  RETURN EXISTS (
    SELECT 1 FROM fcm_customers 
    WHERE id = customer_id 
      AND (
        mobile1 = called_mobile OR 
        mobile2 = called_mobile OR 
        mobile3 = called_mobile
      )
  );
END;
$$ LANGUAGE plpgsql;