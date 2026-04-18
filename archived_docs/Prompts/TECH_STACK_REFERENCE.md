# Tech Stack Reference - Krishi-Seer Analysis

## 📊 Current Project Analysis

This document summarizes the tech stack and design patterns used in your Krishi-Seer project, which serves as the foundation for the Claude AI prompt template.

---

## 🛠️ Technology Stack

### Core Framework
- **Next.js**: 14.1.0 (App Router)
- **React**: 18.2.0
- **TypeScript**: 5.3.3
- **Node.js**: 18.0+ required

### Styling & UI
- **Tailwind CSS**: 3.4.1
- **PostCSS**: 8.4.33
- **Autoprefixer**: 10.4.17
- **Custom CSS**: Minimal, mostly Tailwind utilities

### UI Component Libraries
- **@radix-ui/react-slot**: 1.0.2 (for composable components)
- **@headlessui/react**: 1.7.18 (accessible UI components)
- **Recharts**: 2.12.0 (data visualization)
- **tailwind-merge**: 2.2.0 (className utility)

### Backend & Database
- **Supabase**: 2.39.3
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - File storage (bucket: 'public')

### Internationalization
- **i18next**: 23.7.16
- **react-i18next**: 14.0.1
- **next-i18next**: 15.2.0
- **i18next-browser-languagedetector**: 7.2.0
- **i18next-http-backend**: 2.4.2

### External APIs Used
- **Plant.id API**: Crop disease identification
- **Groq API**: AI-powered chat responses
- **OpenAI API**: Alternative AI provider (optional)
- **OpenWeatherMap API**: Weather data
- **Hugging Face**: ML models (optional)

### Development Tools
- **ESLint**: 8.56.0
- **eslint-config-next**: 14.1.0

---

## 🎨 Design System Breakdown

### Color Scheme
**Primary Colors:**
- Green: `green-50` to `green-700` (agriculture theme)
- Blue: `blue-50` to `blue-600` (trust, technology)
- Yellow: `yellow-50` to `yellow-300` (warmth, sunshine)
- Purple: `purple-400` to `purple-600` (premium features)
- Teal: `teal-400` to `teal-600` (AI features)
- Orange: `orange-400` to `orange-600` (community)
- Indigo: `indigo-400` to `indigo-600` (voice features)

**Background Patterns:**
```css
bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50
```

**Glassmorphism:**
```css
bg-white/40 backdrop-blur-lg
bg-white/60 backdrop-blur-sm
bg-white/80 backdrop-blur-lg
```

### Typography
- **Fonts:**
- Inter (variable font)
- Nunito (weights: 400, 600, 700)

- **Sizes:**
- Headings: `text-4xl`, `text-5xl`, `text-6xl`
- Subheadings: `text-2xl`, `text-3xl`
- Body: `text-base`, `text-lg`, `text-xl`
- Small: `text-sm`, `text-xs`

---

## 📁 Project Structure Analysis

### App Directory (`/app`)
```
app/
├── api/                    # API routes
│   ├── chat/              # Simple chat endpoint
│   ├── chat-stream/       # Streaming chat (Groq)
│   ├── plantid/           # Plant identification
│   ├── debug-farmers/     # Debug endpoint
│   └── hf/                # Hugging Face integration
├── advisory/              # Crop advisory feature
├── chatbot/               # AI chatbot interface
├── community/             # Community features
├── contact/               # Contact page
├── dashboard/             # Main dashboard
├── demo/                  # Demo page
├── features/              # Features showcase
├── fertilizer/            # Fertilizer recommendations
├── irrigation/            # Smart irrigation
├── login/                 # Authentication
├── profile/               # User profile
├── research/              # Research section
├── schemes/               # Government schemes
├── signup/                # Registration
├── voice/                 # Voice assistant
├── weather/               # Weather information
├── globals.css            # Global styles
├── layout.tsx             # Root layout
└── page.tsx               # Landing page
```

---

## 🔧 Configuration Files

### tailwind.config.js
```javascript
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### globals.css
```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

---

## 🔐 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_BUCKET=public

# AI APIs
PLANT_ID_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
HUGGING_FACE_TOKEN=

# Weather
OPENWEATHER_API_KEY=
```

---

## 🚀 Performance Optimizations