-- Complete Supabase schema with profiles table for authentication
-- Run this in your Supabase SQL Editor to set up the complete database

-- Create profiles table for user authentication
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  username TEXT,
  start_trading_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounts table with user isolation
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- User isolation
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('paper', 'live')) NOT NULL DEFAULT 'paper',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table with user isolation
CREATE TABLE IF NOT EXISTS trades (
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

-- Create trigger to automatically update updated_at for profiles
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at for trades
CREATE TRIGGER update_trades_updated_at 
    BEFORE UPDATE ON trades 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, start_trading_date)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Create RLS policies for user isolation on trades
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.accounts TO anon, authenticated;
GRANT ALL ON public.trades TO anon, authenticated;

-- Success message
SELECT 'Complete Supabase schema created successfully! Profiles table included.' as status;
