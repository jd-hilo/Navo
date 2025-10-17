-- Temporarily disable foreign key constraints for testing
-- This allows inserting folders without valid user_id references

-- Drop the foreign key constraint on folders table
ALTER TABLE folders DROP CONSTRAINT IF EXISTS folders_user_id_fkey;

-- Drop the foreign key constraint on saved_content table  
ALTER TABLE saved_content DROP CONSTRAINT IF EXISTS saved_content_user_id_fkey;
ALTER TABLE saved_content DROP CONSTRAINT IF EXISTS saved_content_folder_id_fkey;

-- Note: This is for testing purposes only
-- Re-add foreign key constraints in production
