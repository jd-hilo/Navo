-- Add referral code to user_profiles
ALTER TABLE user_profiles
ADD COLUMN referral_code CHAR(5) UNIQUE,
ADD COLUMN referred_by UUID REFERENCES auth.users(id),
ADD COLUMN referral_credits INTEGER DEFAULT 0;

-- Create function to generate random referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
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
    
    BEGIN
      -- Try to insert the code
      UPDATE user_profiles 
      SET referral_code = result 
      WHERE id = id AND referral_code IS NULL 
      RETURNING referral_code INTO result;
      success := true;
    EXCEPTION WHEN unique_violation THEN
      i := i + 1;
    END;
  END LOOP;
  
  IF NOT success THEN
    RAISE EXCEPTION 'Could not generate unique referral code after 10 attempts';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to process referral
CREATE OR REPLACE FUNCTION process_referral(
  referrer_id UUID,
  referee_id UUID
)
RETURNS void AS $$
DECLARE
  referral_count INTEGER;
BEGIN
  -- Check if referrer exists and hasn't exceeded limit
  SELECT COUNT(*) INTO referral_count
  FROM user_profiles
  WHERE referred_by = referrer_id;
  
  IF referral_count >= 3 THEN
    RAISE EXCEPTION 'Referrer has reached maximum referral limit';
  END IF;
  
  -- Update referee's profile
  UPDATE user_profiles
  SET 
    referred_by = referrer_id,
    referral_credits = referral_credits + 25
  WHERE user_id = referee_id;
  
  -- Update referrer's credits
  UPDATE user_profiles
  SET referral_credits = referral_credits + 25
  WHERE user_id = referrer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to generate referral code for new profiles
CREATE OR REPLACE FUNCTION generate_referral_code_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_referral_code
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code_trigger();

-- Create function to validate and use referral code
CREATE OR REPLACE FUNCTION use_referral_code(
  code CHAR(5),
  user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  referrer_id UUID;
BEGIN
  -- Find the referrer
  SELECT user_id INTO referrer_id
  FROM user_profiles
  WHERE referral_code = code;
  
  IF referrer_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Process the referral
  PERFORM process_referral(referrer_id, user_id);
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 