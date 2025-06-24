-- Clean up general_searches table and all related objects

-- Drop the admin view first
DROP VIEW IF EXISTS admin_general_searches;

-- Drop the trigger
DROP TRIGGER IF EXISTS update_general_searches_updated_at ON general_searches;

-- Drop the function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop the table
DROP TABLE IF EXISTS general_searches;

-- Clean up any remaining objects
DROP INDEX IF EXISTS idx_general_searches_user_id;
DROP INDEX IF EXISTS idx_general_searches_query;
DROP INDEX IF EXISTS idx_general_searches_created_at;

-- Verify cleanup
SELECT 'Cleanup completed' as status; 