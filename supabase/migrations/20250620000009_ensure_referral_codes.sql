-- Create a trigger to ensure all user profiles have referral codes
CREATE OR REPLACE FUNCTION ensure_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- If referral_code is NULL, generate one
  IF NEW.referral_code IS NULL THEN
    -- Try to generate a unique code
    NEW.referral_code := (
      SELECT generate_referral_code_v2()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_profile_referral_code ON user_profiles;

-- Create trigger for both INSERT and UPDATE
CREATE TRIGGER ensure_profile_referral_code
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_referral_code();

-- Backfill any existing profiles that don't have referral codes
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT id 
    FROM user_profiles 
    WHERE referral_code IS NULL
  LOOP
    -- Update will trigger the ensure_referral_code function
    UPDATE user_profiles 
    SET updated_at = NOW()  -- This update will trigger the function
    WHERE id = profile_record.id;
  END LOOP;
END;
$$; 