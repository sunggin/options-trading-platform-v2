-- Create accounts table with user isolation
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- User isolation
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('paper', 'live')) NOT NULL DEFAULT 'paper',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table with user isolation
CREATE TABLE trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- User isolation
  ticker TEXT NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  account TEXT NOT NULL, -- Keep for backward compatibility
  trading_date DATE NOT NULL,
  option_type TEXT CHECK (option_type IN ('Call option', 'Put option', 'Covered call', 'Cash secured put', 'PMCC call option', 'PMCC covered call')) NOT NULL,
  expiration_date DATE NOT NULL,
  status TEXT CHECK (status IN ('open', 'closed')) NOT NULL DEFAULT 'open',
  contracts INTEGER NOT NULL CHECK (contracts > 0),
  cost DECIMAL(10,2) NOT NULL,
  strike_price DECIMAL(10,2) NOT NULL,
  price_at_purchase DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2),
  realized_gain DECIMAL(10,2) DEFAULT 0,
  unrealized_gain DECIMAL(10,2) DEFAULT 0,
  -- New fields
  pmcc_calc DECIMAL(10,2), -- PMCC calculation result
  realized_pl DECIMAL(10,2) DEFAULT 0, -- Realized P/L
  unrealized_pl DECIMAL(10,2) DEFAULT 0, -- Unrealized P/L
  audited BOOLEAN DEFAULT FALSE, -- Audited checkbox
  exercised BOOLEAN DEFAULT FALSE, -- Exercised checkbox
  closed_date DATE, -- Date when trade was closed
  expected_return DECIMAL(10,2), -- Expected return percentage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_trades_updated_at 
    BEFORE UPDATE ON trades 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate unrealized gains
CREATE OR REPLACE FUNCTION calculate_unrealized_gain(
  p_contracts INTEGER,
  p_option_type TEXT,
  p_strike_price DECIMAL,
  p_current_price DECIMAL,
  p_cost DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  option_value DECIMAL;
  total_cost DECIMAL;
BEGIN
  -- Calculate total cost (cost per contract * number of contracts)
  total_cost := p_cost * p_contracts;
  
  -- For calls: profit if current_price > strike_price, otherwise 0
  -- For puts: profit if current_price < strike_price, otherwise 0
  IF p_option_type = 'call' THEN
    option_value := GREATEST(p_current_price - p_strike_price, 0) * p_contracts;
  ELSE
    option_value := GREATEST(p_strike_price - p_current_price, 0) * p_contracts;
  END IF;
  
  -- Return unrealized gain (option value - total cost)
  RETURN option_value - total_cost;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate realized gains
CREATE OR REPLACE FUNCTION calculate_realized_gain(
  p_contracts INTEGER,
  p_option_type TEXT,
  p_strike_price DECIMAL,
  p_sell_price DECIMAL,
  p_cost DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  option_value DECIMAL;
  total_cost DECIMAL;
BEGIN
  -- Calculate total cost (cost per contract * number of contracts)
  total_cost := p_cost * p_contracts;
  
  -- For calls: profit if sell_price > strike_price, otherwise 0
  -- For puts: profit if sell_price < strike_price, otherwise 0
  IF p_option_type = 'call' THEN
    option_value := GREATEST(p_sell_price - p_strike_price, 0) * p_contracts;
  ELSE
    option_value := GREATEST(p_strike_price - p_sell_price, 0) * p_contracts;
  END IF;
  
  -- Return realized gain (option value - total cost)
  RETURN option_value - total_cost;
END;
$$ LANGUAGE plpgsql;

-- No sample data - users start with a blank slate
-- Each user will create their own accounts as needed

-- Enable Row Level Security (RLS)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user isolation
CREATE POLICY "Users can view their own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" ON trades
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for accounts table
CREATE POLICY "Users can view their own accounts" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON accounts
  FOR DELETE USING (auth.uid() = user_id);
