# Zero-Type Login System - Implementation Guide

## Overview

This guide documents the implementation of the zero-type authentication system for Krishi-Seer, which combines facial recognition for login with voice-guided onboarding.

## Components Implemented

### 1. **Database Migration** - `migrations/003_enable_vector_extension_and_user_face_embeddings.sql`

Enables PostgreSQL vector extension and creates the schema for face embeddings:

```sql
-- Tables:
- profiles: Stores user profile data (name, mobile, location, crops)
- user_face_embeddings: Stores 128-d facial descriptors with vector indices

-- Functions:
- find_closest_profile_by_embedding(): RPC function for cosine distance matching
- update_updated_at_column(): Trigger for timestamp updates

-- Security:
- Row Level Security (RLS) enabled on both tables
- Service role can manage all operations
- Regular users can only access their own data
```

**Key Features:**
- IVFFlat indexing for fast vector similarity search
- Configurable distance threshold (default: 0.42 for cosine distance)
- Automatic timestamp management

---

### 2. **Supabase Edge Function** - `supabase/functions/match-face-embedding/index.ts`

Serverless function to find matching profiles using face embeddings:

```typescript
// Endpoint: /functions/v1/match-face-embedding
// Method: POST
// Input: { embedding: number[], threshold?: number }
// Output: { success: boolean, match?: FaceMatchResponse }
```

**Functionality:**
- Validates 128-dimensional embedding array
- Calls RPC function for database matching
- Returns closest profile within distance threshold
- Includes error handling and input validation

---

### 3. **Face Authentication Component** - `components/FaceAuthCamera.tsx`

React component that handles real-time face detection and matching:

```typescript
interface FaceAuthCameraProps {
  onFaceDetected?: (descriptor: Float32Array) => void
  onMatchComplete?: (result: { success: boolean; profile?: any }) => void
  onError?: (error: string) => void
  className?: string
}
```

**Features:**
- Loads `face-api.js` models from `/public/models`
- Real-time camera feed with face detection
- Draws bounding boxes and landmarks on canvas overlay
- Auto-detects face and triggers matching
- Provides loading, matching, and error overlays
- Cleanup on component unmount

**Usage:**
```tsx
<FaceAuthCamera
  onFaceDetected={(descriptor) => console.log('Face detected')}
  onMatchComplete={(result) => handleMatch(result)}
  onError={(error) => handleError(error)}
/>
```

---

### 4. **Face Matching API Route** - `app/api/match-face-embedding/route.ts`

Next.js API route that proxies requests to Supabase:

```typescript
// POST /api/match-face-embedding
// Accepts: { embedding: number[], threshold?: number }
// Returns: { success: boolean, match?: { profile_id, user_id, distance, ... } }
```

**Features:**
- Uses `supabaseAdmin` client for service role access
- Validates input (128-d array)
- Calls the RPC function
- Returns profile matches with distance scores

---

### 5. **Voice Authentication Hook** - `lib/useVoiceAuth.ts`

Custom React hook for speech-to-text with Bhashini and Whisper fallback:

```typescript
const {
  isListening,
  transcript,
  error,
  startListening,
  stopListening,
} = useVoiceAuth({
  language: 'hi', // 'hi', 'mr', 'or', 'en'
  onTranscript: (transcript) => {},
  onError: (error) => {},
  onComplete: (finalTranscript) => {},
})
```

**Architecture:**
- **Primary**: Bhashini WebSocket API (WebSocket connection)
  - Real-time streaming audio to speech recognition
  - Supports Hindi, Marathi, Odia
  - Logs intermediate and final transcripts
  
- **Fallback**: OpenAI Whisper API (via `/api/speech-to-text`)
  - Activated if Bhashini unavailable
  - Supports all languages
  - 10-second auto-stop for better UX

**Features:**
- Microphone access handling
- WebSocket connection management
- Audio streaming (16kHz, mono)
- Error recovery with fallback mechanism
- Automatic cleanup on unmount
- Reconnection logic (up to 3 attempts)

---

### 6. **Speech-to-Text API Route** - `app/api/speech-to-text/route.ts`

Backend route that proxies audio to OpenAI Whisper:

```typescript
// POST /api/speech-to-text
// Body: FormData with 'audio' file and 'language' field
// Returns: { transcript: string, language: string }
```

**Features:**
- Accepts WebM audio format
- Maps language codes for OpenAI
- Returns transcribed text
- Error handling with detailed messages

---

## Integration Flow

### Zero-Type Login Flow

```
┌─────────────────────────────────────┐
│      User Opens Camera              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  FaceAuthCamera detects face        │
│  Extracts 128-d descriptor          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  POST /api/match-face-embedding     │
│  Sends descriptor to API            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Supabase Edge Function             │
│  Runs RPC: find_closest_profile_... │
│  Cosine distance matching           │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
    Match Found    No Match
        │             │
        ▼             ▼
   Log User In   New User Signup
```

### Voice Onboarding Flow

```
┌─────────────────────────────────────┐
│   useVoiceAuth hook initialized     │
│   Language: Hindi/Marathi/Odia      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  startListening() triggered         │
│  Microphone access granted          │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
   Bhashini      No Bhashini Key
   Available     Available
        │             │
        │             ▼
        │      /api/speech-to-text
        │      (OpenAI Whisper)
        │             │
        └──────┬──────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Returns: { transcript, language }  │
│  onTranscript() callback fired      │
└─────────────────────────────────────┘
```

---

## Configuration

### Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx

# OpenAI (for Whisper fallback)
OPENAI_API_KEY=sk-xxxx

# Bhashini (optional, for primary voice)
NEXT_PUBLIC_BHASHINI_API_KEY=xxxx
```

### Models Setup

Copy face-api.js models to `public/models/`:
```
public/models/
├── face_landmark_68_model-weights_manifest.json
├── face_recognition_model-weights_manifest.json
├── tiny_face_detector_model-weights_manifest.json
└── [all associated .bin files]
```

---

## Database Schema Reference

### `profiles` Table
```sql
id: UUID (PK)
user_id: UUID (FK → auth.users)
name: TEXT
mobile: TEXT
location: TEXT
crops: TEXT
signup_method: TEXT (default: 'voice-face')
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
```

### `user_face_embeddings` Table
```sql
id: UUID (PK)
profile_id: UUID (FK → profiles)
embedding: vector(128)
model_version: TEXT (default: 'face-api-0.22.2')
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ

Indexes:
- ivfflat on embedding (vector_cosine_ops, lists=100)
- simple on profile_id
```

### RPC Function: `find_closest_profile_by_embedding()`
```sql
Parameters:
  input_embedding: vector(128)
  distance_threshold: FLOAT (0.42 = cosine distance)

Returns:
  profile_id: UUID
  user_id: UUID
  distance: FLOAT
  name: TEXT
  mobile: TEXT
  location: TEXT
  crops: TEXT
```

---

## Testing Guide

### 1. Test Face Recognition
```typescript
// In your component
import FaceAuthCamera from '@/components/FaceAuthCamera'

export default function TestFaceAuth() {
  const handleMatch = (result: any) => {
    if (result.success) {
      console.log('Match found!', result.profile)
    } else {
      console.log('No match found - new user')
    }
  }

  return <FaceAuthCamera onMatchComplete={handleMatch} />
}
```

### 2. Test Voice Recognition
```typescript
// In your component
import { useVoiceAuth } from '@/lib/useVoiceAuth'

export default function TestVoiceAuth() {
  const { startListening, transcript, isListening } = useVoiceAuth({
    language: 'hi',
    onComplete: (final) => console.log('Final:', final)
  })

  return (
    <div>
      <button onClick={startListening} disabled={isListening}>
        {isListening ? 'Listening...' : 'Start'}
      </button>
      <p>Transcript: {transcript}</p>
    </div>
  )
}
```

### 3. Test API Endpoints
```bash
# Test face matching
curl -X POST http://localhost:3000/api/match-face-embedding \
  -H "Content-Type: application/json" \
  -d '{
    "embedding": [... 128 numbers ...],
    "threshold": 0.42
  }'

# Test speech-to-text
curl -X POST http://localhost:3000/api/speech-to-text \
  -F "audio=@audio.webm" \
  -F "language=hi"
```

---

## Migration Steps

To apply the database changes:

```bash
# 1. Run the migration in Supabase SQL Editor
# Copy contents of migrations/003_enable_vector_extension_and_user_face_embeddings.sql

# 2. Deploy the Edge Function
supabase functions deploy match-face-embedding

# 3. Verify the function
supabase functions list
```

---

## Performance Considerations

1. **Vector Search**: IVFFlat index with 100 lists optimized for ~100K profiles
2. **Distance Threshold**: Default 0.42 (cosine) provides good False Accept Rate (FAR)
3. **Model Size**: face-api.js runs entirely in browser (~500ms per detection)
4. **Audio Streaming**: 16kHz mono reduces bandwidth while maintaining quality

---

## Security Notes

- All face embeddings encrypted at rest in Supabase
- RLS policies prevent users from accessing others' biometric data
- Service role key used only on backend (API routes)
- WebSocket connections to Bhashini use HTTPS
- Microphone and camera access requires user permission

---

## Troubleshooting

### Face Detection Not Working
- Check if models are in `public/models/`
- Verify camera permissions are granted
- Check browser console for face-api.js errors

### Voice Recognition Failing
- Check if OpenAI key is set in `.env.local`
- Verify microphone permissions
- Test audio format (should be WebM with Opus codec)

### Database Errors
- Ensure Supabase service role key is correct
- Verify pgvector extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'vector'`
- Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'user_face_embeddings'`

---

## Next Steps

1. **Face Registration**: Create endpoint to store new face embeddings
2. **Profile Updates**: Allow users to update their voice-captured info
3. **Image Quality Checks**: Validate face quality before storing
4. **Analytics**: Track login success rates and matching distances
5. **Multi-face Support**: Handle scenarios with multiple faces in frame