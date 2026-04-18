-- Migration: Add mobile field to farmers table for voice-face signup

ALTER TABLE farmers 
ADD COLUMN IF NOT EXISTS mobile TEXT;

-- Add index for mobile number lookups (optional)
CREATE INDEX IF NOT EXISTS idx_farmers_mobile ON farmers(mobile);

-- Add signup method tracking if not exists
ALTER TABLE farmers 
ADD COLUMN IF NOT EXISTS signup_method TEXT DEFAULT 'email';

-- Update existing rows to mark them as email signup
UPDATE farmers 
SET signup_method = 'email' 
WHERE signup_method IS NULL;

-- Add comments for clarity
COMMENT ON COLUMN farmers.mobile IS 'Mobile number from voice signup (from Web Speech API)';
COMMENT ON COLUMN farmers.signup_method IS 'How farmer signed up: email, voice-face, etc.';
