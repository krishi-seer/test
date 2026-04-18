# ROADMAP.md

> **Current Phase**: Not started
> **Milestone**: v1.0 Zero-Type Login System

## Must-Haves (from SPEC)
- [ ] Face-ID visual capture & extraction.
- [ ] Supabase pgvector schema and secure backend logic to register/match face vectors.
- [ ] Voice-guided onboarding UI & TTS/STT integration for local languages.

## Phases

### Phase 1: Database Foundation & Schema
**Status**: ⬜ Not Started
**Objective**: Setup `pgvector` inside Supabase, modify the profiles table to include a `vector(128)` column for `face_descriptors`, and create Service Role endpoints for vector similarity search.

### Phase 2: Client-Side Face Extraction System
**Status**: ⬜ Not Started
**Objective**: Integrate `face-api.js` into the web app. Serve models from `public/models`. Create a camera UI component that captures video, detects a face, and outputs a 128d Float32Array descriptor.

### Phase 3: Zero-Type Authentication Flow
**Status**: ⬜ Not Started
**Objective**: Connect the Face Extraction UI with the Supabase backend. If a face matches, create a secure session. If new, proceed to the onboarding phase.

### Phase 4: Voice-Guided Onboarding (Hindi, Marathi, Odia)
**Status**: ⬜ Not Started
**Objective**: Implement automated voice prompts using Text-To-Speech API to ask the user's Name, Location, and Crop. Use Speech-To-Text to transcribe their answers and save to their profile alongside their new Face-ID.
