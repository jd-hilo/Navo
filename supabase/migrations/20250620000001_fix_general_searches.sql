-- Fix general_searches table - add unique constraint if it doesn't exist
DO $$ 
BEGIN
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'general_searches_user_id_query_key'
  ) THEN
    ALTER TABLE general_searches ADD CONSTRAINT general_searches_user_id_query_key UNIQUE(user_id, query);
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_general_searches_user_id ON general_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_general_searches_query ON general_searches(query);
CREATE INDEX IF NOT EXISTS idx_general_searches_created_at ON general_searches(created_at);

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_general_searches_updated_at'
  ) THEN
    CREATE TRIGGER update_general_searches_updated_at 
      BEFORE UPDATE ON general_searches 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE general_searches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own searches" ON general_searches;
DROP POLICY IF EXISTS "Users can insert their own searches" ON general_searches;
DROP POLICY IF EXISTS "Users can update their own searches" ON general_searches;

-- Create policies
CREATE POLICY "Users can view their own searches" ON general_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own searches" ON general_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own searches" ON general_searches
  FOR UPDATE USING (auth.uid() = user_id);

-- Drop and recreate the admin view
DROP VIEW IF EXISTS admin_general_searches;
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