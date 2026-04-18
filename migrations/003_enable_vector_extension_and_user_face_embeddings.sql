-- Migration: Enable vector extension and create user_face_embeddings table
-- Run this in Supabase SQL Editor

-- 1. Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic profile information
  name TEXT,
  mobile TEXT,
  location TEXT,
  crops TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Signup method tracking
  signup_method TEXT DEFAULT 'voice-face'
);

-- 3. Create user_face_embeddings table
CREATE TABLE IF NOT EXISTS user_face_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 128-dimensional face embedding from face-api.js
  embedding vector(128) NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Versioning for face recognition model
  model_version TEXT DEFAULT 'face-api-0.22.2',

  CONSTRAINT embedding_not_null CHECK (embedding IS NOT NULL)
);

-- 4. Create function to find closest profile by face embedding using cosine distance
CREATE OR REPLACE FUNCTION find_closest_profile_by_embedding(
  input_embedding vector(128),
  distance_threshold FLOAT DEFAULT 0.42  -- Cosine distance threshold; lower = stricter matching
)
RETURNS TABLE (
  profile_id UUID,
  user_id UUID,
  distance FLOAT,
  name TEXT,
  mobile TEXT,
  location TEXT,
  crops TEXT
) AS $$
  SELECT
    p.id as profile_id,
    p.user_id,
    (ufe.embedding <=> input_embedding)::FLOAT as distance,
    p.name,
    p.mobile,
    p.location,
    p.crops
  FROM user_face_embeddings ufe
  JOIN profiles p ON ufe.profile_id = p.id
  WHERE (ufe.embedding <=> input_embedding) <= distance_threshold
  ORDER BY (ufe.embedding <=> input_embedding) ASC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_face_embeddings_profile_id ON user_face_embeddings(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_face_embeddings_embedding ON user_face_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 6. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_face_embeddings ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- 8. RLS Policies for user_face_embeddings table
CREATE POLICY "Users can view their own face embeddings"
  ON user_face_embeddings
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own face embeddings"
  ON user_face_embeddings
  FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage face embeddings"
  ON user_face_embeddings
  FOR ALL
  USING (auth.role() = 'service_role');

-- 9. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_face_embeddings_updated_at
  BEFORE UPDATE ON user_face_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();