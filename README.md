# VibeBattle

**Slogan:** *Challenge Your Friends. Discover Who Knows You Best.*

VibeBattle is a mobile-first social entertainment platform where users create personalized quizzes, host Funny Battle squad awards, compare Love & Friendship vibes, solve Daily Challenges, compete on global/friends leaderboards, and play real-time Live Battle multiplayer rooms.

## Architecture Overview

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4 + TanStack Query + React Router + Motion + Lucide React.
- **Full-Stack Server (`server.ts`)**: Express serving Vite middleware in dev (static `dist/` in production), server-side **Gemini AI** endpoints (`/api/ai/*`), and an authoritative **WebSocket** server (`/ws/rooms`) for Live Battle multiplayer rooms.
- **Persistence & Auth (`src/services/mockApi.ts`)**: Deterministic client store with anti-cheat server-style scoring, XP/levels/badges, friend connections, notifications, and moderation audit logs.

### Core Modules
- **Who Knows Me Best? (`/create`, `/quiz/:id/edit`, `/q/:code`, `/results/:attemptId`)**:
  - Create 5–20 question quizzes with 2–4 options, multilingual templates (`EN`, `FR`, `RN`), visual themes, and visibility controls.
  - **AI Quiz Writer**: Server-side Gemini generator builds custom first-person questions from any prompt.
  - **AI Vibe Reaction**: Personalized post-quiz score reaction on the results page.
  - Guest gameplay with anti-cheat stripped payloads, confetti celebration (`>= 80%`), and optional post-game account claim.
- **Funny Battle (`/battles`, `/battles/:code`)**:
  - Group voting challenges with nominee tallying, anti-abuse vote upsert, sharing, and AI prompt generation.
- **Love & Friendship (`/compatibility`, `/compatibility/:code`)**:
  - 6 categories where two players answer separately and compare match percentages side-by-side (for lighthearted fun only).
- **Daily Challenges & Gamification (`/daily`, `/achievements`, `/leaderboards`)**:
  - Daily brain-teasers, AI bonus challenges, streaks, daily-capped XP, levels, unlockable badges, and Global / Weekly / Monthly / Friends leaderboards.
- **Live Battle Multiplayer (`/live`, `/live/:code`)**:
  - Authoritative WebSocket room engine (`/ws/rooms`) with 6-letter join codes, synchronized countdowns, speed-bonus scoring, reconnect support, and final podium.
- **Friends, Notifications & Moderation (`/friends`, `/notifications`, `/admin`)**:
  - Friend requests/blocking, notification inbox, and admin console with **AI Safety Review** for reported quizzes.

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Configure `GEMINI_API_KEY` in environment secrets to enable all AI endpoints.

### Demo Accounts (Quick Sign-In on `/login`)
- **Player / Creator:** `maya@vibebattle.app`
- **Administrator:** `admin@vibebattle.app`

## Verification Commands

```bash
npx tsx --test tests/mvp.test.ts
npm run lint
npm run build
```
