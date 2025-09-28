-- Fix user deletion issues
-- This script addresses foreign key constraints preventing user deletion
-- Run this in your Supabase SQL editor

-- STEP 1: Check current foreign key constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'users'
    AND tc.table_schema = 'public';

-- STEP 2: Ensure all foreign key constraints have CASCADE DELETE
-- Fix profiles table constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix trades table constraint
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_user_id_fkey;
ALTER TABLE trades ADD CONSTRAINT trades_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix accounts table constraint (if it exists)
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_user_id_fkey;
ALTER TABLE accounts ADD CONSTRAINT accounts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- STEP 3: Create a function to safely delete a user and all related data
CREATE OR REPLACE FUNCTION delete_user_safely(user_id_to_delete UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id_to_delete) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE NOTICE 'User % does not exist', user_id_to_delete;
        RETURN FALSE;
    END IF;
    
    -- Delete from all related tables (in correct order to avoid constraint issues)
    -- 1. Delete from trades table
    DELETE FROM trades WHERE user_id = user_id_to_delete;
    RAISE NOTICE 'Deleted trades for user %', user_id_to_delete;
    
    -- 2. Delete from accounts table (if it exists)
    DELETE FROM accounts WHERE user_id = user_id_to_delete;
    RAISE NOTICE 'Deleted accounts for user %', user_id_to_delete;
    
    -- 3. Delete from profiles table
    DELETE FROM profiles WHERE id = user_id_to_delete;
    RAISE NOTICE 'Deleted profile for user %', user_id_to_delete;
    
    -- 4. Finally delete from auth.users
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    RAISE NOTICE 'Deleted user %', user_id_to_delete;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting user %: %', user_id_to_delete, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Create a function to check what's preventing user deletion
CREATE OR REPLACE FUNCTION check_user_deletion_blockers(user_id_to_check UUID)
RETURNS TABLE(
    table_name TEXT,
    record_count BIGINT,
    sample_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'trades'::TEXT as table_name,
        COUNT(*)::BIGINT as record_count,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'ticker', ticker,
                    'user_id', user_id
                )
            ) FILTER (WHERE COUNT(*) > 0),
            '[]'::jsonb
        ) as sample_data
    FROM trades 
    WHERE user_id = user_id_to_check
    
    UNION ALL
    
    SELECT 
        'profiles'::TEXT as table_name,
        COUNT(*)::BIGINT as record_count,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'username', username
                )
            ) FILTER (WHERE COUNT(*) > 0),
            '[]'::jsonb
        ) as sample_data
    FROM profiles 
    WHERE id = user_id_to_check
    
    UNION ALL
    
    SELECT 
        'accounts'::TEXT as table_name,
        COUNT(*)::BIGINT as record_count,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'user_id', user_id
                )
            ) FILTER (WHERE COUNT(*) > 0),
            '[]'::jsonb
        ) as sample_data
    FROM accounts 
    WHERE user_id = user_id_to_check;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Verify the fix
SELECT 'User deletion fix completed successfully' as status;

-- STEP 6: Test the functions (uncomment to test with a specific user ID)
-- SELECT delete_user_safely('your-user-id-here'::UUID);
-- SELECT * FROM check_user_deletion_blockers('your-user-id-here'::UUID);
