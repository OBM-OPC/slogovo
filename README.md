# Slogovo 🇧🇬

Modern Bulgarian language learning app built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## What It Is

Slogovo teaches Bulgarian through structured lessons (A1–A2 levels), grammar guides, vocabulary flashcards, and interactive exercises — all wrapped in a clean, responsive UI with progress tracking and achievements.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| State | Zustand |
| Animations | Framer Motion |
| Icons | Lucide React |

## Features

- **Structured Curriculum** — A1–A2 modules with lessons stored as JSON content
- **Lesson Engine** — Multiple exercise types: quiz, fill-in, matching, sentence builder
- **Grammar Reference** — Thematic grammar pages
- **Vocabulary** — Category-based flashcards + typing exercises
- **Alphabet** — Bulgarian Cyrillic reference
- **Progress Tracking** — Local IndexedDB with Supabase sync for logged-in users
- **Achievements** — Gamified milestones with celebrations
- **TTS** — Text-to-speech for Bulgarian words and sentences
- **Auth** — Email/password registration and login via Supabase Auth
- **Responsive** — Mobile-first with bottom navigation

## Project Structure

```
slogovo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (learn)/            # Learn dashboard (protected)
│   │   │   ├── kurs/           # Course modules & lessons
│   │   │   ├── grammatik/      # Grammar reference
│   │   │   ├── vokabeln/       # Vocabulary categories
│   │   │   ├── alphabet/       # Alphabet guide
│   │   │   ├── fortschritt/    # Progress page
│   │   │   ├── profil/         # User profile
│   │   │   └── einstellungen/  # Settings
│   │   ├── api/                # API routes
│   │   │   └── auth/           # Auth endpoints (login, register, logout, etc.)
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   ├── forgot-password/    # Password reset request
│   │   ├── reset-password/     # Password reset confirmation
│   │   ├── dashboard/          # Dashboard redirect
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── auth/               # Auth forms (login, register, forgot, reset)
│   │   ├── layout/             # AppShell, BottomNav
│   │   ├── lesson/             # LessonView, GrammarClient
│   │   ├── quiz/               # ExerciseEngine, Quiz, FillIn, Matching, SentenceBuilder
│   │   ├── vocabulary/         # Flashcard, TypingExercise, VocabularyList
│   │   └── ui/                 # Button, ProgressBar, SpeakButton, toasts
│   ├── hooks/                  # useAuth, useProgressSafe
│   ├── lib/                    # Utilities, DB clients, content helpers
│   ├── stores/                 # Zustand stores (progress)
│   └── types/                  # TypeScript types
├── content/                    # Curriculum JSON (A1, A2 → modules → lessons)
├── supabase/                   # SQL schema files
├── docs/                       # API docs, sitemap
├── public/                     # Static assets
└── package.json
```

## Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/OBM-OPC/slogovo.git
cd slogovo

# Install dependencies
npm install

# Environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

```env
# Supabase
SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"

# OAuth (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""

# Email (SMTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"
FROM_EMAIL="noreply@slogovo.de"
```

## Database

Supabase schema files are in `/supabase/`:
- `schema.sql` — Core auth and user tables
- `progress-schema.sql` — User progress tracking tables

## Build

```bash
# Production build
npm run build

# Static export (for hosting without a Node server)
# Already configured: output = 'export' in next.config.js
npm run build
```

## License

MIT

---

Made with ❤️ for Bulgaria 🇧🇬
