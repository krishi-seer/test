# Quick Start Template - Copy & Paste Ready

This is a simplified, ready-to-use version of the prompt. Just fill in the blanks and paste into Claude AI.

---

# 🚀 Project Scaffold Request for Claude AI

## Problem Statement
I need a web application for: **[DESCRIBE YOUR PROJECT IN 2-3 SENTENCES]**

Example: "A task management platform where teams can create projects, assign tasks, track progress, and collaborate in real-time with integrated chat and file sharing."

---

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript 5+
- **Styling**: Tailwind CSS 4+ with glassmorphism, gradients, and modern animations
- **UI Components**: Custom library with Radix UI primitives (Button, Card, Badge, Input, Modal, Dropdown)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **APIs**: **[LIST YOUR APIS]**
  - Example: OpenAI API, Stripe API, SendGrid API
- **Charts**: Recharts
- **Icons**: Lucide React or Heroicons

---

## Design Requirements

### Visual Style
- Modern, clean, and vibrant
- Glassmorphism effects (backdrop-blur, transparent backgrounds)
- Multi-color gradients for backgrounds and text
- Smooth animations and hover effects
- Mobile-first responsive design

### Color Palette
**[CHOOSE YOUR COLORS]**
- Primary: **[e.g., Blue - trust, technology]**
- Secondary: **[e.g., Purple - premium features]**
- Accent: **[e.g., Green - success, positive actions]**

Example: Blue (primary), Purple (premium), Green (success), Orange (alerts)

---

## Core Features

**[LIST 5-10 KEY FEATURES]**

1. **Feature Name** - Brief description
2. **Feature Name** - Brief description
3. **Feature Name** - Brief description
4. **Feature Name** - Brief description
5. **Feature Name** - Brief description

Example:
1. **User Authentication** - Email/password and OAuth login
2. **Project Management** - Create, edit, delete projects
3. **Task Board** - Kanban-style task management
4. **Real-time Chat** - Team communication with file sharing
5. **Analytics Dashboard** - Progress tracking and reports

---

## Database Schema

**[DEFINE YOUR MAIN TABLES]**

- **Table Name**: field1, field2, field3, relationships
- **Table Name**: field1, field2, field3, relationships

Example:
- **users**: id, email, name, avatar_url, created_at
- **projects**: id, name, description, owner_id (→users), created_at
- **tasks**: id, project_id (→projects), title, status, assigned_to (→users), due_date
- **messages**: id, project_id (→projects), user_id (→users), content, created_at

---

## API Endpoints

**[LIST YOUR API ROUTES]**

- **METHOD /api/endpoint**: Description
- **METHOD /api/endpoint**: Description

Example:
- **POST /api/projects**: Create a new project
- **GET /api/projects/:id**: Get project details
- **POST /api/tasks**: Create a new task
- **PUT /api/tasks/:id**: Update task status
- **POST /api/chat**: Send a message
- **GET /api/analytics**: Get dashboard analytics

---

## Pages Required

**[LIST ALL PAGES]**

1. **Landing Page** (`/`): Hero, features, pricing, CTA
2. **Dashboard** (`/dashboard`): Overview with stats and recent activity
3. **[Page Name]** (`/route`): Description
4. **[Page Name]** (`/route`): Description
5. **Profile** (`/profile`): User settings
6. **Login/Signup** (`/login`, `/signup`): Authentication

Example:
1. **Landing Page** (`/`): Hero, features, pricing, CTA
2. **Dashboard** (`/dashboard`): Project overview and quick actions
3. **Projects** (`/projects`): List of all projects
4. **Project Detail** (`/projects/[id]`): Task board and team chat
5. **Analytics** (`/analytics`): Charts and reports
6. **Profile** (`/profile`): User settings and preferences
7. **Login/Signup** (`/login`, `/signup`): Authentication pages

---

## Special Requirements

**[ANY SPECIFIC NEEDS]**

- [ ] Multi-language support (i18n)
- [ ] Dark mode
- [ ] Real-time features (Supabase subscriptions)
- [ ] File upload (Supabase storage)
- [ ] Email notifications
- [ ] Payment integration
- [ ] Mobile app (React Native - future)
- [ ] Other: **[SPECIFY]**

---

## UI/UX Enhancements

Make the UI **significantly better** than standard templates with:

1. **Advanced Animations**
   - Smooth page transitions
   - Micro-interactions on all interactive elements
   - Skeleton loaders for content
   - Progress indicators

2. **Better Components**
   - Toast notifications
   - Empty states with illustrations
   - Better form validation feedback
   - Loading states for all async operations

3. **Improved Responsiveness**
   - Optimized for mobile, tablet, and desktop
   - Touch-friendly on mobile
   - Bottom navigation on mobile
   - Adaptive layouts

---

## Project Structure

Please create this structure:

```
project-name/
├── app/
│   ├── api/              # API routes
│   ├── [pages]/          # All page routes
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/               # UI component library
│   └── [features]/       # Feature components
├── lib/
│   ├── supabase.ts
│   ├── utils.ts
│   └── providers.tsx
├── types/
│   └── index.ts
├── public/
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_BUCKET=

# API Keys
[YOUR_API]_API_KEY=

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Implementation Workflow

**Phase 1: Scaffold** (You provide now)
1. Complete folder structure
2. package.json with dependencies
3. All configuration files
4. .env.example template
5. Database schema
6. README.md

**Phase 2-5: Step-by-Step** (I'll request next)
- I will ask for each file/component individually
- Example: "Give me code for /app/layout.tsx"
- Then: "Give me code for /components/ui/button.tsx"
- Continue until complete

---

## Design Inspiration