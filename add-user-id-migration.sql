-- Migration script to add user_id column to existing trades table
-- Run this in your Supabase SQL editor

-- First, check if user_id column exists
DO $$
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'user_id'
    ) THEN
        -- Add the user_id column
        ALTER TABLE trades 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Add NOT NULL constraint after setting default values
        -- For now, we'll set a temporary user_id for existing records
        -- You may want to update this with actual user IDs
        UPDATE trades SET user_id = '00000000-0000-0000-0000-000000000000'::uuid 
        WHERE user_id IS NULL;
        
        -- Now make it NOT NULL
        ALTER TABLE trades ALTER COLUMN user_id SET NOT NULL;
        
        -- Enable Row Level Security if not already enabled
        ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies for user isolation
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
        
        RAISE NOTICE 'user_id column added successfully to trades table';
    ELSE
        RAISE NOTICE 'user_id column already exists in trades table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trades' 
AND column_name = 'user_id';
