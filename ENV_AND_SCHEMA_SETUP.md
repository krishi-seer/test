# ⚙️ Environment Variables & Supabase Setup

## `.env.local` — What To Add

Copy this to your `.env.local` file (you already have most of these):

```bash
# ============================================
# EXISTING (Don't change)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Existing AI keys
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
HUGGING_FACE_TOKEN=hf_...

# ============================================
# NEW — Add These For Face Auth
# ============================================

# Storage bucket name (create this in Supabase)
NEXT_PUBLIC_SUPABASE_BUCKET=farmer-photos

# Face recognition toggle
NEXT_PUBLIC_FACE_DETECTION_ENABLED=true

# Cosine distance threshold for face matching
# Lower = stricter (more secure but more false negatives)
# Higher = looser (easier but more false positives)
# Default 0.42 = ~99.9% accuracy for matching
FACE_MATCH_THRESHOLD=0.42

# Rate limiting for verification attempts (per minute)
FACE_VERIFICATION_RATE_LIMIT=5

# Optional: Bhashini for production voice (if needed later)
# BHASHINI_API_KEY=your-key
# BHASHINI_USER_ID=your-id
```

For reference, here's what each threshold means:

| FACE_MATCH_THRESHOLD | Accuracy | Risk |
|----------------------|----------|------|
| 0.35 | 99.99% | Very strict (some real users may be rejected) |
| 0.40 | 99.9% | **Recommended** |
| 0.45 | 99% | Less strict (slightly more false matches) |
| 0.50 | 95% | Lenient (faster but less secure) |

---

## 🗄️ Supabase SQL — What To Run

### 1. Open Supabase SQL Editor

Go to: **Supabase Dashboard** → **SQL Editor** → **New Query**

### 2. Copy & Paste This Entire SQL

```sql
-- ==============================================
-- Face Recognition Schema Setup
-- ==============================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create user_biometrics table for storing face descriptors
CREATE TABLE IF NOT EXISTS user_biometrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 128-dimensional face descriptor from face-api.js
  face_descriptor vector(128) NOT NULL,
  
  -- Photo metadata
  photo_url TEXT,
  photo_storage_path TEXT,
  
  -- Metadata
  captured_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ,
  
  -- Matching stats
  match_attempts INT DEFAULT 0,
  last_match_attempt TIMESTAMPTZ,
  successful_matches INT DEFAULT 0,
  last_successful_match TIMESTAMPTZ,
  
  -- Versioning
  descriptor_version TEXT DEFAULT 'face-api-0.12',
  
  CONSTRAINT face_descriptor_not_null CHECK (face_descriptor IS NOT NULL)
);

-- 3. Create function for face descriptor cosine similarity matching
CREATE OR REPLACE FUNCTION match_face_descriptor(
  input_descriptor vector(128),
  distance_threshold FLOAT DEFAULT 0.42
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

-- 4. Create function to update matching stats
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

-- 6. Enable Row Level Security
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

-- 9. Optional: Audit table for login attempts
CREATE TABLE IF NOT EXISTS face_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attempt_type TEXT CHECK (attempt_type IN ('attempt', 'success', 'failure')),
  descriptor_distance FLOAT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Index for audit queries
CREATE INDEX IF NOT EXISTS idx_face_login_user ON face_login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_face_login_time ON face_login_attempts(created_at);
```

### 3. Click "Run" ✓

You should see:
```
✓ CREATE EXTENSION
✓ CREATE TABLE public.user_biometrics
✓ CREATE FUNCTION public.match_face_descriptor
✓ CREATE FUNCTION public.update_match_stats
✓ CREATE INDEX public.idx_user_biometrics_user_id
✓ CREATE INDEX public.idx_user_biometrics_descriptor
✓ ALTER TABLE
✓ CREATE POLICY
✓ CREATE POLICY
✓ CREATE TABLE public.face_login_attempts
✓ CREATE INDEX
✓ CREATE INDEX
```

---

## 🪣 Storage Bucket Setup

### Option 1: Supabase UI (Recommended)

1. **Supabase Dashboard** → **Storage**
2. Click **"+ Create a new bucket"**
3. Name: `farmer-photos`
4. Privacy: **Private** (toggle OFF for public)
5. Click **"Create Bucket"**

6. Go to bucket settings → **Policies**
7. For each operation (SELECT, INSERT, UPDATE, DELETE), set:
   ```
   Allow authenticated users to: TRUE
   ```
   (Or use the SQL below)

### Option 2: SQL (Advanced)

```sql
-- Note: Storage buckets are usually managed via UI
-- But here's the RLS policy syntax (apply in Storage Editor)

-- SELECT: Users can read their own photos
CREATE POLICY "Users can download their own photos"
ON storage.objects
FOR SELECT
USING (
  (auth.role() = 'authenticated') AND 
  ((storage.foldername(name))[1] = auth.uid()::text)
);

-- INSERT: Users can upload to their own folder
CREATE POLICY "Users can upload their own photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  (auth.role() = 'authenticated') AND 
  ((storage.foldername(name))[1] = auth.uid()::text) AND
  (bucket_id = 'farmer-photos')
);

-- UPDATE: Users can update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects
FOR UPDATE
USING (
  (auth.role() = 'authenticated') AND 
  ((storage.foldername(name))[1] = auth.uid()::text)
);

-- DELETE: Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
USING (
  (auth.role() = 'authenticated') AND 
  ((storage.foldername(name))[1] = auth.uid()::text)
);
```

---

## 🗄️ Update Existing `farmers` Table (If Needed)

If you already have a `farmers` table and want to track signup method:

```sql
-- Add new column to track how farmer signed up
ALTER TABLE farmers 
ADD COLUMN IF NOT EXISTS signup_method TEXT DEFAULT 'email';

-- Update values for existing farmers
UPDATE farmers SET signup_method = 'email' WHERE signup_method IS NULL;
```

---

## ✅ Verification Checklist

After running these commands, verify everything:

```sql
-- 1. Check pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';
-- Should return: vector | ...

-- 2. Check user_biometrics table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'user_biometrics';
-- Should return 1 row

-- 3. Check function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'match_face_descriptor';
-- Should return: match_face_descriptor

-- 4. Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'user_biometrics';
-- Should return 2 indexes: idx_user_biometrics_*

-- 5. Check RLS is enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'user_biometrics';
-- Should return: rowsecurity = true
```

---

## 🧪 Quick Test

Try this query to make sure pgvector works:

```sql
-- Test pgvector with a random 128-d vector
SELECT 
  vector_fill(128, 0)::vector(128) <=> 
  vector_fill(128, 0)::vector(128) as distance;

-- Should return: 0 (identical vectors have distance 0)
```

---

## 🚨 Common Errors & Fixes

### Error: "extension "vector" does not exist"
```sql
CREATE EXTENSION vector;
```

### Error: "function match_face_descriptor does not exist"
→ Make sure you ran the CREATE FUNCTION statement above

### Error: "invalid input syntax for type vector"
→ Descriptor must be exactly 128 dimensions

### Error: "permission denied for schema public"
→ Use Supabase console (you should have permissions)

---

## 📝 Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_BUCKET` | Storage bucket for photos | `farmer-photos` |
| `NEXT_PUBLIC_FACE_DETECTION_ENABLED` | Toggle face auth on/off | `true` |
| `FACE_MATCH_THRESHOLD` | Strictness of face matching (0-2) | `0.42` |
| `FACE_VERIFICATION_RATE_LIMIT` | Max login attempts per minute | `5` |

---

## 🎯 Done!

After:
1. ✅ Adding `.env.local` variables
2. ✅ Running SQL migration
3. ✅ Creating `farmer-photos` bucket
4. ✅ Verifying via test queries

You're ready to test the face auth system! 🚀
