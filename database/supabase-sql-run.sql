-- =============================================================================
-- LUXURY CALL TRACKER DATABASE SCHEMA - COMPLETE SETUP
-- =============================================================================
-- Complete Supabase SQL setup for PIN-based call disposition tracking
-- No Supabase Auth dependencies - PIN-based access only
-- All tables use 'fcm_' prefix for consistency
-- Includes sample data and verification queries
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

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

-- CUSTOMERS TABLE
-- All customer data is shared - no private fields for now
CREATE TABLE fcm_customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  address_details JSONB, -- Future: private customer address fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique constraint for mobile numbers
  CONSTRAINT unique_customer_mobile UNIQUE (mobile_number)
);

-- CUSTOMER CONTACTS TABLE (Optional - for additional contact methods)
CREATE TABLE fcm_customer_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES fcm_customers(id) ON DELETE CASCADE,
  contact_type TEXT DEFAULT 'mobile', -- mobile, email, whatsapp, etc.
  contact_value TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CALL LOGS TABLE
-- Generic call tracking - no user identity, shared across all PIN holders
CREATE TABLE fcm_call_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES fcm_customers(id) ON DELETE CASCADE,

  -- PIN-based tracking (not user_id)
  agent_pin TEXT NOT NULL, -- The PIN used to access the system

  -- Call timing
  call_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_call_date DATE, -- Next follow-up/reminder date

  -- Call details
  call_duration_seconds INTEGER, -- Future: call length tracking
  call_status call_status NOT NULL DEFAULT 'follow_up',
  outcome_score INTEGER CHECK (outcome_score >= 1 AND outcome_score <= 10), -- 1-10 rating

  -- Free-form notes
  remarks TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_fcm_customers_updated_at
  BEFORE UPDATE ON fcm_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fcm_call_logs_updated_at
  BEFORE UPDATE ON fcm_call_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Customer indexes
CREATE INDEX idx_fcm_customers_mobile_number ON fcm_customers(mobile_number);
CREATE INDEX idx_fcm_customers_name ON fcm_customers(name);
CREATE INDEX idx_fcm_customers_created_at ON fcm_customers(created_at);

-- Customer contacts indexes
CREATE INDEX idx_fcm_customer_contacts_customer_id ON fcm_customer_contacts(customer_id);
CREATE INDEX idx_fcm_customer_contacts_type ON fcm_customer_contacts(contact_type);

-- Call logs indexes (PIN-based, not user-based)
CREATE INDEX idx_fcm_call_logs_customer_id ON fcm_call_logs(customer_id);
CREATE INDEX idx_fcm_call_logs_agent_pin ON fcm_call_logs(agent_pin);
CREATE INDEX idx_fcm_call_logs_call_date ON fcm_call_logs(call_date);
CREATE INDEX idx_fcm_call_logs_next_call_date ON fcm_call_logs(next_call_date);
CREATE INDEX idx_fcm_call_logs_call_status ON fcm_call_logs(call_status);

-- Composite indexes for common query patterns
CREATE INDEX idx_fcm_call_logs_pin_date ON fcm_call_logs(agent_pin, call_date DESC);
CREATE INDEX idx_fcm_call_logs_customer_date ON fcm_call_logs(customer_id, call_date DESC);
CREATE INDEX idx_fcm_call_logs_next_reminders ON fcm_call_logs(agent_pin, next_call_date) WHERE next_call_date IS NOT NULL;

-- =============================================================================
-- SAMPLE DATA
-- =============================================================================

-- Sample customers (using generic data)
INSERT INTO fcm_customers (name, mobile_number, address_details) VALUES
  ('John Smith', '+1-555-0101', '{"street": "123 Main St", "city": "New York", "state": "NY", "zipCode": "10001"}'),
  ('Sarah Johnson', '+1-555-0102', '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zipCode": "90210"}'),
  ('Mike Wilson', '+1-555-0103', '{"street": "789 Pine Rd", "city": "Chicago", "state": "IL", "zipCode": "60601"}'),
  ('Emily Davis', '+1-555-0104', '{"street": "321 Elm St", "city": "Houston", "state": "TX", "zipCode": "77001"}'),
  ('Robert Brown', '+1-555-0105', '{"street": "654 Maple Dr", "city": "Phoenix", "state": "AZ", "zipCode": "85001"}'),
  ('Lisa Garcia', '+1-555-0106', '{"street": "987 Cedar Ln", "city": "Philadelphia", "state": "PA", "zipCode": "19101"}'),
  ('David Miller', '+1-555-0107', '{"street": "147 Birch Way", "city": "San Antonio", "state": "TX", "zipCode": "78201"}'),
  ('Jennifer Taylor', '+1-555-0108', '{"street": "258 Spruce Ct", "city": "San Diego", "state": "CA", "zipCode": "92101"}');

-- Sample call logs with PIN tracking
INSERT INTO fcm_call_logs (customer_id, agent_pin, call_date, next_call_date, call_status, remarks, outcome_score)
SELECT
  c.id,
  '2342',
  NOW() - INTERVAL '2 hours',
  CURRENT_DATE,
  'follow_up',
  'Customer interested in premium package. Follow up required for demo scheduling.',
  8
FROM fcm_customers c
WHERE c.name = 'John Smith';

INSERT INTO fcm_call_logs (customer_id, agent_pin, call_date, next_call_date, call_status, remarks, outcome_score)
SELECT
  c.id,
  '2342',
  NOW() - INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '1 day',
  'completed',
  'Successful call. Product demo scheduled for next week. Customer very interested.',
  9
FROM fcm_customers c
WHERE c.name = 'Sarah Johnson';

INSERT INTO fcm_call_logs (customer_id, agent_pin, call_date, next_call_date, call_status, remarks, outcome_score)
SELECT
  c.id,
  '2342',
  NOW() - INTERVAL '30 minutes',
  CURRENT_DATE,
  'no_answer',
  'No answer. Customer may be busy. Try again later in the day.',
  3
FROM fcm_customers c
WHERE c.name = 'Mike Wilson';

INSERT INTO fcm_call_logs (customer_id, agent_pin, call_date, next_call_date, call_status, remarks, outcome_score)
SELECT
  c.id,
  '2342',
  NOW() - INTERVAL '3 days',
  CURRENT_DATE,
  'follow_up',
  'Follow-up call scheduled. Customer requested callback about pricing options.',
  7
FROM fcm_customers c
WHERE c.name = 'Emily Davis';

INSERT INTO fcm_call_logs (customer_id, agent_pin, call_date, next_call_date, call_status, remarks, outcome_score)
SELECT
  c.id,
  '2342',
  NOW() - INTERVAL '4 hours',
  NULL,
  'busy',
  'Customer was busy. Will try again tomorrow.',
  4
FROM fcm_customers c
WHERE c.name = 'Robert Brown';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check table creation
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'fcm_%';

-- Check sample data
-- SELECT 'customers' as table_name, COUNT(*) as count FROM fcm_customers
-- UNION ALL
-- SELECT 'call_logs' as table_name, COUNT(*) as count FROM fcm_call_logs;

-- Check today's reminders
-- SELECT c.name, cl.call_status, cl.next_call_date, cl.remarks
-- FROM fcm_call_logs cl
-- JOIN fcm_customers c ON cl.customer_id = c.id
-- WHERE cl.next_call_date = CURRENT_DATE
-- ORDER BY cl.call_date DESC;

-- =============================================================================
-- APPLICATION USAGE NOTES
-- =============================================================================

-- This schema is designed for PIN-based access only:
-- - No Supabase Auth user identity required
-- - Any user with valid PIN (2342) can access all data
-- - Perfect for shared kiosk or team environments
-- - All call logs are tracked by agent_pin field

-- Tables created:
-- - fcm_customers: Customer information
-- - fcm_customer_contacts: Additional contact methods
-- - fcm_call_logs: Complete call disposition tracking

-- Key features:
-- - Call categorization (Today, Next 3 Days, Next 7 Days, Overdue)
-- - PIN-based agent tracking
-- - Comprehensive call status tracking
-- - Performance optimized indexes
-- - Sample data for immediate testing

-- =============================================================================
-- FUTURE EXPANSION PLACEHOLDERS
-- =============================================================================

-- Agent management (optional, for team environments)
-- CREATE TABLE fcm_agents (
--   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
--   pin_code TEXT NOT NULL UNIQUE,
--   display_name TEXT,
--   role TEXT DEFAULT 'agent', -- agent, supervisor, admin
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Call outcome categories (for analytics)
-- CREATE TABLE fcm_call_outcomes (
--   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
--   outcome_name TEXT NOT NULL UNIQUE,
--   outcome_color TEXT, -- for UI color coding
--   outcome_order INTEGER
-- );

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================