# Krishi-Seer: Zero-Type Entry System PRD

## 1. Project Overview
**Objective**: Transform user onboarding and authentication for farmers by completely removing the need to interact with a keyboard or text UI.
**Target Audience**: Farmers with extremely low digital literacy who speak local dialects (Hindi, Marathi, Odia).
**Core Technologies**: Next.js 15 App Router, Supabase (`pgvector`), `face-api.js`, Bhashini / AI4Bharat (Whisper).

## 2. Core Functional Requirements

### A. Face-ID Authentication
- **No-Click / No-Type**: A user looks at the camera. If recognized, they bypass any auth screen and are taken to the dashboard securely.
- **Client Processing**: Use `face-api.js` on the browser to minimize server load. It outputs a 128-dimensional float array.
- **Secure Handling**: Matching should occur on the backend via a Supabase Vector Comparison query using `pgvector`. A JWT session is established upon a match.

### B. Voice-Guided Onboarding (The "Agent")
- **Intelligent Flow**: If a face is *not* found in the database, the system immediately recognizes a new user.
- **Multi-lingual Voice Agent**: A voice speaks in their selected language (Hindi/Marathi/Odia) asking:
  1. *"What is your name?"*
  2. *"Where are you from?"*
  3. *"What crops do you grow?"*
- **Speech-to-Text Registration**: Uses the Bhashini API (or Whisper) to catch the response, transcript it to English/Hindi, and save it in Supabase under their new user profile.

## 3. Database Schema Recommendations

### Vector Extension Setup
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Table Structure (`user_biometrics`)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | Links to `auth.users` ID |
| `face_descriptor` | `vector(128)` | `NOT NULL` | Output from face-api.js |
| `metadata` | `jsonb` | | Optional fallback metadata |
| `created_at` | `timestamptz` | `DEFAULT now()` | Timestamp |

### Function Setup for Cosine Matching
A PostgreSQL function using `<=>` (cosine distance) or `<->` (Euclidean distance) allowing us to call an RPC match function with a threshold (e.g. `0.4` or `0.5`).

---

## 4. The R.A.L.P.H Loop Execution Plan
*(For use with GSD / iterative prompt cycles)*

### Step 1: Research & Setup (R)
- [ ] Initialize `pgvector` inside Supabase SQL editor.
- [ ] Write the exact `CREATE TABLE` and `CREATE FUNCTION match_face_descriptor()` sql statements to store the 128-d arrays.
- [ ] Create `public/models/` in the codebase to hold the lightweight weights for `face-api.js`.

### Step 2: Architecture & Foundation (A)
- [ ] Provide the Next.js `app/api/auth/verify-face/route.ts` backend code to interface with the new Postgres function.
- [ ] Scaffold the `FaceLogin` Client Component in React/Next.js to handle webcam stream permissions.
- [ ] Build the Bhashini/Whisper integration route handler `app/api/speech/route.ts` to convert audio blobs to text strings.

### Step 3: Logic Implementation (L)
- [ ] Wire up `face-api.js` inside the `<FaceLogin />` component to extract facial landmarks continuously until a bounding box is found, then generate the descriptor.
- [ ] Hook the descriptor fetch call to `/api/auth/verify-face`.
- [ ] Build the state machine for new user flow -> Trigger `startVoiceOnboarding()`.

### Step 4: Polish & UI (P)
- [ ] Design a beautiful, non-threatening scanning overlay UI over the camera (CSS, framer-motion pulses).
- [ ] Implement an audio visualizer wave when the AI is talking to the farmer so they know the system is active.
- [ ] Ensure the entire experience works optimally over slow network speeds (model caching, vector limits).

### Step 5: Handoff & Security Validation (H)
- [ ] Ensure Supabase Service Role Keys are kept outside of the Client Components.
- [ ] Test the vector match with minor variations (lighting, distance, angle).
- [ ] Verify Row Level Security correctly isolates individual farmer profiles post-auth.
