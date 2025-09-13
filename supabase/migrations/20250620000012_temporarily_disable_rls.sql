-- Temporarily disable RLS for testing
-- This allows all operations without authentication checks

-- Disable RLS on folders table
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on saved_content table  
ALTER TABLE saved_content DISABLE ROW LEVEL SECURITY;

-- Note: This is for testing purposes only
-- Re-enable RLS in production with proper policies
