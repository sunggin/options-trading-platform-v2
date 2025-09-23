-- Add username column to auth.users metadata
-- This will store the username in the user's metadata
-- We'll use a trigger to automatically create a profile when a user signs up

-- Create a profiles table to store additional user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  start_trading_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, start_trading_date)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    (NEW.raw_user_meta_data->>'start_trading_date')::DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update username
CREATE OR REPLACE FUNCTION public.update_username(new_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if username is already taken
  IF EXISTS (SELECT 1 FROM profiles WHERE username = new_username AND id != auth.uid()) THEN
    RETURN FALSE;
  END IF;
  
  -- Update the username
  UPDATE profiles 
  SET username = new_username, updated_at = NOW()
  WHERE id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update start trading date
CREATE OR REPLACE FUNCTION public.update_start_trading_date(new_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the start trading date
  UPDATE profiles 
  SET start_trading_date = new_date, updated_at = NOW()
  WHERE id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_username(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_start_trading_date(DATE) TO anon, authenticated;
