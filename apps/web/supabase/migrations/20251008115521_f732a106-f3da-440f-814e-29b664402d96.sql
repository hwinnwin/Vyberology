-- Create archetypes table for storing all number meanings (1-33)
CREATE TABLE public.archetypes (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  family TEXT NOT NULL CHECK (family IN ('base', 'master', 'power', 'angel')),
  root INTEGER NOT NULL,
  modes TEXT[] NOT NULL,
  primary_label TEXT NOT NULL,
  secondary_label TEXT,
  tertiary_label TEXT,
  emoji TEXT NOT NULL,
  essence TEXT NOT NULL,
  expanded_meaning TEXT NOT NULL,
  light_expression TEXT[] NOT NULL,
  shadow_expression TEXT[] NOT NULL,
  keywords TEXT[] NOT NULL,
  tone_style TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  ui_motif TEXT NOT NULL,
  element TEXT NOT NULL,
  frequency_tone TEXT NOT NULL,
  common_misunderstanding TEXT,
  daily_practice TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create evolution paths table
CREATE TABLE public.evolution_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_number INTEGER NOT NULL REFERENCES public.archetypes(number),
  to_number INTEGER NOT NULL REFERENCES public.archetypes(number),
  path_type TEXT NOT NULL CHECK (path_type IN ('adjacent', 'challenge')),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(from_number, to_number)
);

-- Create keystone actions table
CREATE TABLE public.keystone_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype_number INTEGER NOT NULL REFERENCES public.archetypes(number),
  action TEXT NOT NULL,
  xp_value INTEGER NOT NULL DEFAULT 3,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  archetype_number INTEGER NOT NULL REFERENCES public.archetypes(number),
  current_level TEXT NOT NULL CHECK (current_level IN ('apprentice', 'adept', 'embodied', 'transmitter')) DEFAULT 'apprentice',
  total_xp INTEGER NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  level_up_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, archetype_number)
);

-- Create user actions log table
CREATE TABLE public.user_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  archetype_number INTEGER NOT NULL REFERENCES public.archetypes(number),
  action_id UUID REFERENCES public.keystone_actions(id),
  action_description TEXT NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 1,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keystone_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_actions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for archetypes (public read)
CREATE POLICY "Anyone can view archetypes"
  ON public.archetypes FOR SELECT
  USING (true);

-- RLS Policies for evolution_paths (public read)
CREATE POLICY "Anyone can view evolution paths"
  ON public.evolution_paths FOR SELECT
  USING (true);

-- RLS Policies for keystone_actions (public read)
CREATE POLICY "Anyone can view keystone actions"
  ON public.keystone_actions FOR SELECT
  USING (true);

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_actions_log
CREATE POLICY "Users can view their own actions"
  ON public.user_actions_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own actions"
  ON public.user_actions_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_actions_log_user_id ON public.user_actions_log(user_id);
CREATE INDEX idx_evolution_paths_from ON public.evolution_paths(from_number);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to archetypes
CREATE TRIGGER set_archetypes_updated_at
  BEFORE UPDATE ON public.archetypes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add trigger to user_progress
CREATE TRIGGER set_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();