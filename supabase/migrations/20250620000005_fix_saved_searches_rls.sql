-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can insert their own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can update their own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can delete their own saved searches" ON saved_searches;

-- Create new policies
CREATE POLICY "Users can view their own saved searches" 
ON saved_searches FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved searches" 
ON saved_searches FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches" 
ON saved_searches FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches" 
ON saved_searches FOR DELETE 
USING (auth.uid() = user_id); 