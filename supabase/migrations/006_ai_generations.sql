-- GEOZ — AI Generations table (Content Improver history for Pro/Business)
-- Stores AI-rewritten copy with per-user RLS

-- =========================================================================
-- ai_generations
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text text NOT NULL,
  improved_text text NOT NULL,
  generation_type varchar(50) NOT NULL CHECK (generation_type IN ('title', 'description')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_generations_user_id_created_at_idx
  ON public.ai_generations (user_id, created_at DESC);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ai_generations"
  ON public.ai_generations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own ai_generations"
  ON public.ai_generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
