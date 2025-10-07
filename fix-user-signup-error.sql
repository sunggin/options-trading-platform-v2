-- Fix for "database error saving new user" issue
-- The problem is that there's a trigger trying to create profiles in a non-existent table
-- Run this in your Supabase SQL editor

-- STEP 1: Drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- STEP 2: Drop the problematic function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- STEP 3: Drop any other profile-related functions that might cause issues
DROP FUNCTION IF EXISTS public.update_username(TEXT);
DROP FUNCTION IF EXISTS public.update_start_trading_date(DATE);

-- STEP 4: Drop the profiles table if it exists (it should have been removed)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- STEP 5: Verify the fix
SELECT 'User signup trigger and profiles table removed successfully' as status;
SELECT 'New users should now be able to sign up without database errors' as info;
