-- =============================================================================
-- BIOHACKER APP SCHEMA - MVP & PRODUCTION READY
-- =============================================================================

-- 1. EXTENSIONS
-- Enable Vector for RAG (Retrieval Augmented Generation)
create extension if not exists vector;

-- =============================================================================
-- 2. ENUMS & TYPES
-- =============================================================================
-- Helps keep data clean. 
-- 'detailed' = Full recipe generated (MVP default).
-- 'blueprint' = Just a strategy placeholder (Future Subscription feature).
create type plan_status_type as enum ('detailed', 'blueprint');
create type tier_type as enum ('free', 'protocol_one_time', 'coach_sub');

-- =============================================================================
-- 3. TABLES
-- =============================================================================

-- A. PROFILES (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  
  -- Biohacker Configuration
  diet_type text,         -- e.g., 'Keto', 'Carnivore', 'Mediterranean'
  goal text,              -- e.g., 'Hypertrophy', 'Cognitive', 'Longevity'
  biometrics jsonb,       -- Flexible: { "weight": 85, "height": 180, "bf_percent": 15 }
  intolerances text[],    -- e.g., ['Gluten', 'Seed Oils', 'Nightshades']
  
  -- Monetization State
  subscription_tier tier_type default 'free',
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- B. BIO KNOWLEDGE (RAG Database)
-- Stores research papers and protocols for the AI to reference.
create table public.bio_knowledge (
  id bigserial primary key,
  content text not null,        -- The actual text chunk from the PDF/Paper
  metadata jsonb,               -- { "title": "Huberman Lab", "url": "...", "topic": "Sleep" }
  embedding vector(1536)        -- OpenAI Embedding dimensions
);

-- C. USER PLANS (The Container)
-- Represents a "Season" or "Protocol" (e.g., The 12-week MVP Plan).
create table public.user_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  title text not null,          -- e.g., "Metabolic Reset Protocol"
  start_date date not null,
  end_date date not null,
  
  is_active boolean default true,
  created_at timestamptz default now()
);

-- D. PLAN PHASES (The Strategy)
-- Group weeks together. Crucial for the "Phase" UI on the calendar.
create table public.plan_phases (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.user_plans(id) on delete cascade not null,
  
  phase_name text not null,     -- e.g., "Phase 1: Adaptation"
  start_week int not null,      -- e.g., 1
  end_week int not null,        -- e.g., 4
  
  -- For Subscribers later: This is what they see if specific meals aren't generated yet.
  description text,             -- "Focus on fat adaptation. Low carb, high stearic acid."
  target_macros jsonb           -- { "p": 180, "f": 120, "c": 30 }
);

-- E. DAILY LOGS (The Calendar)
-- Connects a Date to a User and a Plan.
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  plan_id uuid references public.user_plans(id) on delete cascade,
  
  date date not null,
  
  -- MVP: All rows will be 'detailed'. 
  -- Future Sub: Future weeks will be 'blueprint'.
  status plan_status_type default 'detailed',
  
  -- Daily Totals
  macros_total jsonb,           -- { "protein": 150, "fat": 80, "calories": 2100 }
  notes text,                   -- User journal entry
  
  unique(user_id, date)         -- Ensures one log per day per user
);

-- F. MEALS (The Content)
-- Specific food items. Only exists if daily_log.status = 'detailed'.
create table public.meals (
  id uuid default gen_random_uuid() primary key,
  daily_log_id uuid references public.daily_logs(id) on delete cascade not null,
  
  type text not null,           -- 'breakfast', 'lunch', 'dinner', 'snack', 'pre_workout'
  name text not null,           -- e.g., "Wild Caught Salmon & Asparagus"
  
  -- We store ingredients as JSON for easy Shopping List generation in React Native
  -- Format: [{ "item": "Salmon", "qty": "200g", "category": "Fish" }]
  ingredients jsonb,
  
  macros jsonb,                 -- { "p": 40, "f": 20, "c": 5 }
  
  -- The "Biohacker" Feature: Why are we eating this?
  biohack_tip text,             -- "High Omega-3s to lower inflammation post-workout."
  
  is_completed boolean default false
);

-- =============================================================================
-- 4. FUNCTIONS & TRIGGERS
-- =============================================================================

-- A. RAG Search Function
-- This allows your Python Backend to find relevant science.
create or replace function match_bio_knowledge (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    bio_knowledge.id,
    bio_knowledge.content,
    1 - (bio_knowledge.embedding <=> query_embedding) as similarity
  from bio_knowledge
  where 1 - (bio_knowledge.embedding <=> query_embedding) > match_threshold
  order by bio_knowledge.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- B. Auto-Create Profile on Signup
-- When a user confirms email, automatically create a row in 'profiles'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
-- 5. SECURITY (Row Level Security - RLS)
-- =============================================================================
-- Vital: Prevents User A from seeing User B's diet.

alter table profiles enable row level security;
alter table user_plans enable row level security;
alter table plan_phases enable row level security;
alter table daily_logs enable row level security;
alter table meals enable row level security;
alter table bio_knowledge enable row level security;

-- Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view own plans" on user_plans for select using (auth.uid() = user_id);
create policy "Users can view own phases" on plan_phases for select using (auth.uid() = (select user_id from user_plans where id = plan_phases.plan_id));

create policy "Users can view own logs" on daily_logs for select using (auth.uid() = user_id);
create policy "Users can view own meals" on meals for select using (auth.uid() = (select user_id from daily_logs where id = meals.daily_log_id));
create policy "Users can update own meals" on meals for update using (auth.uid() = (select user_id from daily_logs where id = meals.daily_log_id));

-- Knowledge Base: Public Read, Admin Write (You write via backend service key)
create policy "Public read knowledge" on bio_knowledge for select using (true);