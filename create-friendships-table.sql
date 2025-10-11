-- Create friendships table to manage friend requests and connections
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, friend_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Enable Row Level Security
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own friendships (sent or received)
CREATE POLICY "Users can view their friendships"
  ON public.friendships
  FOR SELECT
  USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

-- Policy: Users can create friend requests
CREATE POLICY "Users can send friend requests"
  ON public.friendships
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Policy: Users can update friendships they're part of (to accept/reject)
CREATE POLICY "Users can update their friendships"
  ON public.friendships
  FOR UPDATE
  USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  )
  WITH CHECK (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

-- Policy: Users can delete their own friend requests
CREATE POLICY "Users can delete their friendships"
  ON public.friendships
  FOR DELETE
  USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

