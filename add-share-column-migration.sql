-- Add share column to trades table for social sharing
-- Run this in your Supabase SQL editor

-- Add the share column
ALTER TABLE trades ADD COLUMN IF NOT EXISTS share BOOLEAN DEFAULT FALSE;

-- Add an index for better performance when querying shared trades
CREATE INDEX IF NOT EXISTS idx_trades_share ON trades(share) WHERE share = true;

-- Update RLS policies to allow viewing shared trades
-- Users can view their own trades (existing policy)
-- Users can view shared trades from other users (new policy)

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own trades" ON trades;
DROP POLICY IF EXISTS "Users can view shared trades" ON trades;

-- Recreate the policy for viewing own trades
CREATE POLICY "Users can view their own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id);

-- Create new policy for viewing shared trades
CREATE POLICY "Users can view shared trades" ON trades
    FOR SELECT USING (share = true);

-- Users can update their own trades (including share field)
DROP POLICY IF EXISTS "Users can update their own trades" ON trades;
CREATE POLICY "Users can update their own trades" ON trades
    FOR UPDATE USING (auth.uid() = user_id);

-- Verify the setup
SELECT 'Share column added successfully' as status;
SELECT 'RLS policies updated for social sharing' as info;
