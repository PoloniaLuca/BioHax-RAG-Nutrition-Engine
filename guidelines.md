# Project: Biohacker Protocol MVP

## 1. Project Overview

A high-performance mobile application for biohackers that generates personalized, science-backed meal plans using AI.

- **Core Value:** Automated nutritional engineering based on user biometrics and longevity research.
- **MVP Model:** One-time purchase ($29.99) for a static 12-week protocol.
- **Aesthetic:** Dark mode, "Cyberpunk/High-Performance", Red (#FF3B30) & Dark Charcoal (#121212).

## 2. Tech Stack & Versions

- **Frontend:** React Native (Expo SDK 50+), Expo Router (File-based routing).
- **UI Library:** Tamagui or NativeWind (Tailwind).
- **State Management:** TanStack Query (React Query) + Zustand.
- **Backend:** Python 3.10+, FastAPI.
- **AI Engine:** OpenAI API (GPT-4o) + `instructor` (for structured Pydantic output). but we are gonna set it up with Ollama for testing
- **Database:** Supabase (PostgreSQL + pgvector).
- **Auth:** Supabase Auth (Email/Password).
- **ORM/Client:** `supabase-py` (Backend), `@supabase/supabase-js` (Frontend).

## 3. Database Schema (Source of Truth)

Refer to the `schema.sql` file. Key tables:

- `profiles` (User settings, tier).
- `bio_knowledge` (RAG vectors).
- `daily_logs` (Calendar entries with status 'detailed' or 'blueprint').
- `meals` (JSON ingredients and macros).

## 4. Monetization Model (Business Logic)

- **Tier 1: Protocol (One-Time $29.99)**
  - Access to 12 weeks of _static_ meal plans.
  - No chat/RAG interaction.
  - No plan regeneration.
- **Tier 2: AI Coach (Sub $12.99/mo)**
  - Rolling Horizon: 2 weeks detailed, 10 weeks blueprint.
  - Dynamic regeneration allowed.
  - RAG Chat access.

## 5. Key Features (MVP)

1. **Onboarding:** Multi-step wizard (Biometrics, Diet, Goal, Protocol):
   - workout (what type, how many hours per session, how many times per week, what time of the day)
   - weight (current and target)
   - height
   - age
   - gender
   - what kind of work (active, sedentary, heavy labor)
   - location (foods varies depending on the country)
   - sleep (quantity and quality)
   - current diet (normal or biohacker: Omnivore, Keto, Paleo, Carnivore, Vegan, Mediterranean, Pescatarian)
   - protocol (None, 16:8, OMAD (One Meal A Day), Circadian Fasting)
   - biometrics (optional: body fat %, HRV avg, Vo2 Max)
   - ingredients: organic, supermarket, farm, mix
   - allergies
   - goal (Cognitive Performance (Nootropic focus), Hypertrophy & Strength, Longevity & Autophagy, Energy & Mitochondria Health, Rapid Fat Loss (Ketosis focus))
2. **Dashboard:** "Today" view with Fasting Timer (Ring) and Macro Donut chart.
3. **Planner:** Calendar view with "Phase" indicators.
4. **Shopping List:** Aggregated ingredients sorted by category (Farm/Market).
5. **My Lab:** User profile and excluded ingredients.

## 6. Coding Standards (Do NOT Violate)

- **Strict Typing:** Use Pydantic models for ALL backend I/O. Use TypeScript interfaces for ALL frontend data.
- **No Raw SQL:** Use the Supabase JS/Python client methods (`.select()`, `.insert()`) unless performing complex vector searches (use `.rpc()`).
- **Performance:** Frontend must use optimistic updates. Backend must use `BackgroundTasks` for AI generation (do not make the user wait 30s).
- **File Structure:**
  - `/backend`: FastAPI app, `venv`, `requirements.txt`.
  - `/app`: Expo frontend code.
  - `/components`: Reusable UI elements.

## 7. External Documentation (MCP Context)

- FastAPI: https://fastapi.tiangolo.com/
- Supabase Python: https://supabase.com/docs/reference/python/introduction
- Expo Router: https://docs.expo.dev/router/introduction/
- Instructor (Python): https://python.useinstructor.com/
