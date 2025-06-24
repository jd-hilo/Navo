-- Fix RLS policies for general_searches table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own searches" ON general_searches;
DROP POLICY IF EXISTS "Users can insert their own searches" ON general_searches;
DROP POLICY IF EXISTS "Users can update their own searches" ON general_searches;

-- Create more permissive policies that work with service role
CREATE POLICY "Enable read access for authenticated users" ON general_searches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON general_searches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON general_searches
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Alternative: Disable RLS temporarily for testing
-- ALTER TABLE general_searches DISABLE ROW LEVEL SECURITY; 