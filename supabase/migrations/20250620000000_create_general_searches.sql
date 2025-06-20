-- Create general_searches table to track what people search
CREATE TABLE IF NOT EXISTS general_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, query)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_general_searches_user_id ON general_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_general_searches_query ON general_searches(query);
CREATE INDEX IF NOT EXISTS idx_general_searches_created_at ON general_searches(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_general_searches_updated_at 
  BEFORE UPDATE ON general_searches 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE general_searches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own searches" ON general_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own searches" ON general_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own searches" ON general_searches
  FOR UPDATE USING (auth.uid() = user_id);

-- Create a view for admin to see all searches (optional)
CREATE VIEW admin_general_searches AS
SELECT 
  gs.id,
  gs.query,
  gs.search_count,
  gs.created_at,
  gs.updated_at,
  u.email as user_email,
  u.raw_user_meta_data->>'name' as user_name
FROM general_searches gs
LEFT JOIN auth.users u ON gs.user_id = u.id
ORDER BY gs.created_at DESC; 