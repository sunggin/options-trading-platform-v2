-- Quick fix: Add user_id column to trades table
-- Copy and paste this into your Supabase SQL Editor

-- Add user_id column
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set a default user_id for existing records (you can change this)
UPDATE trades 
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE user_id IS NULL;

-- Make user_id NOT NULL
ALTER TABLE trades ALTER COLUMN user_id SET NOT NULL;

-- Enable Row Level Security
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own trades" ON trades;
CREATE POLICY "Users can view their own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trades" ON trades;
CREATE POLICY "Users can insert their own trades" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trades" ON trades;
CREATE POLICY "Users can update their own trades" ON trades
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own trades" ON trades;
CREATE POLICY "Users can delete their own trades" ON trades
    FOR DELETE USING (auth.uid() = user_id);
