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
**Fonts:**
- Inter (variable font)
- Nunito (weights: 400, 600, 700)

**Sizes:**
- Headings: `text-4xl`, `text-5xl`, `text-6xl`
- Subheadings: `text-2xl`, `text-3xl`
- Body: `text-base`, `text-lg`, `text-xl`
- Small: `text-sm`, `text-xs`

**Gradient Text:**
```css
bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 
bg-clip-text text-transparent
```

### Spacing & Layout
**Container:**
- Max width: `max-w-6xl`, `max-w-4xl`
- Padding: `px-4 sm:px-6`
- Margin: `mx-auto`

**Sections:**
- Padding: `py-16 px-4`
- Gap: `gap-4`, `gap-6`, `gap-8`

**Grid Layouts:**
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6
```

### Border Radius
- Small: `rounded-lg`, `rounded-xl`
- Medium: `rounded-2xl`
- Large: `rounded-3xl`
- Full: `rounded-full`

### Shadows
- Light: `shadow-sm`
- Medium: `shadow-lg`
- Heavy: `shadow-2xl`
- Hover: `hover:shadow-xl`

### Animations & Transitions
**Hover Effects:**
```css
transition-all duration-300 transform hover:scale-105
transition-all duration-500 transform hover:scale-105
hover:-translate-y-2
```

**Loading States:**
```css
animate-pulse
animate-spin
```

**Background Animations:**
```css
animate-pulse (with animation-delay: 2s, 4s)
```

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

### Components (`/components`)
```
components/
├── ui/                    # UI component library
│   ├── badge.tsx         # Badge component
│   ├── button.tsx        # Button component
│   ├── card.tsx          # Card components
│   └── progress.tsx      # Progress bar
├── LanguageSwitcher.tsx  # Language selection
├── SideMenu.tsx          # Navigation menu
└── WeatherWidget.tsx     # Weather display
```

### Library (`/lib`)
```
lib/
├── providers.tsx         # React context providers
├── supabase.ts          # Supabase client
└── utils.ts             # Utility functions (cn, etc.)
```

### Public Assets (`/public`)
```
public/
└── locales/             # i18n translations
    ├── en/              # English
    ├── hi/              # Hindi
    └── or/              # Odia
```

---

## 🧩 Component Patterns

### Button Component
**Features:**
- Variants: default, outline
- asChild prop (Radix Slot)
- Tailwind merge for className composition
- Focus states and accessibility

**Usage:**
```tsx
<Button variant="outline">Click me</Button>
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

### Card Component
**Structure:**
- Card (container)
- CardHeader
- CardTitle
- CardDescription
- CardContent
- CardFooter

**Pattern:**
```tsx
<Card className="bg-white/60 backdrop-blur-sm">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Badge Component
**Usage:**
```tsx
<Badge className="bg-green-100 text-green-800 border-green-200">
  New Feature
</Badge>
```

---

## 🎯 Layout Patterns

### Hero Section
```tsx
<section className="relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10">
    {/* Animated background blobs */}
  </div>
  <div className="relative px-4 py-16">
    <div className="max-w-6xl mx-auto text-center">
      <div className="bg-white/40 backdrop-blur-lg rounded-3xl p-8">
        {/* Hero content */}
      </div>
    </div>
  </div>
</section>
```

### Feature Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {features.map(feature => (
    <Card className="hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
      {/* Feature content */}
    </Card>
  ))}
</div>
```

### Quick Actions
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
  {actions.map(action => (
    <Link href={action.href} className="group">
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 hover:scale-110 hover:-translate-y-2">
        {/* Action icon and label */}
      </div>
    </Link>
  ))}
</div>
```

### Navigation
**Desktop:** Side menu (collapsible)
**Mobile:** Bottom navigation bar (sticky)

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

### next.config.mjs
- Configured for i18n
- Image optimization enabled
- API routes configured

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

## 📱 Responsive Design Breakpoints

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md, lg)
- **Desktop**: > 1024px (lg, xl)

**Mobile-specific:**
- Bottom navigation (fixed)
- Hamburger menu
- Stacked layouts
- Larger touch targets

**Desktop-specific:**
- Side menu (always visible)
- Multi-column layouts
- Hover effects
- Larger content areas

---

## 🎨 Icon Strategy

**Sources:**
- Inline SVG icons (custom)
- Heroicons patterns
- Lucide React (recommended for new projects)

**Pattern:**
```tsx
<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
</svg>
```

---

## 🚀 Performance Optimizations

1. **Image Optimization**: Next.js Image component
2. **Code Splitting**: Automatic with App Router
3. **Font Optimization**: Google Fonts with display: swap
4. **Lazy Loading**: Dynamic imports for heavy components
5. **Caching**: API response caching
6. **Bundle Size**: Tree shaking with ES modules

---

## 🔒 Security Practices

1. **Environment Variables**: Never commit .env.local
2. **API Keys**: Server-side only (not in NEXT_PUBLIC_)
3. **Supabase RLS**: Row Level Security enabled
4. **Input Validation**: Client and server-side
5. **CORS**: Configured for API routes
6. **Authentication**: Supabase Auth with JWT

---

## 📊 Key Metrics

**Bundle Size:** Optimized with tree shaking
**Lighthouse Score:** Target 90+ on all metrics
**Accessibility:** WCAG AA compliance
**Performance:** < 3s initial load time
**SEO:** Proper meta tags and structured data

---

## 🎓 Best Practices Observed

1. **TypeScript Strict Mode**: No `any` types
2. **Component Composition**: Reusable, modular components
3. **Consistent Naming**: PascalCase for components, camelCase for functions
4. **File Organization**: Feature-based structure
5. **CSS Utility Classes**: Tailwind-first approach
6. **Accessibility**: Semantic HTML, ARIA labels
7. **Error Handling**: Try-catch blocks, error boundaries
8. **Loading States**: Skeleton screens, spinners
9. **Responsive Design**: Mobile-first approach
10. **Code Comments**: Minimal but meaningful

---

## 🔄 Recommended Improvements for Next Project

Based on this analysis, the next project should have:

1. **Better Animation Library**: Consider Framer Motion
2. **Toast Notifications**: For user feedback
3. **Form Library**: React Hook Form + Zod validation
4. **State Management**: Zustand or Jotai (if needed)
5. **Testing**: Jest + React Testing Library
6. **Storybook**: Component documentation
7. **Dark Mode**: System preference detection
8. **PWA Support**: Service workers, offline mode
9. **Analytics**: Vercel Analytics or Google Analytics
10. **Error Tracking**: Sentry integration

---

## 📚 Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Supabase**: https://supabase.com/docs
- **Radix UI**: https://www.radix-ui.com/
- **Recharts**: https://recharts.org/

---

**Use this reference when customizing the Claude AI prompt template!**
