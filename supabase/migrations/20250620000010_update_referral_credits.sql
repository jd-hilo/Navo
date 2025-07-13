-- First, update the process_referral function to modify search_count instead of referral_credits
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
    search_count = search_count - 25  -- Decrease search count by 25 (negative is ok)
  WHERE user_id = referee_id;
  
  -- Update referrer's search count
  UPDATE user_profiles
  SET search_count = search_count - 25  -- Decrease search count by 25 (negative is ok)
  WHERE user_id = referrer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the use_referral_code function to use search_count
CREATE OR REPLACE FUNCTION use_referral_code(
  code CHAR(5),
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  referrer_id UUID;
  referrer_profile_id UUID;
  referee_profile_id UUID;
  referral_count INTEGER;
BEGIN
  -- Check if user is trying to use their own code
  SELECT up.user_id INTO referrer_id
  FROM user_profiles up
  WHERE up.referral_code = code;
  
  IF referrer_id IS NULL THEN
    RAISE EXCEPTION 'Invalid referral code';
  END IF;
  
  IF referrer_id = p_user_id THEN
    RAISE EXCEPTION 'Cannot use your own referral code';
  END IF;
  
  -- Get profile IDs
  SELECT id INTO referrer_profile_id
  FROM user_profiles
  WHERE user_id = referrer_id;
  
  SELECT id INTO referee_profile_id
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- Check if referee has already used a referral code
  IF EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE user_id = p_user_id AND referred_by IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'You have already used a referral code';
  END IF;
  
  -- Check referral count
  SELECT COUNT(*) INTO referral_count
  FROM user_profiles
  WHERE referred_by = referrer_id;
  
  IF referral_count >= 3 THEN
    RAISE EXCEPTION 'This referral code has reached its maximum uses';
  END IF;
  
  -- Process the referral
  PERFORM process_referral(referrer_id, p_user_id);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the now unused referral_credits column
ALTER TABLE user_profiles DROP COLUMN IF EXISTS referral_credits; 