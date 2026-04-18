# Claude AI Project Scaffold Prompt Template

## 🎯 Project Request

I need you to create a complete web application scaffold for the following problem statement:

**[INSERT YOUR PROBLEM STATEMENT HERE]**

---

## 🛠️ Technology Stack Requirements

### Frontend Framework
- **Next.js 14+** with App Router (TypeScript)
- **React 18+** with modern hooks and patterns
- **TypeScript 5.0+** for type safety

### Styling & UI
- **Tailwind CSS 4.0+** for utility-first styling
- **Modern UI Design System** with:
  - Glassmorphism effects (`backdrop-blur-lg`, `bg-white/40`)
  - Gradient backgrounds (`bg-gradient-to-br from-[color] via-[color] to-[color]`)
  - Smooth animations and transitions
  - Rounded corners (`rounded-2xl`, `rounded-3xl`)
  - Shadow effects (`shadow-lg`, `shadow-2xl`)
  - Hover effects with `transform`, `scale`, and `translate`
  
### UI Components Library
Create a custom component library in `/components/ui/` with:
- **Button**: Multiple variants (default, outline, gradient)
- **Card**: With CardHeader, CardTitle, CardContent, CardFooter
- **Badge**: For status indicators
- **Progress**: For loading states
- **Input**: Form inputs with validation styles
- **Modal/Dialog**: For overlays
- **Dropdown**: For selections
- Use **@radix-ui** primitives for accessibility

### Backend & Database
- **Supabase** for:
  - PostgreSQL database
  - Authentication (email/password, OAuth)
  - Real-time subscriptions
  - File storage
  - Row Level Security (RLS)

### API Integration
- **Next.js API Routes** (`/app/api/`) for server-side logic
- **[INSERT YOUR SPECIFIC APIs HERE]** - e.g.:
  - OpenAI API for AI features
  - Stripe API for payments
  - SendGrid for emails
  - etc.

### Additional Libraries
- **Recharts** for data visualization and charts
- **Lucide React** or **Heroicons** for icons
- **react-i18next** & **next-i18next** for internationalization (if needed)
- **tailwind-merge** for className utilities
- **@headlessui/react** for accessible UI components

---

## 🎨 Design System Specifications

### Color Palette
Use a vibrant, modern color scheme with:
- **Primary Colors**: Define 2-3 main brand colors with gradient variations
- **Background**: Light gradients (`from-[color]-50 via-[color]-50 to-[color]-50`)
- **Cards**: White with transparency (`bg-white/60`, `bg-white/40`)
- **Accents**: Bright, saturated colors for CTAs and highlights

### Typography
- **Font**: Inter or Nunito from Google Fonts
- **Headings**: Bold, large sizes (text-4xl, text-5xl, text-6xl)
- **Body**: Readable sizes (text-base, text-lg)
- **Gradient Text**: Use `bg-gradient-to-r bg-clip-text text-transparent`

### Layout Patterns
- **Hero Section**: Full-width with gradient background, centered content, glassmorphic card
- **Feature Cards**: Grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- **Responsive Design**: Mobile-first approach
- **Sticky Header**: With backdrop blur effect
- **Bottom Navigation**: For mobile devices (hidden on desktop)
- **Side Menu**: Collapsible sidebar for navigation

### Animation & Effects
- **Hover Effects**: Scale (1.05, 1.1), translate-y, shadow changes
- **Loading States**: Pulse animations, spinners
- **Transitions**: Smooth duration-300, duration-500
- **Blur Effects**: backdrop-blur-sm, backdrop-blur-lg
- **Floating Elements**: Animated background blobs with pulse

---

## 📁 Project Structure

Please create the following folder structure:

```
project-name/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── [feature-1]/         # API endpoint 1
│   │   ├── [feature-2]/         # API endpoint 2
│   │   └── [feature-n]/         # API endpoint N
│   ├── [page-1]/                # Feature page 1
│   ├── [page-2]/                # Feature page 2
│   ├── [page-n]/                # Feature page N
│   ├── dashboard/               # Main dashboard
│   ├── login/                   # Authentication pages
│   ├── signup/
│   ├── profile/                 # User profile
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout with navigation
│   └── page.tsx                 # Landing/home page
├── components/                   # Reusable components
│   ├── ui/                      # UI component library
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   └── [other-components].tsx
│   ├── [FeatureComponent].tsx   # Feature-specific components
│   ├── Navigation.tsx           # Navigation components
│   └── SideMenu.tsx
├── lib/                         # Utility libraries
│   ├── supabase.ts             # Supabase client setup
│   ├── utils.ts                # Helper functions (cn, etc.)
│   └── providers.tsx           # Context providers
├── public/                      # Static assets
│   ├── images/
│   ├── icons/
│   └── locales/                # Translation files (if i18n)
├── types/                       # TypeScript type definitions
│   └── index.ts
├── .env.local                   # Environment variables (template)
├── .env.example                 # Example env file
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
└── README.md                   # Project documentation
```

---

## 🔧 Environment Variables Template

Create `.env.example` with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_BUCKET=your_bucket_name

# API Keys (customize based on your needs)
[API_NAME_1]_API_KEY=your_api_key_here
[API_NAME_2]_API_KEY=your_api_key_here

# Optional: Other Services
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📋 Core Features to Implement

Based on my problem statement, the application should include:

1. **[Feature 1]** - Description
2. **[Feature 2]** - Description
3. **[Feature 3]** - Description
4. **[Feature N]** - Description

---

## 🎯 Specific Requirements

### Authentication
- User registration and login via Supabase Auth
- Protected routes for authenticated users
- User profile management
- Session handling

### Database Schema
Please design Supabase tables for:
- **[Table 1]**: Fields and relationships
- **[Table 2]**: Fields and relationships
- **[Table N]**: Fields and relationships

### API Endpoints
Create API routes for:
- **POST /api/[endpoint-1]**: Description
- **GET /api/[endpoint-2]**: Description
- **[METHOD] /api/[endpoint-n]**: Description

### Pages Required
1. **Landing Page** (`/`): Hero section, features showcase, CTA
2. **Dashboard** (`/dashboard`): Main user interface with stats/analytics
3. **[Feature Page 1]** (`/[route-1]`): Description
4. **[Feature Page 2]** (`/[route-2]`): Description
5. **Profile** (`/profile`): User settings and preferences
6. **Auth Pages** (`/login`, `/signup`): Authentication flows

---

## 🚀 Step-by-Step Implementation Request

**IMPORTANT**: Please provide the scaffold structure FIRST, then I will request code for each component/page step by step.

### Phase 1: Project Scaffold
1. Provide the complete folder structure
2. List all files that need to be created
3. Provide `package.json` with all dependencies
4. Provide configuration files (next.config.mjs, tailwind.config.ts, tsconfig.json)
5. Provide `.env.example` template

### Phase 2: Core Setup (I'll request these next)
1. `/app/layout.tsx` - Root layout with navigation
2. `/app/globals.css` - Global styles and Tailwind imports
3. `/lib/supabase.ts` - Supabase client setup
4. `/lib/utils.ts` - Utility functions
5. `/components/ui/*` - All UI components

### Phase 3: Pages (I'll request one by one)
1. Landing page (`/app/page.tsx`)
2. Dashboard page (`/app/dashboard/page.tsx`)
3. Each feature page individually
4. Authentication pages

### Phase 4: API Routes (I'll request one by one)
1. Each API endpoint with full implementation
2. Error handling and validation
3. Integration with Supabase

### Phase 5: Additional Features
1. Responsive design refinements
2. Loading states and error boundaries
3. SEO optimization
4. Performance optimizations

---

## 🎨 UI/UX Improvements Over Previous Project

Please make the UI **significantly better** than my reference project by:

1. **Enhanced Animations**:
   - Smoother transitions (use Framer Motion if beneficial)
   - Page transition animations
   - Micro-interactions on buttons and cards
   - Skeleton loaders for content

2. **Better Visual Hierarchy**:
   - More consistent spacing system
   - Clearer typography scale
   - Better color contrast
   - More intuitive information architecture

3. **Advanced Components**:
   - Toast notifications for user feedback
   - Skeleton loading states
   - Empty states with illustrations
   - Better form validation feedback
   - Loading states for multi-step processes

4. **Improved Responsiveness**:
   - Better mobile experience
   - Tablet-optimized layouts
   - Touch-friendly interactive elements
   - Bottom navigation on mobile
   - Adaptive navigation patterns

5. **Modern Design Trends**:
   - Neumorphism elements (where appropriate)
   - 3D effects and depth
   - Custom illustrations or icons
   - Dark mode support (optional)
   - Better use of negative space

---

## ✅ Deliverables

Please provide:

1. **Complete folder structure** with all file paths
2. **package.json** with all required dependencies
3. **Configuration files** (Next.js, Tailwind, TypeScript)
4. **Environment variables template**
5. **README.md** with:
   - Project overview
   - Setup instructions
   - API documentation
   - Deployment guide
6. **Database schema** for Supabase tables
7. **API endpoint specifications**

After the scaffold, I'll request code for each component step by step.

---

## 🔄 Workflow

1. **You provide**: Complete project scaffold and structure
2. **I request**: "Give me code for [specific file/component]"
3. **You provide**: Complete, production-ready code for that file
4. **Repeat**: Until all components are implemented

---

## 🎨 Design Customization & Style Guide