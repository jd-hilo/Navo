-- Create an improved version of generate_referral_code for bulk operations
CREATE OR REPLACE FUNCTION generate_referral_code_v2()
RETURNS CHAR(5) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result CHAR(5) := '';
  i INTEGER := 0;
  success BOOLEAN := false;
BEGIN
  -- Try to generate a unique code up to 10 times
  WHILE i < 10 AND NOT success LOOP
    result := '';
    FOR j IN 1..5 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code exists without trying to update
    IF NOT EXISTS (
      SELECT 1 
      FROM user_profiles 
      WHERE referral_code = result
    ) THEN
      success := true;
    ELSE
      i := i + 1;
    END IF;
  END LOOP;
  
  IF NOT success THEN
    RAISE EXCEPTION 'Could not generate unique referral code after 10 attempts';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Backfill referral codes for existing users
DO $$
DECLARE
    user_record RECORD;
    new_code CHAR(5);
    batch_size INTEGER := 100;
    processed INTEGER := 0;
BEGIN
    -- Process users in batches to avoid overwhelming the database
    LOOP
        -- Get a batch of users without referral codes
        FOR user_record IN 
            SELECT id 
            FROM user_profiles 
            WHERE referral_code IS NULL
            LIMIT batch_size
        LOOP
            -- Generate and set a new referral code
            new_code := generate_referral_code_v2();
            
            -- Update the user's profile with the new code
            UPDATE user_profiles 
            SET referral_code = new_code 
            WHERE id = user_record.id;
            
            processed := processed + 1;
            
            -- Add a small delay between updates
            PERFORM pg_sleep(0.1);
        END LOOP;
        
        -- Exit if no more users to process
        EXIT WHEN NOT FOUND;
        
        -- Log progress
        RAISE NOTICE 'Processed % users', processed;
        
        -- Add a delay between batches
        PERFORM pg_sleep(1);
    END LOOP;
    
    RAISE NOTICE 'Finished processing % users', processed;
END;
$$; 