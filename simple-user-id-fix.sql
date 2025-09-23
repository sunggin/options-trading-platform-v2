-- Simple fix for user_id constraint
-- Run this in your Supabase SQL editor

-- Step 1: Drop the existing foreign key constraint if it exists
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_user_id_fkey;

-- Step 2: Add user_id column as nullable first
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 3: For now, set user_id to NULL for existing records
-- New records will get the proper user_id when created
UPDATE trades 
SET user_id = NULL 
WHERE user_id IS NULL;

-- Step 4: Add the foreign key constraint (allows NULL values)
ALTER TABLE trades 
ADD CONSTRAINT trades_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Enable Row Level Security
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies (handles NULL user_id gracefully)
DROP POLICY IF EXISTS "Users can view their own trades" ON trades;
CREATE POLICY "Users can view their own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own trades" ON trades;
CREATE POLICY "Users can insert their own trades" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trades" ON trades;
CREATE POLICY "Users can update their own trades" ON trades
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own trades" ON trades;
CREATE POLICY "Users can delete their own trades" ON trades
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Verify the setup
SELECT 'Migration completed successfully' as status;
