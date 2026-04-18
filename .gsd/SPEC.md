# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
To create a highly accessible "Zero-Type" entry system for Krishi-Seer, eliminating the digital literacy barrier for farmers. The system will rely entirely on facial recognition for authentication and multi-lingual voice interactions for onboarding, allowing seamless use without typing.

## Goals
1. Implement a Face-ID Authentication system using `face-api.js` to log users in automatically without email or passwords.
2. Build an end-to- natural voice-guided onboarding pipeline (Hindi, Marathi, Odia) powered by Bhashini/AI4Bharat or Whisper for Speech-To-Text (ASR) and Text-To-Speech (TTS).
3. Safely store and match facial biometrics (128-d face descriptors) using Supabase and `pgvector` inside the secure environment.

## Non-Goals (Out of Scope)
- Traditional email, password, or OTP-based authentication fallbacks in this specific sprint.
- Complex user profile editing interfaces (we rely on voice updates or initial extraction).
- Supporting languages beyond Hindi, Marathi, and Odia right now.

## Users
Farmers with low digital literacy who struggle with standard keyboard input or reading complex UI text, preferring an intuitive face-scan and voice interaction.

## Constraints
- **Technical**: Must run purely securely. Client-side face processing requires lightweight face models. The voice pipeline latency must be minimal.
- **Database**: We must use `pgvector` in Supabase to do math on the numeric array face descriptors.

## Success Criteria
- [ ] User can look at the phone/desktop camera and be logged in immediately.
- [ ] New user can speak their Name, Location, and Crop type in their local language, which is accurately saved.
- [ ] Database holds `face_descriptors` securely via Row-Level Security.
