# PROJECT_REPORT — Krishi‑Seer

Generated: Automatically by GitHub Copilot

## Overview

Krishi‑Seer is an AI-first agricultural assistant built with Next.js + Supabase. Key capabilities:
- Zero‑touch onboarding using face + voice (browser face detection + Supabase pgvector matching)
- Multilingual voice/chat assistant (English, Hindi, Odia)
- Plant identification, Soil Health Card extraction, and scheme recommendation using LLMs and vision models

This document summarizes the tech stack, APIs, models, database schema, important files, required environment variables, and suggested cleanup steps.

## Tech Stack (selected)
- Next.js: 14.1.0
- React: 18.2.0
- TypeScript: ^5.3.3
- Supabase: @supabase/supabase-js ^2.39.3 (Auth, Postgres, Storage, Edge Functions)
- Face detection: @vladmandic/face-api ^1.7.15 (browser build loaded at runtime)
- LLMs / AI services: OpenAI (GPT‑4o, gpt‑4o‑mini, whisper-1), Groq (Llama 3 family), Hugging Face Inference API
- Plant identification: Plant.id API v3
- Styling / UI: Tailwind CSS, headless UI

Versions are taken from `package.json` and the repository code.

## Models & External Services

- Face‑api browser models (stored in `public/models`):
  - `tiny_face_detector_model-weights_manifest.json` (+ shard)
  - `face_landmark_68_model-weights_manifest.json` (+ shard)
  - `face_recognition_model-weights_manifest.json` (+ shard)

- LLM / Vision models used via APIs:
  - Groq: `llama-3.1-8b-instant` (chat), `llama-3.1-70b-versatile` (eligibility reasoning)
  - OpenAI: `gpt-4o` (vision/composite), `gpt-4o-mini` (chat streaming), `whisper-1` (STT)
  - Hugging Face models: `openai/clip-vit-base-patch32` (zero-shot image classification), `google/vit-base-patch16-224` (fallback), `microsoft/DialoGPT-large` (chat fallback)
  - Plant.id v3 for species + health diagnostics

## Database / Schema (Supabase)

- Postgres + `pgvector` extension are required. Key migration artifacts:
  - `migrations/001_face_recognition_schema.sql` — `user_biometrics`, `face_login_attempts`, `match_face_descriptor` RPC and IVFFlat index
  - `migrations/002_add_mobile_to_farmers.sql` — adds `mobile` + `signup_method`
  - `migrations/003_enable_vector_extension_and_user_face_embeddings.sql` — `profiles`, `user_face_embeddings`, `find_closest_profile_by_embedding` RPC

- Matching workflow:
  1. Client extracts 128‑d descriptor via face‑api in browser.
  2. Descriptor is sent to server endpoint (`/api/match-face-embedding` or Supabase Edge Function) as JSON array.
  3. Server uses Supabase RPC (`find_closest_profile_by_embedding` or `match_face_descriptor`) to compute cosine distance and return closest match.
  4. On match, server updates `update_match_stats` and logs into `face_login_attempts`.

## API Endpoints (not exhaustive — key endpoints)

- `POST /api/chat` — synchronous chat (tries Groq → OpenAI → rule‑based fallback). Env: `GROQ_API_KEY`, `OPENAI_API_KEY`, `HUGGING_FACE_TOKEN`.
- `POST /api/chat-stream` — streaming chat (Edge runtime). Uses Groq/OpenAI streaming with strict agricultural system prompt.
- `POST /api/hf` — Hugging Face image classification / crop detection (zero‑shot + fallback). Env: `HUGGING_FACE_TOKEN`.
- `POST /api/plantid` — Plant.id v3 integration. Env: `PLANT_ID_API_KEY`.
- `POST /api/speech-to-text` — OpenAI Whisper transcription. Env: `OPENAI_API_KEY`.
- `POST /api/extract-soil-card` — Vision + LLM (OpenAI) to extract Soil Health Card data and recommend fertilizers. Env: `OPENAI_API_KEY`.
- `POST /api/analyze-eligibility` — Fetches schemes from Supabase and ranks with Groq (Llama). Env: `GROQ_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `POST /api/match-face-embedding` — Server route using `supabaseAdmin.rpc('find_closest_profile_by_embedding')` to match embeddings. Requires service role key server‑side.
- `POST /api/auth/verify-face` — Server route that verifies face descriptors using a Supabase RPC and may set a secure cookie on success.
- `POST /api/auth/voice-signup-with-face` — Combines voice signup + captured face embedding, creates Supabase user and inserts biometrics (uses service role key).
- `POST /api/alerts/broadcast` — Generates multilingual alert text (Groq) and optionally sends via Twilio WhatsApp. Env: `TWILIO_*`, `GROQ_API_KEY`.
- `GET|POST /api/debug-farmers` — debug endpoint to inspect/insert farmers (uses `lib/supabase.ts`).
- `POST /api/sync-schemes` — Synchronizes schemes into Supabase (uses anon key).

Server-side Edge Function (Supabase):
- `supabase/functions/match-face-embedding/index.ts` — Deno function that offers an alternative matching endpoint and calls `find_closest_profile_by_embedding` using `SUPABASE_SERVICE_ROLE_KEY`.

## Important Files / Components

- `components/FaceDetectionCamera.tsx` — browser‑only camera + runtime face-api injection; returns 128‑d descriptor via callback
- `components/FaceAuthCamera.tsx` — wrapper that captures and calls matching endpoints; calls `/api/match-face-embedding`
- `lib/supabase.ts` — client supabase instance (browser usage). Imports: many pages (profile, schemes, dashboard, login, etc.)
- `lib/supabaseAdmin.ts` — server admin client using `SUPABASE_SERVICE_ROLE_KEY` (server only). Used in `/api/match-face-embedding`, `/api/auth/voice-signup-with-face`, and Supabase functions.
- `public/models/` — face-api model files (see list above)
- `app/voice/page.tsx` — voice assistant UI (recognition + TTS + chat)

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key (client)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (server, secret)
- `NEXT_PUBLIC_SUPABASE_BUCKET` — optional storage bucket name (defaults to `public` or `farmer-photos` in docs)
- `OPENAI_API_KEY` — OpenAI API key (Whisper, GPT, Vision)
- `GROQ_API_KEY` — Groq (Llama) API key
- `HUGGING_FACE_TOKEN` — Hugging Face inference token
- `PLANT_ID_API_KEY` — Plant.id API key
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` — Twilio credentials for alerts (optional)
- `FACE_MATCH_THRESHOLD` — optional override for face match threshold (default ~0.42)

Important: Missing `SUPABASE_SERVICE_ROLE_KEY` will cause server routes that use `lib/supabaseAdmin.ts` to throw and return HTML error pages during dev — this breaks client `.json()` parsing. Always set service key in `.env.local` for local development when calling biometric APIs.

## How the Face Flow Works (brief)

1. Client loads face-api browser bundle at runtime (script injection) and loads local models from `/models` with CDN fallback.
2. Face descriptor (128‑d) is computed on the client and sent as JSON to `/api/match-face-embedding` (or the Supabase Edge Function).
3. The server converts the array into a Postgres vector and calls RPC `find_closest_profile_by_embedding` / `match_face_descriptor`.
4. If a match is returned within threshold, the server returns profile info and optionally sets a secure cookie.

## Recommended Next Actions / Cleanup (proposed)

I recommend archiving (not deleting) these documentation folders/files to keep the repo focused. Move them into `/archived_docs/`:
- `Prompts/` — prompt templates and scaffolds (large and repeated)
- `google_ai_studio_code/` — example client; keep if actively used
- Old session notes: `SESSION_SUMMARY.md`, `DELIVERY_SUMMARY.md` — archive if no longer needed

Before deletion, confirm archive vs delete. I can move files to `/archived_docs/` on your approval.

---

If you'd like, I can now:
- Add this `PROJECT_REPORT.md` to the repo (done).
- Update `README.md` with a short link to this report (I will in the same commit).
- Create `/archived_docs/` and move candidate docs there (requires your confirmation).
