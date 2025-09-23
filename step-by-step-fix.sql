-- Step-by-step fix for user_id constraint
-- Run each step separately in your Supabase SQL editor

-- STEP 1: Check current state
SELECT 'Current trades count:' as info, COUNT(*) as count FROM trades;
SELECT 'Current user_id values:' as info, user_id, COUNT(*) as count FROM trades GROUP BY user_id;

-- STEP 2: Drop the foreign key constraint
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_user_id_fkey;

-- STEP 3: Remove the user_id column completely
ALTER TABLE trades DROP COLUMN IF EXISTS user_id;

-- STEP 4: Add user_id column as nullable
ALTER TABLE trades ADD COLUMN user_id UUID;

-- STEP 5: Verify the column was added
SELECT 'user_id column added' as status;

-- STEP 6: Add foreign key constraint (allows NULL values)
ALTER TABLE trades 
ADD CONSTRAINT trades_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- STEP 7: Enable Row Level Security
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create RLS policies
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

-- STEP 9: Verify final state
SELECT 'Migration completed successfully' as status;
SELECT 'Final trades count:' as info, COUNT(*) as count FROM trades;
SELECT 'Final user_id values:' as info, user_id, COUNT(*) as count FROM trades GROUP BY user_id;
