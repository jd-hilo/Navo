-- Create saved_searches table to store bookmarked searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  gemini_data JSONB,
  tiktok_data JSONB,
  reddit_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, query)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_saved_searches_updated_at 
  BEFORE UPDATE ON saved_searches 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can insert their own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can update their own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can delete their own saved searches" ON saved_searches;

-- Create policies with authenticated role
CREATE POLICY "Users can view their own saved searches" 
ON saved_searches FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved searches" 
ON saved_searches FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches" 
ON saved_searches FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches" 
ON saved_searches FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON saved_searches TO authenticated; 