-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create call status enum type
CREATE TYPE call_status AS ENUM (
  'completed',
  'follow_up', 
  'busy',
  'no_answer',
  'scheduled',
  'cancelled',
  'failed'
);

-- Create fcm_customers table
CREATE TABLE fcm_customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  mobile_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fcm_call_logs table  
CREATE TABLE fcm_call_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES fcm_customers(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_date TIMESTAMPTZ NOT NULL,
  next_call_date TIMESTAMPTZ,
  remarks TEXT,
  call_status call_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
CREATE TRIGGER update_fcm_customers_updated_at 
  BEFORE UPDATE ON fcm_customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fcm_call_logs_updated_at 
  BEFORE UPDATE ON fcm_call_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create performance indices
CREATE INDEX idx_fcm_customers_mobile_number ON fcm_customers(mobile_number);
CREATE INDEX idx_fcm_customers_created_at ON fcm_customers(created_at);

CREATE INDEX idx_fcm_call_logs_customer_id ON fcm_call_logs(customer_id);
CREATE INDEX idx_fcm_call_logs_agent_id ON fcm_call_logs(agent_id);
CREATE INDEX idx_fcm_call_logs_call_date ON fcm_call_logs(call_date);
CREATE INDEX idx_fcm_call_logs_next_call_date ON fcm_call_logs(next_call_date);
CREATE INDEX idx_fcm_call_logs_call_status ON fcm_call_logs(call_status);
CREATE INDEX idx_fcm_call_logs_created_at ON fcm_call_logs(created_at);

-- Composite indices for common query patterns
CREATE INDEX idx_fcm_call_logs_agent_date ON fcm_call_logs(agent_id, call_date DESC);
CREATE INDEX idx_fcm_call_logs_customer_date ON fcm_call_logs(customer_id, call_date DESC);
CREATE INDEX idx_fcm_call_logs_next_call ON fcm_call_logs(agent_id, next_call_date) WHERE next_call_date IS NOT NULL;

-- Create function to check if user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;