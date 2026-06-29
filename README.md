# Slogovo - Bulgarisch lernen

Eine moderne Lern-App für Bulgarisch, gebaut mit Next.js 14, TypeScript, Tailwind CSS und SQLite.

## Features

- Email + Passwort Registrierung
- Email + Passwort Login
- Passwort zurücksetzen (via Email)
- JWT-basierte Session-Verwaltung
- Geschützte Routen (Middleware)
- Responsive Design mit Tailwind CSS
- OAuth (Google, Apple) via NextAuth.js

## Tech Stack

| Layer | Technologie |
|-------|--------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite (Prisma ORM) |
| Auth | JWT + NextAuth.js |
| Email | Nodemailer (SMTP) |

## Setup

### Voraussetzungen

- Node.js 18+
- npm oder yarn

### Installation

1. **Repository klonen**

```bash
git clone https://github.comOBM-OPC/slogovo.git
cd slogovo
```

2. **Abhängigkeiten installieren**

```bash
npm install
```

3. **Umgebungsvariablen setzen**

```bash
cp .env.example .env
# Bearbeite .env mit deinen Werten
```

4. **Datenbank initialisieren**

```bash
npx prisma migrate dev
```

5. **Entwicklungsserver starten**

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) in deinem Browser.

## Umgebungsvariablen

Kopiere `.env.example` zu `.env` und fülle die Werte aus:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key"

# Optional: OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Optional: Email
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"
FROM_EMAIL="noreply@slogovo.de"
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|------------|
| POST | `/api/auth/register` | Benutzer registrieren |
| relevant | `/api/auth/login` | Benutzer anmelden |
| POST | `/api/auth/logout` | Benutzer abmelden |
| GET | `/api/auth/me` | Aktuellen Benutzer abrufen |
| POST | `/api/auth/forgot-password` | Passwort-Reset anfordern |
| POST | `/api/auth/reset-password` | Passwort zurücksetzen |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth.js OAuth Endpoints |

## Datenbank-Schema

### User
- `id` - Eindeutige ID (CUID)
- `email` - E-Mail-Adresse (einzigartig)
- `password` - Gehashtes Passwort (optional für OAuth)
- `name` - Anzeigename
- `image` - Profilbild URL
- `emailVerified` - E-Mail-Verifizierungsdatum
- `displayName` - Öffentlicher Name
- `bio` - Kurzbeschreibung
- `resetToken` / `resetTokenExpiry` - Passwort-Reset
- `verificationToken` / `verificationTokenExpiry` - E-Mail-Verifizierung
- `createdAt` / `updatedAt` - Timestamps

### Account (OAuth)
- `id` - Eindeutige ID
- `userId` - Verknüpfung zu User
- `type` - OAuth-Typ
- `provider` / `providerAccountId` - OAuth-Anbieter
- `refresh_token` / `access_token` - OAuth-Tokens
- `expires_at` / `token_type` / `scope` / `id_token` / `session_state`

## Projektstruktur

```
slogovo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/auth/           # Auth API Routes
│   │   ├── login/              # Login Seite
│   │   ├── register/           # Registrierung Seite
│   │   ├── forgot-password/    # Passwort vergessen
│   │   ├── reset-password/     # Passwort zurücksetzen
│   │   ├── dashboard/          # Geschützte Dashboard
│   │   ├── page.tsx            # Landing Page
│   │   └── layout.tsx          # Root Layout
│   ├── components/
│   │   └── auth/               # Auth UI Components
│   ├── hooks/
│   │   └── useAuth.ts          # Auth Hook
│   ├── lib/
│   │   ├── auth.ts             # Auth Utilities (Hash, JWT)
│   │   ├── db.ts               # Database Client
│   │   ├── email.ts            # Email Service
│   │   └── validations.ts      # Zod Schemas
│   └── middleware.ts            # Route Protection
├── prisma/
│   └── schema.prisma           # Database Schema
└── docs/
    └── API.md                  # API Dokumentation
```

## Laufen mit Docker

```bash
# Container bauen und starten
docker build -t slogovo .
docker run -p 3000:3000 slogovo
```

## Testen

```bash
# Unit Tests
npm test

# e2e Tests
npm run e2e
```

## Deployment

### Vercel

1. Verbinde GitHub-Repo mit Vercel
2. Setze Umgebungsvariablen in Vercel-Dashboard
3. Deploy!

### Self-Hosted

```bash
npm run build
npm start
```

## Lizenz

MIT

---

Made with ❤️ for Bulgaria 🇧🇬
