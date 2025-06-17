/*
  # Create search results storage

  1. New Tables
    - `search_results`
      - `id` (uuid, primary key)
      - `query` (text, search query)
      - `user_id` (uuid, foreign key to auth.users)
      - `gemini_data` (jsonb, Gemini API response)
      - `tiktok_data` (jsonb, TikTok API response)
      - `reddit_data` (jsonb, Reddit API response)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `expires_at` (timestamp, for cache expiration)

  2. Security
    - Enable RLS on `search_results` table
    - Add policies for users to access their own search results
    - Add policy for inserting new search results

  3. Indexes
    - Add index on user_id and query for fast lookups
    - Add index on expires_at for cleanup
*/

CREATE TABLE IF NOT EXISTS search_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_data jsonb,
  tiktok_data jsonb,
  reddit_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  CONSTRAINT search_results_query_check CHECK (length(trim(query)) > 0)
);

-- Enable Row Level Security
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own search results"
  ON search_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search results"
  ON search_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search results"
  ON search_results
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search results"
  ON search_results
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_results_user_query 
  ON search_results(user_id, query);

CREATE INDEX IF NOT EXISTS idx_search_results_expires_at 
  ON search_results(expires_at);

CREATE INDEX IF NOT EXISTS idx_search_results_created_at 
  ON search_results(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_search_results_updated_at
  BEFORE UPDATE ON search_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired search results
CREATE OR REPLACE FUNCTION cleanup_expired_search_results()
RETURNS void AS $$
BEGIN
  DELETE FROM search_results WHERE expires_at < now();
END;
$$ language 'plpgsql';