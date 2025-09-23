-- Enable Row Level Security (RLS) on both tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own trades" ON trades;
DROP POLICY IF EXISTS "Users can insert their own trades" ON trades;
DROP POLICY IF EXISTS "Users can update their own trades" ON trades;
DROP POLICY IF EXISTS "Users can delete their own trades" ON trades;
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;

-- Create RLS policies for trades table
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

-- Ensure user_id column exists and is NOT NULL
ALTER TABLE trades ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE accounts ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trades_user_id_fkey' 
        AND table_name = 'trades'
    ) THEN
        ALTER TABLE trades ADD CONSTRAINT trades_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_user_id_fkey' 
        AND table_name = 'accounts'
    ) THEN
        ALTER TABLE accounts ADD CONSTRAINT accounts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

