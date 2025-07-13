-- Drop the existing function first
DROP FUNCTION IF EXISTS use_referral_code(character, uuid);

-- Drop and recreate the use_referral_code function with better validation and error handling
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
  -- Update referee's profile
  UPDATE user_profiles
  SET 
    referred_by = referrer_id,
    referral_credits = COALESCE(referral_credits, 0) + 25
  WHERE id = referee_profile_id;
  
  -- Update referrer's credits
  UPDATE user_profiles
  SET referral_credits = COALESCE(referral_credits, 0) + 25
  WHERE id = referrer_profile_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 