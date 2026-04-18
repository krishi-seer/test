We are building a "Zero-Type" login and onboarding system for the Krishi-Seer agricultural app. Because typing and reading complex forms are barriers for farmers with low digital literacy, we are replacing it with two things:

Face-ID Authentication: Immediate login via camera using face-api.js on the browser to detect and extract face data, securely matched against a Supabase pgvector store.
Voice Onboarding Wizard: A multi-lingual (Hindi, Marathi, Odia) audio interaction relying on STT/TTS (Bhashini/Whisper) to speak to new users and collect their Name, Location, and Crop type entirely by voice.
2. The Original Prompt you gave me
"I am building Krishi-Seer, a Next.js 15 app using Supabase and GPT-4o. My goal is to add a Zero-Type login system using face-api.js for facial recognition and Bhashini/Whisper for Hindi, Marathi, and Odia voice onboarding. Before we start, identify the API keys I need and suggest the Supabase SQL schema for storing facial descriptors safely. Also, confirm if you can access the /public folder to store the AI models needed for face recognition."

3. The New Prompt (To give to the Vibe Coder)
Objective: Implement the front-end components and API routes for the Zero-Type Login System and Voice Agent. (Assume the Postgres database schema with pgvector is already set up or being handled separately).

Core Tasks:

Build the Client-Side Face Extraction Component (components/FaceLogin.tsx) using face-api.js to get a 128d face descriptor from the user's webcam.
Build the Backend authentication routing (app/api/auth/verify-face/route.ts) to receive the descriptor.
Build the Voice Agent Wizard (components/VoiceOnboarding.tsx) for new users using TTS and STT APIs to autonomously speak and capture their Name, Location, and Crop in local languages.
Strictly adhere to modern, premium aesthetics defined in GSD-STYLE.md.
4. Direct Instructions for the next Vibe Coder
(Paste this exactly to the next agent) "Hey Vibe Coder: Before you start writing any logic, you MUST go look in PRD.md and read it thoroughly (especially the RALPH loop steps at the bottom). Then, go through the whole .gsd/ folder template and read ROADMAP.md, SPEC.md, and ARCHITECTURE.md to understand the technical constraints. Once you have read the project specs, start scaffolding the Face Component and the API routes as outlined in the prompt."