-- Fix user_id constraint error
-- Run this in your Supabase SQL editor

-- Step 1: Add user_id column as nullable first
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 2: Create a temporary user for existing data
-- This creates a placeholder user that we can use for existing trades
INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'legacy@placeholder.com',
    crypt('placeholder', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Update existing trades with the placeholder user_id
UPDATE trades 
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE user_id IS NULL;

-- Step 4: Add the foreign key constraint
ALTER TABLE trades 
ADD CONSTRAINT trades_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Make user_id NOT NULL
ALTER TABLE trades ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Enable Row Level Security
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
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

-- Verify the setup
SELECT 'Migration completed successfully' as status;
