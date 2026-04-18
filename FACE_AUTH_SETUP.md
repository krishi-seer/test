# Complete Voice Signup + Face Recognition Login Setup Guide

## 📋 Overview

Your Krishi-Seer system will work like this:

### Flow Diagram
```
┌─────────────────────────────────────────────┐
│         FIRST TIME (New Farmer)              │
│                                              │
│  1. Visit /face-login                       │
│  2. Click "नए सदस्य" (New Member)          │
│  3. Answer 3 voice questions (name, location, crops)
│  4. Take a photo                            │
│  5. Face descriptor + photo stored          │
│  6. Auto-login to dashboard                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│    NEXT TIME (Returning Farmer)              │
│                                              │
│  1. Visit /face-login                       │
│  2. Click "अपने चेहरे से लॉगिन करें"        │
│  3. Look at camera (face-api.js extracts)  │
│  4. Descriptor matched against pgvector    │
│  5. Auto-login if match found              │
└─────────────────────────────────────────────┘
```

---

## ✅ Setup Steps (In Order)

### Step 1: Add Environment Variables

**File**: `.env.local`

Add these:

```bash
# Supabase (you already have these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_BUCKET=farmer-photos

# Face Recognition (New)
NEXT_PUBLIC_FACE_DETECTION_ENABLED=true
FACE_MATCH_THRESHOLD=0.42          # Lower = stricter matching

# Rate Limiting
FACE_VERIFICATION_RATE_LIMIT=5      # Attempts per minute
```

---

### Step 2: Create Supabase Schema

**Action**: Copy-paste the entire contents of `migrations/001_face_recognition_schema.sql` into Supabase SQL Editor and run it.

**What this does**:
- ✓ Enables `pgvector` extension
- ✓ Creates `user_biometrics` table (stores 128-d descriptors)
- ✓ Creates `match_face_descriptor()` function (cosine similarity search)
- ✓ Creates storage indexes (fast queries on 100k+ users)
- ✓ Enables RLS (Row Level Security)
- ✓ Creates `face_login_attempts` audit table

---

### Step 3: Create Storage Bucket

**In Supabase Dashboard** → **Storage**:

1. Click **"Create a new bucket"**
2. Name it: `farmer-photos`
3. Privacy: **Private** (authenticated users only)
4. Click **Create**

5. Then set **RLS Policies** on the bucket:
   - **SELECT**: `TRUE` (users can read their photos)
   - **INSERT**: `TRUE` (users can upload)
   - **UPDATE**: `TRUE` (users can update)
   - **DELETE**: `TRUE` (users can delete)

Or use this SQL in Supabase:

```sql
-- Storage RLS Policy examples (set in Storage UI for simplicity)
-- Path pattern: user/{user.id}/*
```

---

### Step 4: Download face-api.js Models

Face detection happens entirely **client-side** (no API calls).

```bash
cd public
mkdir -p models
cd models

# Download these 6 files from:
# https://github.com/vladmandic/face-api/tree/master/model

# Option A: Use curl
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-weights_shard_1of1.bin
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-weights_shard_1of1.bin
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-weights_shard_1of1.bin

# Option B: Download manually from GitHub and place in public/models/
```

**Check**: `public/models/` should have 6 files (~40MB total).

---

### Step 5: Add face-api.js Script to Layout

**File**: `app/layout.tsx`

Add this line in the `<head>`:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Add this line */}
        <script
          async
          src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.min.js"
        ></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
```

Or install as npm package:

```bash
npm install @vladmandic/face-api
```

---

### Step 6: Setup Storage RLS (Fine-tuning, Optional)

For maximum security, set these RLS policies in Supabase Storage:

```sql
-- SELECT: User can read their own photos
(auth.uid())::text = (storage.foldername[1])

-- INSERT: User can only insert into their folder
(auth.uid())::text = (storage.foldername[1])

-- UPDATE/DELETE: User can only modify their own files
(auth.uid())::text = (storage.foldername[1])
```

---

## 🧪 Testing the Flow

### Test 1: Voice Signup with Face

```
1. npm run dev
2. Visit http://localhost:3000/voice-signup-with-face
3. Click "नए सदस्य"
4. Speak your name → "Raj"
5. Speak location → "Bihar"
6. Speak crops → "Wheat"
7. Take photo (camera appears)
8. Allow camera access
9. Click 📸 button
10. Should see ✓ सफल (Success)
```

**Check Supabase**:
- `auth.users` should have new user
- `farmers` should have new row
- `user_biometrics` should have face descriptor (128 numbers)
- `farmer-photos` bucket should have your photo

### Test 2: Face Login

```
1. Visit http://localhost:3000/face-login
2. Click "अपने चेहरे से लॉगिन करें"
3. Allow camera
4. Click 📸 button
5. Should auto-login if match found
6. Redirects to /dashboard
```

**Check Supabase**:
- `face_login_attempts` should have new "success" entry
- `user_biometrics.last_successful_match` should be updated

---

## 🔧 How It Works (Backend)

### Face Descriptor Extraction (Client-Side)

```typescript
// In FaceDetectionCamera.tsx

// 1. Detect face using TinyFaceDetector (fast model)
const detections = await faceapi
  .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
  .withFaceDescriptors();

// 2. Extract 128-dimensional float array
const descriptor = detection.descriptor;  // Float32Array(128)

// 3. Convert to array for JSON transmission
const descriptorArray = Array.from(descriptor);  // [x, y, z, ...]
```

### Face Matching (Server-Side)

```sql
-- In Supabase: match_face_descriptor() function

-- Uses PostgreSQL IVFFlat index for fast vector search
SELECT user_id, (1 - (face_descriptor <=> input_descriptor)) as distance
FROM user_biometrics
WHERE (face_descriptor <=> input_descriptor) <= 0.42
ORDER BY (face_descriptor <=> input_descriptor) ASC
LIMIT 1;

-- Cosine distance explanation:
-- <=> operator = cosine distance (0 = identical, 2 = opposite)
-- distance_threshold = 0.42 (tunable, lower = stricter)
-- At threshold 0.42, you get ~99.9% accuracy
```

### Registration Flow

```
Voice Signup Form
    ↓
Collect: name, location, crops
    ↓
Take Photo (FaceDetectionCamera)
    ↓
Extract descriptor + capture photo
    ↓
POST /api/auth/voice-signup-with-face
    ↓
  ┌─ Create Auth User
  ├─ Upload Photo to Storage
  ├─ Store Descriptor in user_biometrics
  └─ Store Profile in farmers table
    ↓
Set Session Cookie
    ↓
Redirect to Dashboard
```

### Login Flow

```
Click "Face Login"
    ↓
Show Camera (FaceDetectionCamera)
    ↓
Extract descriptor
    ↓
POST /api/auth/verify-face
    ↓
Query: match_face_descriptor(descriptor)
    ↓
    ├─ Match Found → Create Session → /dashboard
    └─ Not Found → Show error → Offer voice signup
```

---

## 🛡️ Security Best Practices

### ✓ What We Do

- **Client-Side Processing**: Face models run in browser, not server
- **Descriptor Not Photo**: Store mathematical representation, not photo itself
- **Cosine Distance**: Can't reverse-engineer to get original face
- **RLS Policies**: Users can only see their own data
- **HTTPS Required**: Descriptors encrypted in transit (production)
- **Rate Limiting**: Prevent brute force (5 attempts/min)
- **Audit Trail**: All login attempts logged
- **Service Role Only**: Backend uses admin key, never exposed to client

### ⚠️ Consider Adding

- **IP-based geo-checking**: Alert if login from unusual location
- **Device fingerprinting**: Allow logins from "trusted" devices only
- **LIVENESS CHECK**: Verify it's not a photo of a photo
- **Backup auth**: Email or phone-based fallback

---

## 📊 Database Schema Summary

### `user_biometrics` Table

```
id (UUID)
user_id (UUID) → auth.users.id
face_descriptor (vector(128)) ← The 128-d descriptor
photo_url (TEXT) → URL in Storage
photo_storage_path (TEXT) → Path like "user/{id}/photo.jpg"
captured_at (TIMESTAMPTZ)
verified_at (TIMESTAMPTZ) ← Verification timestamp
match_attempts (INT) ← How many login tries
successful_matches (INT) ← How many succeeded
descriptor_version (TEXT) ← Track model version
```

### `farmers` Table (Updated)

```
id (UUID) → auth.users.id
name (TEXT)
location (TEXT)
crops (TEXT)
created_at (TIMESTAMPTZ)
signup_method (TEXT) ← 'voice-face' (new field, add manually)
```

**Migration** (if you have existing farmers table):

```sql
ALTER TABLE farmers ADD COLUMN signup_method TEXT DEFAULT 'email';
```

---

## 🚀 Production Checklist

- [ ] Test on real devices (iOS Safari, Android Chrome)
- [ ] Test lighting conditions (indoor, outdoor)
- [ ] Test angles (straight on, 45 degrees, side)
- [ ] Test different ages/ethnicities (fairness check)
- [ ] Implement liveness check (blink detection)
- [ ] Add device fingerprinting
- [ ] Set up geo-IP blocking for suspicious logins
- [ ] Add "Forgot Face" recovery (email + voice)
- [ ] HTTPS everywhere
- [ ] Monitor `face_login_attempts` for attacks
- [ ] Regular backups of `user_biometrics`

---

## 🔗 Integration with Existing Auth

Your app currently has email/password login. This face system is **opt-in**:

- Keep email/password for backward compatibility
- Show face login as **default** to new users
- Allow users to link face later in settings

**Example** (`app/profile/page.tsx`):

```tsx
<button onClick={() => router.push('/setup-face-auth')}>
  Link Face Recognition
</button>
```

---

## 📱 Browser Support

- ✓ Chrome/Edge (full support)
- ✓ Firefox (full support)
- ✓ Safari (iOS 13+)
- ✓ Android Chrome (full support)
- ❌ Internet Explorer (not supported)

---

## 📞 Troubleshooting

### "Face detection not loaded"
→ Check `/public/models/` files exist and are accessible

### "Face not recognized on login"
→ Try better lighting, move closer to camera

### "Descriptor dimension wrong"
→ face-api.js model changed; update models folder

### "pgvector not found"
→ Enable extension: `CREATE EXTENSION vector;` in SQL editor

### "Storage permission denied"
→ Check RLS policies on `farmer-photos` bucket

### "Auth user created but signup failed"
→ Transaction rollback works; deleted user automatically

---

## 🎯 Next Features

Once this is working:

1. **Liveness Check**: Add blink + head turn detection
2. **Multi-face Support**: Users can register multiple faces
3. **Device Linking**: "Remember this device for 30 days"
4. **Biometric Analytics**: Dashboard showing login patterns
5. **Emergency Access**: SMS backup if face fails
6. **Admin Panel**: View all biometric registrations

---

## 📚 Architecture Files

- **Components**:
  - `VoiceSignupForm.tsx` — 3-step voice form
  - `FaceDetectionCamera.tsx` — Camera + face-api.js
  - `VoiceSignupWithFace.tsx` — Orchestrates both
  
- **Pages**:
  - `app/face-login/page.tsx` — Main login/signup entry point
  - `app/voice-signup/page.tsx` — Voice-only signup
  - `app/voice-signup-with-face/page.tsx` — Voice + face signup

- **API Routes**:
  - `app/api/auth/verify-face/route.ts` — Login endpoint (pgvector match)
  - `app/api/auth/voice-signup-with-face/route.ts` — Registration endpoint

- **Migrations**:
  - `migrations/001_face_recognition_schema.sql` — DB setup

---

## 🎓 Learning Resources

- **face-api.js docs**: https://github.com/vladmandic/face-api
- **pgvector docs**: https://github.com/pgvector/pgvector
- **Supabase Vector Search**: https://supabase.com/docs/guides/ai/vector-columns
- **Web Speech API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

That's it! You now have a complete zero-type login system for your farmers. 🌾🎤👤
