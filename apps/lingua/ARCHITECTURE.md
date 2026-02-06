# Vybe Lingua - Unified Language Learning Platform

## Overview

Vybe Lingua consolidates 5 separate language learning apps into a single, multi-tenant platform:

1. **Langwage** - Multi-language learning
2. **FnF Language** - Fun & Fast learning (gamified)
3. **Ledeedee** - Interactive music-based lessons
4. **Jayden Language** - Youth-focused learning
5. **Langwage Sasha** - Personalized AI tutoring

## Architecture

### Multi-Tenant Structure

```
apps/lingua/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (marketing)/        # Public landing pages
│   │   ├── (dashboard)/        # Authenticated user dashboard
│   │   ├── learn/              # Learning modules
│   │   │   ├── [language]/     # Dynamic language routes
│   │   │   └── [lesson]/       # Dynamic lesson routes
│   │   └── api/                # API routes
│   │
│   ├── modules/                # Feature modules
│   │   ├── core/               # Shared learning engine
│   │   │   ├── spaced-repetition.ts
│   │   │   ├── progress-tracker.ts
│   │   │   └── achievement-system.ts
│   │   │
│   │   ├── gamification/       # FnF-style game mechanics
│   │   │   ├── xp-system.ts
│   │   │   ├── streaks.ts
│   │   │   └── leaderboards.ts
│   │   │
│   │   ├── audio/              # Ledeedee music features
│   │   │   ├── rhythm-exercises.ts
│   │   │   ├── song-lessons.ts
│   │   │   └── pronunciation.ts
│   │   │
│   │   ├── youth/              # Jayden youth features
│   │   │   ├── age-appropriate.ts
│   │   │   ├── parental-controls.ts
│   │   │   └── kid-themes.ts
│   │   │
│   │   └── ai-tutor/           # Sasha AI tutoring
│   │       ├── conversation.ts
│   │       ├── personalization.ts
│   │       └── feedback.ts
│   │
│   ├── components/             # Shared UI components
│   │   ├── lesson/
│   │   ├── quiz/
│   │   ├── flashcard/
│   │   └── progress/
│   │
│   └── lib/
│       ├── supabase/           # Database client
│       ├── ai/                 # Claude/OpenAI integration
│       └── analytics/          # Learning analytics
│
├── content/                    # Language content
│   ├── en/                     # English
│   ├── es/                     # Spanish
│   ├── fr/                     # French
│   ├── de/                     # German
│   ├── ja/                     # Japanese
│   └── zh/                     # Chinese
│
└── supabase/
    └── migrations/             # Database schema
```

### Database Schema (Supabase)

```sql
-- Users and profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  avatar_url TEXT,
  preferred_learning_style TEXT, -- 'gamified', 'audio', 'traditional', 'ai-guided'
  is_youth_account BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Languages being learned
CREATE TABLE user_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  language_code TEXT NOT NULL,
  proficiency_level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  started_at TIMESTAMPTZ DEFAULT NOW(),
  total_xp INTEGER DEFAULT 0
);

-- Lessons and progress
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL,
  module TEXT NOT NULL,
  lesson_type TEXT NOT NULL, -- 'vocabulary', 'grammar', 'listening', 'speaking', 'song'
  difficulty INTEGER DEFAULT 1,
  content JSONB NOT NULL
);

CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  lesson_id UUID REFERENCES lessons(id),
  completed_at TIMESTAMPTZ,
  score INTEGER,
  time_spent INTEGER, -- seconds
  attempts INTEGER DEFAULT 1
);

-- Spaced repetition for vocabulary
CREATE TABLE vocabulary_srs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  word_id UUID NOT NULL,
  language_code TEXT NOT NULL,
  ease_factor FLOAT DEFAULT 2.5,
  interval INTEGER DEFAULT 1, -- days
  next_review TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0
);

-- Gamification
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0
);

CREATE TABLE user_achievements (
  user_id UUID REFERENCES profiles(id),
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE streaks (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE
);

-- AI Tutor conversations
CREATE TABLE tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  language_code TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  messages JSONB DEFAULT '[]'
);
```

### Feature Flags by "Mode"

Users can switch between learning modes that activate different feature sets:

| Mode | Features Enabled |
|------|-----------------|
| **Classic** | Core learning, flashcards, quizzes |
| **Gamified** (FnF) | XP, streaks, leaderboards, achievements |
| **Musical** (Ledeedee) | Song lessons, rhythm exercises, pronunciation |
| **Youth** (Jayden) | Kid themes, parental controls, age-appropriate content |
| **AI Tutor** (Sasha) | Personalized conversations, adaptive learning |

### Migration Plan

1. **Phase 1: Core Platform** (Week 1-2)
   - Set up Next.js app with Supabase
   - Implement shared learning engine
   - Create base UI components from @vybe/ui

2. **Phase 2: Content Migration** (Week 3-4)
   - Export lessons from existing apps
   - Normalize content format
   - Import into unified content system

3. **Phase 3: Feature Integration** (Week 5-6)
   - Port gamification from FnF
   - Port audio features from Ledeedee
   - Port youth features from Jayden
   - Port AI tutor from Sasha

4. **Phase 4: User Migration** (Week 7-8)
   - Set up SSO with existing apps
   - Migrate user data and progress
   - Redirect old domains to new platform

### Domain Strategy

- **Primary**: `lingua.vybe.app` or `learn.vyberology.app`
- **Redirects**:
  - `langwage.app` → `lingua.vybe.app`
  - `fnflanguage.app` → `lingua.vybe.app?mode=gamified`
  - `ledeedee.app` → `lingua.vybe.app?mode=musical`
  - `jaydenlanguage.app` → `lingua.vybe.app?mode=youth`
  - `sasha.langwage.app` → `lingua.vybe.app?mode=tutor`

### Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + @vybe/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (SSO-ready)
- **AI**: Claude API for tutor, OpenAI Whisper for speech
- **Audio**: Tone.js for music features
- **Analytics**: Plausible + custom learning analytics
