-- =============================================================================
-- FINANCE OFFICE CALL REMINDER APPLICATION - CONSOLIDATED DATABASE SCHEMA
-- =============================================================================
-- Complete database setup for PIN-based call disposition tracking
-- Compatible with: PostgreSQL 12+, Supabase, or any PostgreSQL-compatible database
-- No authentication dependencies - PIN-based access only
-- All tables use 'fcm_' prefix for consistency
-- =============================================================================

-- =============================================================================
-- SETUP INSTRUCTIONS FOR SELF-HOSTING
-- =============================================================================
-- 
-- 1. PREREQUISITES:
--    - PostgreSQL 12 or higher installed
--    - Database created (e.g., CREATE DATABASE call_tracker;)
--    - Superuser or database owner privileges
--
-- 2. INSTALLATION:
--    Method A - Using psql command line:
--      psql -U your_username -d your_database -f schema_consolidated.sql
--
--    Method B - Using pgAdmin or other GUI:
--      - Connect to your database
--      - Open Query Tool
--      - Copy and paste this entire file
--      - Execute the script
--
--    Method C - Using Supabase:
--      - Go to SQL Editor in Supabase Dashboard
--      - Copy and paste this entire file
--      - Click "Run" to execute
--
-- 3. VERIFICATION:
--    After running, verify tables were created:
--      SELECT table_name FROM information_schema.tables 
--      WHERE table_schema = 'public' AND table_name LIKE 'fcm_%';
--
--    Expected output: fcm_customers, fcm_customer_contacts, fcm_call_logs
--
-- 4. CONFIGURATION:
--    - Default PIN is '2342' (see sample data below)
--    - Update .env file with your database credentials
--
-- =============================================================================

-- Enable UUID extension (required for primary keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Drop existing enum if it exists (for re-running script)
DROP TYPE IF EXISTS call_status CASCADE;

-- Create call status enum type
CREATE TYPE call_status AS ENUM (
  'completed',
  'follow_up',
  'busy',
  'no_answer',
  'invalid',
  'not_interested'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Drop existing tables if they exist (for re-running script)
DROP TABLE IF EXISTS fcm_call_logs CASCADE;
DROP TABLE IF EXISTS fcm_customer_contacts CASCADE;
DROP TABLE IF EXISTS fcm_customers CASCADE;

-- -----------------------------------------------------------------------------
-- CUSTOMERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE fcm_customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  mobile1 TEXT NOT NULL,
  mobile2 TEXT,
  mobile3 TEXT,
  address_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_customer_mobile1 UNIQUE (mobile1),
  
  -- Prevent duplicate mobile numbers within the same customer profile
  CONSTRAINT check_no_duplicate_mobiles CHECK (
    (mobile2 IS NULL OR mobile2 != mobile1) AND
    (mobile3 IS NULL OR mobile3 != mobile1) AND
    (mobile3 IS NULL OR mobile2 IS NULL OR mobile3 != mobile2)
  )
);

COMMENT ON TABLE fcm_customers IS 'Stores customer information with multi-mobile support';
COMMENT ON COLUMN fcm_customers.mobile1 IS 'Primary mobile number (required)';
COMMENT ON COLUMN fcm_customers.mobile2 IS 'Secondary mobile number (optional)';
COMMENT ON COLUMN fcm_customers.mobile3 IS 'Tertiary mobile number (optional)';

-- -----------------------------------------------------------------------------
-- CUSTOMER CONTACTS TABLE (Optional)
-- -----------------------------------------------------------------------------
CREATE TABLE fcm_customer_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES fcm_customers(id) ON DELETE CASCADE,
  contact_type TEXT DEFAULT 'mobile',
  contact_value TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE fcm_customer_contacts IS 'Additional contact methods for customers';

-- -----------------------------------------------------------------------------
-- CALL LOGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE fcm_call_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES fcm_customers(id) ON DELETE CASCADE,
  agent_pin TEXT NOT NULL,
  call_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_call_date DATE,
  call_duration_seconds INTEGER,
  call_status call_status NOT NULL DEFAULT 'follow_up',
  outcome_score INTEGER CHECK (outcome_score >= 1 AND outcome_score <= 10),
  called_mobile_number TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE fcm_call_logs IS 'Complete call disposition tracking with PIN-based agent identification';
COMMENT ON COLUMN fcm_call_logs.agent_pin IS 'PIN code used to access the system';
COMMENT ON COLUMN fcm_call_logs.called_mobile_number IS 'The specific mobile number that was called';

-- =============================================================================
-- TRIGGERS
-- =============================================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fcm_customers_updated_at
  BEFORE UPDATE ON fcm_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fcm_call_logs_updated_at
  BEFORE UPDATE ON fcm_call_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

DROP FUNCTION IF EXISTS get_customer_mobile_numbers(UUID);
DROP FUNCTION IF EXISTS is_mobile_number_exists(TEXT);

CREATE OR REPLACE FUNCTION get_customer_mobile_numbers(customer_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  result TEXT[];
BEGIN
  SELECT ARRAY(
    SELECT unnest(ARRAY[mobile1, mobile2, mobile3])
    FROM fcm_customers
    WHERE id = customer_id
  ) INTO result;
  RETURN ARRAY(SELECT unnest(result) WHERE unnest IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

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

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Customer indexes
CREATE INDEX idx_fcm_customers_mobile1 ON fcm_customers(mobile1);
CREATE INDEX idx_fcm_customers_mobile2 ON fcm_customers(mobile2) WHERE mobile2 IS NOT NULL;
CREATE INDEX idx_fcm_customers_mobile3 ON fcm_customers(mobile3) WHERE mobile3 IS NOT NULL;
CREATE INDEX idx_fcm_customers_name ON fcm_customers(name);
CREATE INDEX idx_fcm_customers_created_at ON fcm_customers(created_at);

-- Customer contacts indexes
CREATE INDEX idx_fcm_customer_contacts_customer_id ON fcm_customer_contacts(customer_id);
CREATE INDEX idx_fcm_customer_contacts_type ON fcm_customer_contacts(contact_type);

-- Call logs indexes
CREATE INDEX idx_fcm_call_logs_customer_id ON fcm_call_logs(customer_id);
CREATE INDEX idx_fcm_call_logs_agent_pin ON fcm_call_logs(agent_pin);
CREATE INDEX idx_fcm_call_logs_call_date ON fcm_call_logs(call_date);
CREATE INDEX idx_fcm_call_logs_next_call_date ON fcm_call_logs(next_call_date);
CREATE INDEX idx_fcm_call_logs_call_status ON fcm_call_logs(call_status);
CREATE INDEX idx_fcm_call_logs_called_mobile_number ON fcm_call_logs(called_mobile_number);

-- Composite indexes for common query patterns
CREATE INDEX idx_fcm_call_logs_pin_date ON fcm_call_logs(agent_pin, call_date DESC);
CREATE INDEX idx_fcm_call_logs_customer_date ON fcm_call_logs(customer_id, call_date DESC);
CREATE INDEX idx_fcm_call_logs_next_reminders ON fcm_call_logs(agent_pin, next_call_date) WHERE next_call_date IS NOT NULL;

-- =============================================================================
-- SAMPLE DATA (Optional - Comment out if not needed)
-- =============================================================================

-- Sample customers
INSERT INTO fcm_customers (name, mobile1, mobile2, mobile3, address_details) VALUES
  ('Rajesh Kumar', '9876543210', '9876543211', NULL, '{"street": "123 MG Road", "city": "Mumbai", "state": "Maharashtra", "zipCode": "400001"}'),
  ('Priya Sharma', '9876543212', NULL, NULL, '{"street": "456 Park Street", "city": "Kolkata", "state": "West Bengal", "zipCode": "700016"}'),
  ('Amit Patel', '9876543213', '9876543214', '9876543215', '{"street": "789 Brigade Road", "city": "Bangalore", "state": "Karnataka", "zipCode": "560001"}'),
  ('Sneha Reddy', '9876543216', '9876543217', NULL, '{"street": "321 Anna Salai", "city": "Chennai", "state": "Tamil Nadu", "zipCode": "600002"}'),
  ('Vikram Singh', '9876543218', NULL, NULL, '{"street": "654 Connaught Place", "city": "New Delhi", "state": "Delhi", "zipCode": "110001"}'),
  ('Anita Desai', '9876543219', '9876543220', NULL, '{"street": "987 FC Road", "city": "Pune", "state": "Maharashtra", "zipCode": "411004"}'),
  ('Rahul Verma', '9876543221', NULL, NULL, '{"street": "147 Park Street", "city": "Jaipur", "state": "Rajasthan", "zipCode": "302001"}'),
  ('Kavita Nair', '9876543222', '9876543223', NULL, '{"street": "258 Marine Drive", "city": "Kochi", "state": "Kerala", "zipCode": "682011"}');

-- Sample call logs
INSERT INTO fcm_call_logs (customer_id, agent_pin, call_date, next_call_date, call_status, remarks, outcome_score, called_mobile_number)
SELECT c.id, '2342', NOW() - INTERVAL '2 hours', CURRENT_DATE, 'follow_up',
  'Customer interested in premium package. Follow up required.', 8, c.mobile1
FROM fcm_customers c WHERE c.name = 'Rajesh Kumar';

INSERT INTO fcm_call_logs (customer_id, agent_pin, call_date, next_call_date, call_status, remarks, outcome_score, called_mobile_number)
SELECT c.id, '2342', NOW() - INTERVAL '1 day', CURRENT_DATE + INTERVAL '1 day', 'completed',
  'Successful call. Product demo scheduled.', 9, c.mobile1
FROM fcm_customers c WHERE c.name = 'Priya Sharma';

INSERT INTO fcm_call_logs (customer_id, agent_pin, call_date, next_call_date, call_status, remarks, outcome_score, called_mobile_number)
SELECT c.id, '2342', NOW() - INTERVAL '30 minutes', CURRENT_DATE, 'no_answer',
  'No answer on primary number.', 3, c.mobile1
FROM fcm_customers c WHERE c.name = 'Amit Patel';

INSERT INTO fcm_call_logs (customer_id, agent_pin, call_date, next_call_date, call_status, remarks, outcome_score, called_mobile_number)
SELECT c.id, '2342', NOW() - INTERVAL '3 days', CURRENT_DATE, 'follow_up',
  'Follow-up call scheduled.', 7, c.mobile1
FROM fcm_customers c WHERE c.name = 'Sneha Reddy';

INSERT INTO fcm_call_logs (customer_id, agent_pin, call_date, next_call_date, call_status, remarks, outcome_score, called_mobile_number)
SELECT c.id, '2342', NOW() - INTERVAL '4 hours', NULL, 'busy',
  'Customer was busy.', 4, c.mobile1
FROM fcm_customers c WHERE c.name = 'Vikram Singh';

-- =============================================================================
-- VERIFICATION QUERIES (Uncomment to run)
-- =============================================================================

-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'fcm_%';
-- SELECT 'customers' as table_name, COUNT(*) as count FROM fcm_customers UNION ALL SELECT 'call_logs', COUNT(*) FROM fcm_call_logs;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '📊 Tables: fcm_customers, fcm_customer_contacts, fcm_call_logs';
  RAISE NOTICE '🔐 Default PIN: 2342';
END $$;
