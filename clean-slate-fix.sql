-- Clean slate fix for user_id constraint
-- This will clear existing data and set up properly
-- Run this in your Supabase SQL editor

-- STEP 1: Drop the foreign key constraint
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_user_id_fkey;

-- STEP 2: Clear all existing trades (since they have invalid user_id)
-- WARNING: This will delete all existing trades!
DELETE FROM trades;

-- STEP 3: Remove and recreate the user_id column
ALTER TABLE trades DROP COLUMN IF EXISTS user_id;
ALTER TABLE trades ADD COLUMN user_id UUID;

-- STEP 4: Add foreign key constraint
ALTER TABLE trades 
ADD CONSTRAINT trades_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- STEP 5: Make user_id NOT NULL for new records
ALTER TABLE trades ALTER COLUMN user_id SET NOT NULL;

-- STEP 6: Enable Row Level Security
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create RLS policies
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

-- STEP 8: Verify the setup
SELECT 'Clean slate migration completed successfully' as status;
SELECT 'Trades table is now ready for new data with proper user_id' as info;
