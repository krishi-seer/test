-- Krishi-Seer Supabase Setup Script (Zero-Type Login)
-- Run this in your Supabase SQL Editor

-- 1. Enable the pgvector extension to work with facial embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the user_biometrics table
-- This table stores the 128-dimensional face descriptor array
CREATE TABLE IF NOT EXISTS public.user_biometrics (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    face_descriptor vector(128) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.user_biometrics ENABLE ROW LEVEL SECURITY;

-- 4. Create a policy: Users can only see their own biometrics
CREATE POLICY "Users can view own biometrics" 
ON public.user_biometrics FOR SELECT 
USING (auth.uid() = id);

-- 5. Create a function to match descriptors
-- This uses the <=> operator (cosine distance)
-- Returns the user_id of the best match if the distance is below the threshold
CREATE OR REPLACE FUNCTION match_face_descriptor(
    query_embedding vector(128),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id UUID,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ub.id,
        1 - (ub.face_descriptor <=> query_embedding) AS similarity
    FROM user_biometrics ub
    WHERE 1 - (ub.face_descriptor <=> query_embedding) > match_threshold
    ORDER BY ub.face_descriptor <=> query_embedding
    LIMIT match_count;
END;
$$;
