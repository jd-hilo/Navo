-- Add content saving system for individual search result items
-- This allows users to save individual pieces of content (TikTok videos, Reddit posts, Pinterest pins, etc.) to organized folders

-- Create folders table for organizing saved content
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for folder display
  icon VARCHAR(50) DEFAULT 'folder', -- Icon name for folder display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create saved_content table for individual search result items
CREATE TABLE IF NOT EXISTS saved_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('tiktok', 'reddit', 'pinterest', 'gemini')),
  content_data JSONB NOT NULL, -- Store the actual content data (video, post, pin, etc.)
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, source_url) -- Prevent duplicate saves of same content
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_created_at ON folders(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_content_user_id ON saved_content(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_content_folder_id ON saved_content(folder_id);
CREATE INDEX IF NOT EXISTS idx_saved_content_type ON saved_content(content_type);
CREATE INDEX IF NOT EXISTS idx_saved_content_created_at ON saved_content(created_at);

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_folders_updated_at 
  BEFORE UPDATE ON folders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_content_updated_at 
  BEFORE UPDATE ON saved_content 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own folders" ON folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON folders;

DROP POLICY IF EXISTS "Users can view their own saved content" ON saved_content;
DROP POLICY IF EXISTS "Users can insert their own saved content" ON saved_content;
DROP POLICY IF EXISTS "Users can update their own saved content" ON saved_content;
DROP POLICY IF EXISTS "Users can delete their own saved content" ON saved_content;

-- Create RLS policies for folders
CREATE POLICY "Users can view their own folders" 
ON folders FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" 
ON folders FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" 
ON folders FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" 
ON folders FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policies for saved_content
CREATE POLICY "Users can view their own saved content" 
ON saved_content FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved content" 
ON saved_content FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved content" 
ON saved_content FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved content" 
ON saved_content FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON folders TO authenticated;
GRANT ALL ON saved_content TO authenticated;

-- Create a view for easy querying of saved content with folder information
CREATE VIEW saved_content_with_folders AS
SELECT 
  sc.id,
  sc.user_id,
  sc.folder_id,
  f.name as folder_name,
  f.color as folder_color,
  f.icon as folder_icon,
  sc.content_type,
  sc.content_data,
  sc.title,
  sc.description,
  sc.source_url,
  sc.thumbnail_url,
  sc.created_at,
  sc.updated_at
FROM saved_content sc
LEFT JOIN folders f ON sc.folder_id = f.id
ORDER BY sc.created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON saved_content_with_folders TO authenticated;

-- Create a function to get folder content count
CREATE OR REPLACE FUNCTION get_folder_content_count(folder_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM saved_content 
    WHERE folder_id = folder_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_folder_content_count(UUID) TO authenticated;

-- Create a function to move content between folders
CREATE OR REPLACE FUNCTION move_content_to_folder(
  content_uuid UUID,
  new_folder_uuid UUID,
  user_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the content belongs to the user and the new folder belongs to the user
  IF EXISTS (
    SELECT 1 FROM saved_content sc
    JOIN folders f ON f.id = new_folder_uuid
    WHERE sc.id = content_uuid 
    AND sc.user_id = user_uuid 
    AND f.user_id = user_uuid
  ) THEN
    UPDATE saved_content 
    SET folder_id = new_folder_uuid, updated_at = NOW()
    WHERE id = content_uuid AND user_id = user_uuid;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION move_content_to_folder(UUID, UUID, UUID) TO authenticated;

-- Create a function to create a default folder for new users
CREATE OR REPLACE FUNCTION create_default_folder_for_user(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  folder_id UUID;
BEGIN
  -- Create a default "Saved Items" folder
  INSERT INTO folders (user_id, name, description, color, icon)
  VALUES (user_uuid, 'Saved Items', 'Your default folder for saved content', '#3B82F6', 'bookmark')
  ON CONFLICT (user_id, name) DO NOTHING
  RETURNING id INTO folder_id;
  
  -- If no folder was created (due to conflict), get the existing one
  IF folder_id IS NULL THEN
    SELECT id INTO folder_id FROM folders WHERE user_id = user_uuid AND name = 'Saved Items';
  END IF;
  
  RETURN folder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_default_folder_for_user(UUID) TO authenticated;
