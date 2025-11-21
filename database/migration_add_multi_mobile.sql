/**
 * MIGRATION: Add Multi-Mobile Number Support
 * 
 * This migration adds support for up to 3 mobile numbers per customer
 * while maintaining backward compatibility with existing data.
 */

-- Add new mobile number columns to the customers table
ALTER TABLE fcm_customers 
ADD COLUMN mobile1 TEXT,
ADD COLUMN mobile2 TEXT,
ADD COLUMN mobile3 TEXT;

-- Add NOT NULL constraint to mobile1 (at least one mobile number required)
ALTER TABLE fcm_customers 
ALTER COLUMN mobile1 SET NOT NULL;

-- Update existing data: move current mobile_number to mobile1
UPDATE fcm_customers 
SET mobile1 = mobile_number 
WHERE mobile_number IS NOT NULL;

-- Drop the old mobile_number column
ALTER TABLE fcm_customers DROP COLUMN mobile_number;

-- Add comments for documentation
COMMENT ON COLUMN fcm_customers.mobile1 IS 'Primary mobile number (required)';
COMMENT ON COLUMN fcm_customers.mobile2 IS 'Secondary mobile number (optional)';
COMMENT ON COLUMN fcm_customers.mobile3 IS 'Tertiary mobile number (optional)';

-- Add unique constraints to prevent duplicates within the same customer
-- (customers can have different mobile numbers)
ALTER TABLE fcm_customers 
ADD CONSTRAINT unique_customer_mobile1 UNIQUE (mobile1);

-- Create indexes for efficient mobile number lookups
CREATE INDEX idx_fcm_customers_mobile1 ON fcm_customers(mobile1);
CREATE INDEX idx_fcm_customers_mobile2 ON fcm_customers(mobile2) WHERE mobile2 IS NOT NULL;
CREATE INDEX idx_fcm_customers_mobile3 ON fcm_customers(mobile3) WHERE mobile3 IS NOT NULL;

-- Create composite index for searches across all mobile numbers
-- This will be useful for searching by any mobile number
CREATE INDEX idx_fcm_customers_all_mobile ON fcm_customers(mobile1, mobile2, mobile3);

-- Add check constraints to ensure mobile numbers are valid format
ALTER TABLE fcm_customers 
ADD CONSTRAINT check_mobile1_format CHECK (
  mobile1 IS NULL OR 
  (mobile1 ~ '^(\+91[6-9]\d{9}|91[6-9]\d{9}|0[6-9]\d{9}|[6-9]\d{9})$' AND length(regexp_replace(mobile1, '\D', '', 'g')) = 10)
);

ALTER TABLE fcm_customers 
ADD CONSTRAINT check_mobile2_format CHECK (
  mobile2 IS NULL OR 
  (mobile2 ~ '^(\+91[6-9]\d{9}|91[6-9]\d{9}|0[6-9]\d{9}|[6-9]\d{9})$' AND length(regexp_replace(mobile2, '\D', '', 'g')) = 10)
);

ALTER TABLE fcm_customers 
ADD CONSTRAINT check_mobile3_format CHECK (
  mobile3 IS NULL OR 
  (mobile3 ~ '^(\+91[6-9]\d{9}|91[6-9]\d{9}|0[6-9]\d{9}|[6-9]\d{9})$' AND length(regexp_replace(mobile3, '\D', '', 'g')) = 10)
);

-- Prevent duplicate mobile numbers within the same customer profile
ALTER TABLE fcm_customers 
ADD CONSTRAINT check_no_duplicate_mobiles CHECK (
  (mobile2 IS NULL OR mobile2 != mobile1) AND
  (mobile3 IS NULL OR mobile3 != mobile1) AND
  (mobile3 IS NULL OR mobile2 IS NULL OR mobile3 != mobile2)
);

-- Function to get all mobile numbers for a customer as an array
CREATE OR REPLACE FUNCTION get_customer_mobile_numbers(customer_id UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT unnest(ARRAY[mobile1, mobile2, mobile3])
    FROM fcm_customers
    WHERE id = customer_id
    AND unnest IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if a mobile number exists for any customer
CREATE OR REPLACE FUNCTION is_mobile_number_exists(check_mobile TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM fcm_customers 
    WHERE mobile1 = check_mobile 
       OR mobile2 = check_mobile 
       OR mobile3 = check_mobile
  );
END;
$$ LANGUAGE plpgsql;