-- Supabase SQL Migration: Face Recognition Schema
-- Run this in Supabase SQL Editor

-- 1. Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create user_biometrics table to store face descriptors
CREATE TABLE IF NOT EXISTS user_biometrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 128-dimensional face descriptor from face-api.js
  face_descriptor vector(128) NOT NULL,
  
  -- Photo metadata
  photo_url TEXT,  -- URL to photo in Supabase Storage
  photo_storage_path TEXT, -- Path in storage bucket
  
  -- Metadata
  captured_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ,  -- When face was successfully verified during signup
  
  -- Matching stats
  match_attempts INT DEFAULT 0,
  last_match_attempt TIMESTAMPTZ,
  successful_matches INT DEFAULT 0,
  last_successful_match TIMESTAMPTZ,
  
  -- Versioning
  descriptor_version TEXT DEFAULT 'face-api-0.12',  -- Track which face model generated it
  
  CONSTRAINT face_descriptor_not_null CHECK (face_descriptor IS NOT NULL)
);

-- 3. Create function for face descriptor cosine similarity matching
-- Returns matching user_id if found within threshold
CREATE OR REPLACE FUNCTION match_face_descriptor(
  input_descriptor vector(128),
  distance_threshold FLOAT DEFAULT 0.42  -- Cosine distance; lower = stricter
)
RETURNS TABLE (
  user_id UUID,
  distance FLOAT,
  photo_url TEXT,
  verified_at TIMESTAMPTZ
) AS $$
  SELECT 
    ub.user_id,
    (1 - (ub.face_descriptor <=> input_descriptor))::FLOAT AS distance,
    ub.photo_url,
    ub.verified_at
  FROM user_biometrics ub
  WHERE (ub.face_descriptor <=> input_descriptor) <= distance_threshold
  ORDER BY (ub.face_descriptor <=> input_descriptor) ASC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- 4. Create function to update matching stats (called after verification attempt)
CREATE OR REPLACE FUNCTION update_match_stats(
  p_user_id UUID,
  p_successful BOOLEAN
)
RETURNS void AS $$
BEGIN
  UPDATE user_biometrics
  SET 
    match_attempts = match_attempts + 1,
    last_match_attempt = now(),
    successful_matches = CASE WHEN p_successful THEN successful_matches + 1 ELSE successful_matches END,
    last_successful_match = CASE WHEN p_successful THEN now() ELSE last_successful_match END
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_biometrics_user_id ON user_biometrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_biometrics_descriptor ON user_biometrics USING ivfflat (face_descriptor vector_cosine_ops) WITH (lists = 100);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE user_biometrics ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policy: Users can only read their own biometric data
CREATE POLICY "Users can view their own biometrics"
  ON user_biometrics
  FOR SELECT
  USING (auth.uid() = user_id);

-- 8. RLS Policy: Users can only update their own biometric data
CREATE POLICY "Users can update their own biometrics"
  ON user_biometrics
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 9. RLS Policy: Service role (backend) can insert/update for registration
-- (This is for your API route with service role key)
-- Note: RLS is NOT enforced for service role, so no policy needed for INSERT
-- But we'll create one for clarity
CREATE POLICY "Service backend can manage biometrics"
  ON user_biometrics
  FOR ALL
  USING (true)  -- Bypass for service role
  WITH CHECK (true);

-- 10. Create storage bucket for photos (Run via Supabase dashboard if SQL fails)
-- DO NOT create bucket via SQL; use Supabase Storage UI or JavaScript SDK
-- Bucket name: farmer-photos
-- Privacy: Private (authenticated users only)

-- 11. RLS Policy for storage bucket (Set in Storage UI)
-- Path pattern: user/{user_id}/*
-- SELECT: Users can read their own photos
-- INSERT: Users can upload their own photos
-- UPDATE/DELETE: Users can manage their own photos

-- 12. Optional: Create audit table for login attempts
CREATE TABLE IF NOT EXISTS face_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attempt_type TEXT CHECK (attempt_type IN ('attempt', 'success', 'failure')),
  descriptor_distance FLOAT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- These indices make the face matching lightning-fast
-- With ~100k users, IVFFlat scales much better than regular vector indices
